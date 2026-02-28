package org.acme.controller;

import io.quarkus.logging.Log;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import com.fasterxml.jackson.databind.JsonNode;
import org.acme.auth.AuthUtils;
import org.acme.constants.CheckStatus;
import org.acme.model.domain.EligibilityCheck;
import org.acme.model.dto.CreateCheckRequest;
import org.acme.model.dto.EligibilityCheck.CheckDmnRequest;
import org.acme.model.dto.EligibilityCheck.EditCheckRequest;
import org.acme.persistence.EligibilityCheckRepository;
import org.acme.persistence.StorageService;
import org.acme.service.DmnService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Path("/api/custom-checks")
public class EligibilityCheckResource {

    @Inject
    EligibilityCheckRepository eligibilityCheckRepository;

    @Inject
    StorageService storageService;

    @Inject
    DmnService dmnService;

    // ========== Collection Endpoints ==========

    // By default, returns the most recent versions of all published checks owned by the calling user
    // If the query parameter 'working' is set to true,
    // then all the working check objects owned by the user are returned
    @GET
    public Response getCustomChecks(
        @Context SecurityIdentity identity,
        @QueryParam("working") Boolean working
    ) {
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
            checks = eligibilityCheckRepository.getLatestVersionPublishedCustomChecks(userId);
        }

