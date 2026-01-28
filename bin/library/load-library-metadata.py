from copy import deepcopy
import requests
import firebase_admin
from firebase_admin import credentials, storage, firestore
import json
from datetime import datetime
import os
import google.auth.credentials


class EmulatorCredentials(credentials.Base):
    """Mock credentials for use with Firebase emulators."""

    def __init__(self):
        self._mock_credential = google.auth.credentials.AnonymousCredentials()

    def get_credential(self):
        return self._mock_credential

# -----------------------------------
# CONFIGURATION
# -----------------------------------

# Default to localhost for developer-friendly setup
DEFAULT_LIBRARY_API_URL = "http://localhost:8083"
LIBRARY_API_BASE_URL = os.getenv("LIBRARY_API_BASE_URL", DEFAULT_LIBRARY_API_URL)

# Infer production mode from URL (for versioned URL logic)
IS_PRODUCTION = not ("localhost" in LIBRARY_API_BASE_URL or "127.0.0.1" in LIBRARY_API_BASE_URL)

# Storage bucket defaults - use dev bucket by default
DEFAULT_DEV_BUCKET = "demo-bdt-dev.appspot.com"
DEFAULT_PROD_BUCKET = "benefit-decision-toolkit-play.firebasestorage.app"
STORAGE_BUCKET = os.getenv("GCS_BUCKET_NAME",
                           DEFAULT_PROD_BUCKET if IS_PRODUCTION else DEFAULT_DEV_BUCKET)

# Log configuration
print(f"========================================")
print(f"Library Metadata Sync Configuration")
print(f"========================================")
print(f"Mode: {'production' if IS_PRODUCTION else 'development'}")
print(f"Library API URL: {LIBRARY_API_BASE_URL}")
print(f"Storage Bucket: {STORAGE_BUCKET}")
print(f"========================================\n")

# -----------------------------------
# INIT FIREBASE
# -----------------------------------

# Point google-cloud-storage SDK at the emulator using the existing Quarkus config variable
storage_host_override = os.getenv("QUARKUS_GOOGLE_CLOUD_STORAGE_HOST_OVERRIDE")
if storage_host_override:
    os.environ["STORAGE_EMULATOR_HOST"] = storage_host_override

firebase_options = {"storageBucket": STORAGE_BUCKET}

if IS_PRODUCTION:
    # Production uses Application Default Credentials
    cred = credentials.ApplicationDefault()
else:
    # Emulators don't need real credentials - use anonymous/mock credentials
    # Set FIRESTORE_EMULATOR_HOST if not already set (standard Firebase emulator env var)
    if not os.getenv("FIRESTORE_EMULATOR_HOST"):
        os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8080"

    # Use mock credentials for emulator mode
    cred = EmulatorCredentials()
    firebase_options["projectId"] = os.getenv("QUARKUS_GOOGLE_CLOUD_PROJECT_ID", "demo-bdt-dev")

firebase_admin.initialize_app(cred, firebase_options)

db = firestore.client()
bucket = storage.bucket()


# --------------------------------------------
# Resolve a $ref inside the components/schemas
# --------------------------------------------


def resolve_ref(ref, components):
    ref_path = ref.replace("#/components/schemas/", "")
    if ref_path not in components:
        return {}
    schema = components[ref_path]

    # Deep copy to avoid mutating original schema
    return deepcopy(schema)


# --------------------------------------------
# Recursively expand schemas and resolve $ref
# --------------------------------------------
def expand_schema(schema, components):
    """Recursively expand all $ref inside a schema node."""
    if not isinstance(schema, dict):
        return schema

    # If the schema is only a $ref, replace it fully
    if "$ref" in schema:
        target = resolve_ref(schema["$ref"], components)
        return expand_schema(target, components)

    expanded = {}
    for key, value in schema.items():

        # Recurse into lists (e.g., 'allOf', 'oneOf')
        if isinstance(value, list):
            expanded[key] = [expand_schema(v, components) for v in value]
            continue

        # Recurse into dict children (e.g., items, properties, etc.)
        if isinstance(value, dict):
            expanded[key] = expand_schema(value, components)
            continue

        # Base case: primitive or unchanged field
        expanded[key] = value

    return expanded


def extract_top_level_inputs(schema, components):
    """Return only top-level properties of requestBody schema."""
    expanded = expand_schema(schema, components)

    inputs = {}
    if expanded.get("type") == "object":
        for prop_name, prop_schema in expanded.get("properties", {}).items():
            # Fully expand each property
            inputs[prop_name] = expand_schema(prop_schema, components)
    return inputs


