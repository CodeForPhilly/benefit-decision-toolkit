package org.acme.model;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Screener {
    private String id;
    private Map<String, Object> formSchema;
    @JsonProperty("isPublished")
    private Boolean isPublished;
    private String organizationName;
    private String screenerName;
    private String publishedDmnNameSpace;
    private String publishedDmnName;
    private List<ResultDetail> resultsSchema;

    public Screener(Map<String, Object> model, boolean isPublished){
        this.formSchema = model;
        this.isPublished = isPublished;
    }

    public Screener(){
        this.formSchema = new HashMap<>();
        this.isPublished = false;
    }

    public void setId(String id){
        this.id = id;
    }

    public String getId(){
        return this.id;
    }

    public String getScreenerName(){
        return this.screenerName;
    }

    public void setScreenerName(String screenerName){
        this.screenerName = screenerName;
    }

    public Map<String, Object> getFormSchema() {
        return formSchema;
    }

    public Boolean isPublished() {
        return isPublished;
    }

    public void setIsPublished(Boolean isPublished){
        this.isPublished = isPublished;
    }

    public void setFormSchema(Map<String, Object> formSchema) {
        this.formSchema = formSchema;
    }

    public String getOrganizationName(){
        return this.organizationName;
    }

    public void setOrganizationName(){
        this.organizationName = organizationName;
    }
    public String getPublishedDmnNameSpace(){
        return this.publishedDmnNameSpace;
    }
    public String getPublishedDmnName(){
        return this.publishedDmnName;
    }
    public void setPublishedDmnName(String name){
        this.publishedDmnName = name;
    }
    public void setPublishedDmnNameSpace(String nameSpace){
        this.publishedDmnNameSpace = nameSpace;
    }

    public List<ResultDetail> getResultsSchema() {
        return resultsSchema;
    }

    public void setResultsSchema(List<ResultDetail> resultsSchema) {
        this.resultsSchema = resultsSchema;
    }
}
