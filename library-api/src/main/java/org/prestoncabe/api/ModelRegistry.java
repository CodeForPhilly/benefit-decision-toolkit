package org.prestoncabe.api;

import org.kie.dmn.api.core.DMNModel;
import org.kie.dmn.api.core.DMNRuntime;
import org.kie.kogito.decision.DecisionModels;
import org.kie.kogito.dmn.AbstractDecisionModels;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Registry that automatically discovers all DMN models at runtime using reflection.
 * Provides mapping from model names to their namespaces and metadata.
 */
@ApplicationScoped
public class ModelRegistry {

    private static final Logger log = LoggerFactory.getLogger(ModelRegistry.class);

    @Inject
    org.kie.kogito.Application application;

    /**
     * Get metadata for a specific model by name.
     *
     * @param modelName the DMN model name (e.g., "PersonMinAge", "PhlHomesteadExemption")
     * @return ModelInfo containing namespace and available services, or null if not found
     */
    public ModelInfo getModelInfo(String modelName) {
        Map<String, ModelInfo> allModels = getAllModels();
        return allModels.get(modelName);
    }

    /**
     * Get all discovered DMN models.
     * Rebuilds the mapping on each call to ensure hot-reload compatibility.
     *
     * @return map of model name to ModelInfo
     */
    public Map<String, ModelInfo> getAllModels() {
        Map<String, ModelInfo> modelMap = new HashMap<>();

        try {
            DecisionModels decisionModels = application.get(DecisionModels.class);
            DMNRuntime dmnRuntime = getDMNRuntime(decisionModels);

            if (dmnRuntime == null) {
                log.warn("DMNRuntime is null, no models discovered");
                return modelMap;
            }

            List<DMNModel> models = dmnRuntime.getModels();
            log.debug("Discovered {} DMN models", models.size());

            for (DMNModel model : models) {
                String modelName = model.getName();
                String namespace = model.getNamespace();

                List<String> decisionServices = model.getDecisionServices().stream()
                    .map(ds -> ds.getName())
                    .collect(Collectors.toList());

                List<String> decisions = model.getDecisions().stream()
                    .map(d -> d.getName())
                    .collect(Collectors.toList());

                ModelInfo info = new ModelInfo(namespace, modelName, decisionServices, decisions);
                modelMap.put(modelName, info);

                log.debug("Registered model: {} (namespace: {}, services: {}, decisions: {})",
                    modelName, namespace, decisionServices.size(), decisions.size());
            }

        } catch (Exception e) {
            log.error("Error discovering DMN models", e);
        }

        return modelMap;
    }

    /**
     * Use reflection to access the private static dmnRuntime field from AbstractDecisionModels.
     * This is necessary because Kogito doesn't expose a public API to enumerate all models.
     *
     * @param decisionModels the generated DecisionModels instance
     * @return the DMNRuntime, or null if reflection fails
     */
    private DMNRuntime getDMNRuntime(DecisionModels decisionModels) {
        try {
            Field runtimeField = AbstractDecisionModels.class.getDeclaredField("dmnRuntime");
            runtimeField.setAccessible(true);
            return (DMNRuntime) runtimeField.get(null); // static field
        } catch (NoSuchFieldException | IllegalAccessException e) {
            log.error("Failed to access DMNRuntime via reflection. " +
                "This may be due to a Kogito version incompatibility.", e);
            return null;
        }
    }
}
