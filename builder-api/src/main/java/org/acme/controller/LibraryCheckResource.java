package org.acme.controller;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
        import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.model.domain.EligibilityCheck;
import org.acme.service.LibraryApiService;

import java.util.List;
import java.util.Optional;

@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
public class LibraryCheckResource {

    @Inject
    LibraryApiService libraryApiMetadataService;  // Inject the singleton bean

    @GET
    @Path("/library-checks")
    public List<EligibilityCheck> getLibraryChecks(@QueryParam("module") String module) {
        if (module != null) {
            return libraryApiMetadataService.getByModule(module);
        }
        return libraryApiMetadataService.getAll();
    }

    @GET
    @Path("/library-checks/{checkId}")
    public Response getLibraryCheck(@PathParam("checkId") String checkId) {
        if ( checkId != null) {
            Optional<EligibilityCheck> check = libraryApiMetadataService.getById(checkId);
            if (check.isEmpty()){
                return Response.status(Response.Status.NOT_FOUND).build();
            }
            return Response.ok().entity(check).build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }
}

