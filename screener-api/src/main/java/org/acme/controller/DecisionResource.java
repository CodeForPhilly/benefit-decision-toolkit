package org.acme.controller;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.model.Screener;
import org.acme.repository.ScreenerRepository;
import org.acme.service.DmnService;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

@Path("/api/decision")
public class DecisionResource {

    @Inject
    DmnService dmnService;

    @Inject
    ScreenerRepository screenerRepository;

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Response post(@QueryParam("screenerId") String screenerId, Map<String, Object> inputData) {
        try{
        if (screenerId == null || screenerId.isBlank()){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required query parameter: screenerId")
                    .build();
        }

        if (inputData == null || inputData.isEmpty()){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing decision inputs")
                    .build();
        }


        Optional<Screener> screenerOptional = screenerRepository.getScreener(screenerId);

        String notFoundResponseMessage = String.format("Form %s was not found", screenerId);
        if (screenerOptional.isEmpty()){
            throw new NotFoundException(notFoundResponseMessage);
        }

        Screener screener = screenerOptional.get();
        if (screener.getFormSchema() == null || !screener.isPublished()) {
            throw new NotFoundException(notFoundResponseMessage);
        }

        Map<String, Object> result = dmnService.evaluateDecision(screener, inputData);

        if (!result.isEmpty()){
            return Response.ok(Collections.emptyList()).entity(result).build();
        }

        else {
            return Response.ok(Collections.emptyList()).build();
        }}
        catch (Exception e){
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }
}