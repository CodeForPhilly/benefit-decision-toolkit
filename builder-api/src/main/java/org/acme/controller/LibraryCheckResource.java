package org.acme.controller;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
        import jakarta.ws.rs.core.MediaType;
import org.acme.model.domain.EligibilityCheck;
import org.acme.service.LibraryApiMetadataService;

import java.util.List;

@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
public class LibraryCheckResource {

    @Inject
    LibraryApiMetadataService libraryApiMetadataService;  // Inject the singleton bean

    @GET
    @Path("/library-checks")
    public List<EligibilityCheck> getLibraryChecks(@QueryParam("module") String module) {
        if (module != null) {
            return libraryApiMetadataService.getByModule(module);
        }
        return libraryApiMetadataService.getAll();
    }
}

