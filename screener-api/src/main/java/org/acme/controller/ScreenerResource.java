package org.acme.controller;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.inject.Inject;

import jakarta.ws.rs.core.Response;
import org.acme.model.Screener;
import org.acme.repository.ScreenerRepository;

import java.util.Optional;

@Path("/api/screener/{screenerId}")
public class ScreenerResource {

    @Inject
    ScreenerRepository screenerRepository;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response get(@PathParam("screenerId") String screenerId) {

        Optional<Screener> screenerOptional = screenerRepository.getScreener(screenerId);

        String notFoundResponseMessage = String.format("Form %s was not found", screenerId);
        if (screenerOptional.isEmpty()){
            throw new NotFoundException(notFoundResponseMessage);
        }

        Screener screener = screenerOptional.get();
        if (screener.getFormSchema() == null || !screener.isPublished()) {
            throw new NotFoundException(notFoundResponseMessage);
        }

        return Response.ok(screener, MediaType.APPLICATION_JSON).build();
    }
}