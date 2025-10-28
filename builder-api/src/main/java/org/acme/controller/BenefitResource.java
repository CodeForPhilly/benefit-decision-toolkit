package org.acme.controller;

import io.quarkus.logging.Log;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
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
    public Response getAllBenefits(@Context SecurityIdentity identity) {
        String userId = AuthUtils.getUserId(identity);
        if (userId == null){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Log.info("Fetching all eligibility checks. User:  " + userId);
        List<Benefit> benefits = benefitRepository.getAllPublicBenefits();

        return Response.ok(benefits, MediaType.APPLICATION_JSON).build();
    }

    @GET
    @Path("/benefit/{benefitId}")
    public Response getBenefit(@Context SecurityIdentity identity,
                               @PathParam("benefitId") String benefitId) {
        String userId = AuthUtils.getUserId(identity);
        if (userId == null){
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Log.info("Fetching benefit:  " + benefitId + " for user: " + userId);
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
    public Response getBenefitChecks(@Context SecurityIdentity identity,
                                     @PathParam("benefitId") String benefitId) {
        String userId = AuthUtils.getUserId(identity);
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


    @PUT
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/benefit")
    public Response updateBenefit(@Context SecurityIdentity identity,
                                  Benefit newBenefit) {
        String userId = AuthUtils.getUserId(identity);
        //TODO: Add validations for user provided data

        newBenefit.setOwnerId(userId);
        try {
            Optional<Benefit> benefitOpt = benefitRepository.getBenefit(newBenefit.getId());
            if (benefitOpt.isEmpty()){
                return Response.status(Response.Status.NOT_FOUND).build();
            }
            Benefit existingBenefit = benefitOpt.get();

            if (!isUserAuthorizedToUpdateBenefit(userId, existingBenefit)){
                return Response.status(Response.Status.UNAUTHORIZED).build();
            }


            benefitRepository.updateBenefit(newBenefit);
            return Response.ok(newBenefit, MediaType.APPLICATION_JSON).build();

        } catch (Exception e){
            Log.error(e);
            return  Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Could not update benefit"))
                    .build();
        }
    }

    // Utility endpoint to create a public benefit
    @POST
    @Path("/benefit")
    public Response createBenefit(@Context SecurityIdentity identity,
                                  Benefit newBenefit) {
        String userId = AuthUtils.getUserId(identity);

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

    private boolean isUserAuthorizedToUpdateBenefit(String userId, Benefit benefit) {
        String ownerId = benefit.getOwnerId();
        if (ownerId == null){
            return false;
        }
        if (userId.equals(ownerId)){
            return true;
        }
        return false;
    }
}
