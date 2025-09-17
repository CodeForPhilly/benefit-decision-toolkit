package org.acme.persistence;

import org.acme.model.domain.EligibilityCheck;

import java.util.List;

public interface EligibilityCheckRepository {

    public List<EligibilityCheck> getAllChecks();

}
