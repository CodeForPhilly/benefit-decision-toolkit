package org.acme.controller;

import io.quarkus.logging.Log;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.Validator;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.auth.AuthUtils;
import org.acme.model.domain.*;
import org.acme.model.dto.Screener.FormPathsResponse;
import org.acme.model.dto.Screener.PublishScreenerRequest;
import org.acme.model.dto.Screener.SaveSchemaRequest;
import org.acme.persistence.EligibilityCheckRepository;
import org.acme.persistence.ScreenerRepository;
import org.acme.persistence.PublishedScreenerRepository;
import org.acme.persistence.StorageService;
import org.acme.service.DmnService;
import org.acme.service.InputSchemaService;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.acme.model.dto.Screener.CreateScreenerRequest;
import org.acme.model.dto.Screener.EditScreenerRequest;

@Path("/api")
public class ScreenerResource {

  @Inject Validator validator;

  @Inject ScreenerRepository screenerRepository;

  @Inject PublishedScreenerRepository publishedScreenerRepository;

  @Inject EligibilityCheckRepository eligibilityCheckRepository;

  @Inject StorageService storageService;

  @Inject DmnService dmnService;

  @Inject
  InputSchemaService inputSchemaService;

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
  public Response getScreener(
      @Context SecurityIdentity identity, @PathParam("screenerId") String screenerId) {
    String userId = AuthUtils.getUserId(identity);
    Log.info("Fetching screener " + screenerId + "  for user " + userId);

    Optional<Screener> screenerOptional = screenerRepository.getWorkingScreener(screenerId);

    if (screenerOptional.isEmpty()) {
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
    if (screenerOptional.isEmpty()) {
      throw new NotFoundException();
    }

    return Response.ok(screenerOptional.get(), MediaType.APPLICATION_JSON).build();
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/screener")
  public Response postScreener(
      @Context SecurityIdentity identity, @Valid CreateScreenerRequest request) {
    String userId = AuthUtils.getUserId(identity);

    Screener newScreener = Screener.create(userId, request.screenerName(), request.description());

    try {
      String screenerId = screenerRepository.saveNewWorkingScreener(newScreener);
      newScreener.setId(screenerId);
      return Response.ok(newScreener, MediaType.APPLICATION_JSON).build();
    } catch (Exception e) {
      return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
          .entity(Map.of("error", "Could not save Screener"))
          .build();
    }
  }

  @PATCH
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/screener/{screenerId}")
  public Response updateScreener(
      @Context SecurityIdentity identity,
      @PathParam("screenerId") String screenerId,
      @Valid EditScreenerRequest request) {
    String userId = AuthUtils.getUserId(identity);

    // Fetch Screener record and confirm user is authorized
    Optional<Screener> maybeScreener = screenerRepository.getWorkingScreener(screenerId);
    if (maybeScreener.isEmpty()) {
      return Response.status(Response.Status.NOT_FOUND).build();
    }

    Screener screener = maybeScreener.get();
    if (!isUserAuthorizedToAccessScreenerByScreener(userId, screener)) {
      return Response.status(Response.Status.UNAUTHORIZED).build();
    }

    Log.info(request.toString());

    // Update Screener fields from request
    if (request.screenerName() != null) {
      screener.setScreenerName(request.screenerName());
    }

    try {
      screenerRepository.updateWorkingScreener(screener);
      return Response.ok(screener, MediaType.APPLICATION_JSON).build();
    } catch (Exception e) {
      return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
          .entity(Map.of("error", "Could not update Screener"))
          .build();
    }
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/save-form-schema")
  public Response saveFormSchema(
      @Context SecurityIdentity identity,
      @QueryParam("screenerId") @NotBlank(message = "Must provide screenerId") String screenerId,
      @Valid SaveSchemaRequest request) {

    Log.info(
        "schema node = "
            + (request == null
                ? "request=null"
                : request.schema() == null
                    ? "schema=null"
                    : request.schema().getNodeType() + " : " + request.schema().toString()));

    var violations = validator.validate(request);
    if (!violations.isEmpty()) {
      return Response.status(400).entity(violations.toString()).build();
    }

    // // Make sure request.schema is not null
    // if (request.schema() == null || request.schema().isNull()) {
    //   return Response.status(Response.Status.BAD_REQUEST)
    //       .entity(ApiError.of("schema cannot be null."))
    //       .build();
    // }

    String userId = AuthUtils.getUserId(identity);

    // Fetch Screener record and confirm user is authorized
    Optional<Screener> maybeScreener = screenerRepository.getWorkingScreener(screenerId);
    if (maybeScreener.isEmpty()) {
      return Response.status(Response.Status.NOT_FOUND)
          .entity(Map.of("error", true, "message", "Screener " + screenerId + " cannot be found."))
          .build();
    }

    Screener screener = maybeScreener.get();
    if (!isUserAuthorizedToAccessScreenerByScreener(userId, screener)) {
      return Response.status(Response.Status.UNAUTHORIZED)
          .entity(Map.of("error", true, "message", "Unauthorized access to the screener."))
          .build();
    }

    try {
      String filePath = storageService.getScreenerWorkingFormSchemaPath(screenerId);
      storageService.writeJsonToStorage(filePath, request.schema());
      return Response.ok().build();
    } catch (Exception e) {
      Log.info(("Failed to save form for screener " + screenerId));
      return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/publish")
  public Response publishScreener(
      @Context SecurityIdentity identity, PublishScreenerRequest publishScreenerRequest) {

    String screenerId = publishScreenerRequest.screenerId;
    if (screenerId == null || screenerId.isBlank()) {
      return Response.status(Response.Status.BAD_REQUEST)
          .entity("Error: Missing required query parameter: screenerId")
          .build();
    }

    String userId = AuthUtils.getUserId(identity);
    if (!isUserAuthorizedToAccessScreener(userId, screenerId))
      return Response.status(Response.Status.UNAUTHORIZED).build();

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
  public Response deleteScreener(
      @Context SecurityIdentity identity, @QueryParam("screenerId") String screenerId) {
    if (screenerId == null || screenerId.isBlank()) {
      return Response.status(Response.Status.BAD_REQUEST)
          .entity("Error: Missing required query parameter: screenerId")
          .build();
    }

    String userId = AuthUtils.getUserId(identity);
    if (!isUserAuthorizedToAccessScreener(userId, screenerId))
      return Response.status(Response.Status.UNAUTHORIZED).build();

    try {
      screenerRepository.deleteWorkingScreener(screenerId);
      return Response.ok().build();
    } catch (Exception e) {
      Log.error("Error: error deleting screener " + screenerId);
      return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }
  }

  /**
   * Returns the list of unique input paths required by all checks in a screener.
   * This endpoint transforms inputDefinition schemas and extracts paths,
   * replacing the frontend's transformInputDefinitionSchema and extractJsonSchemaPaths logic.
   */
  @GET
  @Path("/screener/{screenerId}/form-paths")
  public Response getScreenerFormPaths(@Context SecurityIdentity identity,
                                        @PathParam("screenerId") String screenerId) {
    String userId = AuthUtils.getUserId(identity);

    Optional<Screener> screenerOpt = screenerRepository.getWorkingScreener(screenerId);
    if (screenerOpt.isEmpty()) {
      throw new NotFoundException();
    }
    Screener screener = screenerOpt.get();

    if (!isUserAuthorizedToAccessScreenerByScreener(userId, screener)) {
      return Response.status(Response.Status.UNAUTHORIZED).build();
    }

    try {
      List<Benefit> benefits = screenerRepository.getBenefitsInScreener(screener);
      List<FormPath> paths = new ArrayList<>(inputSchemaService.extractUniqueInputPaths(benefits));
      Collections.sort(paths, new Comparator<FormPath>() {
        public int compare(FormPath fp1, FormPath fp2) {
          // compare two instance of `Score` and return `int` as result.
          return fp1.getPath().compareTo(fp2.getPath());
        }
      });
      return Response.ok().entity(new FormPathsResponse(paths)).build();
    } catch (Exception e) {
      Log.error(e);
      return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
              .entity(Map.of("error", "Could not extract form paths"))
              .build();
    }
  }

  private boolean isUserAuthorizedToAccessScreener(String userId, String screenerId) {
    Optional<Screener> screenerOptional =
        screenerRepository.getWorkingScreenerMetaDataOnly(screenerId);
    if (screenerOptional.isEmpty()) {
      return false;
    }
    Screener screener = screenerOptional.get();
    return isUserAuthorizedToAccessScreenerByScreener(userId, screener);
  }

  private boolean isUserAuthorizedToAccessScreenerByScreener(String userId, Screener screener) {
    return userId.equals(screener.getOwnerId());
  }
}
