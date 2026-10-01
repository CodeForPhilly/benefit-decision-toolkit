package org.codeforphilly.bdt.builder.api.validation;

import com.fasterxml.jackson.databind.JsonNode;

public interface HasSchema {
  JsonNode schema();
}
