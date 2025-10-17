package org.acme.controller;

import com.fasterxml.jackson.databind.JsonNode;
import io.quarkus.logging.Log;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.auth.AuthUtils;
import org.acme.model.domain.*;
import org.acme.model.dto.DmnImportRequest;
import org.acme.model.dto.PublishScreenerRequest;
import org.acme.model.dto.SaveDmnRequest;
import org.acme.model.dto.SaveSchemaRequest;
import org.acme.persistence.BenefitRepository;
import org.acme.persistence.EligibilityCheckRepository;
import org.acme.persistence.ScreenerRepository;
import org.acme.persistence.StorageService;
import org.acme.service.DmnService;
import org.acme.service.ScreenerDependencyService;
import org.acme.service.DmnParser;

import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Path("/api")
public class ScreenerResource {

    @Inject
    ScreenerRepository screenerRepository;

    @Inject
    BenefitRepository benefitRepository;

    @Inject
    EligibilityCheckRepository eligibilityCheckRepository;

    @Inject
    StorageService storageService;

    @Inject
    DmnService dmnService;

    @Inject
    ScreenerDependencyService screenerDependencyService;

    @GET
    @Path("/screeners")
    public Response getScreeners(@Context SecurityIdentity identity) {
        String userId = AuthUtils.getUserId(identity);
        if (userId == null){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Log.info("Fetching screeners for user: " + userId);
        List<Screener> screeners = screenerRepository.getScreeners(userId);

        return Response.ok(screeners, MediaType.APPLICATION_JSON).build();
    }


    @GET
    @Path("/screener/{screenerId}")
    public Response getScreener(@Context SecurityIdentity identity, @PathParam("screenerId") String screenerId) {

        String userId = AuthUtils.getUserId(identity);
        Log.info("Fetching screener " + screenerId + "  for user " + userId);

        //perform authentication

        Optional<Screener> screenerOptional = screenerRepository.getScreener(screenerId);

        if (screenerOptional.isEmpty()){
          throw new NotFoundException();
        }

        Screener screener = screenerOptional.get();

        if (!isUserAuthorizedToAccessScreenerByScreener(userId, screener)) return Response.status(Response.Status.UNAUTHORIZED).build();

        return Response.ok(screener, MediaType.APPLICATION_JSON).build();
    }


    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/screener")
    public Response postScreener(@Context SecurityIdentity identity, Screener newScreener){
        String userId = AuthUtils.getUserId(identity);

        //initialize screener data not in form
        newScreener.setIsPublished(false);

        newScreener.setOwnerId(userId);
        try {
            String screenerId = screenerRepository.saveNewScreener(newScreener);
            newScreener.setId(screenerId);
            return Response.ok(newScreener, MediaType.APPLICATION_JSON).build();
        } catch (Exception e){
            return  Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Could not save Screener"))
                    .build();
        }
    }


    @PUT
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/screener")
    public Response updateScreener(@Context SecurityIdentity identity, Screener screener){
        String userId = AuthUtils.getUserId(identity);
        if (!isUserAuthorizedToAccessScreener(userId, screener.getId())) return Response.status(Response.Status.UNAUTHORIZED).build();

        //add user info to the update data
        screener.setOwnerId(userId);

        Log.info("isPublished: " + screener.isPublished());
        try {
            screenerRepository.updateScreener(screener);

            return Response.ok().build();
        } catch (Exception e){
            return  Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Could not update Screener"))
                    .build();
        }
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/save-form-schema")
    public Response saveFormSchema(@Context SecurityIdentity identity, SaveSchemaRequest saveSchemaRequest){

        String screenerId = saveSchemaRequest.screenerId;
        if (screenerId == null || screenerId.isBlank()){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required required data in request body: screenerId")
                    .build();
        }

        String userId = AuthUtils.getUserId(identity);
        if (!isUserAuthorizedToAccessScreener(userId, saveSchemaRequest.screenerId)) return Response.status(Response.Status.UNAUTHORIZED).build();

        JsonNode schema = saveSchemaRequest.schema;
        if (schema == null){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required required data in request body: screenerId")
                    .build();
        }
        try {
            String filePath = storageService.getScreenerWorkingFormSchemaPath(screenerId);
            storageService.writeJsonToStorage(filePath, schema);
            Log.info("Saved form schema of screener " + screenerId + " to storage");
            return Response.ok().build();
        } catch (Exception e){
            Log.info(("Failed to save form for screener " + screenerId));
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/save-dmn-model")
    public Response saveDmnModel(@Context SecurityIdentity identity, SaveDmnRequest saveDmnRequest){

        String screenerId = saveDmnRequest.id;
        String dmnModel = saveDmnRequest.dmnModel;
        if (screenerId == null || screenerId.isBlank()){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required data: screenerId")
                    .build();
        }

        String userId = AuthUtils.getUserId(identity);
        if (!isUserAuthorizedToAccessScreener(userId, screenerId)) return Response.status(Response.Status.UNAUTHORIZED).build();

        if (dmnModel == null){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required data: DMN Model")
                    .build();
        }
        try {
            String filePath = storageService.getScreenerWorkingDmnModelPath(screenerId);
            storageService.writeStringToStorage(filePath, dmnModel, "application/xml");
            Log.info("Saved DMN model of screener " + screenerId + " to storage");


            Screener updateScreener = new Screener();
            updateScreener.setId(screenerId);
            updateScreener.setLastDmnSave(Instant.now().toString());
            //update screener metadata
            screenerRepository.updateScreener(updateScreener);
            return Response.ok().build();
        } catch (Exception e){
            Log.info(("Failed to save DMN model for screener " + screenerId));
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/publish")
    public Response publishScreener(@Context SecurityIdentity identity, PublishScreenerRequest publishScreenerRequest){

        String screenerId = publishScreenerRequest.screenerId;
        if (screenerId == null || screenerId.isBlank()){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required query parameter: screenerId")
                    .build();
        }

        String userId = AuthUtils.getUserId(identity);
        if (!isUserAuthorizedToAccessScreener(userId, screenerId)) return Response.status(Response.Status.UNAUTHORIZED).build();

        try {
            //update published form schema
            storageService.updatePublishedFormSchemaArtifact(screenerId);
            Log.info("Updated Screener " + screenerId + " to published.");

            //update published dmn model
            String dmnXml = dmnService.compilePublishedDmnModel(screenerId);

            Screener updateScreener = new Screener();
            updateScreener.setId(screenerId);
            updateScreener.setIsPublished(true);
            updateScreener.setLastPublishDate(Instant.now().toString());
            DmnParser dmnParser = new DmnParser(dmnXml);
            updateScreener.setPublishedDmnName(dmnParser.getName());
            updateScreener.setPublishedDmnNameSpace(dmnParser.getNameSpace());
            //update screener metadata
            screenerRepository.updateScreener(updateScreener);

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("screenerUrl", getScreenerUrl(screenerId));
            return Response.ok().entity(responseData).build();

        } catch (Exception e){
            Log.error("Error: Error updating screener to published. Screener: " + screenerId);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    private static String getScreenerUrl(String screenerId) {
        return "screener/" + screenerId;
    }

    @POST
    @Path("/unpublish")
    public Response unpublishScreener(@Context SecurityIdentity identity, @QueryParam("screenerId") String screenerId){

        if (screenerId == null || screenerId.isBlank()){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required query parameter: screenerId")
                    .build();
        }

        String userId = AuthUtils.getUserId(identity);
        if (!isUserAuthorizedToAccessScreener(userId, screenerId)) return Response.status(Response.Status.UNAUTHORIZED).build();

        try {
            Screener updateScreener = new Screener();
            updateScreener.setId(screenerId);
            updateScreener.setIsPublished(false);
            screenerRepository.updateScreener(updateScreener);
            Log.info("Updated Screener " + screenerId + " to unpublished.");
            return Response.ok().build();

        } catch (Exception e){
            Log.error("Error: Error updating screener to unpublished. Screener: " + screenerId);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DELETE
    @Path("/screener/delete")
    public Response deleteScreener(@Context SecurityIdentity identity, @QueryParam("screenerId") String screenerId){
        if (screenerId == null || screenerId.isBlank()){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required query parameter: screenerId")
                    .build();
        }

        String userId = AuthUtils.getUserId(identity);
        if (!isUserAuthorizedToAccessScreener(userId, screenerId)) return Response.status(Response.Status.UNAUTHORIZED).build();

        try {
            screenerRepository.deleteScreener(screenerId);
            return Response.ok().build();
        } catch (Exception e){
            Log.error("Error: error deleting screener " + screenerId);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    private boolean isUserAuthorizedToAccessScreener(String userId, String screenerId) {
        Optional<Screener> screenerOptional = screenerRepository.getScreenerMetaDataOnly(screenerId);
        if (screenerOptional.isEmpty()){
            return false;
        }
        Screener screener = screenerOptional.get();
        return isUserAuthorizedToAccessScreenerByScreener(userId, screener);
    }

    private boolean isUserAuthorizedToAccessScreenerByScreener(String userId, Screener screener) {
        String ownerId = screener.getOwnerId();
        if (userId.equals(ownerId)){
            return true;
        }
        return false;
    }

    // This Endpoint allows users to add a public DMN model into their project as a dependency.
    // This makes the dmn model elements available in the dmn editor as well as includes the dmn model when the dmn is
    // compiled
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/dependency")
    public Response addDependency(@Context SecurityIdentity identity, DmnImportRequest request){
        String userId = AuthUtils.getUserId(identity);
        return screenerDependencyService.addDependency(request, userId);
    }

    // This Endpoint allows users to delete dmn dependencies from their project. The DMN model elements will no longer
    // be available in the DMN editor.
    @DELETE
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/dependency")
    public Response deleteDependency(@Context SecurityIdentity identity, DmnImportRequest request){
        String userId = AuthUtils.getUserId(identity);
        return screenerDependencyService.deleteDependency(request, userId);
    }

    @GET
    @Path("/screener/{screenerId}/benefit")
    public Response getScreenerBenefits(@Context SecurityIdentity identity,
                                        @PathParam("screenerId") String screenerId){
        String userId = AuthUtils.getUserId(identity);

        Optional<Screener> screenerOpt = screenerRepository.getScreener(screenerId);
        if (screenerOpt.isEmpty()){
            throw new NotFoundException();
        }
        Screener screener = screenerOpt.get();

        if (!isUserAuthorizedToAccessScreenerByScreener(userId, screener)){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        try{
            List<Benefit> benefits = benefitRepository.getBenefitsInScreener(screener);
            return Response.ok().entity(benefits).build();
        } catch (Exception e){
            Log.error(e);
            return  Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Could not fetch benefits"))
                    .build();
        }
    }

    @GET
    @Path("/screener/{screenerId}/benefit/{benefitId}")
    public Response getScreenerBenefit(@Context SecurityIdentity identity,
                                       @PathParam("screenerId") String screenerId,
                                       @PathParam("benefitId") String benefitId){
        String userId = AuthUtils.getUserId(identity);
        if (!isUserAuthorizedToAccessScreener(userId, screenerId)){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        try{
            Optional<Benefit> benefitOpt = benefitRepository.getCustomBenefit(screenerId, benefitId);
            if (benefitOpt.isEmpty()){
                return Response.status(Response.Status.NOT_FOUND).build();
            }
            return Response.ok().entity(benefitOpt.get()).build();
        } catch (Exception e){
            Log.error(e);
            return  Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Could not fetch benefit"))
                    .build();
        }
    }

    @GET
    @Path("/screener/{screenerId}/benefit/{benefitId}/check")
    public Response getScreenerCustomBenefitChecks(@Context SecurityIdentity identity,
                                                    @PathParam("screenerId") String screenerId,
                                                    @PathParam("benefitId") String benefitId){
        try {
            String userId = AuthUtils.getUserId(identity);

            Optional<Screener> screenerOpt = screenerRepository.getScreener(screenerId);
            if (screenerOpt.isEmpty()){
                throw new NotFoundException();
            }
            Screener screener = screenerOpt.get();

            if (!isUserAuthorizedToAccessScreenerByScreener(userId, screener)){
                return Response.status(Response.Status.UNAUTHORIZED).build();
            }

            Optional<Benefit> benefitOpt = benefitRepository.getCustomBenefit(screenerId, benefitId);
            if (benefitOpt.isEmpty()) {
                throw new NotFoundException();
            }

            List<EligibilityCheck> checks = eligibilityCheckRepository.getChecksInBenefit(benefitOpt.get());
            return Response.ok().entity(checks).build();
        } catch (Exception e){
            Log.error(e);
            return  Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Could not fetch checks"))
                    .build();
        }
    }

    @POST
    @Path("/screener/{screenerId}/benefit")
    public Response addCustomBenefit(@Context SecurityIdentity identity,
                                  @PathParam("screenerId") String screenerId,
                                  Benefit newBenefit) {
        String userId = AuthUtils.getUserId(identity);

        newBenefit.setOwnerId(userId);
        newBenefit.setChecks(Collections.emptyList());

        BenefitDetail benefitDetail = new BenefitDetail();
        benefitDetail.setId(newBenefit.getId());
        benefitDetail.setName(newBenefit.getName());
        benefitDetail.setDescription(newBenefit.getDescription());
        benefitDetail.setPublic(newBenefit.getPublic());
        try {
            // Check to make sure not introducing duplicates
            Optional<Screener> screenerOpt = screenerRepository.getScreener(screenerId);
            if (screenerOpt.isEmpty()){
                Log.error("Screener not found. Screener ID:" + screenerId);
                throw new NotFoundException();
            }

            Screener screener = screenerOpt.get();

            // Authorise action
            if (userId != null && !isUserAuthorizedToAccessScreenerByScreener(userId, screener)) {
                return Response.status(Response.Status.UNAUTHORIZED).build();
            }

            List<BenefitDetail> benefits = screenerOpt.get().getBenefits();
            if (benefits == null) {
                benefits = Collections.emptyList();
            }
            Boolean benefitIdExists = !benefits.stream().filter(benefit -> benefit.getId().equals(benefitDetail.getId())).toList().isEmpty();

            if (benefitIdExists){
                return Response.status(
                    Response.Status.CONFLICT.getStatusCode(),
                    "Benefit with provided ID already exists on screener."
                ).build();
            }

            String benefitId = benefitRepository.saveNewCustomBenefit(screenerId, newBenefit);
            screenerRepository.addBenefitDetailToScreener(screenerId, benefitDetail);
            newBenefit.setId(benefitId);
            return Response.ok(newBenefit, MediaType.APPLICATION_JSON).build();
        } catch (Exception e) {
            Log.error(e);
            return  Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Could not save benefit"))
                    .build();
        }
    }

    @POST
    @Path("/screener/{screenerId}/copy_public_benefit")
    public Response copyPublicBenefit(@Context SecurityIdentity identity,
                                      @PathParam("screenerId") String screenerId,
                                      @QueryParam("benefitId") String benefitId) {
        // Check if Screener and Benefit exist
        Optional<Screener> screenerOpt = screenerRepository.getScreener(screenerId);
        Optional<Benefit> benefitOpt = benefitRepository.getBenefit(benefitId);
        if (screenerOpt.isEmpty()) {
            throw new NotFoundException();
        }
        if (benefitOpt.isEmpty()) {
            throw new NotFoundException();
        }

        // Confirm user is authorized to make the change
        String userId = AuthUtils.getUserId(identity);
        Screener screener = screenerOpt.get();
        if (!isUserAuthorizedToAccessScreenerByScreener(userId, screener)){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        Benefit publicBenefit = benefitOpt.get();
        List<BenefitDetail> benefits = screenerOpt.get().getBenefits();
        Boolean benefitIdExists = !benefits.stream().filter(
            benefitDetail -> publicBenefit.getId().equals(benefitDetail.getId())
        ).toList().isEmpty();
        if (benefitIdExists){
            return Response.status(
                Response.Status.CONFLICT.getStatusCode(),
                "Benefit with provided ID already exists on screener."
            ).build();
        }

        try {
            Benefit newBenefit = new Benefit();
            newBenefit.setId(UUID.randomUUID().toString());
            newBenefit.setName(publicBenefit.getName());
            newBenefit.setDescription(publicBenefit.getDescription());
            newBenefit.setOwnerId(userId);
            newBenefit.setChecks(publicBenefit.getChecks());

            BenefitDetail benefitDetail = new BenefitDetail();
            benefitDetail.setId(newBenefit.getId());
            benefitDetail.setName(newBenefit.getName());
            benefitDetail.setDescription(newBenefit.getDescription());
            benefitDetail.setPublic(newBenefit.getPublic());

            String generatedBenefitId = benefitRepository.saveNewCustomBenefit(screenerId, newBenefit);
            screenerRepository.addBenefitDetailToScreener(screenerId, benefitDetail);
            newBenefit.setId(generatedBenefitId);

            return Response.ok(newBenefit, MediaType.APPLICATION_JSON).build();
        } catch (Exception e) {
            Log.error(e);
            return  Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Could not save benefit"))
                    .build();
        }
    }

    @PUT
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/screener/{screenerId}/benefit")
    public Response updateCustomBenefit(@Context SecurityIdentity identity,
                                        @PathParam("screenerId") String screenerId,
                                        Benefit updatedBenefit) {
        String userId = AuthUtils.getUserId(identity);

        // TODO: Add validations for user provided data

        if (!isUserAuthorizedToAccessScreener(userId, screenerId)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        try {
            Optional<Benefit> benefitOpt = benefitRepository.getCustomBenefit(screenerId, updatedBenefit.getId());
            if (benefitOpt.isEmpty()) {
                return Response.status(Response.Status.NOT_FOUND).build();
            }

            benefitRepository.updateCustomBenefit(screenerId, updatedBenefit);
            return Response.ok(updatedBenefit, MediaType.APPLICATION_JSON).build();
        } catch (Exception e) {
            Log.error(e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Could not update custom benefit"))
                    .build();
        }
    }

    @DELETE
    @Path("/screener/{screenerId}/benefit/{benefitId}")
    public Response deleteCustomBenefit(@Context SecurityIdentity identity,
                                        @PathParam("screenerId") String screenerId,
                                        @PathParam("benefitId") String benefitId) {
        try {
            // Check if Screener and Benefit exist
            Optional<Screener> screenerOpt = screenerRepository.getScreener(screenerId);
            Optional<Benefit> benefitOpt = benefitRepository.getCustomBenefit(screenerId, benefitId);
            if (screenerOpt.isEmpty()){
                throw new NotFoundException();
            }
            if (benefitOpt.isEmpty()) {
                throw new NotFoundException();
            }

            // Confirm user is authorized to make the change
            String userId = AuthUtils.getUserId(identity);
            Screener screener = screenerOpt.get();
            if (!isUserAuthorizedToAccessScreenerByScreener(userId, screener)){
                return Response.status(Response.Status.UNAUTHORIZED).build();
            }

            // Delete the benefit and remove the benefitDetail from the screener
            benefitRepository.deleteCustomBenefit(screenerId, benefitId);
            List<BenefitDetail> updatedBenefits = screener.getBenefits()
                    .stream()
                    .filter(benefitDetail -> !benefitDetail.getId().equals(benefitId))
                    .toList();
            screener.setBenefits(updatedBenefits);
            screenerRepository.updateScreener(screener);

            return Response.ok().build();
        } catch (Exception e) {
            Log.error(e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Could not delete custom benefit"))
                    .build();
        }
    }
}
