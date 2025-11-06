package org.prestoncabe.functions;

import io.quarkus.arc.Arc;
import io.quarkus.arc.Unremovable;
import org.kie.kogito.Application;
import org.kie.kogito.decision.DecisionModel;
import org.kie.kogito.decision.DecisionModels;
import org.kie.kogito.dmn.rest.DMNJSONUtils;
import org.kie.dmn.api.core.DMNContext;
import org.kie.dmn.api.core.DMNResult;

import javax.annotation.PostConstruct;
import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

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

    // Cache: modelName -> (namespace, modelReference)
    private final Map<String, ModelInfo> modelCache = new ConcurrentHashMap<>();

    @PostConstruct
    public void discoverModels() {
        DecisionModels decisionModels = application.get(DecisionModels.class);

        // Kogito doesn't expose a direct API to list all models, but we can populate
        // the cache as models are accessed. For now, we'll populate known models.
        // Note: If a model isn't in cache, we'll try to discover it on first use.

        // TODO: This could be enhanced with reflection or configuration to auto-discover all models
        // For now, we rely on lazy population or explicit registration
    }

    /**
     * Dynamically invokes a decision service.
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
        // Get the Application bean directly from Arc
        Application application = null;
        try {
            application = Arc.container().instance(Application.class).get();
        } catch (Exception e) {
            throw new RuntimeException("Failed to obtain Application from CDI container. " +
                "Ensure the application context is initialized.", e);
        }

        if (application == null) {
            throw new RuntimeException("Application bean not found in CDI container.");
        }

        // Call the internal implementation directly
        return invokeInternalStatic(application, modelName, serviceName, situation, parameters);
    }

    /**
     * Static internal implementation that doesn't rely on instance fields.
     */
    private static Object invokeInternalStatic(Application application, String modelName, String serviceName,
                                                Map<String, Object> situation, Map<String, Object> parameters) {
        DecisionModels decisionModels = application.get(DecisionModels.class);

        // Try to discover the model by its name
        ModelInfo modelInfo = discoverModelStatic(decisionModels, modelName);
        if (modelInfo == null) {
            throw new RuntimeException(
                String.format("Decision model '%s' not found. Available models may need to be registered.", modelName)
            );
        }

        DecisionModel model = decisionModels.getDecisionModel(modelInfo.namespace, modelInfo.name);

        if (model == null) {
            throw new RuntimeException(
                String.format("Failed to retrieve decision model '%s' with namespace '%s'",
                    modelName, modelInfo.namespace)
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
                String.format("Failed to create DMN context for service '%s' in model '%s'. " +
                    "The decision service may not exist in this model. Error: %s",
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
                errorMsg.append(msg.getMessage()).append("; ");
            });
            throw new RuntimeException(errorMsg.toString());
        }

        // Return the result from the decision service
        Object serviceResult = result.getDecisionResultByName(serviceName);
        if (serviceResult != null) {
            return ((org.kie.dmn.api.core.DMNDecisionResult) serviceResult).getResult();
        }

        return result.getContext().getAll();
    }

    private static ModelInfo discoverModelStatic(DecisionModels decisionModels, String modelName) {
        Map<String, String> known = getKnownModels();

        if (known.containsKey(modelName)) {
            String namespace = known.get(modelName);
            return new ModelInfo(namespace, modelName);
        }

        // If not in known models, return null
        return null;
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

        DecisionModels decisionModels = application.get(DecisionModels.class);

        // Try to get model info from cache, or discover it
        ModelInfo modelInfo = modelCache.get(modelName);

        if (modelInfo == null) {
            // Attempt to discover the model by trying common namespace patterns
            modelInfo = discoverModel(decisionModels, modelName);
            if (modelInfo == null) {
                throw new RuntimeException(
                    String.format("Decision model '%s' not found. Available models may need to be registered.", modelName)
                );
            }
            modelCache.put(modelName, modelInfo);
        }

        DecisionModel model = decisionModels.getDecisionModel(modelInfo.namespace, modelInfo.name);

        if (model == null) {
            throw new RuntimeException(
                String.format("Failed to retrieve decision model '%s' with namespace '%s'",
                    modelName, modelInfo.namespace)
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
                String.format("Failed to create DMN context for service '%s' in model '%s'. " +
                    "The decision service may not exist in this model. Error: %s",
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

        // Return the result of the decision service
        return result.getContext().get(serviceName);
    }

    /**
     * Attempts to discover a model by trying common namespace patterns.
     * This is a fallback when the model isn't in the cache.
     */
    private ModelInfo discoverModel(DecisionModels decisionModels, String modelName) {
        // Try to get the model with various namespace patterns
        // Kogito generates namespaces based on DMN file namespaces

        // Pattern 1: Try with the model name directly (some models might use simple namespaces)
        DecisionModel model = tryGetModel(decisionModels, modelName, modelName);
        if (model != null) {
            return new ModelInfo(modelName, modelName);
        }

        // Pattern 2: Since we can't enumerate all models easily, we'll need to know the namespace
        // In practice, you might want to:
        // 1. Configure these in application.properties
        // 2. Use a registration pattern
        // 3. Or parse DMN files at startup to extract namespaces

        // For now, let's register known models explicitly
        // Users can extend this list or we can make it configurable
        Map<String, String> knownModels = getKnownModels();
        String namespace = knownModels.get(modelName);

        if (namespace != null) {
            model = tryGetModel(decisionModels, namespace, modelName);
            if (model != null) {
                return new ModelInfo(namespace, modelName);
            }
        }

        return null;
    }

    /**
     * Helper to safely try to get a model without throwing exceptions.
     */
    private DecisionModel tryGetModel(DecisionModels decisionModels, String namespace, String name) {
        try {
            return decisionModels.getDecisionModel(namespace, name);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Returns a map of known model names to their namespaces.
     * This can be moved to configuration or auto-discovered from DMN files.
     */
    private static Map<String, String> getKnownModels() {
        Map<String, String> known = new HashMap<>();

        // Add known models here - these match the DMN file namespaces
        known.put("Benefits", "https://kie.apache.org/dmn/_9514D95A-63FB-4345-911B-D83E1867F709");
        known.put("benefits", "https://kie.apache.org/dmn/_128BAC16-3FFC-4BF4-ADEC-BE9FFE4EDE17");  // PhlHomesteadExemption model
        known.put("age", "https://kie.apache.org/dmn/_81D401A8-CA81-4F9A-ABCC-532C25768708");
        known.put("enrollment", "https://kie.apache.org/dmn/_3B9E68B5-63FA-437C-AF93-CC12DDD00BC5");
        known.put("BDT", "https://kie.apache.org/dmn/_1B91A885-130A-4E0B-A762-E12AA6DD5C79");

        // Add more models as needed

        return known;
    }

    /**
     * Internal class to hold model information.
     */
    private static class ModelInfo {
        final String namespace;
        final String name;

        ModelInfo(String namespace, String name) {
            this.namespace = namespace;
            this.name = name;
        }
    }
}
