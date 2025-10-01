package org.acme.persistence;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.constants.CollectionNames;
import org.acme.constants.FieldNames;
import org.acme.model.domain.DmnModel;
import org.acme.model.domain.Screener;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class ScreenerTestRepositoryImpl implements ScreenerTestRepository {

  @Inject
  private StorageService storageService;

  @Override
  public List<ScreenerTest> getScreenerTests(String userId, String screenerId) {

    List<Map<String, Object>> screenersMaps = FirestoreUtils.getFirestoreDocsByField(
        CollectionNames.SCREENER_COLLECTION,
        FieldNames.OWNER_ID,
        userId);

    ObjectMapper mapper = new ObjectMapper();
    List<Screener> screenerTests = screenersMaps.stream()
        .map(screenerMap -> mapper.convertValue(screenerMap, Screener.class)).toList();

    return screenerTests;
  }
}
