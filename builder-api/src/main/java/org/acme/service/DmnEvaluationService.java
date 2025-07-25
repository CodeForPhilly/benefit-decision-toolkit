package org.acme.service;
import org.acme.model.domain.Screener;
import java.io.IOException;
import java.util.Map;

public interface DmnEvaluationService {
    public Map<String, Object> evaluateDecision(Screener screener, Map<String, Object> inputs) throws IOException;
    public String compilePublishedDmnModel(String screenerId) throws Exception;
    public void compileWorkingDmnModel(Screener screener) throws Exception;
}
