package org.acme.persistence;

import org.acme.model.domain.DmnModel;
import org.acme.model.domain.Screener;

import java.util.List;
import java.util.Optional;

public interface ScreenerRepository {

    public List<Screener> getScreeners(String userId);

    public Optional<Screener> getScreener(String screenerId);

    public Optional<Screener> getScreenerMetaDataOnly(String screenerId);

    public String saveNewScreener(Screener screener) throws Exception;

    public void updateScreener(Screener screener) throws Exception;

    public void deleteScreener(String screenerId) throws Exception;

    public void addDmnDependency(String screenerId, DmnModel dmnModel) throws Exception;

    public void deleteDmnDependency(String screenerId, String groupId, String artifactId, String version) throws Exception;
}
