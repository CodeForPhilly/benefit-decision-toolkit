package org.acme.controller;


import io.quarkus.logging.Log;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.auth.AuthUtils;
import org.acme.model.domain.EligibilityCheck;
import org.acme.persistence.EligibilityCheckRepository;

import java.util.List;

@Path("/api")
public class EligibilityCheckResource {

    @Inject
    EligibilityCheckRepository eligibilityCheckRepository;

    @GET
    @Path("/check")
    public Response getScreeners(@Context ContainerRequestContext requestContext) {
        String userId = AuthUtils.getUserId(requestContext);
        if (userId == null){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Log.info("Fetching all eligibility checks. User:  " + userId);
        List<EligibilityCheck> checks = eligibilityCheckRepository.getAllChecks();

        return Response.ok(checks, MediaType.APPLICATION_JSON).build();
    }


}
