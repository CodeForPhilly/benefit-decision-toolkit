package org.acme.repository.utils;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Bucket;
import com.google.firebase.cloud.FirestoreClient;
import com.google.firebase.cloud.StorageClient;
import io.quarkus.logging.Log;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class FirestoreUtils {


    public static Optional<Map<String, Object>> getFirestoreDocById(String collection, String id) {

        Firestore db = FirestoreClient.getFirestore();
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
}
