package org.acme.controller;

import io.quarkus.logging.Log;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.auth.AuthUtils;
import org.acme.model.domain.Benefit;
import org.acme.persistence.BenefitRepository;

import java.util.List;
import java.util.Optional;

@Path("/api")
public class BenefitResource {

    @Inject
    BenefitRepository benefitRepository;

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
}
