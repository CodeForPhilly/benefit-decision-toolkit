package org.acme.persistence;

import org.acme.model.domain.DmnModel;
import org.acme.model.domain.Screener;

import java.util.List;
import java.util.Optional;

public interface ScreenerTestRepository {

  public List<ScreenerTest> getScreenerTests(String userId, String screenerId);

}
