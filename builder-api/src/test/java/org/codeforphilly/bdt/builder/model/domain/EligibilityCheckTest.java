package org.codeforphilly.bdt.builder.model.domain;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EligibilityCheckTest {

    private final ObjectMapper mapper = new ObjectMapper();

    /* Stored checks are read into this class and returned by the API, so a field it lacks never
       reaches the frontend */
    @Test
    void keepsThePublishDateOfAStoredPublishedCheck() {
        Map<String, Object> stored = Map.of("name", "my-check", "datePublished", 1790791953833L);

        EligibilityCheck check = mapper.convertValue(stored, EligibilityCheck.class);

        assertEquals(1790791953833L, check.getDatePublished());
        assertEquals(1790791953833L, mapper.convertValue(check, Map.class).get("datePublished"));
    }
}
