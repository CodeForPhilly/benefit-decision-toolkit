package org.acme.model.dto.EligibilityCheck;

import java.util.Map;

import org.acme.model.domain.CheckConfig;

public class EvaluateCheckRequest {
    public CheckConfig checkConfig;
    public Map<String, Object> inputData;
}
