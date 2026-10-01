package org.codeforphilly.bdt.builder.persistence;

import org.codeforphilly.bdt.builder.model.domain.Benefit;
import org.codeforphilly.bdt.builder.model.domain.Screener;

import java.util.List;
import java.util.Optional;

public interface PublishedScreenerRepository {
    public Optional<Screener> getScreener(String screenerId);

    public List<Benefit> getBenefitsInScreener(Screener screener) throws Exception;

    public String createPublishedScreener(Screener screener) throws Exception;

    public void updatePublishedScreener(String publishedScreenerId, Screener screener) throws Exception;

    public void refreshPublishedScreenerbenefits(String publishedScreenerId, List<Benefit> benefits) throws Exception;
}
