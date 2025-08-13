package org.acme.controller;

import io.quarkus.logging.Log;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import org.acme.persistence.DmnModelRepository;
import org.acme.service.ModelLibraryService;

@Path("/api")
public class ModelLibraryResource {

    @Inject
    ModelLibraryService modelLibraryService;

    @GET
    @Path("/dmn-models")
    public Response getDmnModels(@Context ContainerRequestContext requestContext) {
        Log.info("Get dmn models list");
        return modelLibraryService.getDmnModels();
    }

    @GET
    @Path("/dmn-models/{groupId}/{artifactId}/{version}")
    public Response getDmnModel( @PathParam("groupId") String groupId,
                                 @PathParam("artifactId") String artifactId,
                                 @PathParam("version") String version){

        Log.info("Get dmn model");
        return modelLibraryService.getDmnModel(groupId, artifactId, version);
    }
}
