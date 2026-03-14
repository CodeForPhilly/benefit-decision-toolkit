package org.acme.functions;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import org.acme.model.domain.Screener;
import org.acme.persistence.ScreenerRepository;

@ApplicationScoped
public class AccountHooks {
    @Inject
    ScreenerRepository screenerRepository;

    public Boolean addExampleScreenerToAccount(String userId) {
        try {
            Log.info("Running ADD_EXAMPLE_SCREENER hook for user: " + userId);
            String screenerName = "Example screener - Philly Property Tax Relief";
            String screenerDescription = "Example description";
            Screener exampleScreener = Screener
                    .create(userId, screenerName, screenerDescription);

            String screenerId = screenerRepository
                    .saveNewWorkingScreener(exampleScreener);
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
