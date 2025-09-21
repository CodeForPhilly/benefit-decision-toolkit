package org.acme.persistence;

import org.acme.model.domain.EligibilityCheck;

import java.util.List;
import java.util.Optional;

public interface EligibilityCheckRepository {

    List<EligibilityCheck> getAllPublicChecks();

    Optional<EligibilityCheck> getCheck(String checkId);
}
