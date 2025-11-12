package org.acme.persistence;

import org.acme.model.domain.Benefit;

import java.util.List;
import java.util.Optional;

public interface BenefitRepository {
    List<Benefit> getAllBenefits();

    Optional<Benefit> getBenefit(String benefitId);
}
