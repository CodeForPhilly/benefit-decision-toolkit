package org.acme.repository.utils;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import io.quarkus.logging.Log;

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
