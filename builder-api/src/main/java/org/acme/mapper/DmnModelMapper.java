package org.acme.mapper;

import org.acme.constants.FieldNames;
import org.acme.model.domain.DmnModel;
import org.acme.model.dto.DmnModelSummary;

import java.util.HashMap;
import java.util.Map;

public class DmnModelMapper {

    public static DmnModel fromMap(Map<String, Object> map) {
        DmnModel dmnModel = new DmnModel();

        if (doesAttributeExistOfType(map, FieldNames.ID, String.class)) {
            dmnModel.setId((String) map.get(FieldNames.ID));
        }
        if (doesAttributeExistOfType(map, FieldNames.GROUP_ID, String.class)) {
            dmnModel.setGroupId((String) map.get(FieldNames.GROUP_ID));
        }
        if (doesAttributeExistOfType(map, FieldNames.ARTIFACT_ID, String.class)) {
            dmnModel.setArtifactId((String) map.get(FieldNames.ARTIFACT_ID));
        }
        if (doesAttributeExistOfType(map, FieldNames.VERSION, String.class)){
            dmnModel.setVersion((String) map.get(FieldNames.VERSION));
        }
        if (doesAttributeExistOfType(map, FieldNames.IMPORT_TYPE, String.class)){
            dmnModel.setImportType((String) map.get(FieldNames.IMPORT_TYPE));
        }
        if (doesAttributeExistOfType(map, FieldNames.NAMESPACE, String.class)){
            dmnModel.setNamespace((String) map.get(FieldNames.NAMESPACE));
        }
        if (doesAttributeExistOfType(map, FieldNames.STORAGE_LOCATION, String.class)) {
            dmnModel.setStorageLocation((String) map.get(FieldNames.STORAGE_LOCATION));
        }
        if (doesAttributeExistOfType(map, FieldNames.MODEL_DESCRIPTION, String.class)) {
            dmnModel.setDescription((String) map.get(FieldNames.MODEL_DESCRIPTION));
        }
        if (doesAttributeExistOfType(map, FieldNames.MODEL_SHORT_DESCRIPTION, String.class)) {
            dmnModel.setShortDescription((String) map.get(FieldNames.MODEL_SHORT_DESCRIPTION));
        }
        if (doesAttributeExistOfType(map, FieldNames.MODEL_NAME, String.class)) {
            dmnModel.setName((String) map.get(FieldNames.MODEL_NAME));
        }
        return dmnModel;
    }

    public static Map<String, Object> fromDmnModel(DmnModel model) {
        Map<String, Object> data = new HashMap<>();
        if (model.getGroupId() != null) {
            data.put(FieldNames.GROUP_ID, model.getGroupId());
        }
        if (model.getArtifactId() != null) {
            data.put(FieldNames.ARTIFACT_ID, model.getArtifactId());
        }
        if (model.getVersion() != null) {
            data.put(FieldNames.VERSION, model.getVersion());
        }
        return data;
    }

    public static DmnModelSummary summaryFromDmnModel(DmnModel model) {
        DmnModelSummary summary = new DmnModelSummary();
        if (model.getGroupId() != null) {
            summary.groupId = model.getGroupId();
        }
        if (model.getArtifactId() != null) {
            summary.artifactId = model.getArtifactId();
        }
        if (model.getVersion() != null) {
            summary.version = model.getVersion();
        }
        if (model.getName() != null) {
            summary.name = model.getName();
        }
        if (model.getDescription() != null) {
            summary.description = model.getDescription();
        }
        if (model.getShortDescription() != null) {
            summary.shortDescription = model.getShortDescription();
        }
        return summary;
    }

    private static boolean doesAttributeExistOfType(Map<String, Object> map, String attributeName, Class<?> expectedType) {
        return map.containsKey(attributeName) && expectedType.isInstance(map.get(attributeName));
    }
}
