package org.acme.controller;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EligibilityCheckResourceTest {

    private final EligibilityCheckResource resource = new EligibilityCheckResource();

    @Test
    void firstPublishKeepsInitialVersion() {
        assertEquals("1.0.0", resource.versionForPublish("1.0.0", false));
    }

    @Test
    void laterPublishIncrementsMajorVersion() {
        assertEquals("2.0.0", resource.versionForPublish("1.0.0", true));
    }
}
