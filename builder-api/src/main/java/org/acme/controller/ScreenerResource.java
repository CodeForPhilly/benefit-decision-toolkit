package org.acme.controller;

import com.fasterxml.jackson.databind.JsonNode;
import io.quarkus.logging.Log;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.auth.AuthUtils;
import org.acme.model.dto.DmnImportRequest;
import org.acme.model.dto.PublishScreenerRequest;
import org.acme.model.dto.SaveDmnRequest;
import org.acme.model.dto.SaveSchemaRequest;
import org.acme.model.domain.Screener;
import org.acme.persistence.ScreenerRepository;
import org.acme.persistence.StorageService;
import org.acme.service.DmnService;
import org.acme.service.ScreenerDependencyService;
import org.acme.service.DmnParser;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Path("/api")
public class ScreenerResource {

    @Inject
    ScreenerRepository screenerRepository;

    @Inject
    StorageService storageService;
    
    @Inject
    DmnService dmnService;

    @Inject
    ScreenerDependencyService screenerDependencyService;

    @GET
    @Path("/screeners")
    public Response getScreeners(@Context ContainerRequestContext requestContext) {
        String userId = AuthUtils.getUserId(requestContext);
        if (userId == null){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Log.info("Fetching screeners for user: " + userId);
        List<Screener> screeners = screenerRepository.getScreeners(userId);

        return Response.ok(screeners, MediaType.APPLICATION_JSON).build();
    }


    @GET
    @Path("/screener/{screenerId}")
    public Response getScreener(@Context ContainerRequestContext requestContext, @PathParam("screenerId") String screenerId) {

        String userId = AuthUtils.getUserId(requestContext);
        Log.info("Fetching screener " + screenerId + "  for user " + userId);

        //perform authentication

        Optional<Screener> screenerOptional = screenerRepository.getScreener(screenerId);

        if (screenerOptional.isEmpty()){
          throw new NotFoundException();
        }

        Screener screener = screenerOptional.get();

        if (!isUserAuthorizedToAccessScreener(userId, screener)) return Response.status(Response.Status.UNAUTHORIZED).build();

        return Response.ok(screener, MediaType.APPLICATION_JSON).build();
    }


    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/screener")
    public Response postScreener(@Context ContainerRequestContext requestContext, Screener newScreener){
        String userId = AuthUtils.getUserId(requestContext);

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
    public Response updateScreener(@Context ContainerRequestContext requestContext, Screener screener){
        String userId = AuthUtils.getUserId(requestContext);
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
    public Response saveFormSchema(@Context ContainerRequestContext requestContext, SaveSchemaRequest saveSchemaRequest){

        String screenerId = saveSchemaRequest.screenerId;
        if (screenerId == null || screenerId.isBlank()){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required required data in request body: screenerId")
                    .build();
        }

        String userId = AuthUtils.getUserId(requestContext);
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
    public Response saveDmnModel(@Context ContainerRequestContext requestContext, SaveDmnRequest saveDmnRequest){

        String screenerId = saveDmnRequest.screenerId;
        String dmnModel = saveDmnRequest.dmnModel;
        if (screenerId == null || screenerId.isBlank()){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required data: screenerId")
                    .build();
        }

        String userId = AuthUtils.getUserId(requestContext);
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
    public Response publishScreener(@Context ContainerRequestContext requestContext, PublishScreenerRequest publishScreenerRequest){

        String screenerId = publishScreenerRequest.screenerId;
        if (screenerId == null || screenerId.isBlank()){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required query parameter: screenerId")
                    .build();
        }

        String userId = AuthUtils.getUserId(requestContext);
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
    public Response unpublishScreener(@Context ContainerRequestContext requestContext, @QueryParam("screenerId") String screenerId){

        if (screenerId == null || screenerId.isBlank()){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required query parameter: screenerId")
                    .build();
        }

        String userId = AuthUtils.getUserId(requestContext);
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
    public Response deleteScreener(@Context ContainerRequestContext requestContext, @QueryParam("screenerId") String screenerId){
        if (screenerId == null || screenerId.isBlank()){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required query parameter: screenerId")
                    .build();
        }

        String userId = AuthUtils.getUserId(requestContext);
        if (!isUserAuthorizedToAccessScreener(userId, screenerId)) return Response.status(Response.Status.UNAUTHORIZED).build();

        try {
            screenerRepository.deleteScreener(screenerId);
            return Response.ok().build();
        } catch (Exception e){
            Log.error("Error: error deleting screener " + screenerId);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }


    private boolean isUserAuthorizedToAccessScreener(String userId, Screener screener) {
        String ownerId = screener.getOwnerId();
        if (userId.equals(ownerId)){
            return true;
        }
        return false;
    }

    private boolean isUserAuthorizedToAccessScreener(String userId, String screenerId) {
        Optional<Screener> screenerOptional = screenerRepository.getScreenerMetaDataOnly(screenerId);
        if (screenerOptional.isEmpty()){
            return false;
        }
        Screener screener = screenerOptional.get();
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
    public Response addDependency(@Context ContainerRequestContext requestContext, DmnImportRequest request){
        String userId = AuthUtils.getUserId(requestContext);
        return screenerDependencyService.addDependency(request, userId);
    }

    // This Endpoint allows users to delete dmn dependencies from their project. The DMN model elements will no longer
    // be available in the DMN editor.
    @DELETE
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/dependency")
    public Response deleteDependency(@Context ContainerRequestContext requestContext, DmnImportRequest request){
        String userId = AuthUtils.getUserId(requestContext);
        return screenerDependencyService.deleteDependency(request, userId);
    }
}
