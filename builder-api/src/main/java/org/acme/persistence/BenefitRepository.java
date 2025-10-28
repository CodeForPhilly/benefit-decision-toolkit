package org.acme.persistence;

import org.acme.model.domain.Benefit;
import org.acme.model.domain.Screener;

import java.util.List;
import java.util.Optional;

public interface BenefitRepository {
    List<Benefit> getAllPublicBenefits();

    Optional<Benefit> getBenefit(String benefitId);

    Optional<Benefit> getCustomBenefit(String screenerId, String benefitId);

    String saveNewBenefit(Benefit benefit) throws Exception;

    String saveNewCustomBenefit(String ScreenerId, Benefit benefit) throws Exception;

    void updateCustomBenefit(String ScreenerId, Benefit benefit) throws Exception;

    List<Benefit> getBenefitsInScreener(Screener screener) throws Exception;

    void updateBenefit(Benefit benefit) throws Exception;

    void deleteCustomBenefit(String screenerId, String benefitId) throws Exception;
}
