package org.codeforphilly.bdt.builder.persistence;

import org.codeforphilly.bdt.builder.model.domain.Benefit;

import java.util.List;
import java.util.Optional;

public interface BenefitRepository {
    List<Benefit> getAllBenefits();

    Optional<Benefit> getBenefit(String benefitId);
}
