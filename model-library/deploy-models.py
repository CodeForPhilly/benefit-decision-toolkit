import os
from google.cloud import storage

# Configuration
LOCAL_DIR = "./dmn/"
BUCKET_NAME = "benefits-decision-toolkit.firebasestorage.app"

# Map of local filenames to their corresponding GCS paths
GCS_PATH_MAP = {
    "compare.dmn": "model_repository/benefits-decision-toolkit/compare/1.0.0/compare.dmn",
    "utility.dmn": "model_repository/benefits-decision-toolkit/utility/1.0.0/utility.dmn",
    "age.dmn": "model_repository/benefits-decision-toolkit/age/1.0.0/age.dmn",
    "enrollments.dmn": "model_repository/benefits-decision-toolkit/enrollments/1.0.0/enrollments.dmn",
    "housing.dmn": "model_repository/benefits-decision-toolkit/housing/1.0.0/housing.dmn",
    "income.dmn": "model_repository/benefits-decision-toolkit/income/1.0.0/income.dmn",
    "location.dmn": "model_repository/benefits-decision-toolkit/location/1.0.0/location.dmn",
}


def upload_dmn_files(local_dir, bucket_name, path_map):
    client = storage.Client()
    bucket = client.bucket(bucket_name)

    for local_file, gcs_path in path_map.items():
        local_path = os.path.join(local_dir, local_file)

        if not os.path.exists(local_path):
            print(f"[WARNING] File not found: {local_path}, skipping.")
            continue

        blob = bucket.blob(gcs_path)
        blob.upload_from_filename(local_path)
        print(f"[INFO] Uploaded {local_file} to gs://{bucket_name}/{gcs_path}")


if __name__ == "__main__":
    upload_dmn_files(LOCAL_DIR, BUCKET_NAME, GCS_PATH_MAP)
