package org.acme.service;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotFoundException;
import org.acme.model.ResultDetail;
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
    @Inject
    StorageUtils storageUtils;
    public List<ResultDetail> evaluateDecision(Screener screener, Map<String, Object> inputs) throws IOException {

        String filePath = storageUtils.getPublishedCompiledDmnModelPath(screener.getId());
        Optional<byte[]> dmnDataOpt = storageUtils.getFileBytesFromStorage(filePath);


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
            kieSession.dispose();

            List<ResultDetail> decisions = new ArrayList<>();
            for (DMNDecisionResult decisionResult :  dmnResult.getDecisionResults()) {
                ResultDetail decisionDetail = new ResultDetail();
                decisionDetail.setId(decisionResult.getDecisionName());
                if (decisionResult.getResult() instanceof Boolean){
                    decisionDetail.setResult((Boolean) decisionResult.getResult());
                } else {
                    Log.debug("KieDmnService:evaluateDecision: Expecting boolean as decision result but got a different type");
                }
                decisionDetail.setStatus(decisionResult.getEvaluationStatus().toString());
                decisions.add(decisionDetail);
            }
            return decisions;
        }
        catch (Exception e){
            return Collections.emptyList();
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
