package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.NotFoundException;
import org.acme.model.Screener;
import org.acme.repository.utils.StorageUtils;
import org.kie.api.KieServices;
import org.kie.api.builder.KieModule;
import org.kie.api.builder.ReleaseId;
import org.kie.api.io.Resource;
import org.kie.api.runtime.KieContainer;
import org.kie.api.runtime.KieSession;
import org.kie.dmn.api.core.*;
import java.io.*;
import java.util.*;

@ApplicationScoped
public class KieDmnService implements DmnService {
    public Map<String, Object> evaluateDecision(Screener screener, Map<String, Object> inputs) throws IOException {

        String filePath = StorageUtils.getPublishedCompiledDmnModelPath(screener.getId());
        Optional<byte[]> dmnDataOpt = StorageUtils.getFileBytesFromStorage(filePath);


        if (dmnDataOpt.isEmpty()){
            throw new NotFoundException();
        }

        byte[] dmnModuleData = dmnDataOpt.get();

        KieSession kieSession = initializeKieSession(dmnModuleData);
        DMNRuntime dmnRuntime = kieSession.getKieRuntime(DMNRuntime.class);

        try {
            DMNModel dmnModel = dmnRuntime.getModel(screener.getPublishedDmnNameSpace(), screener.getPublishedDmnName());

            DMNContext context = dmnRuntime.newContext();
            for (String key : inputs.keySet()) {
                context.set(key, inputs.get(key));
            }

            DMNResult dmnResult = dmnRuntime.evaluateAll(dmnModel, context);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("inputs", inputs);


            List<Map<String, Object>> decisions = new ArrayList<>();
            for (DMNDecisionResult decisionResult :  dmnResult.getDecisionResults()) {
                Map<String, Object> decisionDetail = new LinkedHashMap<>();
                decisionDetail.put("decisionName", decisionResult.getDecisionName());
                decisionDetail.put("result", decisionResult.getResult());
                decisionDetail.put("status", decisionResult.getEvaluationStatus().toString());
                decisions.add(decisionDetail);
            }

            response.put("decisions", decisions);

            kieSession.dispose();
            return response;
        }
        catch (Exception e){
            return new HashMap<>();
        } finally{
            if (kieSession != null) {
                kieSession.dispose();
            }
        }
    }

    private KieSession initializeKieSession(byte[] moduleBytes) throws IOException {
        KieServices kieServices = KieServices.Factory.get();
        Resource jarResource = kieServices.getResources().newByteArrayResource(moduleBytes);
        KieModule kieModule = kieServices.getRepository().addKieModule(jarResource);

        ReleaseId releaseId = kieModule.getReleaseId();
        KieContainer kieContainer = kieServices.newKieContainer(releaseId);
        return kieContainer.newKieSession();
    }
}
