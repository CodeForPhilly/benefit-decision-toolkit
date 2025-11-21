package org.codeforphilly.bdt.api;

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
     * Evaluate a decision service for a given model using path-based routing.
     * The service name is inferred as {modelName}Service.
     *
     * @param path the path to the DMN model (e.g., "age/PersonMinAge", "checks/test/TestOne")
     * @param variables the input variables (must include "situation" and "parameters" as per DMN model)
     * @return the decision result or error response
     */
    @POST
    @Path("/{path:.+}")
    public Response evaluateDecisionService(
            @PathParam("path") String path,
            Map<String, Object> variables) {

        log.debug("Evaluating decision service for path: {}", path);

        // 1. Look up model metadata by path
        ModelInfo modelInfo = modelRegistry.getModelInfoByPath(path);
        if (modelInfo == null) {
            log.warn("Model not found for path: {}", path);
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of(
                            "error", "Model not found",
                            "path", path,
                            "message", "No DMN model found at path '" + path + "'. " +
                                    "Check the OpenAPI schema at /q/openapi or /q/swagger-ui for available models."
                    ))
                    .build();
        }

        String modelName = modelInfo.getModelName();

        // 2. Infer service name: {modelName}Service (enforced convention)
        String serviceName = modelName + "Service";

        // 3. Check if the inferred service exists in this model
        if (!modelInfo.getDecisionServices().contains(serviceName)) {
            log.warn("Expected decision service '{}' not found in model '{}'", serviceName, modelName);
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of(
                            "error", "Decision service not found",
                            "path", path,
                            "modelName", modelName,
                            "expectedServiceName", serviceName,
                            "availableServices", modelInfo.getDecisionServices(),
                            "message", "Model '" + modelName + "' must have a decision service named '" +
                                    serviceName + "'. Available services: " + modelInfo.getDecisionServices()
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

        // Return the DMN context (contains all output variables)
        return Response.ok(result.getDmnContext()).build();
    }

}
