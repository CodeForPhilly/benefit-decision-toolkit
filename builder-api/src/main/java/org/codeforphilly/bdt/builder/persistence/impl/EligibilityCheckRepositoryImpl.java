package org.codeforphilly.bdt.builder.persistence.impl;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import org.codeforphilly.bdt.builder.constants.CheckStatus;
import org.codeforphilly.bdt.builder.constants.CollectionNames;
import org.codeforphilly.bdt.builder.constants.FieldNames;
import org.codeforphilly.bdt.builder.model.domain.Benefit;
import org.codeforphilly.bdt.builder.model.domain.CheckVersion;
import org.codeforphilly.bdt.builder.model.domain.EligibilityCheck;
import org.codeforphilly.bdt.builder.persistence.EligibilityCheckRepository;
import org.codeforphilly.bdt.builder.persistence.FirestoreUtils;
import org.codeforphilly.bdt.builder.persistence.StorageService;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@ApplicationScoped
public class EligibilityCheckRepositoryImpl implements EligibilityCheckRepository {

    private static final long ABANDONED_RESERVATION_MILLIS = 5 * 60 * 1000;

    @Inject
    private StorageService storageService;

    @Override
    public List<EligibilityCheck> getCustomChecksForImport(String userId) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        List<EligibilityCheck> all = new ArrayList<>();
        for (String collection : List.of(CollectionNames.WORKING_CUSTOM_CHECK_COLLECTION,
                CollectionNames.PUBLISHED_CUSTOM_CHECK_COLLECTION)) {
            for (Map<String, Object> data : FirestoreUtils.getFirestoreDocsByFields(collection,
                    Map.of(FieldNames.OWNER_ID, userId))) {
                all.add(mapper.convertValue(data, EligibilityCheck.class));
            }
        }
        return all;
    }

    @Override
    public void reserveImportIdentity(String ownerId, String originId, String workingId) throws Exception {
        long now = System.currentTimeMillis();
        FirestoreUtils.createDocumentUnlessHeld(CollectionNames.CUSTOM_CHECK_ORIGIN_COLLECTION,
                importIdentityId(ownerId, originId),
                Map.of("ownerId", ownerId, "originCheckId", originId, "checkId", workingId, "reservedAt", now),
                (existing, reader) -> existing.get("reservedAt") instanceof Number reservedAt
                        && now - reservedAt.longValue() >= ABANDONED_RESERVATION_MILLIS
                        && existing.get("checkId") instanceof String holder
                        && reader.get(CollectionNames.WORKING_CUSTOM_CHECK_COLLECTION, holder).isEmpty());
    }

    @Override
    public void releaseImportIdentity(String ownerId, String originId, String workingId) throws Exception {
        String id = importIdentityId(ownerId, originId);
        var reservation = FirestoreUtils.getFirestoreDocById(CollectionNames.CUSTOM_CHECK_ORIGIN_COLLECTION, id);
        if (reservation.isPresent() && workingId.equals(reservation.get().get("checkId")))
            FirestoreUtils.deleteDocument(CollectionNames.CUSTOM_CHECK_ORIGIN_COLLECTION, id);
    }

    private String importIdentityId(String ownerId, String originId) {
        return URLEncoder.encode(ownerId, StandardCharsets.UTF_8) + ":"
                + URLEncoder.encode(originId, StandardCharsets.UTF_8);
    }

    public List<EligibilityCheck> getWorkingCustomChecks(String userId){
        return getAllWorkingCustomChecks(userId).stream()
                .filter(check -> !check.getIsArchived())
                .toList();
    }

    public List<EligibilityCheck> getAllWorkingCustomChecks(String userId){
        List<Map<String, Object>> checkMaps = FirestoreUtils.getFirestoreDocsByField(CollectionNames.WORKING_CUSTOM_CHECK_COLLECTION, FieldNames.OWNER_ID, userId);
        ObjectMapper mapper = new ObjectMapper();
        return checkMaps.stream()
                .map(checkMap -> mapper.convertValue(checkMap, EligibilityCheck.class))
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
                (check1, check2) -> CheckVersion.compare(check1.getVersion(), check2.getVersion()) > 0 ? check1 : check2
            ));
        return new ArrayList<>(latestVersionMap.values());
    }

    public List<EligibilityCheck> getPublishedCheckVersions(EligibilityCheck workingCustomCheck) throws Exception {
        String prefix = getPublishedPrefix(workingCustomCheck);
        return getPublishedCustomChecks(workingCustomCheck.getOwnerId()).stream()
                .filter(check -> prefix.equals(getPublishedPrefix(check)))
                .toList();
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

    public Optional<EligibilityCheck> getWorkingCustomCheckMetadata(String userId, String checkId){
        return getCustomCheck(userId, checkId, false, false);
    }

    public Optional<EligibilityCheck> getPublishedCustomCheck(String userId, String checkId){
        return getPublishedCustomCheck(userId, checkId, false);
    }

    public Optional<EligibilityCheck> getPublishedCustomCheck(String userId, String checkId, boolean includeArchived){
        Optional<EligibilityCheck> publishedCheckOpt = getCustomCheck(userId, checkId, true);
        if (publishedCheckOpt.isEmpty()) {
            return Optional.empty();
        }

        // Check if the corresponding working check is archived
        EligibilityCheck publishedCheck = publishedCheckOpt.get();
        String workingCheckId = getWorkingId(publishedCheck);
        Optional<EligibilityCheck> workingCheckOpt = getWorkingCustomCheck(userId, workingCheckId, true);

        // If working check exists and is archived, return empty
        if (!includeArchived && workingCheckOpt.isPresent() && workingCheckOpt.get().getIsArchived()) {
            return Optional.empty();
        }

        return publishedCheckOpt;
    }

    private Optional<EligibilityCheck> getCustomCheck(String userId, String checkId, boolean isPublished){
        return getCustomCheck(userId, checkId, isPublished, true);
    }

    private Optional<EligibilityCheck> getCustomCheck(String userId, String checkId, boolean isPublished,
                                                      boolean includeDmnModel){
        String collectionName = isPublished ? CollectionNames.PUBLISHED_CUSTOM_CHECK_COLLECTION : CollectionNames.WORKING_CUSTOM_CHECK_COLLECTION;

        Optional<Map<String, Object>> checkMap = FirestoreUtils.getFirestoreDocById(collectionName, checkId);
        if (checkMap.isEmpty()){
            return Optional.empty();
        }
        Map<String, Object> data = checkMap.get();

        ObjectMapper mapper = new ObjectMapper();
        EligibilityCheck check = mapper.convertValue(data, EligibilityCheck.class);

        if (includeDmnModel) {
            String dmnPath = storageService.getCheckDmnModelPath(checkId);
            Optional<String> dmnModel = storageService.getStringFromStorage(dmnPath);
            dmnModel.ifPresent(check::setDmnModel);
        }

        return Optional.of(check);
    }

    public String saveNewWorkingCustomCheck(EligibilityCheck check) throws Exception{
        // A check's id never changes, so it cannot be derived from the name, which can be renamed.
        if (check.getId() == null) {
            check.setId(newWorkingId());
        }
        String checkId = check.getId();
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(check, Map.class);
        return FirestoreUtils.persistDocumentWithId(CollectionNames.WORKING_CUSTOM_CHECK_COLLECTION, checkId, data);
    }

    public void updateWorkingCustomCheck(EligibilityCheck check) throws Exception {
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(check, Map.class);
        FirestoreUtils.updateDocument(CollectionNames.WORKING_CUSTOM_CHECK_COLLECTION, data, check.getId());
    }

    public void deleteWorkingCustomCheck(String checkId) throws Exception {
        FirestoreUtils.deleteDocument(CollectionNames.WORKING_CUSTOM_CHECK_COLLECTION, checkId);
    }

    @Override
    public void deletePublishedCustomCheck(String checkId) throws Exception {
        FirestoreUtils.deleteDocument(CollectionNames.PUBLISHED_CUSTOM_CHECK_COLLECTION, checkId);
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

    @Override
    public String getWorkingId(EligibilityCheck check) {
        if (check.getId() != null && check.getId().startsWith("W-")) {
            return check.getId();
        }
        if (check.getId() != null && check.getId().startsWith("P-")
                && check.getVersion() != null && check.getId().endsWith("-" + check.getVersion())) {
            return "W-" + check.getId().substring(2, check.getId().length() - check.getVersion().length() - 1);
        }
        throw new IllegalArgumentException("Check " + check.getId() + " has no working id");
    }

    @Override
    public void reserveCheckName(String ownerId, String module, String name, String checkId) throws Exception {
        long now = System.currentTimeMillis();
        Map<String, Object> reservation = new HashMap<>();
        reservation.put(FieldNames.OWNER_ID, ownerId);
        reservation.put("module", module);
        reservation.put("name", name);
        reservation.put("checkId", checkId);
        reservation.put("reservedAt", now);
        FirestoreUtils.createDocumentUnlessHeld(CollectionNames.CUSTOM_CHECK_NAME_COLLECTION,
                getCheckNameReservationId(ownerId, module, name), reservation,
                (existing, reader) -> isAbandonedReservation(existing, reader, now));
    }

    /* A reservation outlives its check when a request fails between reserving the name and saving
       the check. Once it is old enough that no request can still be finishing with it, it counts
       only if its check still has the name. */
    private boolean isAbandonedReservation(Map<String, Object> reservation,
                                           FirestoreUtils.TransactionReader reader, long now) throws Exception {
        if (!(reservation.get("reservedAt") instanceof Number reservedAt)
                || now - reservedAt.longValue() < ABANDONED_RESERVATION_MILLIS) {
            return false;
        }
        if (!(reservation.get("checkId") instanceof String holderId)) {
            return true;
        }
        Optional<Map<String, Object>> holder = reader.get(CollectionNames.WORKING_CUSTOM_CHECK_COLLECTION, holderId);
        return holder.isEmpty()
                || !Objects.equals(holder.get().get("module"), reservation.get("module"))
                || !Objects.equals(holder.get().get("name"), reservation.get("name"));
    }

    @Override
    public void releaseCheckName(String ownerId, String module, String name, String checkId) throws Exception {
        String reservationId = getCheckNameReservationId(ownerId, module, name);
        Optional<Map<String, Object>> reservation = FirestoreUtils.getFirestoreDocById(
                CollectionNames.CUSTOM_CHECK_NAME_COLLECTION, reservationId);
        if (reservation.isPresent() && checkId.equals(reservation.get().get("checkId"))) {
            FirestoreUtils.deleteDocument(CollectionNames.CUSTOM_CHECK_NAME_COLLECTION, reservationId);
        }
    }

    /* Encoding keeps ':' out of the parts, so it can separate them, and '/' out of the id. */
    public String getCheckNameReservationId(String ownerId, String module, String name) {
        return Stream.of(ownerId, module == null ? "" : module, name)
                .map(part -> URLEncoder.encode(part, StandardCharsets.UTF_8))
                .collect(Collectors.joining(":"));
    }

    @Override
    public String newWorkingId() {
        return CheckStatus.WORKING.getCode() + "-" + UUID.randomUUID();
    }

    public String getPublishedPrefix(EligibilityCheck check) {
        return "P-" + getWorkingId(check).substring(2);
    }

    public String getPublishedId(EligibilityCheck check) {
        return getPublishedId(check, check.getVersion());
    }

    public String getPublishedId(EligibilityCheck check, String version) {
        return getPublishedPrefix(check) + "-" + version;
    }
}