        return Response.ok(checks, MediaType.APPLICATION_JSON).build();
    }

    @POST
    public Response createCustomCheck(@Context SecurityIdentity identity,
                                CreateCheckRequest request) {
        String userId = AuthUtils.getUserId(identity);

        // Build EligibilityCheck from allowed fields only
        EligibilityCheck newCheck = new EligibilityCheck(
            request.name,
            request.module,
            request.description,
            request.parameterDefinitions,
            userId
        );

        try {
            eligibilityCheckRepository.saveNewWorkingCustomCheck(newCheck);
            return Response.ok(newCheck, MediaType.APPLICATION_JSON).build();
        } catch (Exception e){
            return  Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Could not save Check"))
                    .build();
        }
    }

    // ========== Single Resource Endpoints ==========

    @GET
    @Path("/{checkId}")
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
            checkOpt = eligibilityCheckRepository.getWorkingCustomCheck(userId, checkId);
        } else {
            Log.info("Fetching published custom check: " + checkId + " User:  " + userId);
            checkOpt = eligibilityCheckRepository.getPublishedCustomCheck(userId, checkId);
        }

        if (checkOpt.isEmpty()){
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        EligibilityCheck check = checkOpt.get();

        if (!check.getOwnerId().equals(userId)){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        return Response.ok(check, MediaType.APPLICATION_JSON).build();
    }

    @PATCH
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/{checkId}")
    public Response updateCustomCheck(@Context SecurityIdentity identity,
                                      @PathParam("checkId") String checkId,
                                      @Valid EditCheckRequest request){
        String userId = AuthUtils.getUserId(identity);

        // Check if the check exists and is not archived
        Optional<EligibilityCheck> existingCheckOpt = eligibilityCheckRepository.getWorkingCustomCheck(userId, checkId);
        if (existingCheckOpt.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        EligibilityCheck existingCheck = existingCheckOpt.get();

        // Authorization: verify ownership using existing record (not from request)
        if (!userId.equals(existingCheck.getOwnerId())){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        // Partial update: only update fields that are provided (non-null)
        if (request.description() != null) {
            existingCheck.setDescription(request.description());
        }
        if (request.parameterDefinitions() != null) {
            existingCheck.setParameterDefinitions(request.parameterDefinitions());
        }

        try {
            eligibilityCheckRepository.updateWorkingCustomCheck(existingCheck);
            return Response.ok().entity(existingCheck).build();
        } catch (Exception e){
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "could not update Check"))
                    .build();
        }
    }

    // ========== Sub-Resource Endpoints: DMN ==========

    @PUT
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/{checkId}/dmn")
    public Response saveCheckDmn(@Context SecurityIdentity identity,
                                 @PathParam("checkId") String checkId,
                                 @Valid CheckDmnRequest saveDmnRequest){
        String dmnModel = saveDmnRequest.dmnModel();

        String userId = AuthUtils.getUserId(identity);
        Optional<EligibilityCheck> checkOpt = eligibilityCheckRepository.getWorkingCustomCheck(userId, checkId);
        if (checkOpt.isEmpty()){
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        EligibilityCheck check = checkOpt.get();
        if (!check.getOwnerId().equals(userId)){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        try {
            String filePath = storageService.getCheckDmnModelPath(checkId);
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

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/{checkId}/dmn/validate")
    public Response validateCheckDmn(@Context SecurityIdentity identity,
                                     @PathParam("checkId") String checkId,
                                     @Valid CheckDmnRequest validateDmnRequest){
        String dmnModel = validateDmnRequest.dmnModel();

        String userId = AuthUtils.getUserId(identity);
        Optional<EligibilityCheck> checkOpt = eligibilityCheckRepository.getWorkingCustomCheck(userId, checkId);
        if (checkOpt.isEmpty()){
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        EligibilityCheck check = checkOpt.get();
        if (!check.getOwnerId().equals(userId)){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        if (dmnModel == null || dmnModel.isBlank()){
            return Response.ok(Map.of("errors", List.of("DMN Definition cannot be empty"))).build();
        }

        try {
            HashMap<String, String> dmnDependenciesMap = new HashMap<String, String>();
            List<String> validationErrors = dmnService.validateDmnXml(dmnModel, dmnDependenciesMap, check.getName(), check.getName());
            if (!validationErrors.isEmpty()) {
                validationErrors = validationErrors.stream()
                    .map(error -> error.replaceAll("\\(.*?\\)", ""))
                    .collect(java.util.stream.Collectors.toList());

                return Response.ok(Map.of("errors", validationErrors)).build();
            }

            return Response.ok(Map.of("errors", List.of())).build();
        } catch (Exception e){
            Log.info(("Failed to validate DMN model for check " + checkId));
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ========== Sub-Resource Endpoints: Actions ==========

    @POST
    @Path("/{checkId}/publish")
    public Response publishCustomCheck(@Context SecurityIdentity identity, @PathParam("checkId") String checkId){

        String userId = AuthUtils.getUserId(identity);
        Optional<EligibilityCheck> checkOpt = eligibilityCheckRepository.getWorkingCustomCheck(userId, checkId);
        if (checkOpt.isEmpty()){
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        EligibilityCheck check = checkOpt.get();

        // Authorization
        if (!userId.equals(check.getOwnerId())){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        // Retrieve DMN Path before incrementing version
        Optional<String> workingDmnOpt = storageService.getStringFromStorage(storageService.getCheckDmnModelPath(check.getId()));
        if (!workingDmnOpt.isPresent()) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "could not find DMN file for working Check"))
                    .build();
        }

        // Extract input schema from DMN
        try {
            String workingDmn = workingDmnOpt.get();
            HashMap<String, String> dmnDependenciesMap = new HashMap<String, String>();
            JsonNode inputSchema = dmnService.extractInputSchema(workingDmn, dmnDependenciesMap, check.getName());
            check.setInputDefinition(inputSchema);
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Failed to extract input schema for check " + check.getId()))
                    .build();
        }

        // Update workingCheck so that the incremented version number is saved
        check.setVersion(incrementMajorVersion(check.getVersion()));
        try {
            eligibilityCheckRepository.updateWorkingCustomCheck(check);
        } catch (Exception e){
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "could not update working Check, published check version was not created"))
                    .build();
        }

        // Create new published custom check
        try {
            // save published check meta data document
            String publishedCheckId = eligibilityCheckRepository.saveNewPublishedCustomCheck(check);

            // save published check DMN to storage
            if (workingDmnOpt.isPresent()){
                String workingDmn = workingDmnOpt.get();
                storageService.writeStringToStorage(storageService.getCheckDmnModelPath(publishedCheckId), workingDmn, "application/xml");
            } else {
                Log.warn("Could not find working DMN model for check " + check.getId() + ", published check created without DMN model");
            }
        } catch (Exception e){
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "could not create new published custom check version"))
                    .build();
        }

        return Response.ok(check, MediaType.APPLICATION_JSON).build();
    }

    @POST
    @Path("/{checkId}/archive")
    public Response archiveCustomCheck(@Context SecurityIdentity identity, @PathParam("checkId") String checkId) {
        String userId = AuthUtils.getUserId(identity);
        if (userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        Optional<EligibilityCheck> checkOpt = eligibilityCheckRepository.getWorkingCustomCheck(userId, checkId, true);
        if (checkOpt.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        EligibilityCheck check = checkOpt.get();

        if (!check.getOwnerId().equals(userId)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        if (check.getIsArchived()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Check is already archived"))
                    .build();
        }

        check.setIsArchived(true);
        try {
            eligibilityCheckRepository.updateWorkingCustomCheck(check);
            return Response.ok().build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Could not archive check"))
                    .build();
        }
    }

    // ========== Sub-Resource Endpoints: Related Resources ==========

    /* Endpoint for returning all Published Check Versions related to a given Working Eligibility Check */
    @GET
    @Path("/{checkId}/versions")
    public Response getPublishedVersionsOfWorkingCheck(@Context SecurityIdentity identity, @PathParam("checkId") String checkId){
        String userId = AuthUtils.getUserId(identity);
        Optional<EligibilityCheck> checkOpt = eligibilityCheckRepository.getWorkingCustomCheck(userId, checkId);
        if (checkOpt.isEmpty()){
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        EligibilityCheck check = checkOpt.get();

        // Authorization
        if (!userId.equals(check.getOwnerId())){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        try {
            List<EligibilityCheck> publishedChecks = eligibilityCheckRepository.getPublishedCheckVersions(check);

            return Response.ok(publishedChecks, MediaType.APPLICATION_JSON).build();
        } catch (Exception e){
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "could not update working Check, published check version was not created"))
                    .build();
        }
    }

    // ========== Private Helper Methods ==========

    private String incrementMajorVersion(String version) {
        int[] v = normalize(version);
        v[0]++;         // increment major
        v[1] = 0;       // reset minor
        v[2] = 0;       // reset patch
        return v[0] + "." + v[1] + "." + v[2];
    }

    private int[] normalize(String version) {
        String[] parts = version.split("\\.");
        int[] nums = new int[]{0, 0, 0};

        for (int i = 0; i < parts.length && i < 3; i++) {
            nums[i] = Integer.parseInt(parts[i]);
        }
        return nums;
    }
}
