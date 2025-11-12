package org.acme.controller;

import io.quarkus.logging.Log;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.acme.auth.AuthUtils;
import org.acme.enums.OptionalBoolean;
import org.acme.model.domain.Benefit;
import org.acme.model.domain.EligibilityCheck;
import org.acme.model.domain.Screener;
import org.acme.persistence.EligibilityCheckRepository;
import org.acme.persistence.PublishedScreenerRepository;
import org.acme.persistence.ScreenerRepository;
import org.acme.persistence.StorageService;
import org.acme.service.DmnService;

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

        try {
            Map<String, Object> screenerResults = new HashMap<String, Object>();
            for (Benefit benefit : benefits) {
                // Evaluate benefit
                Map<String, Object> benefitResults = evaluateBenefit(benefit, inputData);
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
        Map<String, Object> inputData
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

        try {
            Map<String, Object> screenerResults = new HashMap<String, Object>();
            for (Benefit benefit : benefits) {
                // Evaluate benefit
                Map<String, Object> benefitResults = evaluateBenefit(benefit, inputData);
                screenerResults.put(benefit.getId(), benefitResults);
            }
            return Response.ok().entity(screenerResults).build();
        } catch (Exception e) {
            Log.error("Error: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    private Map<String, Object> evaluateBenefit(Benefit benefit, Map<String, Object> inputData) throws Exception {
        List<EligibilityCheck> checks = eligibilityCheckRepository.getChecksInBenefit(benefit);

        if (benefit.getPublic()){
            // Public benefit, call the Library API to evaluate
            Map<String, Object> result = new HashMap<>();
            return result;
        } else {
            // Custom benefit, evaluate here in the web app api (as opposed to calling the library api for evaluation)
            List<OptionalBoolean> checkResultsList = new ArrayList<>();
            Map<String, Object> checkResults = new HashMap<>();

            Map<String, Object> result = new HashMap<>();
            return result;
            //TODO: update implementation here
//            for (EligibilityCheck check : checks) {
//                Optional<CheckConfig> matchingCheckConfig = benefit.getChecks().stream().filter(
//                        checkConfig -> checkConfig.getCheckId().equals(check.getId())
//                ).findFirst();
//                if (matchingCheckConfig.isEmpty()) {
//                    throw new Exception("Could not find CheckConfig for check " + check.getId());
//                }
//
//                String dmnFilepath = storageService.getCheckDmnModelPath(
//                        check.getModule(), check.getId(), check.getVersion()
//                );
//                String dmnModelName = check.getId();
//
//                OptionalBoolean result = dmnService.evaluateSimpleDmn(
//                        dmnFilepath, dmnModelName, inputData, matchingCheckConfig.get().getParameters()
//                );
//                checkResultsList.add(result);
//                checkResults.put(check.getId(), Map.of("name", check.getName(), "result", result));
//            }
//
//            // Determine overall Benefit result
//            Boolean allChecksTrue = checkResultsList.stream().allMatch(result -> result == OptionalBoolean.TRUE);
//            Boolean anyChecksFalse = checkResultsList.stream().anyMatch(result -> result == OptionalBoolean.FALSE);
//            Log.info("All True: " + allChecksTrue + " Any False: " + anyChecksFalse);
//
//            OptionalBoolean benefitResult;
//            if (allChecksTrue) {
//                benefitResult = OptionalBoolean.TRUE;
//            } else if (anyChecksFalse) {
//                benefitResult = OptionalBoolean.FALSE;
//            } else {
//                benefitResult = OptionalBoolean.UNABLE_TO_DETERMINE;
//            }
//
//            return new HashMap<String, Object>(
//                    Map.of(
//                            "name", benefit.getName(),
//                            "result", benefitResult,
//                            "check_results", checkResults
//                    )
//            );
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
}
