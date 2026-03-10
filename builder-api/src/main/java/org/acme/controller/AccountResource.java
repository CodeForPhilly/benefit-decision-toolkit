package org.acme.controller;

import io.quarkus.logging.Log;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import jakarta.validation.Validator;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

import org.acme.api.error.ApiError;
import org.acme.auth.AuthUtils;
import org.acme.model.dto.Auth.AccountHookResponse;

@Path("/api")
public class AccountResource {

    @Inject
    Validator validator;

    @GET
    @Path("/account-hooks")
    public Response getScreeners(@Context SecurityIdentity identity,
            @QueryParam("action") String action) {
        String userId = AuthUtils.getUserId(identity);
        if (userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ApiError(true, "Unauthorized.")).build();
        }

        if (action == null || action.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST).entity(
                    new ApiError(true, "Query parameter 'action' is required."))
                    .build();
        }
        Log.info("Running account hooks for: " + userId);

        if (action.equals("add example screener")) {
            Log.info("***** Adding an exaample screener to the account *****");
        }

        AccountHookResponse responseBody = new AccountHookResponse(
                "add example screener", true);

        return Response.ok(responseBody).build();
    }
}
