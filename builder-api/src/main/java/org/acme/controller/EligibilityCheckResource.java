package org.acme.controller;


import io.quarkus.logging.Log;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.auth.AuthUtils;
import org.acme.model.domain.EligibilityCheck;
import org.acme.persistence.EligibilityCheckRepository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Path("/api")
public class EligibilityCheckResource {

    @Inject
    EligibilityCheckRepository eligibilityCheckRepository;

    @GET
    @Path("/check")
    public Response getAllChecks(@Context ContainerRequestContext requestContext) {
        String userId = AuthUtils.getUserId(requestContext);
        if (userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Log.info("Fetching all eligibility checks. User:  " + userId);
        List<EligibilityCheck> checks = eligibilityCheckRepository.getAllPublicChecks();

        return Response.ok(checks, MediaType.APPLICATION_JSON).build();
    }

    @GET
    @Path("/check/{checkId}")
    public Response getAllChecks(@Context ContainerRequestContext requestContext, @PathParam("checkId") String checkId) {
        String userId = AuthUtils.getUserId(requestContext);
        if (userId == null){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Log.info("Fetching all eligibility checks. User:  " + userId);
        Optional<EligibilityCheck> checkOpt = eligibilityCheckRepository.getCheck(checkId);

        if (checkOpt.isEmpty()){
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        EligibilityCheck check = checkOpt.get();

        if (!check.getPublic() && !check.getOwnerId().equals(userId)){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        return Response.ok(check, MediaType.APPLICATION_JSON).build();

    }

    // Utility endpoint to create an Eligibility check
    // In the future seperate endpoints will need to be created for publishing public checks and creating private checks
    @POST
    @Path("/check")
    public Response createCheck(@Context ContainerRequestContext requestContext, EligibilityCheck newCheck) {
          String userId = AuthUtils.getUserId(requestContext);

        //TODO: Add validations for user provided data

        newCheck.setOwnerId(userId);
        try {
            String checkId = eligibilityCheckRepository.saveNewCheck(newCheck);
            newCheck.setId(checkId);
            return Response.ok(newCheck, MediaType.APPLICATION_JSON).build();
        } catch (Exception e){
            return  Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Could not save Check"))
                    .build();
        }
    }
}
