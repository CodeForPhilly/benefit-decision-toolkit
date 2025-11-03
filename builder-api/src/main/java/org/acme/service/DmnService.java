package org.acme.service;
import org.acme.enums.OptionalBoolean;

import java.util.Map;

public interface DmnService {
    public OptionalBoolean evaluateSimpleDmn(
        String dmnFilePath,
        String dmnModelName,
        Map<String, Object> inputs,
        Map<String, Object> parameters
    ) throws Exception;
}
