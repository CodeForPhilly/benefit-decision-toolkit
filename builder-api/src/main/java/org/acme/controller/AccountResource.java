package org.acme.controller;

import io.quarkus.logging.Log;
import io.quarkus.runtime.LaunchMode;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import org.acme.api.error.ApiError;
import org.acme.auth.AuthUtils;
import org.acme.enums.AccountHookAction;
import org.acme.functions.AccountHooks;
import org.acme.model.dto.Auth.AccountHookRequest;
import org.acme.model.dto.Auth.AccountHookResponse;
import org.acme.service.ExampleScreenerExportService;

@Path("/api")
public class AccountResource {

    @Inject
    AccountHooks accountHooks;

    @Inject
    ExampleScreenerExportService exampleScreenerExportService;

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/account/hooks")
    public Response accountHooks(@Context SecurityIdentity identity,
            AccountHookRequest request) {

        Set<AccountHookAction> hooks = request.hooks();
        String userId = AuthUtils.getUserId(identity);

        if (userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ApiError(true, "Unauthorized.")).build();
        }

        // Map of AccountHookAction to a hook side-effect function
        // The function returns whether the side-effect was successful
        Map<AccountHookAction, Predicate<String>> hooksMap = Map.of(
                AccountHookAction.ADD_EXAMPLE_SCREENER,
                accountHooks::addExampleScreenerToAccount,
                AccountHookAction.UNABLE_TO_DETERMINE,
                (String uId) -> true);

        // Run each action's function and determine whether successful
        Map<String, Boolean> hookResults = hooks.stream()
                .collect(Collectors.toMap(s -> s.getLabel(), s -> {
                    Predicate<String> fn = hooksMap.get(s);
                    return fn.test(userId);
                }));

        Boolean allHooksSuccess = hookResults.values().stream()
                .allMatch(Boolean::booleanValue);

        AccountHookResponse responseBody = new AccountHookResponse(
                allHooksSuccess, hookResults);

        return Response.ok(responseBody).build();
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/account/export-example-screener")
    public Response exportExampleScreener(@Context SecurityIdentity identity) {
        String userId = AuthUtils.getUserId(identity);

        if (userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ApiError(true, "Unauthorized.")).build();
        }

        if (LaunchMode.current() != LaunchMode.DEVELOPMENT) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        try {
            ExampleScreenerExportService.ExportSummary summary = exampleScreenerExportService
                    .exportForUser(userId);
            return Response.ok(
                    Map.of(
                            "success",
                            true,
                            "outputPath",
                            summary.outputPath(),
                            "screenerCount",
                            summary.screenerCount(),
                            "firestoreDocuments",
                            summary.firestoreDocuments(),
                            "storageFiles",
                            summary.storageFiles()))
                    .build();
        } catch (Exception e) {
            Log.error(
                    "Failed to export example screener seed data for user "
                            + userId,
                    e);
            return Response.serverError().entity(
                    new ApiError(true,
                            "Failed to export example screener seed data."))
                    .build();
        }
    }
}
