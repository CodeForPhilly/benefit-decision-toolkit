package org.acme.controller;

import io.quarkus.logging.Log;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.acme.auth.AuthUtils;
import org.acme.enums.EvaluationResult;
import org.acme.model.domain.Benefit;
import org.acme.model.domain.CheckConfig;
import org.acme.model.domain.EligibilityCheck;
import org.acme.model.domain.Screener;
import org.acme.model.dto.EvaluateCheckRequest;
import org.acme.persistence.EligibilityCheckRepository;
import org.acme.persistence.PublishedScreenerRepository;
import org.acme.persistence.ScreenerRepository;
import org.acme.persistence.StorageService;
import org.acme.service.DmnService;
import org.acme.service.FormDataTransformer;
import org.acme.service.LibraryApiService;

import java.util.*;

@Path("/api")
public class DecisionResource {
    
    @Inject
    EligibilityCheckRepository eligibilityCheckRepository;

    @Inject
    ScreenerRepository screenerRepository;

    @Inject
    PublishedScreenerRepository publishedScreenerRepository;

    @Inject
    StorageService storageService;

    @Inject
    DmnService dmnService;

    @Inject
    LibraryApiService libraryApi;

    @POST
    @Path("/published/{screenerId}/evaluate")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response evaluatePublishedScreener(
        @PathParam("screenerId") String screenerId,
        Map<String, Object> inputData
    ) throws Exception {
        Optional<Screener> screenerOpt = publishedScreenerRepository.getScreener(screenerId);
        if (screenerOpt.isEmpty()){
            Log.info("Screener not found: " + screenerId);
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        Screener screener = screenerOpt.get();

        List<Benefit> benefits = publishedScreenerRepository.getBenefitsInScreener(screener);
        if (benefits.isEmpty()){
            Log.info("Benefits not found: " + screenerId);
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        // Transform form data: convert people object to people array
        Map<String, Object> transformedData = FormDataTransformer.transformFormData(inputData);

        try {
            Map<String, Object> screenerResults = new HashMap<String, Object>();
            for (Benefit benefit : benefits) {
                // Evaluate benefit
                Map<String, Object> benefitResults = evaluateBenefit(benefit, transformedData);
                screenerResults.put(benefit.getId(), benefitResults);
            }
            return Response.ok().entity(screenerResults).build();
        } catch (Exception e) {
            Log.error("Error: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    @POST
    @Path("/decision/v2")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response evaluateScreener(
        @Context SecurityIdentity identity,
        @QueryParam("screenerId") String screenerId,
        Map<String, Object> formData
    ) throws Exception {
        // Authorize user and get benefit
        String userId = AuthUtils.getUserId(identity);
        if (screenerId.isEmpty() || !isUserAuthorizedToAccessScreenerByScreenerId(userId, screenerId)){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        Optional<Screener> screenerOpt = screenerRepository.getWorkingScreener(screenerId);
        if (screenerOpt.isEmpty()){
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        Screener screener = screenerOpt.get();

        List<Benefit> benefits = screenerRepository.getBenefitsInScreener(screener);
        if (benefits.isEmpty()){
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        // Transform form data: convert people object to people array
        Map<String, Object> transformedData = FormDataTransformer.transformFormData(formData);

        try {
            Map<String, Object> screenerResults = new HashMap<String, Object>();
            //TODO: consider ways of processing benefits in parallel
            for (Benefit benefit : benefits) {
                // Evaluate benefit
                Map<String, Object> benefitResults = evaluateBenefit(benefit, transformedData);
                screenerResults.put(benefit.getId(), benefitResults);
            }
            return Response.ok().entity(screenerResults).build();
        } catch (Exception e) {
            Log.error("Error: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    private Map<String, Object> evaluateBenefit(Benefit benefit, Map<String, Object> formData) throws Exception {
        if (benefit.getPublic()) {
            // Public benefit, call the Library API to evaluate
            Map<String, Object> result = new HashMap<>();
            return result;
        } else {
            // Custom benefit, evaluate here in the web app api (as opposed to calling the library api for evaluation)
            List<EvaluationResult> resultsList = new ArrayList<>();
            Map<String, Object> checkResults = new HashMap<>();

            int checkNum = 0;
            for (CheckConfig checkConfig : benefit.getChecks()) {
                String dmnFilepath = storageService.getCheckDmnModelPath(checkConfig.getCheckId());
                EvaluationResult evaluationResult;
                if (isLibraryCheck(checkConfig)){
                    evaluationResult = libraryApi.evaluateCheck(checkConfig, formData);
                } else {
                    Map<String, Object> customFormValues = (Map<String, Object>) formData.get("custom");
                    if (customFormValues == null) {
                        customFormValues = new HashMap<String, Object>();
                    }
                    evaluationResult = dmnService.evaluateDmn(
                        dmnFilepath, checkConfig.getCheckName(), customFormValues, checkConfig.getParameters()
                    );
                }
                resultsList.add(evaluationResult);

                String uniqueCheckKey = checkConfig.getCheckId() + checkNum;
                checkResults.put(uniqueCheckKey, Map.of("name", checkConfig.getCheckName(), "result", evaluationResult));
                checkNum += 1;
            }

            // Determine overall Benefit result
            Boolean allChecksTrue = resultsList.stream().allMatch(evaluationResult -> evaluationResult == EvaluationResult.TRUE);
            Boolean anyChecksFalse = resultsList.stream().anyMatch(evaluationResult -> evaluationResult == EvaluationResult.FALSE);

            EvaluationResult benefitEvaluationResult;
            if (allChecksTrue) {
                benefitEvaluationResult = EvaluationResult.TRUE;
            } else if (anyChecksFalse) {
                benefitEvaluationResult = EvaluationResult.FALSE;
            } else {
                benefitEvaluationResult = EvaluationResult.UNABLE_TO_DETERMINE;
            }

            return new HashMap<String, Object>(
                Map.of(
                    "name", benefit.getName(),
                    "result", benefitEvaluationResult,
                    "check_results", checkResults
                )
            );
        }
    }

    @POST
    @Path("/decision/working-check")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response evaluateCustomCheck(
        @Context SecurityIdentity identity,
        @QueryParam("checkId") String checkId,
        EvaluateCheckRequest request
    ) throws Exception {
        String userId = AuthUtils.getUserId(identity);

        if (checkId == null || checkId.isBlank()){
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required query parameter: checkId")
                    .build();
        }

        // Get EligibilityCheck
        Optional<EligibilityCheck> checkOpt = eligibilityCheckRepository.getWorkingCustomCheck(userId, checkId);
        if (checkOpt.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity("Error: Check not found")
                .build();
        }
        EligibilityCheck check = checkOpt.get();

        try {
            String dmnFilepath = storageService.getCheckDmnModelPath(check.getId());

            EvaluationResult evaluationResult = dmnService.evaluateDmn(
                dmnFilepath, request.checkConfig.getCheckName(), request.inputData, request.checkConfig.getParameters()
            );
            return Response.ok().entity(Map.of("result", evaluationResult)).build();
        } catch (Exception e) {
            Log.error("Error: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    private boolean isUserAuthorizedToAccessScreenerByScreenerId(String userId, String screenerId) {
        Optional<Screener> screenerOpt = screenerRepository.getWorkingScreenerMetaDataOnly(screenerId);
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

    private boolean isLibraryCheck(CheckConfig checkConfig){
        Character libraryCheckPrefix = 'L';
        return libraryCheckPrefix.equals(checkConfig.getCheckId().charAt(0));
    }
}
