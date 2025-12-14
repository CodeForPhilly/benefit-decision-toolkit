package org.acme.service;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.enums.EvaluationResult;
import org.acme.persistence.StorageService;
import org.kie.api.KieServices;
import org.kie.api.builder.*;
import org.kie.api.io.Resource;
import org.kie.api.runtime.KieContainer;
import org.kie.api.runtime.KieSession;
import org.kie.dmn.api.core.*;
import org.kie.dmn.api.core.ast.DecisionNode;
import org.kie.dmn.api.core.ast.InputDataNode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.*;
import java.util.*;
import org.drools.compiler.kie.builder.impl.InternalKieModule;


class DmnCompilationResult {
    public byte[] dmnBytes;
    public List<String> errors;

    public DmnCompilationResult(byte[] dmnBytes, List<String> errors) {
        this.dmnBytes = dmnBytes;
        this.errors = errors;
    }
}

class DmnModelResult {
    public DMNModel model;
    public DMNRuntime runtime;

    public DmnModelResult(DMNModel model, DMNRuntime runtime) {
        this.model = model;
        this.runtime = runtime;
    }
}

@ApplicationScoped
public class KieDmnService implements DmnService {
    @Inject
    private StorageService storageService;

    private KieSession initializeKieSession(byte[] moduleBytes) throws IOException {
        KieServices kieServices = KieServices.Factory.get();
        Resource jarResource = kieServices.getResources().newByteArrayResource(moduleBytes);
        KieModule kieModule = kieServices.getRepository().addKieModule(jarResource);

        ReleaseId releaseId = kieModule.getReleaseId();
        KieContainer kieContainer = kieServices.newKieContainer(releaseId);
        return kieContainer.newKieSession();
    }

    private DmnModelResult compileAndGetDmnModel(String dmnXml, Map<String, String> dependenciesMap, String modelId) throws Exception {
        DmnCompilationResult compilationResult = compileDmnModel(dmnXml, dependenciesMap, modelId);
        if (!compilationResult.errors.isEmpty()) {
            throw new IllegalStateException("DMN compilation failed: " + String.join(", ", compilationResult.errors));
        }

        KieSession kieSession = initializeKieSession(compilationResult.dmnBytes);
        DMNRuntime dmnRuntime = kieSession.getKieRuntime(DMNRuntime.class);

        List<DMNModel> dmnModels = dmnRuntime.getModels();
        if (dmnModels.size() != 1) {
            throw new RuntimeException("Expected exactly one DMN model, found: " + dmnModels.size());
        }

        return new DmnModelResult(dmnModels.get(0), dmnRuntime);
    }

    // Validates that the DMN XML can compile and contains the required decision.
    // Returns a list of error messages if any issues are found.
    public List<String> validateDmnXml (
        String dmnXml, Map<String, String> dependenciesMap, String modelId, String requiredBooleanDecisionName
    ) throws Exception {
        DmnCompilationResult compilationResult = compileDmnModel(dmnXml, dependenciesMap, modelId);
        if (!compilationResult.errors.isEmpty()) {
            return compilationResult.errors;
        }

        KieSession kieSession = initializeKieSession(compilationResult.dmnBytes);
        DMNRuntime dmnRuntime = kieSession.getKieRuntime(DMNRuntime.class);

        List<DMNModel> dmnModels = dmnRuntime.getModels();
        if (dmnModels.size() != 1) {
            return List.of("Expected exactly one DMN model, found: " + dmnModels.size());
        }

        DMNModel dmnModel = dmnModels.get(0);
        DecisionNode requiredBooleanDecision = dmnModel.getDecisions().stream()
            .filter(d -> d.getName().equals(requiredBooleanDecisionName))
            .findFirst()
            .orElse(null);
        if (requiredBooleanDecision == null) {
            List<String> decisionNames = dmnModel.getDecisions().stream()
                .map(DecisionNode::getName)
                .toList();
            return List.of(
                "Required Decision '" + requiredBooleanDecisionName + "' not found in DMN definition. " +
                "Decisions found: " + decisionNames
            );
        }

        if (requiredBooleanDecision.getResultType().getName() != "boolean") {
            return List.of("The Result DataType of Decision '" + requiredBooleanDecisionName + "' must be of type 'boolean'.");
        }
        return new ArrayList<String>();
    }

    private DmnCompilationResult compileDmnModel(String dmnXml, Map<String, String> dependenciesMap, String modelId) {
        Log.info("Compiling and saving DMN model: " + modelId);

        KieServices kieServices = KieServices.Factory.get();
        // 1. Compile the DMN XML into a KieBase
        KieFileSystem kfs = kieServices.newKieFileSystem();
        // Use a unique ReleaseId for each compilation if you plan to update models
        // For production, consider versioning the ReleaseId carefully.
        ReleaseId releaseId = kieServices.newReleaseId("user-model", modelId, "1.0.0");
        kfs.write("src/main/resources/model.dmn", dmnXml);

        String kmoduleXml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                "<kmodule xmlns=\"http://www.drools.org/xsd/kmodule\">\n" +
                "  <kbase name=\"dmn-kbase\" default=\"true\">\n" +
                "    <ksession name=\"dmn-ksession\" default=\"true\"/>\n" +
                "  </kbase>\n" +
                "</kmodule>";

        kfs.write("src/main/resources/META-INF/kmodule.xml", kmoduleXml);

        // Write all imported DMN models
        for (Map.Entry<String, String> entry : dependenciesMap.entrySet()) {
            // Ensure the path starts with "src/main/resources/" to be picked up by KieBuilder
            String resourcePath = entry.getKey();
            if (!resourcePath.startsWith("src/main/resources/")) {
                resourcePath = "src/main/resources/" + resourcePath + ".dmn";
            }
            kfs.write(resourcePath, entry.getValue());
            Log.info("Added imported DMN model to KieFileSystem: " + resourcePath);
        }

        kfs.generateAndWritePomXML(releaseId);

        KieBuilder kieBuilder = kieServices.newKieBuilder(kfs);
        kieBuilder.buildAll();
        Results results = kieBuilder.getResults();

        if (results.hasMessages(Message.Level.ERROR)) {
            return new DmnCompilationResult(
                null,
                results.getMessages(Message.Level.ERROR).stream().map(Message::getText).toList()
            );
        }

        InternalKieModule kieModule = (InternalKieModule) kieBuilder.getKieModule();
        byte[] kieModuleBytes = kieModule.getBytes();

        Log.info("Serialized kieModule for model " + modelId);
        return new DmnCompilationResult(kieModuleBytes, new ArrayList<String>());
    }

