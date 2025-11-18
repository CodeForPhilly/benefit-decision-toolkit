package org.acme.persistence.impl;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import org.acme.constants.CheckStatus;
import org.acme.constants.CollectionNames;
import org.acme.constants.FieldNames;
import org.acme.model.domain.Benefit;
import org.acme.model.domain.EligibilityCheck;
import org.acme.persistence.EligibilityCheckRepository;
import org.acme.persistence.FirestoreUtils;
import org.acme.persistence.StorageService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class EligibilityCheckRepositoryImpl implements EligibilityCheckRepository {

    @Inject
    private StorageService storageService;

    public List<EligibilityCheck> getPublicChecks(){

        List<Map<String, Object>> checkMaps = FirestoreUtils.getAllDocsInCollection(
                CollectionNames.PUBLIC_CHECK_COLLECTION);

        ObjectMapper mapper = new ObjectMapper();
        List<EligibilityCheck> checks = checkMaps.stream().map( checkMap ->  mapper.convertValue(checkMap, EligibilityCheck.class)).toList();

        return checks;    }

    public Optional<EligibilityCheck> getPublicCheck(String checkId){
        Optional<Map<String, Object>> dataOpt = FirestoreUtils.getFirestoreDocById(CollectionNames.PUBLIC_CHECK_COLLECTION, checkId);
        if (dataOpt.isEmpty()){
            return Optional.empty();
        }
        Map<String, Object> data = dataOpt.get();

        ObjectMapper mapper = new ObjectMapper();
        EligibilityCheck check = mapper.convertValue(data, EligibilityCheck.class);
        return Optional.of(check);
    }

    public List<EligibilityCheck> getChecksInBenefit(Benefit benefit){
        List<String> checkIds = benefit.getChecks().stream().map(checkConfig -> checkConfig.getCheckId()).toList();
        List<Map<String, Object>> customCheckMaps = FirestoreUtils.getFirestoreDocsByIds(
                CollectionNames.WORKING_CUSTOM_CHECK_COLLECTION, checkIds);

        // TODO: Replace with PUBLISHED_CUSTOM_CHECK_COLLECTION after implementing published checks
        // List<Map<String, Object>> customCheckMaps = FirestoreUtils.getFirestoreDocsByIds(
        //         CollectionNames.PUBLISHED_CUSTOM_CHECK_COLLECTION, checkIds);

        List<Map<String, Object>> publicCheckMaps = FirestoreUtils.getFirestoreDocsByIds(
                CollectionNames.PUBLIC_CHECK_COLLECTION, checkIds);

        List<Map<String, Object>> checkMaps = new ArrayList<>();
        checkMaps.addAll(customCheckMaps);
        checkMaps.addAll(publicCheckMaps);

        ObjectMapper mapper = new ObjectMapper();
        return checkMaps.stream().map(checkMap -> mapper.convertValue(checkMap, EligibilityCheck.class)).toList();
    }

    public List<EligibilityCheck> getWorkingCustomChecks(String userId){
        List<Map<String, Object>> checkMaps = FirestoreUtils.getFirestoreDocsByField(CollectionNames.WORKING_CUSTOM_CHECK_COLLECTION, FieldNames.OWNER_ID, userId);
        ObjectMapper mapper = new ObjectMapper();
        return checkMaps.stream().map(checkMap -> mapper.convertValue(checkMap, EligibilityCheck.class)).toList();
    }

    public List<EligibilityCheck> getPublishedCustomChecks(String userId){
        List<Map<String, Object>> checkMaps = FirestoreUtils.getFirestoreDocsByField(CollectionNames.PUBLISHED_CUSTOM_CHECK_COLLECTION, FieldNames.OWNER_ID, userId);
        ObjectMapper mapper = new ObjectMapper();
        return checkMaps.stream().map(checkMap -> mapper.convertValue(checkMap, EligibilityCheck.class)).toList();
    }

    public List<EligibilityCheck> getPublishedCheckVersions(EligibilityCheck workingCustomCheck){
        Map<String, String> fieldValues = Map.of(
            "ownerId", workingCustomCheck.getOwnerId(),
            "module", workingCustomCheck.getModule(),
            "name", workingCustomCheck.getName()
        );

        /* Get all related Published Checks for a Working Check */
        List<Map<String, Object>> checkMaps = (
            FirestoreUtils.getFirestoreDocsByFields(
                CollectionNames.PUBLISHED_CUSTOM_CHECK_COLLECTION,
                fieldValues
            )
        );
        ObjectMapper mapper = new ObjectMapper();
        return checkMaps.stream().map(checkMap -> mapper.convertValue(checkMap, EligibilityCheck.class)).toList();
    }

    public Optional<EligibilityCheck> getWorkingCustomCheck(String userId, String checkId){
        return getCustomCheck(userId, checkId, false);
    }

    public Optional<EligibilityCheck> getPublishedCustomCheck(String userId, String checkId){
        return getCustomCheck(userId, checkId, true);
    }

    private Optional<EligibilityCheck> getCustomCheck(String userId, String checkId, boolean isPublished){
        String collectionName = isPublished ? CollectionNames.PUBLISHED_CUSTOM_CHECK_COLLECTION : CollectionNames.WORKING_CUSTOM_CHECK_COLLECTION;

        Optional<Map<String, Object>> checkMap = FirestoreUtils.getFirestoreDocById(collectionName, checkId);
        if (checkMap.isEmpty()){
            return Optional.empty();
        }
        Map<String, Object> data = checkMap.get();

        ObjectMapper mapper = new ObjectMapper();
        EligibilityCheck check = mapper.convertValue(data, EligibilityCheck.class);

        String dmnPath = storageService.getCheckDmnModelPath(checkId);
        Optional<String> dmnModel = storageService.getStringFromStorage(dmnPath);
        dmnModel.ifPresent(check::setDmnModel);

        return Optional.of(check);
    }

    public String saveNewWorkingCustomCheck(EligibilityCheck check) throws Exception{
        String checkId = getWorkingId(check);
        check.setId(checkId);
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(check, Map.class);
        return FirestoreUtils.persistDocumentWithId(CollectionNames.WORKING_CUSTOM_CHECK_COLLECTION, checkId, data);
    }

    public void updateWorkingCustomCheck(EligibilityCheck check) throws Exception {
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(check, Map.class);
        FirestoreUtils.updateDocument(CollectionNames.WORKING_CUSTOM_CHECK_COLLECTION, data, check.getId());
    }

    public String saveNewPublishedCustomCheck(EligibilityCheck check) throws Exception {
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(check, Map.class);
        data.put("id", getPublishedId(check));
        data.put("datePublished", System.currentTimeMillis());

        String checkDocId = getPublishedId(check);
        return FirestoreUtils.persistDocumentWithId(CollectionNames.PUBLISHED_CUSTOM_CHECK_COLLECTION, checkDocId, data);
    }

    public void updatePublishedCustomCheck(EligibilityCheck check) throws Exception{
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(check, Map.class);
        FirestoreUtils.updateDocument(CollectionNames.PUBLISHED_CUSTOM_CHECK_COLLECTION, data, check.getId());
    }

    public String savePublicCheck(EligibilityCheck check) throws Exception{
        String checkId = getPublishedId(check);
        check.setId(checkId);
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(check, Map.class);
        return FirestoreUtils.persistDocumentWithId(CollectionNames.PUBLIC_CHECK_COLLECTION, checkId , data);
    }

    public String getWorkingId(EligibilityCheck check) {
        return CheckStatus.WORKING.getCode() + "-" + check.getOwnerId() + "-" + check.getModule() + "-" + check.getName();
    }

    public String getPublishedPrefix(EligibilityCheck check) {
        return CheckStatus.PUBLISHED.getCode() + "-" + check.getOwnerId() + "-" + check.getModule() + "-" + check.getName();
    }

    public String getPublishedId(EligibilityCheck check) {
        return getPublishedPrefix(check) + "-" + check.getVersion().toString();
    }
}
