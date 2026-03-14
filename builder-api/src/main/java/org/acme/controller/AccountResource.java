package org.acme.controller;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import jakarta.validation.Validator;
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

@Path("/api")
public class AccountResource {

    @Inject
    Validator validator;

    @Inject
    AccountHooks accountHooks;

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/account-hooks")
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
                .collect(Collectors.toMap(s -> s.toString(), s -> {
                    Predicate<String> fn = hooksMap.get(s);
                    return fn.test(userId);
                }));

        AccountHookResponse responseBody = new AccountHookResponse(true,
                hookResults);

        return Response.ok(responseBody).build();
    }
}
