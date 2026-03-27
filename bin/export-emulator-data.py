"""
Export Firestore and Cloud Storage data from running Firebase emulators
into a portable format suitable for seeding other environments (including production).

Usage:
  python3 bin/export-emulator-data.py [output-dir] [--skip-storage-prefix PREFIX ...]
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import firebase_admin
from firebase_admin import credentials, firestore, storage
from google.cloud.firestore import Client as FirestoreClient
from google.cloud.firestore_v1.base_document import DocumentSnapshot
from google.cloud.storage import Bucket
import google.auth.credentials


# ---------------------------------------------------------------------------
# Emulator credentials (same pattern as load-library-metadata.py)
# ---------------------------------------------------------------------------

class EmulatorCredentials(credentials.Base):
    """Mock credentials for use with Firebase emulators."""
    _mock_credential: google.auth.credentials.Credentials

    def __init__(self) -> None:
        self._mock_credential = google.auth.credentials.AnonymousCredentials()

    def get_credential(self) -> google.auth.credentials.Credentials:
        return self._mock_credential


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

parser = argparse.ArgumentParser(description="Export Firebase emulator data")
parser.add_argument("output_dir", nargs="?",
                    default="exported-data-" + datetime.now(tz=timezone.utc).strftime("%Y%m%dT%H%M%SZ"),
                    help="Output directory (default: timestamped directory)")
parser.add_argument("--skip-storage-prefix", action="append", default=[],
                    metavar="PREFIX",
                    help="Skip storage blobs whose path starts with PREFIX (can be repeated)")
args = parser.parse_args()

OUTPUT_DIR = Path(args.output_dir)
SKIP_STORAGE_PREFIXES: list[str] = args.skip_storage_prefix

# Ensure emulator env vars are set
if not os.getenv("FIRESTORE_EMULATOR_HOST"):
    os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8080"

storage_host_override = os.getenv("QUARKUS_GOOGLE_CLOUD_STORAGE_HOST_OVERRIDE")
if storage_host_override:
    os.environ["STORAGE_EMULATOR_HOST"] = storage_host_override
elif not os.getenv("STORAGE_EMULATOR_HOST"):
    os.environ["STORAGE_EMULATOR_HOST"] = "http://localhost:9199"

STORAGE_BUCKET = os.getenv("GCS_BUCKET_NAME", "demo-bdt-dev.appspot.com")
PROJECT_ID = os.getenv("QUARKUS_GOOGLE_CLOUD_PROJECT_ID", "demo-bdt-dev")


# ---------------------------------------------------------------------------
# Initialize Firebase
# ---------------------------------------------------------------------------

cred = EmulatorCredentials()
firebase_admin.initialize_app(cred, {
    "storageBucket": STORAGE_BUCKET,
    "projectId": PROJECT_ID,
})

db: FirestoreClient = firestore.client()
bucket: Bucket = storage.bucket()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def serialize_value(value: Any) -> Any:
    """Convert Firestore field values into JSON-serializable types."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return {"_type": "timestamp", "value": value.isoformat()}
    if isinstance(value, dict):
        return {k: serialize_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [serialize_value(v) for v in value]
    if isinstance(value, (str, int, float, bool)):
        return value
    # Fallback: convert to string
    return str(value)


def export_document(doc: DocumentSnapshot, base_path: Path) -> None:
    """Export a single Firestore document and its subcollections."""
    data = doc.to_dict()
    if data is None:
        return

    # Add the document ID into the exported data for reference
    data["_id"] = doc.id

    serialized = serialize_value(data)

    # Write document JSON
    doc_file = base_path / f"{doc.id}.json"
    doc_file.parent.mkdir(parents=True, exist_ok=True)
    with open(doc_file, "w", encoding="utf-8") as f:
        json.dump(serialized, f, indent=2, ensure_ascii=False)

    # Recurse into subcollections
    for subcol_ref in doc.reference.collections():
        subcol_path = base_path / doc.id / subcol_ref.id
        docs = subcol_ref.stream()
        for sub_doc in docs:
            export_document(sub_doc, subcol_path)


def export_firestore(output_dir: Path) -> int:
    """Export all Firestore collections to JSON files. Returns document count."""
    firestore_dir = output_dir / "firestore"
    doc_count = 0

    # Iterate over all root-level collections
    for collection_ref in db.collections():
        col_name = collection_ref.id
        col_path = firestore_dir / col_name
        print(f"  Exporting collection: {col_name}")

        for doc in collection_ref.stream():
            export_document(doc, col_path)
            doc_count += 1

    return doc_count


def export_storage(output_dir: Path, skip_prefixes: list[str]) -> int:
    """Export all Storage blobs to files. Returns file count."""
    storage_dir = output_dir / "storage"
    file_count = 0

    blobs = bucket.list_blobs()
    for blob in blobs:
        # Skip zero-byte placeholder objects
        if blob.size == 0:
            continue

        # Skip blobs matching any of the skip prefixes
        if any(blob.name.startswith(prefix) for prefix in skip_prefixes):
            print(f"  Skipping blob: {blob.name} (matched skip prefix)")
            continue

        dest = storage_dir / blob.name
        dest.parent.mkdir(parents=True, exist_ok=True)

        print(f"  Exporting blob: {blob.name} ({blob.size} bytes)")
        blob.download_to_filename(str(dest))
        file_count += 1

    return file_count


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print(f"Output directory: {OUTPUT_DIR}")
    print()

    # Clean previous export
    if OUTPUT_DIR.exists():
        import shutil
        shutil.rmtree(OUTPUT_DIR)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Export Firestore
    print("Exporting Firestore data...")
    doc_count = export_firestore(OUTPUT_DIR)
    print(f"  -> {doc_count} document(s) exported")
    print()

    # Export Storage
    print("Exporting Storage data...")
    file_count = export_storage(OUTPUT_DIR, SKIP_STORAGE_PREFIXES)
    print(f"  -> {file_count} file(s) exported")
    print()

    # Write a manifest for reference
    manifest = {
        "exportedAt": datetime.now(tz=timezone.utc).isoformat() + "Z",
        "source": "firebase-emulators",
        "projectId": PROJECT_ID,
        "storageBucket": STORAGE_BUCKET,
        "firestoreDocuments": doc_count,
        "storageFiles": file_count,
    }
    manifest_path = OUTPUT_DIR / "manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"Manifest written to {manifest_path}")


if __name__ == "__main__":
    main()
