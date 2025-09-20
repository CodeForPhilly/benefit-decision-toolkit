package org.acme.persistence;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class FirestoreService {

    @Inject
    Firestore db;

    public List<Map<String, Object>> getAllDocsInCollection(String collection){
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

    public List<Map<String, Object>> getFirestoreDocsByField(String collection, String field, String value) {
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

    public Optional<Map<String, Object>> getFirestoreDocById(String collection, String id) {
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

    public String persistDocument(String collectionName, Map<String, Object> data) throws Exception {
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


    public void updateDocument(String collectionName, Map<String, Object> data, String docId) throws Exception {
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

    public void deleteDocument(String collectionName, String docId) throws Exception {
        try{
            WriteResult result = db.collection(collectionName).document(docId).delete().get();
            Log.info("Document " + docId + " deleted at " + result.getUpdateTime());
        } catch (Exception e){
            Log.error("Failed to delete document from firestore");
            throw new Exception(e);
        }

    }

    public void addObjectToListFieldOfDocument(String collection, String docId, String field, Object object) throws Exception{
        try{
            DocumentReference docRef = db.collection(collection).document(docId);
            docRef.update(field, FieldValue.arrayUnion(object));
        } catch (Exception e){
            Log.error("Failed to add object to list field of collection.");
            throw new Exception(e);
        }
    }

    public void removeObjectFromListFieldOfDocument(String collection, String docId, String field, Object object) throws Exception {
        try {
            DocumentReference docRef = db.collection(collection).document(docId);
            docRef.update(field, FieldValue.arrayRemove(object));
        } catch (Exception e) {
            Log.error("Failed to remove object from list field of collection.");
            throw new Exception(e);
        }
    }
}
