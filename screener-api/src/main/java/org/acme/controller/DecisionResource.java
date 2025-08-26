package org.acme.controller;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.model.ResultDetail;
import org.acme.model.Screener;
import org.acme.repository.ScreenerRepository;
import org.acme.service.DmnService;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

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

        List<ResultDetail> results = dmnService.evaluateDecision(screener, inputData);
        Map<String, ResultDetail> resultMap = results.stream()
                .collect(Collectors.toMap(
                        ResultDetail::getId,
                        Function.identity(),
                        (existing, duplicate) -> existing
                ));

        List<ResultDetail> resultsSchema = screener.getResultsSchema();

        List<ResultDetail> publishedResults = new ArrayList<>();

        for (ResultDetail resultDetail : resultsSchema){
            addResultValuesToResultDetailObject(resultDetail, resultMap);
        }

        return Response.ok().entity(resultsSchema).build();
        }
        catch (Exception e){
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    private static void addResultValuesToResultDetailObject(ResultDetail resultDetail, Map<String, ResultDetail> resultMap) {
        String decisionId = resultDetail.getId();
        if(resultMap.containsKey(decisionId)){
            resultDetail.setResult(resultMap.get(decisionId).getResult());
        }
        if (resultDetail.getChecks() == null) return;
        for (ResultDetail check : resultDetail.getChecks()){
            addResultValuesToResultDetailObject(check, resultMap);
        }
    }
}