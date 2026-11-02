package org.codeforphilly.bdt.builder.persistence;

import org.codeforphilly.bdt.builder.model.domain.Benefit;
import org.codeforphilly.bdt.builder.model.domain.BenefitDetail;
import org.codeforphilly.bdt.builder.model.domain.CheckConfig;
import org.codeforphilly.bdt.builder.model.domain.Screener;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.UnaryOperator;

public interface ScreenerRepository {
    public List<Screener> getWorkingScreeners(String userId);

    public Optional<Screener> getWorkingScreener(String screenerId);

    public Optional<Screener> getWorkingScreenerMetaDataOnly(String screenerId);

    public String saveNewWorkingScreener(Screener screener) throws Exception;

    public void updateWorkingScreener(Screener screener) throws Exception;

    /** Saves a new name, rejecting one already used by another of the owner's screeners. */
    public void renameWorkingScreener(Screener screener) throws Exception;

    public void addBenefitDetailToWorkingScreener(String screenerId, BenefitDetail benefitDetail) throws Exception;

    public void deleteWorkingScreener(String screenerId) throws Exception;

    // Custom Benefit logic
    public Optional<Benefit> getCustomBenefit(String screenerId, String benefitId);

    public String saveNewCustomBenefit(String ScreenerId, Benefit benefit) throws Exception;

    public List<Benefit> getBenefitsInScreener(Screener screener) throws Exception;

    public void deleteCustomBenefit(String screenerId, String benefitId) throws Exception;

    /** Writes only the given top-level fields, leaving the rest (such as checks) as stored. */
    public void updateCustomBenefitFields(String screenerId, String benefitId, Map<String, Object> fields) throws Exception;

    /**
     * Applies update to the stored checks and writes only the checks, in one transaction that reruns
     * update if the benefit changes first, so update must not call slow services. Returns false,
     * writing nothing, when the benefit is missing or update returns null.
     */
    public boolean updateCustomBenefitChecks(String screenerId, String benefitId, UnaryOperator<List<CheckConfig>> update) throws Exception;

    // Publishing logic
    public void publishScreener(Screener screener) throws Exception;
}
