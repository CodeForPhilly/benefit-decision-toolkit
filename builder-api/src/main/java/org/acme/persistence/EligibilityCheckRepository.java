package org.acme.persistence;

import org.acme.model.domain.Benefit;
import org.acme.model.domain.EligibilityCheck;

import java.util.List;
import java.util.Optional;

public interface EligibilityCheckRepository {

    List<EligibilityCheck> getWorkingCustomChecks(String userId);

    List<EligibilityCheck> getPublishedCheckVersions(EligibilityCheck workingCustomCheck);

    List<EligibilityCheck> getLatestVersionPublishedCustomChecks(String userId);

    List<EligibilityCheck> getPublishedCustomChecks(String userId);

    Optional<EligibilityCheck> getWorkingCustomCheck(String userId, String checkId);

    Optional<EligibilityCheck> getWorkingCustomCheck(String userId, String checkId, boolean includeArchived);

    Optional<EligibilityCheck> getPublishedCustomCheck(String userId, String checkId);

    String saveNewWorkingCustomCheck(EligibilityCheck check) throws Exception;

    String saveNewPublishedCustomCheck(EligibilityCheck check) throws Exception;

    void updateWorkingCustomCheck(EligibilityCheck check) throws Exception;

    void updatePublishedCustomCheck(EligibilityCheck check) throws Exception;
}
