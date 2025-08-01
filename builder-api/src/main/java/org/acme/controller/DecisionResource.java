package org.acme.controller;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.model.domain.Screener;
import org.acme.persistence.ScreenerRepository;
import org.acme.persistence.StorageService;
import org.acme.service.DmnParser;
import org.acme.service.DmnService;

import java.io.InputStream;
import java.time.Instant;
import java.util.*;

@Path("/api/decision")
public class DecisionResource {

    @Inject
    ScreenerRepository screenerRepository;

    @Inject
    StorageService storageService;

    @Inject
    DmnService dmnService;

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response post(@QueryParam("screenerId") String screenerId, Map<String, Object> inputData) {
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

        return getScreenerResults(screenerId, inputData);
    }

    private Response getScreenerResults(String screenerId, Map<String, Object> inputData) {
        Optional<Screener> screenerOptional = screenerRepository.getScreener(screenerId);

        if (screenerOptional.isEmpty()){
            throw new NotFoundException(String.format("Form %s was not found", screenerId));
        }

        Screener screener = screenerOptional.get();

        try {
            if (true || isLastScreenerCompileOutOfDate(screener)){
                dmnService.compileWorkingDmnModel(screener);
                updateScreenerLastCompileTime(screenerId, screener.getDmnModel());
            }

            Map <String, Object> result = dmnService.evaluateDecision(screener, inputData);

            if (result.isEmpty()) return Response.ok().entity(Collections.emptyList()).build();

            return Response.ok().entity(result).build();

        } catch (Exception e){
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    private static boolean isLastScreenerCompileOutOfDate(Screener screener) {
        return screener.getLastDmnCompile() == null || Instant.parse(screener.getLastDmnSave()).isAfter(Instant.parse(screener.getLastDmnCompile()));
    }

    private void updateScreenerLastCompileTime(String screenerId, String dmnXml) throws Exception {
        Screener updateScreener = new Screener();
        updateScreener.setId(screenerId);
        updateScreener.setLastDmnCompile(Instant.now().toString());
        DmnParser dmnParser = new DmnParser(dmnXml);
        updateScreener.setWorkingDmnName(dmnParser.getName());
        updateScreener.setWorkingDmnNameSpace(dmnParser.getNameSpace());
        screenerRepository.updateScreener(updateScreener);
    }
}