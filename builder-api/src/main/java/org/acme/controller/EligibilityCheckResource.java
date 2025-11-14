package org.acme.controller;

import io.quarkus.logging.Log;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.auth.AuthUtils;
import org.acme.constants.CheckStatus;
import org.acme.model.domain.EligibilityCheck;
import org.acme.model.dto.SaveDmnRequest;
import org.acme.persistence.EligibilityCheckRepository;
import org.acme.persistence.StorageService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Path("/api")
public class EligibilityCheckResource {

    @Inject
    EligibilityCheckRepository eligibilityCheckRepository;

    @Inject
    StorageService storageService;

    @GET
    @Path("/checks")
    public Response getPublicChecks(@Context SecurityIdentity identity) {
        String userId = AuthUtils.getUserId(identity);
        if (userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Log.info("Fetching all eligibility checks. User:  " + userId);
        List<EligibilityCheck> checks = eligibilityCheckRepository.getPublicChecks();

        return Response.ok(checks, MediaType.APPLICATION_JSON).build();
    }

    @GET
    @Path("/checks/{checkId}")
    public Response getPublicCheck(@Context SecurityIdentity identity, @PathParam("checkId") String checkId) {
        String userId = AuthUtils.getUserId(identity);
        if (userId == null){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Log.info("Fetching all eligibility checks. User:  " + userId);
        Optional<EligibilityCheck> checkOpt = eligibilityCheckRepository.getPublicCheck(checkId);

        if (checkOpt.isEmpty()){
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        EligibilityCheck check = checkOpt.get();

        if (!check.getPublic() && !check.getOwnerId().equals(userId)){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        return Response.ok(check, MediaType.APPLICATION_JSON).build();
    }

    // Utility endpoint, public checks come from the Library API schema and shouldn't usually be created through the app
    @POST
    @Path("/checks")
    public Response createPublicCheck(@Context SecurityIdentity identity,
                                EligibilityCheck newCheck) {
        String userId = AuthUtils.getUserId(identity);

        //TODO: Add validations for user provided data
        newCheck.setOwnerId(userId);
        newCheck.setPublic(true);
        newCheck.setVersion(1);
        try {
            String checkId = eligibilityCheckRepository.savePublicCheck(newCheck);
            newCheck.setId(checkId);
            return Response.ok(newCheck, MediaType.APPLICATION_JSON).build();
        } catch (Exception e){
            return  Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Could not save Check"))
                    .build();
        }
    }

    // Utility endpoint, public checks are static and come from the library api schema
    // and usually should not be updated through the app
    @PUT
    @Path("/checks")
    public Response updatePublicCheck(@Context SecurityIdentity identity,
                                EligibilityCheck updateCheck){
        String userId = AuthUtils.getUserId(identity);

        // TODO: Add authorization to update check
        try {
            eligibilityCheckRepository.savePublicCheck(updateCheck);
            return Response.ok().entity(updateCheck).build();
        } catch (Exception e){
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "could not update Check"))
                    .build();
        }
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/save-check-dmn")
    public Response updateCheckDmn(@Context SecurityIdentity identity, SaveDmnRequest saveDmnRequest){
        String checkId = saveDmnRequest.id;
        String dmnModel = saveDmnRequest.dmnModel;
        if (checkId == null || checkId.isBlank()){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required data: checkId")
                    .build();
        }

        String userId = AuthUtils.getUserId(identity);
        Optional<EligibilityCheck> checkOpt = eligibilityCheckRepository.getWorkingCustomCheck(userId, checkId);
        if (checkOpt.isEmpty()){
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        EligibilityCheck check = checkOpt.get();

        //AUTHORIZATION
//        if (!check.getOwnerId().equals(userId)){
//           return Response.status(Response.Status.UNAUTHORIZED).build();
//        }

        if (dmnModel == null){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required data: DMN Model")
                    .build();
        }
        try {
            String filePath = storageService.getCheckDmnModelPath(userId, checkId);
            storageService.writeStringToStorage(filePath, dmnModel, "application/xml");
            Log.info("Saved DMN model of check " + checkId + " to storage");

            // TODO: Need to figure out if we are allowing DMN versions to be mutable. If so, we need to update a
            // last_saved field so that we know the check was updated and needs to be recompiled on evaluation

            return Response.ok().build();
        } catch (Exception e){
            Log.info(("Failed to save DMN model for check " + checkId));
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    // By default, returns the most recent versions of all published checks owned by the calling user
    // If the query parameter 'working' is set to true,
    // then all the working check objects owned by the user are returned
    @GET
    @Path("/custom-checks")
    public Response getCustomChecks(@Context SecurityIdentity identity, @QueryParam("working") Boolean working) {
        String userId = AuthUtils.getUserId(identity);
        if (userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        List<EligibilityCheck> checks;

        if (working != null && working){
            Log.info("Fetching all working custom checks. User:  " + userId);
            checks = eligibilityCheckRepository.getWorkingCustomChecks(userId);
        } else {
            Log.info("Fetching all published custom checks. User:  " + userId);
            checks = eligibilityCheckRepository.getPublishedCustomChecks(userId);
        }

        return Response.ok(checks, MediaType.APPLICATION_JSON).build();
    }

    @GET
    @Path("/custom-checks/{checkId}")
    public Response getCustomCheck(@Context SecurityIdentity identity, @PathParam("checkId") String checkId) {
        String userId = AuthUtils.getUserId(identity);
        if (userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        char statusIndicator = (checkId != null && !checkId.isEmpty())
                ? checkId.charAt(0)
                : '\0';

        Optional<EligibilityCheck> checkOpt;

        if (statusIndicator == CheckStatus.WORKING.getCode()){
            Log.info("Fetching working custom check: " + checkId + " User:  " + userId);
            checkOpt = eligibilityCheckRepository.getWorkingCustomCheck(userId, userId);
        } else {
            Log.info("Fetching published custom check: " + checkId + " User:  " + userId);
            checkOpt = eligibilityCheckRepository.getPublishedCustomCheck(userId, userId);
        }

        if (checkOpt.isEmpty()){
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        EligibilityCheck check = checkOpt.get();

        if (!check.getPublic() && !check.getOwnerId().equals(userId)){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        return Response.ok(check, MediaType.APPLICATION_JSON).build();
    }

    @POST
    @Path("/custom-checks")
    public Response createCustomCheck(@Context SecurityIdentity identity,
                                EligibilityCheck newCheck) {
        String userId = AuthUtils.getUserId(identity);

        //TODO: Add validations for user provided data
        newCheck.setOwnerId(userId);
        newCheck.setPublic(false);
        newCheck.setVersion(1);
        try {
            String checkId = eligibilityCheckRepository.saveWorkingCustomCheck(newCheck);
            newCheck.setId(checkId);
            return Response.ok(newCheck, MediaType.APPLICATION_JSON).build();
        } catch (Exception e){
            return  Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Could not save Check"))
                    .build();
        }
    }

    @PUT
    @Path("/custom-checks")
    public Response updateCustomCheck(@Context SecurityIdentity identity,
                                EligibilityCheck updateCheck){
        String userId = AuthUtils.getUserId(identity);

        // TODO: Add authorization to update check
        try {
            eligibilityCheckRepository.saveWorkingCustomCheck(updateCheck);
            return Response.ok().entity(updateCheck).build();
        } catch (Exception e){
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "could not update Check"))
                    .build();
        }
    }
}
