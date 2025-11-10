package org.prestoncabe.api;

import org.kie.dmn.api.core.DMNModel;
import org.kie.dmn.api.core.DMNRuntime;
import org.kie.kogito.decision.DecisionModels;
import org.kie.kogito.dmn.AbstractDecisionModels;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
     * Get metadata for a specific model by path.
     *
     * @param path the relative path (e.g., "age/PersonMinAge", "checks/test/TestOne")
     * @return ModelInfo or null if not found
     */
    public ModelInfo getModelInfoByPath(String path) {
        Map<String, ModelInfo> allModels = getAllModels();
        return allModels.values().stream()
                .filter(info -> info.getPath().equals(path))
                .findFirst()
                .orElse(null);
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
            // Build mapping of model name -> file path
            Map<String, String> modelNameToPath = scanDMNFiles();

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

                // Get the file path for this model
                String path = modelNameToPath.getOrDefault(modelName, modelName);

                ModelInfo info = new ModelInfo(namespace, modelName, decisionServices, decisions, path);
                modelMap.put(modelName, info);

                log.debug("Registered model: {} (namespace: {}, services: {}, decisions: {}, path: {})",
                    modelName, namespace, decisionServices.size(), decisions.size(), path);
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

    /**
     * Scan the filesystem for .dmn files and build a mapping of model name to relative path.
     * Paths are relative to src/main/resources/, excluding the .dmn extension.
     *
     * Example: src/main/resources/age/PersonMinAge.dmn -> "age/PersonMinAge"
     *
     * @return map of model name to relative path
     */
    private Map<String, String> scanDMNFiles() {
        Map<String, String> modelNameToPath = new HashMap<>();

        try {
            // In production, DMN files are in the classpath
            // We need to check if we're in dev mode (filesystem) or production (classpath)
            Path resourcesPath = Paths.get("src/main/resources");

            if (Files.exists(resourcesPath)) {
                // Dev mode - scan filesystem
                try (Stream<Path> paths = Files.walk(resourcesPath)) {
                    paths.filter(path -> path.toString().endsWith(".dmn"))
                         .forEach(path -> {
                             try {
                                 String modelName = extractModelName(path);
                                 if (modelName != null) {
                                     // Build relative path without extension
                                     String relativePath = resourcesPath.relativize(path).toString();
                                     relativePath = relativePath.substring(0, relativePath.length() - 4); // remove .dmn
                                     modelNameToPath.put(modelName, relativePath);
                                     log.debug("Mapped DMN file: {} -> {}", modelName, relativePath);
                                 }
                             } catch (Exception e) {
                                 log.warn("Failed to parse DMN file: {}", path, e);
                             }
                         });
                }
            } else {
                // Production mode - scan classpath resources
                log.debug("Scanning classpath for DMN files (production mode)");
                // For now, we'll skip production mode scanning
                // This can be enhanced later if needed
            }

        } catch (Exception e) {
            log.error("Error scanning DMN files", e);
        }

        return modelNameToPath;
    }

    /**
     * Extract the model name from a DMN file by parsing its XML.
     *
     * @param dmnFilePath path to the DMN file
     * @return the model name, or null if parsing fails
     */
    private String extractModelName(Path dmnFilePath) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(dmnFilePath.toFile());

            Element root = doc.getDocumentElement();
            if (root != null && root.hasAttribute("name")) {
                return root.getAttribute("name");
            }
        } catch (Exception e) {
            log.debug("Failed to extract model name from {}: {}", dmnFilePath, e.getMessage());
        }
        return null;
    }
}
