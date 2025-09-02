package org.acme.infrastructure;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import io.quarkus.runtime.Startup;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.IOException;

@Startup
@ApplicationScoped
public class FirebaseInitializer {

    @PostConstruct
    void init() {

        if (FirebaseApp.getApps().isEmpty()) {
            try {

                FirebaseOptions options = new FirebaseOptions.Builder()
                        .setCredentials(GoogleCredentials.getApplicationDefault())
                        .setProjectId("benefit-decision-toolkit-play")
                        .setStorageBucket("benefit-decision-toolkit-play.firebasestorage.app")
                        .build();

                FirebaseApp.initializeApp(options);
                System.out.println("✅ Firebase initialized");
            } catch (IOException e) {
                throw new RuntimeException("Failed to initialize Firebase", e);
            }
        }
    }
}