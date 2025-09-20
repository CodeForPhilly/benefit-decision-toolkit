package org.acme.controller;

import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;

@Path("/api")
public class ProtectedResource {

    @GET
    @Path("/profile")
    @Authenticated // Standard Quarkus annotation
    public Response getUserProfile(@Context SecurityIdentity identity) {
        // The Firebase token is automatically validated
        // User info is available in the SecurityIdentity
        
        return Response.ok()
            .entity(Map.of(
                "uid", identity.getPrincipal().getName(),
                "attributes", identity.getAttributes()
            ))
            .build();
    }
}
