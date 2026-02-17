package org.acme.api.error;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.server.ServerExceptionMapper;

public class JsonServerExceptionMappers {

  @ServerExceptionMapper
  public Response map(MismatchedInputException e) {
    // e.g. screenerName is object but DTO expects String
    String field =
        e.getPath() != null && !e.getPath().isEmpty()
            ? e.getPath().get(e.getPath().size() - 1).getFieldName()
            : "request body";

    return Response.status(Response.Status.BAD_REQUEST)
        .type(MediaType.APPLICATION_JSON)
        .entity(ApiError.of("Invalid type for field '" + field + "'."))
        .build();
  }

  @ServerExceptionMapper
  public Response map(JsonParseException e) {
    // malformed JSON like { "schema": }
    return Response.status(Response.Status.BAD_REQUEST)
        .type(MediaType.APPLICATION_JSON)
        .entity(ApiError.of("Malformed JSON."))
        .build();
  }

  @ServerExceptionMapper
  public Response map(WebApplicationException e) {
    return Response.status(Response.Status.BAD_REQUEST)
        .type(MediaType.APPLICATION_JSON)
        .entity(ApiError.of("Malformed JSON."))
        .build();
  }

  @ServerExceptionMapper
  public Response map(JsonMappingException e) {
    // other mapping errors
    return Response.status(Response.Status.BAD_REQUEST)
        .type(MediaType.APPLICATION_JSON)
        .entity(ApiError.of("Invalid request body."))
        .build();
  }
}
