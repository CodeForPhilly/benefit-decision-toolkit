package org.acme.persistence;

import org.acme.model.domain.BenefitDetail;
import org.acme.model.domain.Screener;

import java.util.List;
import java.util.Optional;

public interface ScreenerRepository {
    public List<Screener> getWorkingScreeners(String userId);

    public Optional<Screener> getWorkingScreener(String screenerId);

    public Optional<Screener> getWorkingScreenerMetaDataOnly(String screenerId);

    public String saveNewWorkingScreener(Screener screener) throws Exception;

    public void updateWorkingScreener(Screener screener) throws Exception;

    public void addBenefitDetailToWorkingScreener(String screenerId, BenefitDetail benefitDetail) throws Exception;

    public void deleteWorkingScreener(String screenerId) throws Exception;
}