# --------------------------------------------
# Convert schema to simple {field: type}
# --------------------------------------------
def flatten_schema(schema):
    flat = {}

    def walk(name, node):
        if not isinstance(node, dict):
            return

        node_type = node.get("type")

        # ---------------------------------
        # Primitive types
        # ---------------------------------
        if node_type in ("string", "number", "integer", "boolean"):
            flat[name] = {
                "type": node_type
            }
            return

        # ---------------------------------
        # Object
        # ---------------------------------
        if node_type == "object":
            props = node.get("properties", {})

            # Create schema entry for this object
            flat[name] = {
                "type": "object",
                "properties": {}
            }

            # Add detailed properties
            for p_name, p_schema in props.items():
                flat[name]["properties"][p_name] = p_schema

                # Also flatten subproperties
                full_name = f"{name}.{p_name}" if name else p_name
                walk(full_name, p_schema)

            return

        # ---------------------------------
        # Array
        # ---------------------------------
        if node_type == "array":
            items = node.get("items", {})

            # Create array schema entry
            flat[name] = {
                "type": "array",
                "items": items
            }

            # Flatten item structure using name[]
            walk(name + "[]", items)
            return

        # Default fallback
        flat[name] = node

    walk("", schema)
    return flat


# --------------------------------------------
# Process entire OpenAPI document
# --------------------------------------------
def extract_check_records(openapi, version):
    components = openapi.get("components", {}).get("schemas", {})
    paths = openapi.get("paths", {})

    output = []

    for path, methods in paths.items():
        # Only process check endpoints
        if "/checks" not in path:
            continue
        for method, details in methods.items():
            method = method.upper()

            # Split the URL into parts
            segments = path.strip("/").split("/")

            # Find index of 'checks'
            checks_index = segments.index("checks")

            name = segments[-1]

            module = "/".join(segments[checks_index + 1:-1])

            id = 'L-' + module + '-' + name + '-' + version

            entry = {
                "id": id,
                "evaluationUrl": path,
                "method": method,
                "name": name,
                "module": module,
                "version": version,
                "inputs": {}
            }

            # ----------------------------------------
            # 1. Path or query parameters
            # ----------------------------------------
            parameters = details.get("parameters", [])
            for p in parameters:
                name = p["name"]
                dtype = p.get("schema", {}).get("type", "unknown")
                entry["inputs"][name] = dtype

            # ----------------------------------------
            # 2. Request body parameters
            # ----------------------------------------
            if "requestBody" in details:
                content = details["requestBody"]["content"]

                if "application/json" in content:

                    schema = content["application/json"].get("schema", {})
                    # Only expand top-level 'parameters' and 'situation'
                    entry["inputs"].update(
                        extract_top_level_inputs(schema, components))

                    output.append(entry)

    return output


def transform_parameters(properties_obj):
    """Convert properties dict to a list of {key, name, type} objects."""
    transformed = []

    for key, val in properties_obj.items():
        # Determine the property's type
        prop_type = val.get("type", "object")  # fallback

        transformed.append({
            "key": key,
            "label": key,
            "required": False,
            "type": prop_type
        })

    return transformed


def transform_parameters_format(data):
    """Transform all `inputs.parameters.properties` in the provided list."""
    for check in data:
        inputs = check.get("inputs", {})
        parameters = inputs.get("parameters")

        # Only transform objects that follow the original structure
        if isinstance(parameters, dict) and "properties" in parameters:
            properties_obj = parameters["properties"]
            new_parameters = transform_parameters(properties_obj)

            # Replace object with the transformed list
            check["parameterDefinitions"] = new_parameters
    return data


def transform_situation_format(data):
    """Transform all `inputs.situation` in the provided list."""
    for check in data:
        check["inputDefinition"] = check["inputs"]["situation"]
    return data


def save_json_to_storage_and_update_firestore(json_string, firestore_doc_path):
    """
    Upload JSON string to Firebase Storage and update Firestore
    with the storage path or download URL of the uploaded file.
    """

    # ---------------------
    # Create filename
    # Example: exported_2025-02-12_14-30-59.json
    # ---------------------
    timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"LibraryApiSchemaExports/export_{timestamp}.json"

    # ---------------------
    # Upload to storage
    # ---------------------
    blob = bucket.blob(filename)
    blob.upload_from_string(json_string, content_type="application/json")

    # Get the storage path
    storage_path = blob.name

    # ---------------------
    # Update Firestore
    # ---------------------
    doc_ref = db.document(firestore_doc_path)
    doc_ref.set({
        "latestJsonStoragePath": storage_path,
        "updatedAt": firestore.SERVER_TIMESTAMP
    }, merge=True)

    print("Uploaded:", storage_path)
    print("Firestore updated!")

    return storage_path


# --------------------------------------------
# Load your OpenAPI JSON here
# --------------------------------------------
if __name__ == "__main__":

    url = f"{LIBRARY_API_BASE_URL}/q/openapi.json"

    print(f"Fetching OpenAPI spec from: {url}")

    # Send a GET request
    response = requests.get(url)

    # Raise an error if the request failed
    response.raise_for_status()  # optional, but good practice

    # Parse JSON
    data = response.json()

    version = data["info"]["version"]

    check_records = extract_check_records(data, version)
    check_records = transform_parameters_format(check_records)
    check_records = transform_situation_format(check_records)

    for check in check_records:
        check.pop("inputs")

    # Write JSON file using UTF-8 to avoid errors
    json_string = json.dumps(check_records, indent=2, ensure_ascii=False)

    print("Parsed json")
    print(json_string)

    save_json_to_storage_and_update_firestore(
        json_string,
        firestore_doc_path="system/config"
    )
