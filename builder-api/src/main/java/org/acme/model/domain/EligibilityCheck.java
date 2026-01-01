package org.acme.model.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class EligibilityCheck {
    private String id;
    private String name;
    private String module;
    private String description;
    private String version;
    private String dmnModel;
    private JsonNode inputDefinition;
    private List<ParameterDefinition> parameterDefinitions;
    private String ownerId;
    // API endpoint for evaluating library checks
    private String evaluationUrl;
    private Boolean isArchived;

    public String getId() {
        return this.id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDmnModel(String dmnModel){
        this.dmnModel = dmnModel;
    }

    public String getDmnModel(){
        return dmnModel;
    }

    public String getModule() {
        return module;
    }

    public void setModule(String module) {
        this.module = module;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public List<ParameterDefinition> getParameterDefinitions() {
        return parameterDefinitions;
    }

    public void setParameterDefinitions(List<ParameterDefinition> parameterDefinitions) {
        this.parameterDefinitions = parameterDefinitions;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(String ownerId) {
        this.ownerId = ownerId;
    }

    public JsonNode getInputDefinition() {
        return inputDefinition;
    }

    public void setInputDefinition(JsonNode inputDefinition) {
        this.inputDefinition = inputDefinition;
    }

    public String getEvaluationUrl() {
        return evaluationUrl;
    }

    public void setEvaluationUrl(String evaluationUrl) {
        this.evaluationUrl = evaluationUrl;
    }

    public Boolean getIsArchived() {
        return isArchived != null ? isArchived : false;
    }

    public void setIsArchived(Boolean isArchived) {
        this.isArchived = isArchived;
    }
}
