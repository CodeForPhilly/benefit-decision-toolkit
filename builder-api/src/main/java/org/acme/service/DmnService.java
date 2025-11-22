package org.acme.service;
import org.acme.enums.OptionalBoolean;

import java.util.List;
import java.util.Map;

public interface DmnService {
    public List<String> validateDmnXml(
        String dmnXml,
        Map<String, String> dependenciesMap,
        String modelId,
        String requiredBooleanDecisionName
    ) throws Exception;
    public OptionalBoolean evaluateDmn(
        String dmnFilePath,
        String dmnModelName,
        Map<String, Object> inputs,
        Map<String, Object> parameters
    ) throws Exception;
}
