package org.acme.persistence;

import org.acme.model.domain.Benefit;
import org.acme.model.domain.EligibilityCheck;

import java.util.List;
import java.util.Optional;

public interface EligibilityCheckRepository {

    List<EligibilityCheck> getPublicChecks();

    Optional<EligibilityCheck> getPublicCheck(String checkId);

    List<EligibilityCheck> getChecksInBenefit(Benefit benefit);

    List<EligibilityCheck> getWorkingCustomChecks(String userId);

    List<EligibilityCheck> getPublishedCustomChecks(String userId);

    Optional<EligibilityCheck> getWorkingCustomCheck(String userId, String checkId);

    Optional<EligibilityCheck> getPublishedCustomCheck(String userId, String checkId);

    String saveWorkingCustomCheck(EligibilityCheck check) throws Exception;

    String savePublishedCustomCheck(EligibilityCheck check) throws Exception;

    void updateWorkingCustomCheck(EligibilityCheck check) throws Exception;

    void updatePublishedCustomCheck(EligibilityCheck check) throws Exception;

    String savePublicCheck(EligibilityCheck check) throws Exception;
}
