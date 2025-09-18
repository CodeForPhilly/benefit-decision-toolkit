package org.acme.persistence;

import org.acme.model.domain.Benefit;

import java.util.List;

public interface BenefitRepository {
    List<Benefit> getAllBenefits();

}
