package org.acme.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.logging.Log;
import jakarta.inject.Inject;
import jakarta.inject.Named;
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
import org.acme.model.domain.ScreenerTest;
import org.acme.persistence.ScreenerTestRepository;
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
public class ScreenerTestResource {

  @Inject
  ScreenerTestRepository screenerTestRepository;

  @GET
  @Path("/screenertest/{screenerId}")
  public Response getScreenerTests(@Context ContainerRequestContext requestContext,
      @PathParam("screenerId") String screenerId) {

    String userId = AuthUtils.getUserId(requestContext);
    Log.info("Fetching tests for screener " + screenerId + " for user " + userId);

    // perform authentication

    List<ScreenerTest> screenerTests = screenerTestRepository.getScreenerTests(userId, screenerId);

    if (!isUserAuthorizedToAccessScreener(userId, screener))
      return Response.status(Response.Status.UNAUTHORIZED).build();

    return Response.ok(screenerTests, MediaType.APPLICATION_JSON).build();
  }
}
