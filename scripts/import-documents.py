import firebase_admin
from firebase_admin import credentials, storage, firestore
import json
from datetime import datetime


# -----------------------------------
# INIT FIREBASE
# -----------------------------------
cred = credentials.Certificate(
    "C:\\Users\\Owner\\Code\\benefit-decision-toolkit\\builder-api\\src\\main\\resources\\benefit-decision-toolkit-play-69aed1a8f86b.json")
firebase_admin.initialize_app(cred, {
    "storageBucket": "benefit-decision-toolkit-play.firebasestorage.app"
})

db = firestore.client()
bucket = storage.bucket()


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


# -----------------------------------
# Example usage
# -----------------------------------
if __name__ == "__main__":
    with open("endpoint_inputs.json", "r") as f:
        data = json.load(f)
        json_string = json.dumps(data, indent=2)

    save_json_to_storage_and_update_firestore(
        json_string,
        firestore_doc_path="system/config"   # Example document path
    )
