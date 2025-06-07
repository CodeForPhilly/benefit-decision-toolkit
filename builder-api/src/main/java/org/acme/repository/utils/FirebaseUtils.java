package org.acme.repository.utils;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Bucket;
import com.google.firebase.cloud.FirestoreClient;
import com.google.firebase.cloud.StorageClient;
import io.quarkus.logging.Log;
import org.acme.mapper.ScreenerMapper;
import org.acme.model.Screener;
import org.w3c.dom.stylesheets.DocumentStyle;

import javax.swing.text.html.Option;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

public class FirebaseUtils {

    private static final Firestore db = FirestoreClient.getFirestore();

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

    // If unique field is not unique, this function returns the first of the matched results
    public static Optional<Map<String, Object>> getFirestoreDocByUniqueField(String collection, String field, String value) {
        try {
            ApiFuture<QuerySnapshot> query = db.collection(collection)
                    .whereEqualTo(field, value)
                    .limit(1)
                    .get();
            List<QueryDocumentSnapshot> documents;
            documents = query.get().getDocuments();

            if (documents.isEmpty()) {
                return Optional.empty();
            }
            QueryDocumentSnapshot document = documents.getFirst();

            return Optional.of(document.getData());

        }catch(Exception e){
            Log.error("Error fetching document from firestore: ", e);
            return Optional.empty();
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

    public static <T> Optional<T> getOptionalField(Map<String, Object> doc, String fieldName, Class<T> clazz) {
        Object value = doc.get(fieldName);
        if (clazz.isInstance(value)) {
            return Optional.of((T) value);
        } else {
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

    public static Optional<InputStream> getFileFromStorage(String filePath) {
        try {
            Bucket bucket = StorageClient.getInstance().bucket();
            Blob blob = bucket.get(filePath);

            if (blob == null || !blob.exists()) {
                return Optional.empty();
            }

            byte[] data = blob.getContent();

            return Optional.of(new ByteArrayInputStream(data));

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
}
