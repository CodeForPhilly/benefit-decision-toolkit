package org.acme.controller;

import com.github.javaparser.utils.Log;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.auth.AuthUtils;
import org.acme.model.domain.Benefit;
import org.acme.model.domain.EligibilityCheck;
import org.acme.model.domain.Screener;
import org.acme.persistence.BenefitRepository;
import org.acme.persistence.EligibilityCheckRepository;
import org.acme.persistence.ScreenerRepository;
import org.acme.persistence.StorageService;
import org.acme.service.DmnParser;
import org.acme.service.DmnService;

import java.io.InputStream;
import java.time.Instant;
import java.util.*;

@Path("/api")
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

    @Path("/decision")
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
    @Path("/v2/decision")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response evaluateBenefit(@Context ContainerRequestContext requestContext, @QueryParam("screenerId") String screenerId, @QueryParam("benefitId") String benefitId, Map<String, Object> inputData) throws Exception {
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
        return getBenefitResults(benefit, inputData);
    }


    private Response getBenefitResults(Benefit benefit, Map<String, Object> inputData) throws Exception {
        try{
            List<EligibilityCheck> checks = eligibilityCheckRepository.getChecksInBenefit(benefit);
            Map<String, Boolean> results = new HashMap<>();
            for (EligibilityCheck check : checks){
                Boolean result = dmnService.evaluateCheck(check, inputData);
                results.put(check.getId(), result);
            }

            //TODO: evaultuate and add benefit final result attirbute to results
            return Response.ok().entity(results).build();
        } catch (Exception e){
            Log.error("Error ");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }


    private boolean isUserAuthorizedToAccessScreenerByScreenerId(String userId, String screenerId) {
        Optional<Screener> screenerOptional = screenerRepository.getScreenerMetaDataOnly(screenerId);
        if (screenerOptional.isEmpty()){
            return false;
        }
        Screener screener = screenerOptional.get();
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
