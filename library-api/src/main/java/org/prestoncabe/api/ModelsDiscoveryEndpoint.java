package org.prestoncabe.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Discovery endpoint for browsing available DMN models and their metadata.
 * Provides convenient GET endpoints to explore the API surface.
 */
@Path("/api/v1/models")
@Produces(MediaType.APPLICATION_JSON)
public class ModelsDiscoveryEndpoint {

    private static final Logger log = LoggerFactory.getLogger(ModelsDiscoveryEndpoint.class);

    @Inject
    ModelRegistry modelRegistry;

    /**
     * List all available DMN models with their metadata.
     *
     * GET /api/v1/models
     *
     * Returns:
     * {
     *   "models": {
     *     "PersonMinAge": {
     *       "namespace": "https://kie.apache.org/dmn/...",
     *       "modelName": "PersonMinAge",
     *       "decisionServices": ["PersonMinAgeService"],
     *       "decisions": ["result"],
     *       "endpoints": {
     *         "evaluateService": "POST /api/v1/PersonMinAge/PersonMinAgeService",
     *         "evaluateModel": "POST /api/v1/PersonMinAge"
     *       }
     *     },
     *     ...
     *   },
     *   "count": 5
     * }
     */
    @GET
    public Response listAllModels() {
        log.debug("Listing all available DMN models");

        Map<String, ModelInfo> allModels = modelRegistry.getAllModels();

        Map<String, Object> response = new HashMap<>();
        response.put("count", allModels.size());

        // Enhance each model with endpoint information
        Map<String, Map<String, Object>> enhancedModels = allModels.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> {
                            ModelInfo info = entry.getValue();
                            Map<String, Object> modelData = new HashMap<>();
                            modelData.put("namespace", info.getNamespace());
                            modelData.put("modelName", info.getModelName());
                            modelData.put("decisionServices", info.getDecisionServices());
                            modelData.put("decisions", info.getDecisions());

                            // Add endpoint URLs
                            Map<String, Object> endpoints = new HashMap<>();
                            endpoints.put("evaluateModel", "POST /api/v1/" + info.getModelName());

                            Map<String, String> services = new HashMap<>();
                            for (String service : info.getDecisionServices()) {
                                services.put(service, "POST /api/v1/" + info.getModelName() + "/" + service);
                            }
                            endpoints.put("decisionServices", services);

                            modelData.put("endpoints", endpoints);
                            return modelData;
                        }
                ));

        response.put("models", enhancedModels);

        return Response.ok(response).build();
    }

    /**
     * Get details for a specific model.
     *
     * GET /api/v1/models/{modelName}
     *
     * Returns:
     * {
     *   "namespace": "https://kie.apache.org/dmn/...",
     *   "modelName": "PersonMinAge",
     *   "decisionServices": ["PersonMinAgeService"],
     *   "decisions": ["result", "dateOfBirth", "age"],
     *   "endpoints": {
     *     "evaluateService": "POST /api/v1/PersonMinAge/PersonMinAgeService",
     *     "evaluateModel": "POST /api/v1/PersonMinAge"
     *   }
     * }
     */
    @GET
    @Path("/{modelName}")
    public Response getModelDetails(@PathParam("modelName") String modelName) {
        log.debug("Getting details for model: {}", modelName);

        ModelInfo modelInfo = modelRegistry.getModelInfo(modelName);

        if (modelInfo == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of(
                            "error", "Model not found",
                            "modelName", modelName,
                            "message", "No DMN model with name '" + modelName + "' exists",
                            "hint", "Use GET /api/v1/models to see all available models"
                    ))
                    .build();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("namespace", modelInfo.getNamespace());
        response.put("modelName", modelInfo.getModelName());
        response.put("decisionServices", modelInfo.getDecisionServices());
        response.put("decisions", modelInfo.getDecisions());

        // Add endpoint URLs
        Map<String, Object> endpoints = new HashMap<>();
        endpoints.put("evaluateModel", "POST /api/v1/" + modelInfo.getModelName());

        Map<String, String> services = new HashMap<>();
        for (String service : modelInfo.getDecisionServices()) {
            services.put(service, "POST /api/v1/" + modelInfo.getModelName() + "/" + service);
        }
        endpoints.put("decisionServices", services);

        response.put("endpoints", endpoints);

        return Response.ok(response).build();
    }
}
