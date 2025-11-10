package org.acme.persistence;

import org.acme.model.domain.Benefit;
import org.acme.model.domain.EligibilityCheck;

import java.util.List;
import java.util.Optional;

public interface EligibilityCheckRepository {

    List<EligibilityCheck> getAllPublicChecks();

    Optional<EligibilityCheck> getCheck(String checkId);

    List<EligibilityCheck> getChecksInBenefit(Benefit benefit);

    List<EligibilityCheck> getCustomChecks(String userId);

    Optional<EligibilityCheck> getCustomCheck(String userId, String checkId);

    String saveNewCheck(EligibilityCheck check) throws Exception;

    String saveNewCustomCheck(EligibilityCheck check) throws Exception;

    void updateCheck(EligibilityCheck check) throws Exception;

    void updateCustomCheck(EligibilityCheck check) throws Exception;
}
