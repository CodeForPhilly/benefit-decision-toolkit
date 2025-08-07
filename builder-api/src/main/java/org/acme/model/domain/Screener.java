package org.acme.model.domain;
import org.acme.model.dto.Dependency;

import java.util.List;
import java.util.Map;

public class Screener {
    private String id;
    private Map<String, Object> formSchema;
    private String dmnModel;
    private Boolean isPublished;
    private String ownerId;
    private String screenerName;
    private String lastPublishDate;
    private String organizationName;
    private String publishedDmnNameSpace;
    private String workingDmnNameSpace;
    private String publishedDmnName;
    private String workingDmnName;
    private String lastDmnSave;
    private String lastDmnCompile;
    private List<Dependency> dependencies;

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

    public void setDmnModel(String dmnModel){
        this.dmnModel = dmnModel;
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

    public String getDmnModel(){
        return this.dmnModel;
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

    public String getLastDmnSave() {
        return lastDmnSave;
    }

    public void setLastDmnSave(String lastDmnSave) {
        this.lastDmnSave = lastDmnSave;
    }

    public String getLastDmnCompile() {
        return lastDmnCompile;
    }

    public void setLastDmnCompile(String lastDmnCompile) {
        this.lastDmnCompile = lastDmnCompile;
    }

    public String getWorkingDmnNameSpace() {
        return workingDmnNameSpace;
    }

    public void setWorkingDmnNameSpace(String workingDmnNameSpace) {
        this.workingDmnNameSpace = workingDmnNameSpace;
    }

    public String getWorkingDmnName() {
        return workingDmnName;
    }

    public void setWorkingDmnName(String workingDmnName) {
        this.workingDmnName = workingDmnName;
    }

    public List<Dependency> getDependencies() {
        return dependencies;
    }

    public void setDependencies(List<Dependency> dependencies) {
        this.dependencies = dependencies;
    }
}
