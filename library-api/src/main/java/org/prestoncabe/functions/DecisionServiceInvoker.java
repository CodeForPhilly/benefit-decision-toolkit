package org.prestoncabe.functions;

import io.quarkus.arc.Arc;
import io.quarkus.arc.Unremovable;
import org.kie.kogito.Application;
import org.kie.kogito.decision.DecisionModel;
import org.kie.kogito.decision.DecisionModels;
import org.kie.kogito.dmn.rest.DMNJSONUtils;
import org.kie.dmn.api.core.DMNContext;
import org.kie.dmn.api.core.DMNResult;
import org.prestoncabe.api.ModelInfo;
import org.prestoncabe.api.ModelRegistry;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.HashMap;
import java.util.Map;

/**
 * Service that allows dynamic invocation of decision services from FEEL expressions.
 *
 * Usage from FEEL:
 * org.prestoncabe.functions.DecisionServiceInvoker.invoke(
 *   "benefits",                    // model name
 *   "PhlHomesteadExemption",       // decision service name
 *   situation,                     // tSituation context
 *   {"benefit": "homestead"}       // parameters map
 * )
 */
@Unremovable
@ApplicationScoped
public class DecisionServiceInvoker {

    @Inject
    Application application;

    @Inject
    ModelRegistry modelRegistry;

    /**
     * Dynamically invokes a decision service.
     * This static method is provided for backward compatibility and FEEL expression usage.
     *
     * @param modelName The DMN model name (e.g., "benefits", "age", "enrollment")
     * @param serviceName The decision service name (e.g., "PhlHomesteadExemption")
     * @param situation The tSituation context (required)
     * @param parameters Additional parameters map (can be null)
     * @return The result from the decision service evaluation
     * @throws RuntimeException if the model/service is not found or evaluation fails
     */
    public static Object invoke(String modelName, String serviceName,
                                Map<String, Object> situation, Map<String, Object> parameters) {
        // Delegate to the instance method via CDI
        DecisionServiceInvoker invoker;
        try {
            invoker = Arc.container().instance(DecisionServiceInvoker.class).get();
        } catch (Exception e) {
            throw new RuntimeException("Failed to obtain DecisionServiceInvoker from CDI container. " +
                "Ensure the application context is initialized.", e);
        }

        if (invoker == null) {
            throw new RuntimeException("DecisionServiceInvoker bean not found in CDI container.");
        }

        return invoker.invokeInternal(modelName, serviceName, situation, parameters);
    }

    /**
     * Internal implementation of invoke that has access to instance fields.
     * Can also be called directly when the invoker is injected.
     */
    public Object invokeInternal(String modelName, String serviceName,
                                  Map<String, Object> situation, Map<String, Object> parameters) {
        if (application == null) {
            throw new RuntimeException("Application is null - CDI injection failed");
        }

        if (modelRegistry == null) {
            throw new RuntimeException("ModelRegistry is null - CDI injection failed");
        }

        // Use ModelRegistry for auto-discovery
        ModelInfo modelInfo = modelRegistry.getModelInfo(modelName);

        if (modelInfo == null) {
            // Provide helpful error message with available models
            Map<String, ModelInfo> allModels = modelRegistry.getAllModels();
            String availableModels = String.join(", ", allModels.keySet());
            throw new RuntimeException(
                String.format("Decision model '%s' not found. Available models: %s",
                    modelName, availableModels)
            );
        }

        // Validate that the decision service exists in the model
        if (!modelInfo.getDecisionServices().contains(serviceName)) {
            String availableServices = String.join(", ", modelInfo.getDecisionServices());
            throw new RuntimeException(
                String.format("Decision service '%s' not found in model '%s'. Available services: %s",
                    serviceName, modelName, availableServices)
            );
        }

        // Get the decision model
        DecisionModels decisionModels = application.get(DecisionModels.class);
        DecisionModel model = decisionModels.getDecisionModel(modelInfo.getNamespace(), modelInfo.getModelName());

        if (model == null) {
            throw new RuntimeException(
                String.format("Failed to retrieve decision model '%s' with namespace '%s'",
                    modelName, modelInfo.getNamespace())
            );
        }

        // Build the input context with situation and parameters
        Map<String, Object> input = new HashMap<>();
        input.put("situation", situation);
        if (parameters != null) {
            input.put("parameters", parameters);
        }

        DMNContext context;
        try {
            context = DMNJSONUtils.ctx(model, input, serviceName);
        } catch (Exception e) {
            throw new RuntimeException(
                String.format("Failed to create DMN context for service '%s' in model '%s'. Error: %s",
                    serviceName, modelName, e.getMessage()), e
            );
        }

        DMNResult result;
        try {
            result = model.evaluateDecisionService(context, serviceName);
        } catch (Exception e) {
            throw new RuntimeException(
                String.format("Failed to evaluate decision service '%s' in model '%s': %s",
                    serviceName, modelName, e.getMessage()), e
            );
        }

        // Check for errors and throw exception if any
        if (result.hasErrors()) {
            StringBuilder errorMsg = new StringBuilder(
                String.format("Decision service evaluation failed for '%s.%s': ", modelName, serviceName)
            );
            result.getMessages().forEach(msg -> {
                errorMsg.append(msg.toString()).append("; ");
            });
            throw new RuntimeException(errorMsg.toString());
        }

        // Return the entire DMN context containing all output decisions
        // This allows access to any output decision by name (e.g., "result", "checks", "eligible")
        return result.getContext().getAll();
    }
}
