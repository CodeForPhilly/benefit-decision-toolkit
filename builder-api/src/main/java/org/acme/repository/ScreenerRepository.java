package org.acme.repository;

import org.acme.model.Screener;

import java.io.InputStream;
import java.util.List;
import java.util.Optional;

public interface ScreenerRepository {

    public List<Screener> getScreeners(String userId);

    public Optional<Screener> getScreener(String screenerId);


}
