package org.acme.service;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.enums.OptionalBoolean;
import org.acme.persistence.StorageService;
import org.kie.api.KieServices;
import org.kie.api.builder.*;
import org.kie.api.io.Resource;
import org.kie.api.runtime.KieContainer;
import org.kie.api.runtime.KieSession;
import org.kie.dmn.api.core.*;
import java.io.*;
import java.util.*;
import org.drools.compiler.kie.builder.impl.InternalKieModule;


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

    private byte[] compileDmnModel(String dmnXml, Map<String, String> dependenciesMap, String modelId) throws IOException {
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
            Log.error("DMN Compilation errors for model " + modelId + ":");
            for (Message message : results.getMessages(Message.Level.ERROR)) {
                Log.error(message.getText());
            }
            throw new IllegalStateException("DMN Model compilation failed for model: " + modelId);
        }

        InternalKieModule kieModule = (InternalKieModule) kieBuilder.getKieModule();
        byte[] kieModuleBytes = kieModule.getBytes();

        Log.info("Serialized kieModule for model " + modelId);
        return kieModuleBytes;
    }

    public OptionalBoolean evaluateDmn(
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
        byte[] serializedModel = compileDmnModel(dmnXml, dmnDependenciesMap, dmnModelName);

        KieSession kieSession = initializeKieSession(serializedModel);
        DMNRuntime dmnRuntime = kieSession.getKieRuntime(DMNRuntime.class);

        List<DMNModel> dmnModels = dmnRuntime.getModels();
        if (dmnModels.size() != 1) {
            throw new RuntimeException("Expected exactly one DMN model, found: " + dmnModels.size());
        }

        Log.info("DMN Model loaded: " + dmnModels.get(0).getName() + " Namespace: " + dmnModels.get(0).getNamespace());

        // Prepare model and context using inputs
        DMNModel dmnModel = dmnModels.get(0);
        DMNContext context = dmnRuntime.newContext();
        context.set("inputs", inputs);
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
            return OptionalBoolean.UNABLE_TO_DETERMINE;
        }
        else if (result instanceof Boolean && (Boolean) result) {
            return OptionalBoolean.TRUE;
        }
        else if (result instanceof Boolean && !(Boolean) result) {
            return OptionalBoolean.FALSE;
        }
        throw new RuntimeException("Unexpected decision result type: " + result.getClass().getName());
    }
}
