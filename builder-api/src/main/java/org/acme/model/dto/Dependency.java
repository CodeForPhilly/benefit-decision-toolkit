package org.acme.model.dto;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Dependency {

    @JsonProperty("group_id")
    public String groupId;
    @JsonProperty("artifact_id")
    public String artifactId;
    @JsonProperty("version")
    public String version;
    @JsonProperty("xml")
    public String xml;
}
