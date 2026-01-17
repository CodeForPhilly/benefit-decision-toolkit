package org.acme.persistence.impl;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;

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

    public List<EligibilityCheck> getWorkingCustomChecks(String userId){
        List<Map<String, Object>> checkMaps = FirestoreUtils.getFirestoreDocsByField(CollectionNames.WORKING_CUSTOM_CHECK_COLLECTION, FieldNames.OWNER_ID, userId);
        ObjectMapper mapper = new ObjectMapper();
        return checkMaps.stream()
                .map(checkMap -> mapper.convertValue(checkMap, EligibilityCheck.class))
                .filter(check -> !check.getIsArchived())
                .toList();
    }

    public List<EligibilityCheck> getPublishedCustomChecks(String userId){
        List<Map<String, Object>> checkMaps = FirestoreUtils.getFirestoreDocsByField(CollectionNames.PUBLISHED_CUSTOM_CHECK_COLLECTION, FieldNames.OWNER_ID, userId);
        ObjectMapper mapper = new ObjectMapper();
        return checkMaps.stream().map(checkMap -> mapper.convertValue(checkMap, EligibilityCheck.class)).toList();
    }

    public List<EligibilityCheck> getLatestVersionPublishedCustomChecks(String userId) {
        List<EligibilityCheck> publishedChecks = getPublishedCustomChecks(userId);

        // Get all working checks to determine which are archived
        List<EligibilityCheck> workingChecks = getWorkingCustomChecks(userId);
        java.util.Set<String> nonArchivedPrefixes = workingChecks.stream()
                .map(this::getPublishedPrefix)
                .collect(java.util.stream.Collectors.toSet());

        Map<String, EligibilityCheck> latestVersionMap = publishedChecks.stream()
            .filter(check -> nonArchivedPrefixes.contains(getPublishedPrefix(check)))
            .collect(java.util.stream.Collectors.toMap(
                check -> getPublishedPrefix(check),
                check -> check,
                (check1, check2) -> compareVersions(check1.getVersion(), check2.getVersion()) > 0 ? check1 : check2
            ));
        return new ArrayList<>(latestVersionMap.values());
    }

    private  static int compareVersions(String v1, String v2) {
        int[] a = normalize(v1);
        int[] b = normalize(v2);

        for (int i = 0; i < 3; i++) {
            if (a[i] != b[i]) {
                return a[i] - b[i];
            }
        }
        return 0;
    }

    private static int[] normalize(String version) {
        String[] parts = version.split("\\.");
        int[] nums = new int[] {0, 0, 0};

        for (int i = 0; i < parts.length && i < 3; i++) {
            nums[i] = Integer.parseInt(parts[i]);
        }
        return nums;
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
        return getWorkingCustomCheck(userId, checkId, false);
    }

    public Optional<EligibilityCheck> getWorkingCustomCheck(String userId, String checkId, boolean includeArchived){
        Optional<EligibilityCheck> checkOpt = getCustomCheck(userId, checkId, false);
        if (checkOpt.isEmpty()) {
            return Optional.empty();
        }
        EligibilityCheck check = checkOpt.get();
        if (!includeArchived && check.getIsArchived()) {
            return Optional.empty();
        }
        return checkOpt;
    }

    public Optional<EligibilityCheck> getPublishedCustomCheck(String userId, String checkId){
        Optional<EligibilityCheck> publishedCheckOpt = getCustomCheck(userId, checkId, true);
        if (publishedCheckOpt.isEmpty()) {
            return Optional.empty();
        }

        // Check if the corresponding working check is archived
        EligibilityCheck publishedCheck = publishedCheckOpt.get();
        String workingCheckId = getWorkingId(publishedCheck);
        Optional<EligibilityCheck> workingCheckOpt = getWorkingCustomCheck(userId, workingCheckId, true);

        // If working check exists and is archived, return empty
        if (workingCheckOpt.isPresent() && workingCheckOpt.get().getIsArchived()) {
            return Optional.empty();
        }

        return publishedCheckOpt;
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
