package org.codeforphilly.bdt.builder.persistence;

import org.codeforphilly.bdt.builder.model.domain.Benefit;
import org.codeforphilly.bdt.builder.model.domain.EligibilityCheck;

import java.util.List;
import java.util.Optional;

public interface EligibilityCheckRepository {

    /* Strict metadata read, including archived drafts and all published versions. */
    List<EligibilityCheck> getCustomChecksForImport(String userId) throws Exception;

    /* Prevents concurrent imports from creating separate families for the same origin. */
    void reserveImportIdentity(String ownerId, String originId, String workingId) throws Exception;

    void releaseImportIdentity(String ownerId, String originId, String workingId) throws Exception;

    List<EligibilityCheck> getWorkingCustomChecks(String userId);

    List<EligibilityCheck> getAllWorkingCustomChecks(String userId);

    List<EligibilityCheck> getPublishedCheckVersions(EligibilityCheck workingCustomCheck) throws Exception;

    List<EligibilityCheck> getLatestVersionPublishedCustomChecks(String userId);

    List<EligibilityCheck> getPublishedCustomChecks(String userId);

    Optional<EligibilityCheck> getWorkingCustomCheck(String userId, String checkId);

    Optional<EligibilityCheck> getWorkingCustomCheck(String userId, String checkId, boolean includeArchived);

    /* The working check document, archived or not, without its DMN model. */
    Optional<EligibilityCheck> getWorkingCustomCheckMetadata(String userId, String checkId);

    Optional<EligibilityCheck> getPublishedCustomCheck(String userId, String checkId);

    Optional<EligibilityCheck> getPublishedCustomCheck(String userId, String checkId, boolean includeArchived);

    String getWorkingId(EligibilityCheck check);

    String newWorkingId();

    /* Claims a check name within the owner's module for checkId, atomically, so two checks cannot
       take the same name at once. Throws DocumentAlreadyExistsException when another check holds it. */
    void reserveCheckName(String ownerId, String module, String name, String checkId) throws Exception;

    /* Gives up checkId's claim on a name; a claim held by another check is left alone. */
    void releaseCheckName(String ownerId, String module, String name, String checkId) throws Exception;

    String saveNewWorkingCustomCheck(EligibilityCheck check) throws Exception;

    String saveNewPublishedCustomCheck(EligibilityCheck check) throws Exception;

    void updateWorkingCustomCheck(EligibilityCheck check) throws Exception;

    void deleteWorkingCustomCheck(String checkId) throws Exception;

    void deletePublishedCustomCheck(String checkId) throws Exception;

    void updatePublishedCustomCheck(EligibilityCheck check) throws Exception;

    /* The published document id a check would get at the given version. */
    String getPublishedId(EligibilityCheck check, String version);
}
