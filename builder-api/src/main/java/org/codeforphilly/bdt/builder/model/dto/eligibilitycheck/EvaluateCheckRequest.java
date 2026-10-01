package org.codeforphilly.bdt.builder.model.dto.eligibilitycheck;

import java.util.Map;

import org.codeforphilly.bdt.builder.model.domain.CheckConfig;

public class EvaluateCheckRequest {
    public CheckConfig checkConfig;
    public Map<String, Object> inputData;
}
