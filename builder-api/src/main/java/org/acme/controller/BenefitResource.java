package org.acme.controller;

import io.quarkus.logging.Log;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.auth.AuthUtils;
import org.acme.model.domain.Benefit;
import org.acme.model.domain.EligibilityCheck;
import org.acme.persistence.BenefitRepository;
import org.acme.persistence.EligibilityCheckRepository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Path("/api")
public class BenefitResource {

    @Inject
    BenefitRepository benefitRepository;

    @Inject
    EligibilityCheckRepository eligibilityCheckRepository;

    @GET
    @Path("/benefit")
    public Response getAllBenefits(@Context ContainerRequestContext requestContext) {
        String userId = AuthUtils.getUserId(requestContext);
        if (userId == null){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Log.info("Fetching all eligibility checks. User:  " + userId);
        List<Benefit> benefits = benefitRepository.getAllPublicBenefits();

        return Response.ok(benefits, MediaType.APPLICATION_JSON).build();
    }



    @GET
    @Path("/benefit/{benefitId}")
    public Response getBenefit(@Context ContainerRequestContext requestContext, @PathParam("benefitId") String benefitId) {
        String userId = AuthUtils.getUserId(requestContext);
        if (userId == null){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Log.info("Fetching all eligibility checks. User:  " + userId);
        Optional<Benefit> benefitOpt = benefitRepository.getBenefit(benefitId);

        if (benefitOpt.isEmpty()){
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        Benefit benefit = benefitOpt.get();

        if (!benefit.getPublic() && !benefit.getOwnerId().equals(userId)){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        return Response.ok(benefit, MediaType.APPLICATION_JSON).build();
    }


    // Get all of the full Eligibility Check Objects that have been added to a  Public Benefit
    @GET
    @Path("/benefit/{benefitId}/check")
    public Response getBenefitChecks(@Context ContainerRequestContext requestContext, @PathParam("benefitId") String benefitId) {
        String userId = AuthUtils.getUserId(requestContext);
        if (userId == null){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Log.info("Fetching all eligibility checks for Benefit: " + benefitId + "  User:  " + userId);
        Optional<Benefit> benefitOpt = benefitRepository.getBenefit(benefitId);

        if (benefitOpt.isEmpty()){
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        Benefit benefit = benefitOpt.get();

        if (!benefit.getPublic() && !benefit.getOwnerId().equals(userId)){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        List<EligibilityCheck> checks = eligibilityCheckRepository.getChecksInBenefit(benefit);

        return Response.ok(checks, MediaType.APPLICATION_JSON).build();
    }



    // Utility endpoint to create a Benefit
    // In the future separate endpoints will need to be created for publishing public benefits and creating private benefits
    @POST
    @Path("/benefit")
    public Response createBenefit(@Context ContainerRequestContext requestContext, Benefit newBenefit) {
        String userId = AuthUtils.getUserId(requestContext);

        //TODO: Add validations for user provided data

        newBenefit.setOwnerId(userId);
        try {
            String benefitId = benefitRepository.saveNewBenefit(newBenefit);
            newBenefit.setId(benefitId);
            return Response.ok(newBenefit, MediaType.APPLICATION_JSON).build();
        } catch (Exception e){
            Log.error(e);
            return  Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Could not save benefit"))
                    .build();
        }
    }
}
