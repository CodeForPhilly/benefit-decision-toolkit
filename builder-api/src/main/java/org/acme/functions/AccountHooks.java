package org.acme.functions;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import org.acme.service.ExampleScreenerImportService;

@ApplicationScoped
public class AccountHooks {
    @Inject
    ExampleScreenerImportService exampleScreenerImportService;

    public Boolean addExampleScreenerToAccount(String userId) {
        try {
            Log.info("Running ADD_EXAMPLE_SCREENER hook for user: " + userId);
            var screenerIds = exampleScreenerImportService.importForUser(userId);
            Log.info("Imported example screeners " + screenerIds + " for user " + userId);
            return true;
        } catch (Exception e) {
            Log.error(
                    "Failed to run ADD_EXAMPLE_SCREENER hook for user: "
                            + userId,
                    e);
            return false;
        }
    }
}
