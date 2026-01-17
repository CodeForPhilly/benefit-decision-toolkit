package org.acme.model.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Screener {
    /* Screener metadata */
    private String id;
    private String ownerId;
    private String screenerName;
    private String organizationName;

    /* Screener data */
    private Map<String, Object> formSchema;
    private List<ResultDetail> resultsSchema;
    private List<BenefitDetail> benefits;

    /* Publishing properties */
    private String publishedScreenerId;
    private String lastPublishDate;

    public Screener(Map<String, Object> model) {
        this.formSchema = model;
    }

    public Screener() {
    }

    /* Domain creation for POST */
    public static Screener create(String ownerId, String screenerName, String description) {
        Screener s = new Screener();
        s.ownerId = ownerId;
        s.screenerName = screenerName;

        return s;
    }

    public Map<String, Object> getFormSchema() {
        return formSchema;
    }

    public void setFormSchema(Map<String, Object> formSchema) {
        this.formSchema = formSchema;
    }

    public void setOwnerId(String ownerId) {
        this.ownerId = ownerId;
    }

    public String getOwnerId() {
        return this.ownerId;
    }

    public void setScreenerName(String screenerName) {
        this.screenerName = screenerName;
    }

    public String getScreenerName() {
        return this.screenerName;
    }

    public void setLastPublishDate(String lastPublishDate) {
        this.lastPublishDate = lastPublishDate;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getId() {
        return this.id;
    }

    public String getOrganizationName() {
        return this.organizationName;
    }

    public void setOrganizationName(String organizationName) {
        this.organizationName = organizationName;
    }

    public void setPublishedScreenerId(String publishedScreenerId) {
        this.publishedScreenerId = publishedScreenerId;
    }

    public String getPublishedScreenerId() {
        return this.publishedScreenerId;
    }

    public void setLastPublishedDate(String lastPublishDate) {
        this.lastPublishDate = lastPublishDate;
    }

    public String getLastPublishDate() {
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
