import json
from copy import deepcopy
import requests


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
                "path": path,
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
            check["parameters"] = new_parameters
    return data


def transform_situation_format(data):
    """Transform all `inputs.situation` in the provided list."""
    for check in data:
        check["situation"] = check["inputs"]["situation"]
    return data


# --------------------------------------------
# Load your OpenAPI JSON here
# --------------------------------------------
if __name__ == "__main__":

    url = "https://library-api-cnsoqyluna-uc.a.run.app/q/openapi.json"

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
    with open("endpoint_inputs.json", "w", encoding="utf-8") as out:
        json.dump(check_records, out, indent=2, ensure_ascii=False)

    print("Output written to endpoint_inputs.json")
