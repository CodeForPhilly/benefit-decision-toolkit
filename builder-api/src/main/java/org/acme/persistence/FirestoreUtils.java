package org.acme.persistence;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Bucket;
import com.google.firebase.cloud.FirestoreClient;
import com.google.firebase.cloud.StorageClient;
import io.quarkus.logging.Log;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

public class FirestoreUtils {

    private static final Firestore db = FirestoreClient.getFirestore();

    public static List<Map<String, Object>> getAllDocsInCollection(String collection){
        try {
            ApiFuture<QuerySnapshot> query = db.collection(collection)
                    .get();
            List<QueryDocumentSnapshot> documents;
            documents = query.get().getDocuments();

            return documents.stream()
                    .map(doc -> {
                        Map<String, Object> data = doc.getData();
                        data.put("id", doc.getId());
                        return data;
                    })
                    .toList();

        }catch(Exception e){
            Log.error("Error fetching documents from firestore: ", e);
            return new ArrayList<>();
        }
    }

    public static List<Map<String, Object>> getFirestoreDocsByField(String collection, String field, String value) {
        try {
            ApiFuture<QuerySnapshot> query = db.collection(collection)
                    .whereEqualTo(field, value)
                    .get();
            List<QueryDocumentSnapshot> documents;
            documents = query.get().getDocuments();

            return documents.stream()
                    .map(doc -> {
                        Map<String, Object> data = doc.getData();
                        data.put("id", doc.getId());
                        return data;
                    })
                    .toList();

        }catch(Exception e){
            Log.error("Error fetching documents from firestore: ", e);
            return new ArrayList<>();
        }
    }

    public static List<Map<String, Object>> getFirestoreDocsByField(String collection, String field, boolean value) {
        try {
            ApiFuture<QuerySnapshot> query = db.collection(collection)
                    .whereEqualTo(field, value)
                    .get();
            List<QueryDocumentSnapshot> documents;
            documents = query.get().getDocuments();

            return documents.stream()
                    .map(doc -> {
                        Map<String, Object> data = doc.getData();
                        data.put("id", doc.getId());
                        return data;
                    })
                    .toList();

        }catch(Exception e){
            Log.error("Error fetching documents from firestore: ", e);
            return new ArrayList<>();
        }
    }

    public static List<Map<String, Object>> getFirestoreDocsByIds(String collection, List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }

        try {
            // Create document references for all IDs
            List<DocumentReference> docRefs = ids.stream()
                    .map(id -> db.collection(collection).document(id))
                    .toList();

            // Batch get all documents
            List<DocumentSnapshot> snapshots = db.getAll(docRefs.toArray(new DocumentReference[0])).get();


            // Might be an issue with the colon in the IDs
            // Add after getting snapshots
            for (int i = 0; i < snapshots.size(); i++) {
                DocumentSnapshot doc = snapshots.get(i);
                Log.info("Document ID: " + ids.get(i) + ", Exists: " + doc.exists() + ", Reference: " + doc.getReference().getPath());
            }
            // Process results, filtering out non-existent documents
            List<Map<String, Object>> results = new ArrayList<>();
            for (DocumentSnapshot doc : snapshots) {
                if (doc.exists()) {
                    Map<String, Object> data = doc.getData();
                    data.put("id", doc.getId());
                    results.add(data);
                }
            }

            return results;
        } catch (Exception e) {
            Log.error("Error fetching documents from firestore: ", e);
            return new ArrayList<>();
        }
    }

    public static Optional<Map<String, Object>> getFirestoreDocById(String collection, String id) {
        try {

            DocumentSnapshot doc = db.collection(collection)
                    .document(id)
                    .get().get();


            if (!doc.exists()) {
                return Optional.empty();
            }


            Map<String, Object> data = doc.getData();
            data.put("id", doc.getId());

            return Optional.of(data);

        }catch(Exception e){
            Log.error("Error fetching document from firestore: ", e);
            return Optional.empty();
        }
    }

    public static Optional<String> getFileAsStringFromStorage(String filePath) {
        try {
            Bucket bucket = StorageClient.getInstance().bucket();
            Blob blob = bucket.get(filePath);

            if (blob == null || !blob.exists()) {
                return Optional.empty();
            }

            byte[] data = blob.getContent();
            String content = new String(data, StandardCharsets.UTF_8);

            return Optional.of(content);

        } catch (Exception e){
            Log.error("Error fetching file from firebase storage: ", e);
            return Optional.empty();
        }
    }

    public static String persistDocument(String collectionName, Map<String, Object> data) throws Exception {
        try {
            DocumentReference documentRef = db.collection(collectionName)
                    .add(data)
                    .get();
            return documentRef.getId();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt(); // preserve interrupt status
            throw new Exception("Thread interrupted while saving to Firestore", e);
        } catch (ExecutionException e) {
            throw new Exception("Failed to write document to Firestore", e);
        }
    }


    public static String persistDocumentWithId(String collectionPath, String documentId, Map<String, Object> data) throws Exception {
        try {
            DocumentReference documentRef = db.collection(collectionPath).document(documentId);
            documentRef.create(data).get();
            return documentRef.getId();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            Log.error(e);
            throw new Exception("Thread interrupted while saving to Firestore", e);
        } catch (ExecutionException e) {
            Log.error(e);
            throw new Exception("Failed to write document to Firestore", e);
        }
    }


    public static void updateDocument(String collectionName, Map<String, Object> data, String docId) throws Exception {
        try {
            WriteResult result = db.collection(collectionName)
                    .document(docId)
                    .set(data, SetOptions.merge())
                    .get();
            Log.info("Document " + docId + " updated at " + result.getUpdateTime());

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt(); // preserve interrupt status
            throw new Exception("Thread interrupted while saving to Firestore", e);
        } catch (ExecutionException e) {
            throw new Exception("Failed to write document to Firestore", e);
        }
    }

    public static void addObjectToArrayField(String collectionName,
                                             String docId,
                                             String field,
                                             Map<String, Object> data) throws Exception{
        try {
            DocumentReference projectRef = db.collection(collectionName).document(docId);

            ApiFuture<WriteResult> future = projectRef.update(
                    field, FieldValue.arrayUnion(data)
            );

            // Wait for the update to complete
            future.get();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            Log.error(e);
            throw new Exception("Thread interrupted while updating array field", e);
        } catch (Exception e) {
            Log.error(e);
            throw new Exception("Failed to update array field", e);
        }
    }

    public static void deleteDocument(String collectionName, String docId) throws Exception {
        try{
            WriteResult result = db.collection(collectionName).document(docId).delete().get();
            Log.info("Document " + docId + " deleted at " + result.getUpdateTime());
        } catch (Exception e){
            Log.error("Failed to delete document from firestore");
            throw new Exception(e);
        }

    }

    public static void addObjectToListFieldOfDocument(String collection, String docId, String field, Object object) throws Exception{
        try{
            DocumentReference docRef = db.collection(collection).document(docId);
            docRef.update(field, FieldValue.arrayUnion(object));
        } catch (Exception e){
            Log.error("Failed to add object to list field of collection.");
            throw new Exception(e);
        }
    }

    public static void removeObjectFromListFieldOfDocument(String collection, String docId, String field, Object object) throws Exception {
        try {
            DocumentReference docRef = db.collection(collection).document(docId);
            docRef.update(field, FieldValue.arrayRemove(object));
        } catch (Exception e) {
            Log.error("Failed to remove object from list field of collection.");
            throw new Exception(e);
        }
    }
}
