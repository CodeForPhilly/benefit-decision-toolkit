package org.codeforphilly.bdt.library.api;

import org.kie.dmn.api.core.DMNModel;
import org.kie.dmn.api.core.DMNResult;
import org.kie.dmn.api.core.DMNRuntime;
import org.kie.dmn.api.core.ast.DecisionNode;
import org.kie.kogito.decision.DecisionModels;
import org.kie.kogito.dmn.AbstractDecisionModels;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;

import io.quarkus.runtime.Startup;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.net.URI;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Registry that automatically discovers all DMN models at runtime using reflection.
 * Provides mapping from model names to their namespaces and metadata.
 */
@Startup
@ApplicationScoped
public class ModelRegistry {

    private static final Logger log = LoggerFactory.getLogger(ModelRegistry.class);

    @Inject
    org.kie.kogito.Application application;

    /**
     * Cached model registry built once at startup.
     * Volatile to ensure visibility across threads.
     */
    private volatile Map<String, ModelInfo> cachedModels;

    /**
     * Cached path-to-model mapping built once at startup.
     * Volatile to ensure visibility across threads.
     */
    private volatile Map<String, ModelInfo> cachedModelsByPath;

    /**
     * Get metadata for a specific model by name.
     * Returns cached result built at startup.
     *
     * @param modelName the DMN model name (e.g., "PersonMinAge", "PhlHomesteadExemption")
     * @return ModelInfo containing namespace and available services, or null if not found
     */
    public ModelInfo getModelInfo(String modelName) {
        return cachedModels.get(modelName);
    }

    /**
     * Get metadata for a specific model by path.
     * Returns cached result built at startup.
     *
     * @param path the relative path (e.g., "age/PersonMinAge", "checks/test/TestOne")
     * @return ModelInfo or null if not found
     */
    public ModelInfo getModelInfoByPath(String path) {
        return cachedModelsByPath.get(path);
    }

    /**
     * Get all discovered DMN models.
     * Returns cached results built once at startup.
     * Hot-reload compatibility: Quarkus dev mode reloads the entire class, triggering cache rebuild.
     *
     * @return map of model name to ModelInfo
     */
    public Map<String, ModelInfo> getAllModels() {
        return cachedModels;
    }

    /**
     * Get the compiled DMN models used by the running application.
     *
     * Kogito 10 generates JSON schemas from these runtime models rather than
     * emitting the legacy aggregate dmnDefinitions.json resource.
     */
    /**
     * The compiled models in a fixed order (namespace, then name). The OpenAPI schema generator numbers
     * schema prefixes ({@code ns1}, {@code ns2}, ...) in list order, and the runtime's own order follows
     * file discovery, which differs between machines; a fixed order keeps {@code openapi.snapshot.json} stable.
     */
    List<DMNModel> getDmnModels() {
        DecisionModels decisionModels = application.get(DecisionModels.class);
        DMNRuntime dmnRuntime = getDMNRuntime(decisionModels);
        return dmnRuntime == null ? List.of() : dmnRuntime.getModels().stream()
            .sorted(Comparator.comparing(DMNModel::getNamespace).thenComparing(DMNModel::getName))
            .toList();
    }

