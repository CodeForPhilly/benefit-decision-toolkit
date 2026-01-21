package org.acme.api.error;

import com.fasterxml.jackson.databind.exc.UnrecognizedPropertyException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

// Global error handler for providing extra fields in the request body

@Provider
public class UnknownFieldExceptionMapper implements ExceptionMapper<UnrecognizedPropertyException> {

  @Override
  public Response toResponse(UnrecognizedPropertyException e) {
    return Response.status(Response.Status.BAD_REQUEST)
        .type(MediaType.APPLICATION_JSON)
        .entity(ApiError.of("Unknown field '" + e.getPropertyName() + "'"))
        .build();
  }
}
