package org.prestoncabe.api;

import org.kie.dmn.api.core.DMNResult;
import org.kie.kogito.Application;
import org.kie.kogito.decision.DecisionModel;
import org.kie.kogito.decision.DecisionModels;
import org.kie.kogito.dmn.rest.DMNJSONUtils;
import org.kie.kogito.dmn.rest.KogitoDMNResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.Map;

/**
 * Dynamic REST resource that provides clean paths for all DMN decision services.
 * Automatically discovers models via ModelRegistry and evaluates decision services.
 *
 * Endpoint pattern: POST /api/v1/{modelName}/{serviceName}
 * Example: POST /api/v1/PersonMinAge/PersonMinAgeService
 */
@Path("/api/v1")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DynamicDMNResource {

    private static final Logger log = LoggerFactory.getLogger(DynamicDMNResource.class);

    @Inject
    Application application;

    @Inject
    ModelRegistry modelRegistry;

    /**
     * Evaluate a decision service for a given model.
     *
     * @param modelName the DMN model name (e.g., "PersonMinAge")
     * @param serviceName the decision service name (e.g., "PersonMinAgeService")
     * @param variables the input variables (must include "situation" and "parameters" as per DMN model)
     * @return the decision result or error response
     */
    @POST
    @Path("/{modelName}/{serviceName}")
    public Response evaluateDecisionService(
            @PathParam("modelName") String modelName,
            @PathParam("serviceName") String serviceName,
            Map<String, Object> variables) {

        log.debug("Evaluating decision service: {}/{}", modelName, serviceName);

        // 1. Look up model metadata
        ModelInfo modelInfo = modelRegistry.getModelInfo(modelName);
        if (modelInfo == null) {
            log.warn("Model not found: {}", modelName);
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of(
                            "error", "Model not found",
                            "modelName", modelName,
                            "message", "No DMN model with name '" + modelName + "' exists. " +
                                    "Check /api/v1/models for available models."
                    ))
                    .build();
        }

        // 2. Check if the decision service exists in this model
        if (!modelInfo.getDecisionServices().contains(serviceName)) {
            log.warn("Decision service '{}' not found in model '{}'", serviceName, modelName);
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of(
                            "error", "Decision service not found",
                            "modelName", modelName,
                            "serviceName", serviceName,
                            "availableServices", modelInfo.getDecisionServices(),
                            "message", "Model '" + modelName + "' does not have a decision service named '" +
                                    serviceName + "'"
                    ))
                    .build();
        }

        // 3. Get the decision model
        DecisionModel decision;
        try {
            DecisionModels decisionModels = application.get(DecisionModels.class);
            decision = decisionModels.getDecisionModel(modelInfo.getNamespace(), modelName);

            if (decision == null) {
                log.error("DecisionModel is null for namespace={}, name={}", modelInfo.getNamespace(), modelName);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(Map.of("error", "Failed to load decision model"))
                        .build();
            }
        } catch (Exception e) {
            log.error("Error loading decision model: {}/{}", modelInfo.getNamespace(), modelName, e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of(
                            "error", "Failed to load decision model",
                            "message", e.getMessage()
                    ))
                    .build();
        }

        // 4. Evaluate the decision service
        DMNResult dmnResult;
        try {
            dmnResult = decision.evaluateDecisionService(
                    DMNJSONUtils.ctx(decision, variables, serviceName),
                    serviceName
            );
        } catch (Exception e) {
            log.error("Error evaluating decision service: {}/{}", modelName, serviceName, e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of(
                            "error", "Decision evaluation failed",
                            "message", e.getMessage()
                    ))
                    .build();
        }

        // 5. Build result
        KogitoDMNResult result = new KogitoDMNResult(
                modelInfo.getNamespace(),
                modelName,
                dmnResult
        );

        // 6. Check for errors
        if (result.hasErrors()) {
            log.warn("Decision evaluation completed with errors for {}/{}", modelName, serviceName);
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(result)
                    .build();
        }

        // 7. Return successful result
        log.debug("Decision service {}/{} evaluated successfully", modelName, serviceName);

        // Extract the decision result value (simplified response)
        if (!result.getDecisionResults().isEmpty()) {
            return Response.ok(result.getDecisionResults().get(0).getResult()).build();
        } else {
            return Response.ok(result).build();
        }
    }

    /**
     * Evaluate all decisions in a model (full model evaluation).
     *
     * @param modelName the DMN model name
     * @param variables the input variables
     * @return the decision results
     */
    @POST
    @Path("/{modelName}")
    public Response evaluateModel(
            @PathParam("modelName") String modelName,
            Map<String, Object> variables) {

        log.debug("Evaluating full model: {}", modelName);

        // 1. Look up model metadata
        ModelInfo modelInfo = modelRegistry.getModelInfo(modelName);
        if (modelInfo == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of(
                            "error", "Model not found",
                            "modelName", modelName
                    ))
                    .build();
        }

        // 2. Get the decision model
        DecisionModel decision;
        try {
            DecisionModels decisionModels = application.get(DecisionModels.class);
            decision = decisionModels.getDecisionModel(modelInfo.getNamespace(), modelName);
        } catch (Exception e) {
            log.error("Error loading decision model: {}", modelName, e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Failed to load decision model"))
                    .build();
        }

        // 3. Evaluate all decisions
        DMNResult dmnResult;
        try {
            dmnResult = decision.evaluateAll(DMNJSONUtils.ctx(decision, variables));
        } catch (Exception e) {
            log.error("Error evaluating model: {}", modelName, e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Decision evaluation failed"))
                    .build();
        }

        // 4. Build result
        KogitoDMNResult result = new KogitoDMNResult(
                modelInfo.getNamespace(),
                modelName,
                dmnResult
        );

        // 5. Return result
        return Response.ok(result.getDmnContext()).build();
    }
}
