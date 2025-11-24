package org.acme.model.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class EligibilityCheck {
    private String id;
    private String name;
    private String module;
    private String description;
    private Integer version;
    private boolean isActive;
    private String dmnModel;
    private List<InputDefinition> inputs;
    private JsonNode situation;
    private List<ParameterDefinition> parameters;
    private String ownerId;
    @JsonProperty("isPublic")
    private Boolean isPublic;

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

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public List<InputDefinition> getInputs() {
        return inputs;
    }

    public void setInputs(List<InputDefinition> inputDefinitions) {
        this.inputs = inputDefinitions;
    }

    public List<ParameterDefinition> getParameters() {
        return parameters;
    }

    public void setParameters(List<ParameterDefinition> parameters) {
        this.parameters = parameters;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(String ownerId) {
        this.ownerId = ownerId;
    }

    public Boolean getPublic() {
        return isPublic;
    }

    public void setPublic(Boolean aPublic) {
        isPublic = aPublic;
    }

    public JsonNode getSituation() {
        return situation;
    }

    public void setSituation(JsonNode situation) {
        this.situation = situation;
    }
}
