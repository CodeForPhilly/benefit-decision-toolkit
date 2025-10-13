package org.acme.controller;

import io.quarkus.logging.Log;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.acme.auth.AuthUtils;
import org.acme.enums.OptionalBoolean;
import org.acme.model.domain.Benefit;
import org.acme.model.domain.CheckConfig;
import org.acme.model.domain.EligibilityCheck;
import org.acme.model.domain.Screener;
import org.acme.persistence.BenefitRepository;
import org.acme.persistence.EligibilityCheckRepository;
import org.acme.persistence.ScreenerRepository;
import org.acme.persistence.StorageService;
import org.acme.service.DmnParser;
import org.acme.service.DmnService;

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

    @Inject
    EligibilityCheckRepository eligibilityCheckRepository;

    @Inject
    BenefitRepository benefitRepository;

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
            if (isLastScreenerCompileOutOfDate(screener)){
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

    @POST
    @Path("/v2")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response evaluateScreener(
        @Context ContainerRequestContext requestContext,
        @QueryParam("screenerId") String screenerId,
        Map<String, Object> inputData
    ) throws Exception {
        // Authorize user and get benefit
        String userId = AuthUtils.getUserId(requestContext);
        if (screenerId.isEmpty() || !isUserAuthorizedToAccessScreenerByScreenerId(userId, screenerId)){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        Optional<Screener> screenerOpt = screenerRepository.getScreener(screenerId);
        if (screenerOpt.isEmpty()){
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        Screener screener = screenerOpt.get();

        List<Benefit> benefits = benefitRepository.getBenefitsInScreener(screener);
        if (benefits.isEmpty()){
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        try {
            Map<String, Object> screenerResults = new HashMap<String, Object>();
            for (Benefit benefit : benefits) {
                // Evaluate benefit
                Map<String, Object> benefitResults = evaluateBenefitDmn(benefit, inputData);
                screenerResults.put(benefit.getId(), benefitResults);
            }
            return Response.ok().entity(screenerResults).build();
        } catch (Exception e) {
            Log.error("Error: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    @POST
    @Path("/v2/benefit")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response evaluateBenefit(
        @Context ContainerRequestContext requestContext,
        @QueryParam("screenerId") String screenerId,
        @QueryParam("benefitId") String benefitId,
        Map<String, Object> inputData
    ) throws Exception {
        if (benefitId == null || benefitId.isBlank()){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required query parameter: benefitId")
                    .build();
        }
        if (inputData == null || inputData.isEmpty()){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing decision inputs")
                    .build();
        }

        // Authorize user and get benefit
        String userId = AuthUtils.getUserId(requestContext);
        Optional<Benefit> benefitOpt = Optional.empty();
        if (!screenerId.isEmpty()){
            if (!isUserAuthorizedToAccessScreenerByScreenerId(userId, screenerId)){
                return Response.status(Response.Status.UNAUTHORIZED).build();
            }
            benefitOpt = benefitRepository.getCustomBenefit(screenerId, benefitId);
        } else {
            benefitOpt = benefitRepository.getBenefit(benefitId);
        }
        if (benefitOpt.isEmpty()){
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        Benefit benefit = benefitOpt.get();
        try {
            // Evaluate benefit
            Map<String, Object> results = evaluateBenefitDmn(benefit, inputData);
            return Response.ok().entity(results).build();
        } catch (Exception e) {
            Log.error("Error: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    private Map<String, Object> evaluateBenefitDmn(Benefit benefit, Map<String, Object> inputData) throws Exception {
        List<EligibilityCheck> checks = eligibilityCheckRepository.getChecksInBenefit(benefit);

        List<OptionalBoolean> checkResultsList = new ArrayList<>();
        Map<String, Object> checkResults = new HashMap<>();
        for (EligibilityCheck check : checks) {
            Optional<CheckConfig> matchingCheckConfig = benefit.getChecks().stream().filter(
                checkConfig -> checkConfig.getCheckId().equals(check.getId())
            ).findFirst();
            if (matchingCheckConfig.isEmpty()) {
                throw new Exception("Could not find CheckConfig for check " + check.getId());
            }
            Map<String, Object> checkInputData = new HashMap<String, Object>(inputData);
            checkInputData.put("parameters", matchingCheckConfig.get().getParameters());

            String dmnFilepath = storageService.getCheckDmnModelPath(
                check.getModule(), check.getId(), check.getVersion()
            );
            Log.info(checkInputData);
            String dmnModelName = check.getId();
            OptionalBoolean result = dmnService.evaluateSimpleDmn(
                dmnFilepath, dmnModelName, checkInputData
            );
            checkResultsList.add(result);
            checkResults.put(check.getId(), Map.of("name", check.getName(),"result", result));
        }

        // Determine overall Benefit result
        Boolean allChecksTrue = checkResultsList.stream().allMatch(result -> result == OptionalBoolean.TRUE);
        Boolean anyChecksFalse = checkResultsList.stream().anyMatch(result -> result == OptionalBoolean.FALSE);
        Log.info("All True: " + allChecksTrue + " Any False: " + anyChecksFalse);

        OptionalBoolean benefitResult;
        if (allChecksTrue) {
            benefitResult = OptionalBoolean.TRUE;
        } else if (anyChecksFalse) {
            benefitResult = OptionalBoolean.FALSE;
        } else {
            benefitResult = OptionalBoolean.UNABLE_TO_DETERMINE;
        }

        return new HashMap<String, Object>(
            Map.of(
                "name", benefit.getName(),
                "result", benefitResult,
                "check_results", checkResults
            )
        );
    }

    private boolean isUserAuthorizedToAccessScreenerByScreenerId(String userId, String screenerId) {
        Optional<Screener> screenerOpt = screenerRepository.getScreenerMetaDataOnly(screenerId);
        if (screenerOpt.isEmpty()){
            return false;
        }
        Screener screener = screenerOpt.get();
        return isUserAuthorizedToAccessScreenerByScreener(userId, screener);
    }

    private boolean isUserAuthorizedToAccessScreenerByScreener(String userId, Screener screener) {
        String ownerId = screener.getOwnerId();
        if (userId.equals(ownerId)){
            return true;
        }
        return false;
    }
}
