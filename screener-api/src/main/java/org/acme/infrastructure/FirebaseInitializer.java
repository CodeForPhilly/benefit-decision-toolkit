package org.acme.infrastructure;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.auth.oauth2.GoogleCredentials;
import io.quarkus.runtime.Startup;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Singleton;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
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
                        .setProjectId("benefits-decision-toolkit")
                        .setStorageBucket("benefits-decision-toolkit.firebasestorage.app")
                        .build();

                FirebaseApp.initializeApp(options);
                System.out.println("✅ Firebase initialized");
            } catch (IOException e) {
                throw new RuntimeException("Failed to initialize Firebase", e);
            }
        }
    }
}