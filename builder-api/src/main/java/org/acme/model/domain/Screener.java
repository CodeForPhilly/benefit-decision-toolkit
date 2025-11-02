package org.acme.model.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Screener {
    private String id;
    private Map<String, Object> formSchema;
    @JsonProperty("isPublished")
    private Boolean isPublished;
    private String ownerId;
    private String screenerName;
    private String lastPublishDate;
    private String organizationName;
    private List<ResultDetail> resultsSchema;
    private List<BenefitDetail> benefits;

    public Screener(Map<String, Object> model, boolean isPublished){
        this.formSchema = model;
        this.isPublished = isPublished;
    }

    public Screener(){
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

    public void setOwnerId(String ownerId){
        this.ownerId = ownerId;
    }

    public String getOwnerId(){
        return this.ownerId;
    }

    public void setScreenerName(String screenerName){
        this.screenerName = screenerName;
    }

    public String getScreenerName(){
        return this.screenerName;
    }

    public void setLastPublishDate(String lastPublishDate){
        this.lastPublishDate = lastPublishDate;
    }

    public void setId(String id){
        this.id = id;
    }

    public String getId(){
        return this.id;
    }

    public String getOrganizationName(){
        return this.organizationName;
    }

    public void setOrganizationName(String organizationName){
        this.organizationName = organizationName;
    }

    public void setLastPublishedDate(String lastPublishDate){
        this.lastPublishDate = lastPublishDate;
    }

    public String getLastPublishDate(){
        return this.lastPublishDate;
    }

    public List<ResultDetail> getResultsSchema() {
        return resultsSchema;
    }

    public void setResultsSchema(List<ResultDetail> resultsSchema) {
        this.resultsSchema = resultsSchema;
    }

    public List<BenefitDetail> getBenefits() {
        return benefits;
    }

    public void setBenefits(List<BenefitDetail> benefits) {
        this.benefits = benefits;
    }
}
