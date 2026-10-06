package org.codeforphilly.bdt.builder.controller;

import io.quarkus.logging.Log;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import org.codeforphilly.bdt.builder.auth.AuthUtils;
import org.codeforphilly.bdt.builder.model.dto.screener.ScreenerTransfer;
import org.codeforphilly.bdt.builder.service.ScreenerTransferService;
import java.util.Map;

@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
public class ScreenerTransferResource {
    @Inject ScreenerTransferService transferService;

    @GET
    @Path("/screener/{screenerId}/export")
    public Response exportScreener(@Context SecurityIdentity identity, @PathParam("screenerId") String id) {
        String owner = AuthUtils.getUserId(identity);
        if (owner == null) return Response.status(Response.Status.UNAUTHORIZED).build();
        try {
            return Response.ok(transferService.exportScreener(owner, id)).build();
        } catch (WebApplicationException rejected) {
            return rejected.getResponse();
        } catch (Exception failure) {
            Log.error("Could not export screener", failure);
            return Response.serverError().entity(Map.of("error", "Could not export the complete screener.")).build();
        }
    }

    @POST
    @Path("/screener/import")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response importScreener(@Context SecurityIdentity identity, ScreenerTransfer transfer) {
        String owner = AuthUtils.getUserId(identity);
        if (owner == null) return Response.status(Response.Status.UNAUTHORIZED).build();
        try {
            return Response.status(Response.Status.CREATED).entity(transferService.importScreener(owner, transfer)).build();
        } catch (BadRequestException rejected) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", rejected.getMessage())).build();
        } catch (Exception failure) {
            Log.error("Could not import screener", failure);
            return Response.serverError().entity(Map.of("error", "Could not import the screener. Please try again.")).build();
        }
    }
}
