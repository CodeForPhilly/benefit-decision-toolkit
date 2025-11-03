package org.acme.controller;

import io.quarkus.logging.Log;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.auth.AuthUtils;
import org.acme.model.domain.EligibilityCheck;
import org.acme.model.dto.SaveDmnRequest;
import org.acme.persistence.EligibilityCheckRepository;
import org.acme.persistence.StorageService;

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
    @Path("/check")
    public Response getAllChecks(@Context SecurityIdentity identity) {
        String userId = AuthUtils.getUserId(identity);
        if (userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Log.info("Fetching all eligibility checks. User:  " + userId);
        List<EligibilityCheck> checks = eligibilityCheckRepository.getAllPublicChecks();

        return Response.ok(checks, MediaType.APPLICATION_JSON).build();
    }

    @GET
    @Path("/check/{checkId}")
    public Response getCheck(@Context SecurityIdentity identity, @PathParam("checkId") String checkId) {
        String userId = AuthUtils.getUserId(identity);
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
    public Response createCheck(@Context SecurityIdentity identity,
                                EligibilityCheck newCheck) {
        String userId = AuthUtils.getUserId(identity);

        //TODO: Add validations for user provided data
        newCheck.setOwnerId(userId);
        newCheck.setPublic(true); // By default all created checks are public
        newCheck.setVersion("1");
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

    @PUT
    @Path("/check")
    public Response updateCheck(@Context SecurityIdentity identity,
                                EligibilityCheck updateCheck){
        String userId = AuthUtils.getUserId(identity);

        // TODO: Add authorization to update check
        try {
            eligibilityCheckRepository.updateCheck(updateCheck);
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
        Optional<EligibilityCheck> checkOpt = eligibilityCheckRepository.getCheck(checkId);
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
            String filePath = storageService.getCheckDmnModelPath(check.getModule(), check.getId(), check.getVersion());
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
}
