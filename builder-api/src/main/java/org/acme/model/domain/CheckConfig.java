package org.acme.model.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CheckConfig {
    private String checkId;
    private String checkName;
    private String checkVersion;
    private String checkModule;
    private Map<String, Object> parameters;
    // evaluation endpoint url for library checks
    private String evaluationUrl;
    private JsonNode inputDefinition;
    private List<ParameterDefinition> parameterDefinitions;

    public String getCheckId() {
        return checkId;
    }

    public void setCheckId(String checkId) {
        this.checkId = checkId;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, Object> parameters) {
        this.parameters = parameters;
    }

    public String getCheckName() {
        return checkName;
    }

    public void setCheckName(String checkName) {
        this.checkName = checkName;
    }

    public String getEvaluationUrl() {
        return evaluationUrl;
    }

    public void setEvaluationUrl(String libraryCheckEvaluationUrl) {
        this.evaluationUrl = libraryCheckEvaluationUrl;
    }

    public JsonNode getInputDefinition() {
        return inputDefinition;
    }

    public void setInputDefinition(JsonNode inputDefinition) {
        this.inputDefinition = inputDefinition;
    }

    public List<ParameterDefinition> getParameterDefinitions() {
        return parameterDefinitions;
    }

    public void setParameterDefinitions(List<ParameterDefinition> parameterDefinitions) {
        this.parameterDefinitions = parameterDefinitions;
    }

    public String getCheckVersion() {
        return checkVersion;
    }

    public void setCheckVersion(String checkVersion) {
        this.checkVersion = checkVersion;
    }

    public String getCheckModule() {
        return checkModule;
    }

    public void setCheckModule(String checkModule) {
        this.checkModule = checkModule;
    }
}
