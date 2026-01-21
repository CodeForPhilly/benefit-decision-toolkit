package org.acme.api.error;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import java.util.stream.Collectors;
import org.jboss.logging.Logger;

@Provider
public class ValidationExceptionMapper implements ExceptionMapper<ConstraintViolationException> {

  private static final Logger LOG = Logger.getLogger(ValidationExceptionMapper.class);

  @Override
  public Response toResponse(ConstraintViolationException e) {
    // Log all violations (since endpoint method won't run)
    String detail =
        e.getConstraintViolations().stream()
            .map(
                v ->
                    v.getPropertyPath()
                        + ": "
                        + v.getMessage()
                        + " (invalid="
                        + String.valueOf(v.getInvalidValue())
                        + ")")
            .collect(Collectors.joining("; "));

    LOG.warn("Validation failed: " + detail);

    String msg =
        e.getConstraintViolations().stream()
            .findFirst()
            .map(ConstraintViolation::getMessage)
            .orElse("Validation failed.");

    return Response.status(Response.Status.BAD_REQUEST)
        .type(MediaType.APPLICATION_JSON)
        .entity(ApiError.of(msg))
        .build();
  }
}