    /**
     * Build the model registry cache.
     * This is called once during @PostConstruct initialization.
     * Scans the classpath for DMN files and builds the model metadata registry.
     */
    private void buildModelCache() {
        Map<String, ModelInfo> modelMap = new HashMap<>();
        Map<String, ModelInfo> modelsByPath = new HashMap<>();

        // Outside the try: a malformed Bruno example must fail startup, not publish an empty registry.
        Map<String, List<BrunoExamples.Example>> examples = BrunoExamples.load();

        try {
            DmnScan scan = scanDMNFiles();

            DecisionModels decisionModels = application.get(DecisionModels.class);
            DMNRuntime dmnRuntime = getDMNRuntime(decisionModels);

            if (dmnRuntime == null) {
                log.warn("DMNRuntime is null, no models discovered");
                this.cachedModels = modelMap;
                this.cachedModelsByPath = modelsByPath;
                return;
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

                // Get the file path and description for this model
                String path = scannedPath(model, scan.paths);
                String description = scan.descriptions.get(modelName);
                boolean benefit = path.startsWith("benefits/");
                List<BenefitCheckInfo> checks = scan.benefitChecks.getOrDefault(modelName, List.of());

                ModelInfo info = new ModelInfo(namespace, modelName, decisionServices, decisions, path, description,
                    checks,
                    benefit ? evaluateNextSteps(dmnRuntime, model) : Map.of(),
                    publishedReference(dmnRuntime, model, path, description, checks,
                        scan.referenceDocs.getOrDefault(modelName, ReferenceDocs.NONE)),
                    examples.getOrDefault(path, List.of()));
                modelMap.put(modelName, info);
                modelsByPath.put(path, info);

                log.debug("Registered model: {} (namespace: {}, services: {}, decisions: {}, path: {}, description: {})",
                    modelName, namespace, decisionServices.size(), decisions.size(), path,
                    description != null ? description.substring(0, Math.min(30, description.length())) + "..." : "null");
            }

            log.info("Model registry cache built: {} models registered", modelMap.size());

        } catch (InvalidNextStepsException | Reference.InvalidReferenceException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error building DMN model cache", e);
        }

        // Assign to volatile fields for thread-safe publication
        this.cachedModels = modelMap;
        this.cachedModelsByPath = modelsByPath;
    }

    /**
     * The model's file path from the classpath scan, or its bare name when the scan did not record it.
     * An exposed model the scan missed fails startup: without its path, nothing can tell whether it is a
     * library benefit or check that must have a reference.
     */
    static String scannedPath(DMNModel model, Map<String, String> scannedPaths) {
        String path = scannedPaths.get(model.getName());
        if (path != null) {
            return path;
        }
        if (ModelInfo.isExposed(model.getName(), serviceNames(model))) {
            throw new Reference.InvalidReferenceException(model.getName() + " is exposed through " + model.getName() + "Service"
                + " but the classpath scan did not find its DMN file, so its reference cannot be checked."
            + " The scan probably failed: see the earlier DMN classpath scan errors or warnings in the log.");
        }
        return model.getName();
    }

    /**
     * The reference as published in OpenAPI ({@code x-bdt-reference}): the model description as its summary,
     * the constant {@code reference} decision, and the documentation written on the DMN itself.
     * Every exposed benefit and check ({@link ModelInfo#isLibraryExposed}) must have one. Base modules and
     * utilities outside {@code benefits/} and {@code checks/} need none, and may not have one: the path decides
     * whether a reference is a benefit or check reference, and outside those folders it is neither.
     */
    static Map<String, Object> publishedReference(DMNRuntime runtime, DMNModel model, String path,
                                                  String summary, List<BenefitCheckInfo> checks, ReferenceDocs docs) {
        boolean benefit = path.startsWith("benefits/");
        if (!benefit && !path.startsWith("checks/")) {
            if (model.getDecisionByName(Reference.DECISION) != null) {
                throw new Reference.InvalidReferenceException(model.getName() + " has a '" + Reference.DECISION
                    + "' decision but its file (" + path + ") is not under benefits/ or checks/,"
                    + " so it is neither a benefit nor a check reference");
            }
            return Map.of();
        }
        Map<String, Object> evaluated = Reference.evaluate(runtime, model,
            benefit ? Reference.Kind.BENEFIT : Reference.Kind.CHECK);
        if (evaluated.isEmpty()) {
            if (ModelInfo.isLibraryExposed(path, model.getName(), serviceNames(model))) {
                throw new Reference.InvalidReferenceException(model.getName()
                    + " is exposed through " + model.getName() + "Service but has no '" + Reference.DECISION + "' decision");
            }
            return Map.of();
        }
        if (summary == null) {
            throw new Reference.InvalidReferenceException(model.getName()
                + " has a reference but no model description to use as its summary");
        }
        Map<String, Object> reference = new LinkedHashMap<>();
        reference.put("summary", summary);
        reference.putAll(evaluated);
        if (benefit) {
            List<Map<String, Object>> rationale = new ArrayList<>();
            for (BenefitCheckInfo check : checks) {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("alias", check.alias());
                entry.put("operationId", check.operationId());
                entry.put("rationale", docs.checkRationale().get(check.alias()));
                rationale.add(Collections.unmodifiableMap(entry));
            }
            reference.put("checks", List.copyOf(rationale));
        } else if (!docs.parameters().isEmpty()) {
            reference.put("parameters", docs.parameters());
        }
        reference.put("implementationNotes", docs.implementationNotes());
        return Collections.unmodifiableMap(reference);
    }

