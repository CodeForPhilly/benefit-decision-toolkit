package org.codeforphilly.bdt.library.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Keeps the committed OpenAPI snapshot in step with the running service. The docs site builds the library
 * catalog from this file (see docs/adr/0001), so a change to a reference, an example or a schema shows up as
 * a reviewable diff. To accept a change, run:
 * {@code mvn test -Dtest=OpenApiSnapshotTest -Dopenapi.snapshot.update=true}
 */
@QuarkusTest
class OpenApiSnapshotTest {

    static final Path SNAPSHOT = Path.of("openapi.snapshot.json");
    private static final ObjectMapper MAPPER = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);

    @Test
    void openApiMatchesTheCommittedSnapshot() throws Exception {
        String body = given().queryParam("format", "JSON").get("/q/openapi")
            .then().statusCode(200).extract().asString();
        String actual = canonical(MAPPER.readTree(body));

        if (Boolean.getBoolean("openapi.snapshot.update")) {
            Files.writeString(SNAPSHOT, actual, StandardCharsets.UTF_8);
            return;
        }
        assertTrue(Files.exists(SNAPSHOT), "Missing " + SNAPSHOT.toAbsolutePath() + ". " + HOW_TO_UPDATE);
        assertEquals(Files.readString(SNAPSHOT, StandardCharsets.UTF_8), actual,
            "OpenAPI changed. Review the diff, then accept it. " + HOW_TO_UPDATE);
    }

    private static final String HOW_TO_UPDATE =
        "Run: (cd library-api && mvn test -Dtest=OpenApiSnapshotTest -Dopenapi.snapshot.update=true)";

    /** Sorted object keys and two-space indentation, so the file only changes when the content does. */
    static String canonical(JsonNode node) throws Exception {
        return MAPPER.writeValueAsString(sorted(node)) + "\n";
    }

    private static JsonNode sorted(JsonNode node) {
        if (node.isObject()) {
            ObjectNode copy = MAPPER.createObjectNode();
            List<String> names = new ArrayList<>();
            node.fieldNames().forEachRemaining(names::add);
            names.sort(null);
            names.forEach(name -> copy.set(name, sorted(node.get(name))));
            return copy;
        }
        if (node.isArray()) {
            ArrayNode copy = MAPPER.createArrayNode();
            node.forEach(item -> copy.add(sorted(item)));
            return copy;
        }
        return node;
    }
}
