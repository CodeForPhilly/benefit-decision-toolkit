package org.acme.model.domain;

import org.acme.model.dto.Dependency;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ScreenerTest {
  private String id;
  private String screenerTestName;

  public ScreenerTest() {
  }

  public String getScreenerTestName() {
    return this.screenerTestName;
  }
}