    private static List<String> serviceNames(DMNModel model) {
        return model.getDecisionServices().stream().map(ds -> ds.getName()).toList();
    }

    /** Thrown for any invalid benefit nextSteps so startup fails instead of publishing a partial registry. */
    static class InvalidNextStepsException extends IllegalStateException {
        InvalidNextStepsException(String message) {
            super(message);
        }

        InvalidNextStepsException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    /** Evaluate static benefit content once, without evaluating checks or requiring situation data. */
    static Map<String, Object> evaluateNextSteps(DMNRuntime runtime, DMNModel model) {
        try {
            return readNextSteps(runtime, model);
        } catch (InvalidNextStepsException e) {
            throw e;
        } catch (RuntimeException e) {
            throw new InvalidNextStepsException("Failed to evaluate " + model.getName() + ".nextSteps", e);
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> readNextSteps(DMNRuntime runtime, DMNModel model) {
        DecisionNode decision = model.getDecisionByName("nextSteps");
        if (decision == null) {
            return Map.of();
        }
        if (!decision.getDecision().getInformationRequirement().isEmpty()) {
            throw new InvalidNextStepsException(model.getName() + ".nextSteps must be constant (no information requirements)");
        }
        DMNResult result = runtime.evaluateByName(model, runtime.newContext(), "nextSteps");
        if (result.hasErrors()) {
            throw new InvalidNextStepsException("Failed to evaluate " + model.getName() + ".nextSteps: " + result.getMessages());
        }
        Object value = result.getDecisionResultByName("nextSteps").getResult();
        if (!(value instanceof Map<?, ?>)) {
            throw new InvalidNextStepsException(model.getName() + ".nextSteps must return a context");
        }
        return (Map<String, Object>) immutableCopy(value);
    }

    /** Deep copy that keeps FEEL context key order and null fields, so exported metadata is stable. */
    private static Object immutableCopy(Object value) {
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> copy = new LinkedHashMap<>();
            map.forEach((key, item) -> copy.put(String.valueOf(key), immutableCopy(item)));
            return Collections.unmodifiableMap(copy);
        }
        if (value instanceof List<?> list) {
            List<Object> copy = new ArrayList<>();
            list.forEach(item -> copy.add(immutableCopy(item)));
            return Collections.unmodifiableList(copy);
        }
        return value;
    }

    /**
     * Initializes the model registry and validates that all DMN model names are unique.
     * This runs at application startup and on every hot reload.
     * Validates model names FIRST: the classpath scan is keyed by model name, so a duplicate would
     * otherwise mix up two files' paths and references and fail with a misleading reference error.
     *
     * @throws IllegalStateException if duplicate model names are detected
     */
    @PostConstruct
    public void initialize() {
        validateUniqueModelNames();
        buildModelCache();
    }

    private void validateUniqueModelNames() {
        try {
            // Get models directly from DMNRuntime BEFORE deduplication
            DecisionModels decisionModels = application.get(DecisionModels.class);
            DMNRuntime dmnRuntime = getDMNRuntime(decisionModels);

            if (dmnRuntime == null) {
                log.warn("DMNRuntime is null, skipping validation");
                return;
            }

            List<DMNModel> models = dmnRuntime.getModels();
            Map<String, String> namespaceToPath = scanDMNFilesForNamespaces();
            Map<String, List<String>> nameToFiles = new HashMap<>();

            // Check all models from runtime (including duplicates)
            for (DMNModel model : models) {
                String modelName = model.getName();
                String namespace = model.getNamespace();
                String path = namespaceToPath.getOrDefault(namespace, "unknown");
                String shortNamespace = namespace.substring(namespace.lastIndexOf('/') + 1);

                nameToFiles.computeIfAbsent(modelName, k -> new ArrayList<>())
                           .add(path + " (namespace: " + shortNamespace + ")");
            }

            // Find and report duplicates
            List<String> duplicateErrors = new ArrayList<>();
            for (Map.Entry<String, List<String>> entry : nameToFiles.entrySet()) {
                if (entry.getValue().size() > 1) {
                    duplicateErrors.add(
                        "  - Model name '" + entry.getKey() + "' found in:\n    " +
                        String.join("\n    ", entry.getValue())
                    );
                }
            }

            if (!duplicateErrors.isEmpty()) {
                String errorMessage = "Duplicate DMN model names detected:\n" +
                                    String.join("\n", duplicateErrors) +
                                    "\n\nEach DMN model must have a unique 'name' attribute in its <dmn:definitions> element.";
                log.error(errorMessage);
                throw new IllegalStateException(errorMessage);
            }

            log.info("DMN model name validation passed - {} unique model names found across {} total models",
                     nameToFiles.size(), models.size());

        } catch (IllegalStateException e) {
            // Re-throw validation failures
            throw e;
        } catch (Exception e) {
            log.error("Error during model name validation", e);
            throw new IllegalStateException("Failed to validate DMN model names", e);
        }
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

    /** What the classpath scan reads from each DMN file, keyed by model name. */
    private static final class DmnScan {
        final Map<String, String> paths = new HashMap<>();
        final Map<String, String> descriptions = new HashMap<>();
        final Map<String, List<BenefitCheckInfo>> benefitChecks = new HashMap<>();
        final Map<String, ReferenceDocs> referenceDocs = new HashMap<>();
    }

    /**
     * Scan the classpath for .dmn files and read each model's path, description, benefit checks and reference docs.
     * Uses ClassLoader-based scanning that works in both dev mode and production (JAR).
     * Paths are relative to the classpath root, excluding the .dmn extension.
     */
    private DmnScan scanDMNFiles() {
        DmnScan scan = new DmnScan();

        try {
            ClassLoader classLoader = Thread.currentThread().getContextClassLoader();

            // Try to find a known DMN file to locate the resources root
            URL resourceUrl = classLoader.getResource("BDT.dmn");

            if (resourceUrl != null) {
                String protocol = resourceUrl.getProtocol();
                log.debug("Found BDT.dmn at: {} (protocol: {})", resourceUrl, protocol);

                if ("file".equals(protocol)) {
                    // Dev mode or exploded deployment - get parent directory
                    try {
                        Path dmnPath = Paths.get(resourceUrl.toURI());
                        Path rootPath = dmnPath.getParent(); // This should be target/classes or similar
                        log.debug("Scanning filesystem for DMN files from root: {}", rootPath);
                        scanFilesystemForDMN(rootPath, scan);
                    } catch (Exception e) {
                        log.error("Error scanning filesystem from resource URL", e);
                    }
                } else if ("jar".equals(protocol)) {
                    // Production mode - extract JAR path
                    try {
                        Path jarPath = jarFilePath(resourceUrl);
                        log.debug("Scanning JAR for DMN files: {}", jarPath);
                        scanJarForDMN(jarPath, scan);
                    } catch (Exception e) {
                        log.error("Error scanning JAR from resource URL", e);
                    }
                } else {
                    log.error("Cannot scan DMN files: BDT.dmn was found at {}, but only file: and jar: URLs can be scanned",
                        resourceUrl);
                }
            } else {
                log.warn("Could not locate BDT.dmn resource, falling back to target/classes scan");
                // Fallback for dev mode: check if target/classes exists
                Path targetClasses = Paths.get("target/classes");
                if (Files.exists(targetClasses)) {
                    log.debug("Scanning fallback directory: {}", targetClasses);
                    scanFilesystemForDMN(targetClasses, scan);
                } else {
                    log.error("Could not find DMN files - neither BDT.dmn resource nor target/classes directory found");
                }
            }

            if (scan.paths.isEmpty()) {
                log.error("DMN classpath scan found no DMN files");
            } else {
                log.info("DMN classpath scan complete: found {} models", scan.paths.size());
            }

        } catch (Exception e) {
            log.error("Error scanning DMN files from classpath", e);
        }

        return scan;
    }

    /**
     * Scan a filesystem directory for DMN files.
     */
    private void scanFilesystemForDMN(Path rootPath, DmnScan scan) throws Exception {
        log.debug("Walking filesystem from {}", rootPath);
        try (Stream<Path> paths = Files.walk(rootPath)) {
            paths.filter(path -> path.toString().endsWith(".dmn"))
                 .forEach(path -> {
                     // Use '/' on every OS: paths become API routes and are matched against "benefits/"
                     String relativePath = rootPath.relativize(path).toString().replace('\\', '/');
                     try (InputStream is = Files.newInputStream(path)) {
                         readDMN(relativePath, is, scan);
                     } catch (Exception e) {
                         log.warn("Failed to parse DMN file: {}", path, e);
                     }
                 });
        }
    }

    /**
     * The JAR file holding a {@code jar:file:...!/entry} resource. The file URL is percent-encoded, so it is
     * decoded as a URI: a JAR under a directory with a space in its name would otherwise not be found.
     */
    static Path jarFilePath(URL resourceUrl) {
        String spec = resourceUrl.toString();
        int separator = spec.indexOf("!/");
        if (!spec.startsWith("jar:") || separator < 0) {
            throw new IllegalArgumentException("Not a JAR resource URL: " + spec);
        }
        return Paths.get(URI.create(spec.substring("jar:".length(), separator)));
    }

    /**
     * Scan a JAR file for DMN files.
     */
    private void scanJarForDMN(Path jarPath, DmnScan scan) {
        try (JarFile jarFile = new JarFile(jarPath.toFile())) {
            Enumeration<JarEntry> entries = jarFile.entries();

            while (entries.hasMoreElements()) {
                JarEntry entry = entries.nextElement();
                String name = entry.getName();

                if (name.endsWith(".dmn") && !entry.isDirectory()) {
                    try (InputStream is = jarFile.getInputStream(entry)) {
                        readDMN(name, is, scan);
                    } catch (Exception e) {
                        log.warn("Failed to parse DMN file from JAR: {}", name, e);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error scanning JAR for DMN files: {}", jarPath, e);
        }
    }

    /** Parse one DMN file (relative path including {@code .dmn}) and record what the registry needs from it. */
    private void readDMN(String relativeFile, InputStream inputStream, DmnScan scan) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        Document doc = factory.newDocumentBuilder().parse(inputStream);
        Element root = doc.getDocumentElement();
        if (root == null || !root.hasAttribute("name")) {
            return;
        }
        String modelName = root.getAttribute("name");
        String relativePath = relativeFile.substring(0, relativeFile.length() - 4); // remove .dmn
        scan.paths.put(modelName, relativePath);
        scan.descriptions.put(modelName, modelDescription(root));
        scan.referenceDocs.put(modelName, ReferenceDocs.extract(doc));
        if (relativePath.startsWith("benefits/")) {
            List<BenefitCheckInfo> checks = extractBenefitChecks(doc);
            if (!checks.isEmpty()) {
                scan.benefitChecks.put(modelName, checks);
            }
        }
        log.debug("Mapped DMN file: {} -> {}", modelName, relativePath);
    }

    /**
     * The model description: the {@code <description>} directly within the root {@code <definitions>},
     * ignoring descriptions on decisions and other nested elements. Null when absent or blank.
     */
    String modelDescription(Element root) {
        Element descElement = directChild(root, "description");
        if (descElement != null) {
            String description = descElement.getTextContent();
            // Return null if description is just whitespace
            return (description != null && !description.trim().isEmpty()) ? description.trim() : null;
        }
        return null;
    }

    /**
     * Extract benefit composition from the conventional top-level decision named {@code checks}.
     * The DMN remains the source of truth; this representation is published in OpenAPI for clients.
     */
    private List<BenefitCheckInfo> extractBenefitChecks(Document doc) {
        try {
            Element definitions = doc.getDocumentElement();
            Element checksDecision = null;
            for (Node node = definitions.getFirstChild(); node != null; node = node.getNextSibling()) {
                if (node instanceof Element element && "decision".equals(element.getLocalName())
                    && "checks".equals(element.getAttribute("name"))) {
                    checksDecision = element;
                    break;
                }
            }
            if (checksDecision == null) {
                return List.of();
            }

            Element context = directChild(checksDecision, "context");
            if (context == null) {
                throw new IllegalArgumentException("decision 'checks' must contain a context");
            }

            List<BenefitCheckInfo> checks = new ArrayList<>();
            for (Element entry : directChildren(context, "contextEntry")) {
                Element variable = directChild(entry, "variable");
                Element invocation = directChild(entry, "invocation");
                if (variable == null || invocation == null) {
                    throw new IllegalArgumentException(
                        "every named entry in decision 'checks' must invoke a library decision service");
                }

                String alias = variable.getAttribute("name");
                Element serviceExpression = directChild(invocation, "literalExpression");
                String qualifiedService = expressionText(serviceExpression);
                String operationId = qualifiedService.substring(qualifiedService.lastIndexOf('.') + 1);
                Map<String, Object> parameters = new LinkedHashMap<>();
                Map<String, String> bindings = new LinkedHashMap<>();

                for (Element binding : directChildren(invocation, "binding")) {
                    Element parameter = directChild(binding, "parameter");
                    if (parameter == null || !"parameters".equals(parameter.getAttribute("name"))) {
                        continue;
                    }
                    Element parameterContext = directChild(binding, "context");
                    if (parameterContext == null) {
                        continue;
                    }
                    for (Element parameterEntry : directChildren(parameterContext, "contextEntry")) {
                        Element parameterVariable = directChild(parameterEntry, "variable");
                        String key = parameterVariable.getAttribute("name");
                        String expression = expressionText(directChild(parameterEntry, "literalExpression"));
                        if (expression.matches("situation\\.[A-Za-z_][A-Za-z0-9_.]*")) {
                            bindings.put(key, expression.substring("situation.".length()));
                        } else {
                            parameters.put(key, parseLiteral(expression, key));
                        }
                    }
                }
                checks.add(new BenefitCheckInfo(operationId, alias, parameters, bindings));
            }
            return List.copyOf(checks);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to extract benefit checks", e);
        }
    }

    private Object parseLiteral(String expression, String parameterName) {
        if (expression.length() >= 2 && expression.startsWith("\"") && expression.endsWith("\"")) {
            return expression.substring(1, expression.length() - 1).replace("\\\"", "\"");
        }
        if ("true".equals(expression) || "false".equals(expression)) {
            return Boolean.valueOf(expression);
        }
        if ("null".equals(expression)) {
            return null;
        }
        try {
            return new java.math.BigDecimal(expression);
        } catch (NumberFormatException ignored) {
            throw new IllegalArgumentException("Benefit parameter '" + parameterName + "' uses unsupported FEEL '"
                + expression + "'. Move computed logic into a library check or bind a situation field.");
        }
    }

    private String expressionText(Element expression) {
        Element text = directChild(expression, "text");
        if (text == null || text.getTextContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Expected a non-empty FEEL expression");
        }
        return text.getTextContent().trim();
    }

    private Element directChild(Element parent, String localName) {
        if (parent == null) {
            return null;
        }
        for (Node node = parent.getFirstChild(); node != null; node = node.getNextSibling()) {
            if (node instanceof Element element && localName.equals(element.getLocalName())) {
                return element;
            }
        }
        return null;
    }

    private List<Element> directChildren(Element parent, String localName) {
        List<Element> children = new ArrayList<>();
        for (Node node = parent.getFirstChild(); node != null; node = node.getNextSibling()) {
            if (node instanceof Element element && localName.equals(element.getLocalName())) {
                children.add(element);
            }
        }
        return children;
    }

    /**
     * Scan the classpath for .dmn files and build a mapping of namespace to relative path.
     * Uses ClassLoader-based scanning that works in both dev mode and production (JAR).
     * This is used for validation to show the correct file paths for duplicate models.
     *
     * @return map of namespace to relative path
     */
    private Map<String, String> scanDMNFilesForNamespaces() {
        Map<String, String> namespaceToPath = new HashMap<>();

        try {
            ClassLoader classLoader = Thread.currentThread().getContextClassLoader();

            // Try to find a known DMN file to locate the resources root
            URL resourceUrl = classLoader.getResource("BDT.dmn");

            if (resourceUrl != null) {
                String protocol = resourceUrl.getProtocol();

                if ("file".equals(protocol)) {
                    // Dev mode or exploded deployment
                    Path dmnPath = Paths.get(resourceUrl.toURI());
                    Path rootPath = dmnPath.getParent();
                    scanFilesystemForNamespaces(rootPath, rootPath, namespaceToPath);
                } else if ("jar".equals(protocol)) {
                    // Production mode - scan JAR file
                    scanJarForNamespaces(jarFilePath(resourceUrl), namespaceToPath);
                }
            } else {
                // Fallback for dev mode
                Path targetClasses = Paths.get("target/classes");
                if (Files.exists(targetClasses)) {
                    scanFilesystemForNamespaces(targetClasses, targetClasses, namespaceToPath);
                }
            }

        } catch (Exception e) {
            log.error("Error scanning DMN files for namespaces from classpath", e);
        }

        return namespaceToPath;
    }

    /**
     * Scan a filesystem directory for DMN namespaces.
     */
    private void scanFilesystemForNamespaces(Path rootPath, Path currentPath,
                                             Map<String, String> namespaceToPath) throws Exception {
        try (Stream<Path> paths = Files.walk(currentPath)) {
            paths.filter(path -> path.toString().endsWith(".dmn"))
                 .forEach(path -> {
                     try (InputStream is = Files.newInputStream(path)) {
                         DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
                         factory.setNamespaceAware(true);
                         DocumentBuilder builder = factory.newDocumentBuilder();
                         Document doc = builder.parse(is);

                         Element root = doc.getDocumentElement();
                         if (root != null && root.hasAttribute("namespace")) {
                             String namespace = root.getAttribute("namespace");
                             String relativePath = rootPath.relativize(path).toString();
                             relativePath = relativePath.substring(0, relativePath.length() - 4); // remove .dmn
                             namespaceToPath.put(namespace, relativePath);
                             log.debug("Mapped DMN namespace: {} -> {}", namespace, relativePath);
                         }
                     } catch (Exception e) {
                         log.warn("Failed to parse DMN file: {}", path, e);
                     }
                 });
        }
    }

    /**
     * Scan a JAR file for DMN namespaces.
     */
    private void scanJarForNamespaces(Path jarPath, Map<String, String> namespaceToPath) {
        try (JarFile jarFile = new JarFile(jarPath.toFile())) {
            Enumeration<JarEntry> entries = jarFile.entries();

            while (entries.hasMoreElements()) {
                JarEntry entry = entries.nextElement();
                String name = entry.getName();

                if (name.endsWith(".dmn") && !entry.isDirectory()) {
                    try (InputStream is = jarFile.getInputStream(entry)) {
                        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
                        factory.setNamespaceAware(true);
                        DocumentBuilder builder = factory.newDocumentBuilder();
                        Document doc = builder.parse(is);

                        Element root = doc.getDocumentElement();
                        if (root != null && root.hasAttribute("namespace")) {
                            String namespace = root.getAttribute("namespace");
                            String relativePath = name.substring(0, name.length() - 4); // remove .dmn
                            namespaceToPath.put(namespace, relativePath);
                            log.debug("Mapped DMN namespace from JAR: {} -> {}", namespace, relativePath);
                        }
                    } catch (Exception e) {
                        log.warn("Failed to parse DMN file from JAR: {}", name, e);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error scanning JAR for namespaces: {}", jarPath, e);
        }
    }
}