    public EvaluationResult evaluateDmn(
        String dmnFilePath,
        String dmnModelName,
        Map<String, Object> inputs,
        Map<String, Object> parameters
    ) throws Exception {
        Log.info("Evaluating Simple DMN: " + dmnFilePath + " Model: " + dmnModelName);

        Optional<String> dmnXmlOpt = storageService.getStringFromStorage(dmnFilePath);
        if (dmnXmlOpt.isEmpty()) {
            throw new RuntimeException("DMN file not found: " + dmnFilePath);
        }
        String dmnXml = dmnXmlOpt.get();

        HashMap<String, String> dmnDependenciesMap = new HashMap<String, String>();
        DmnModelResult modelResult = compileAndGetDmnModel(dmnXml, dmnDependenciesMap, dmnModelName);
        DMNModel dmnModel = modelResult.model;
        DMNRuntime dmnRuntime = modelResult.runtime;

        Log.info("DMN Model loaded: " + dmnModel.getName() + " Namespace: " + dmnModel.getNamespace());

        DMNContext context = dmnRuntime.newContext();

        for (Map.Entry<String, Object> input : inputs.entrySet()) {
            context.set(input.getKey(), input.getValue());
        }
        context.set("parameters", parameters);
        DMNResult dmnResult = dmnRuntime.evaluateAll(dmnModel, context);

        // Collect and interpret results
        List<DMNDecisionResult> decisionResults = dmnResult.getDecisionResults().stream()
                .filter(result -> result.getDecisionName().equals(dmnModelName)).toList();

        if (decisionResults.isEmpty()) {
            throw new RuntimeException("No decision results from DMN evaluation");
        }
        if (decisionResults.size() > 1) {
            throw new RuntimeException("Multiple decision results from DMN evaluation");
        }

        // Assuming single decision result for a Simple DMN
        DMNDecisionResult decisionResult = decisionResults.get(0);
        Object result = decisionResult.getResult();
        if (result == null) {
            return EvaluationResult.UNABLE_TO_DETERMINE;
        }
        else if (result instanceof Boolean && (Boolean) result) {
            return EvaluationResult.TRUE;
        }
        else if (result instanceof Boolean && !(Boolean) result) {
            return EvaluationResult.FALSE;
        }
        throw new RuntimeException("Unexpected decision result type: " + result.getClass().getName());
    }

    public JsonNode extractInputSchema(
        String dmnXml,
        Map<String, String> dependenciesMap,
        String modelId
    ) throws Exception {
        Log.info("Extracting input schema from DMN model: " + modelId);

        DmnModelResult modelResult = compileAndGetDmnModel(dmnXml, dependenciesMap, modelId);
        DMNModel dmnModel = modelResult.model;
        Set<InputDataNode> inputs = dmnModel.getInputs();

        ObjectMapper mapper = new ObjectMapper();

        // Create custom object for non-parameters inputs
        ObjectNode customObj = mapper.createObjectNode();
        customObj.put("type", "object");

        ArrayList<String> requiredCustomProps = new ArrayList<String>();

        // Fill out custom properties and check if parameters input exists
        ObjectNode customProperties = mapper.createObjectNode();
        boolean hasParametersInput = false;
        for (InputDataNode input : inputs) {
            String inputName = input.getName();
            if ("parameters".equals(inputName)) {
                hasParametersInput = true;
                continue;
            }
            // Add as empty object (no type constraints)
            customProperties.set(inputName, mapper.createObjectNode());
            requiredCustomProps.add(inputName);
        }
        ArrayNode requiredCustomPropsNode = mapper.valueToTree(requiredCustomProps);
        customObj.set("required", requiredCustomPropsNode);
        customObj.set("properties", customProperties);

        ObjectNode properties = mapper.createObjectNode();
        properties.set("custom", customObj);

        ArrayList<String> requiredTopLevelProps = new ArrayList<String>();
        requiredTopLevelProps.add("custom");

        // Only add parameters to schema if it's defined as an input in the DMN
        if (hasParametersInput) {
            ObjectNode parametersObj = mapper.createObjectNode();
            ObjectNode parametersProperties = mapper.createObjectNode();
            parametersObj.put("type", "object");
            parametersObj.set("properties", parametersProperties);
            properties.set("parameters", parametersObj);
            requiredTopLevelProps.add("parameters");
        }

        ObjectNode schema = mapper.createObjectNode();
        ArrayNode requiredTopLevelPropsNode = mapper.valueToTree(requiredTopLevelProps);
        schema.put("type", "object");
        schema.set("properties", properties);
        schema.set("required", requiredTopLevelPropsNode);

        Log.info("Extracted " + inputs.size() + " inputs from DMN model: " + modelId);
        return schema;
    }
}
