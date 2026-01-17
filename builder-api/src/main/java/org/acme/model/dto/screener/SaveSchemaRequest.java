package org.acme.model.dto.screener;

import com.fasterxml.jackson.databind.JsonNode;

public class SaveSchemaRequest {
    public String screenerId;
    public JsonNode schema;
}
