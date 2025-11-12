package org.acme.controller;

import com.fasterxml.jackson.databind.JsonNode;
import io.quarkus.logging.Log;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.auth.AuthUtils;
import org.acme.model.domain.*;
import org.acme.model.dto.PublishScreenerRequest;
import org.acme.model.dto.SaveSchemaRequest;
import org.acme.persistence.EligibilityCheckRepository;
import org.acme.persistence.ScreenerRepository;
import org.acme.persistence.PublishedScreenerRepository;
import org.acme.persistence.StorageService;
import org.acme.service.DmnService;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Path("/api")
public class ScreenerResource {

    @Inject
    ScreenerRepository screenerRepository;

    @Inject
    PublishedScreenerRepository publishedScreenerRepository;

    @Inject
    EligibilityCheckRepository eligibilityCheckRepository;

    @Inject
    StorageService storageService;

    @Inject
    DmnService dmnService;

    @GET
    @Path("/screeners")
    public Response getScreeners(@Context SecurityIdentity identity) {
        String userId = AuthUtils.getUserId(identity);
        if (userId == null){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Log.info("Fetching screeners for user: " + userId);
        List<Screener> screeners = screenerRepository.getWorkingScreeners(userId);

        return Response.ok(screeners, MediaType.APPLICATION_JSON).build();
    }

    @GET
    @Path("/screener/{screenerId}")
    public Response getScreener(@Context SecurityIdentity identity, @PathParam("screenerId") String screenerId) {
        String userId = AuthUtils.getUserId(identity);
        Log.info("Fetching screener " + screenerId + "  for user " + userId);

        Optional<Screener> screenerOptional = screenerRepository.getWorkingScreener(screenerId);

        if (screenerOptional.isEmpty()){
            throw new NotFoundException();
        }

        Screener screener = screenerOptional.get();
        if (!isUserAuthorizedToAccessScreenerByScreener(userId, screener)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        return Response.ok(screener, MediaType.APPLICATION_JSON).build();
    }

    @GET
    @Path("/published/screener/{screenerId}")
    @PermitAll // This endpoint is accessible without authentication
    public Response getPublishedScreener(@PathParam("screenerId") String screenerId) {
        Optional<Screener> screenerOptional = publishedScreenerRepository.getScreener(screenerId);
        if (screenerOptional.isEmpty()){
          throw new NotFoundException();
        }

        return Response.ok(screenerOptional.get(), MediaType.APPLICATION_JSON).build();
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/screener")
    public Response postScreener(@Context SecurityIdentity identity, Screener newScreener){
        String userId = AuthUtils.getUserId(identity);

        newScreener.setOwnerId(userId);
        try {
            String screenerId = screenerRepository.saveNewWorkingScreener(newScreener);
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

        try {
            screenerRepository.updateWorkingScreener(screener);

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
            Optional<Screener> screenerOpt = screenerRepository.getWorkingScreener(screenerId);
            if (screenerOpt.isEmpty()) {
                return Response.status(Response.Status.NOT_FOUND).build();
            }
            Screener screener = screenerOpt.get();
            screenerRepository.publishScreener(screener);
            return Response.ok().build();
        } catch (Exception e) {
            Log.error("Error: Error updating screener to published. Screener: " + screenerId);
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
            screenerRepository.deleteWorkingScreener(screenerId);
            return Response.ok().build();
        } catch (Exception e){
            Log.error("Error: error deleting screener " + screenerId);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    private boolean isUserAuthorizedToAccessScreener(String userId, String screenerId) {
        Optional<Screener> screenerOptional = screenerRepository.getWorkingScreenerMetaDataOnly(screenerId);
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

    @GET
    @Path("/screener/{screenerId}/benefit")
    public Response getScreenerBenefits(@Context SecurityIdentity identity,
                                        @PathParam("screenerId") String screenerId){
        String userId = AuthUtils.getUserId(identity);

        Optional<Screener> screenerOpt = screenerRepository.getWorkingScreener(screenerId);
        if (screenerOpt.isEmpty()){
            throw new NotFoundException();
        }
        Screener screener = screenerOpt.get();

        if (!isUserAuthorizedToAccessScreenerByScreener(userId, screener)){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        try{
            List<Benefit> benefits = screenerRepository.getBenefitsInScreener(screener);
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
            Optional<Benefit> benefitOpt = screenerRepository.getCustomBenefit(screenerId, benefitId);
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

            Optional<Screener> screenerOpt = screenerRepository.getWorkingScreener(screenerId);
            if (screenerOpt.isEmpty()){
                throw new NotFoundException();
            }
            Screener screener = screenerOpt.get();

            if (!isUserAuthorizedToAccessScreenerByScreener(userId, screener)){
                return Response.status(Response.Status.UNAUTHORIZED).build();
            }

            Optional<Benefit> benefitOpt = screenerRepository.getCustomBenefit(screenerId, benefitId);
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
            Optional<Screener> screenerOpt = screenerRepository.getWorkingScreener(screenerId);
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

            String benefitId = screenerRepository.saveNewCustomBenefit(screenerId, newBenefit);
            screenerRepository.addBenefitDetailToWorkingScreener(screenerId, benefitDetail);
            newBenefit.setId(benefitId);
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
            Optional<Benefit> benefitOpt = screenerRepository.getCustomBenefit(screenerId, updatedBenefit.getId());
            if (benefitOpt.isEmpty()) {
                return Response.status(Response.Status.NOT_FOUND).build();
            }

            screenerRepository.updateCustomBenefit(screenerId, updatedBenefit);
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
            Optional<Screener> screenerOpt = screenerRepository.getWorkingScreener(screenerId);
            Optional<Benefit> benefitOpt = screenerRepository.getCustomBenefit(screenerId, benefitId);
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
            screenerRepository.deleteCustomBenefit(screenerId, benefitId);
            List<BenefitDetail> updatedBenefits = screener.getBenefits()
                    .stream()
                    .filter(benefitDetail -> !benefitDetail.getId().equals(benefitId))
                    .toList();
            screener.setBenefits(updatedBenefits);
            screenerRepository.updateWorkingScreener(screener);

            return Response.ok().build();
        } catch (Exception e) {
            Log.error(e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Could not delete custom benefit"))
                    .build();
        }
    }
}
