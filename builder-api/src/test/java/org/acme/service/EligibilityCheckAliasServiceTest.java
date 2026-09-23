package org.acme.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EligibilityCheckAliasServiceTest {
    private EligibilityCheckAliasService service;
    private HttpServer server;
    private final AtomicReference<HttpExchange> lastRequest = new AtomicReference<>();
    private final AtomicReference<String> lastRequestBody = new AtomicReference<>();

    @BeforeEach
    void setUp() {
        service = new EligibilityCheckAliasService();
        service.objectMapper = new ObjectMapper();
        service.enabled = true;
        service.apiKey = Optional.empty();
        service.model = "test-model";
    }

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void generateReturnsNothingWithoutAnApiKey() {
        assertEquals(Optional.empty(), service.generate("IncomeThreshold", Map.of("limit", 50_000)));
    }

    @Test
    void generateReturnsNothingWithABlankApiKey() {
        service.apiKey = Optional.of(" ");

        assertEquals(Optional.empty(), service.generate("IncomeThreshold", Map.of("limit", 50_000)));
    }

    @Test
    void generateSkipsGeminiWhenDisabled() throws Exception {
        startGemini(200, geminiResponse("{\"alias\":\"Income under $50,000\"}"));
        service.enabled = false;

        assertEquals(Optional.empty(), service.generate("IncomeThreshold", Map.of("limit", 50_000)));
        assertNull(lastRequest.get());
    }

    @Test
    void generateReturnsTheAliasFromGemini() throws Exception {
        startGemini(200, geminiResponse("{\"alias\":\"  Income under $50,000 \"}"));

        assertEquals(Optional.of("Income under $50,000"), service.generate("IncomeThreshold", Map.of("limit", 50_000)));

        HttpExchange request = lastRequest.get();
        assertEquals("/test-model:generateContent", request.getRequestURI().getPath());
        assertEquals("test-key", request.getRequestHeaders().getFirst("x-goog-api-key"));
        String prompt = new ObjectMapper().readTree(lastRequestBody.get())
            .path("contents").path(0).path("parts").path(0).path("text").asText();
        assertTrue(prompt.contains("Check name: IncomeThreshold"));
        assertTrue(prompt.contains("{\"limit\":50000}"));
    }

    @Test
    void generateReturnsNothingWhenGeminiReturnsAnError() throws Exception {
        startGemini(500, "{}");

        assertEquals(Optional.empty(), service.generate("IncomeThreshold", Map.of("limit", 50_000)));
    }

    @Test
    void generateReturnsNothingWhenGeminiReturnsABlankAlias() throws Exception {
        startGemini(200, geminiResponse("{\"alias\":\" \"}"));

        assertEquals(Optional.empty(), service.generate("IncomeThreshold", Map.of("limit", 50_000)));
    }

    @Test
    void generateReturnsNothingWhenGeminiReturnsMalformedJson() throws Exception {
        startGemini(200, geminiResponse("not json"));

        assertEquals(Optional.empty(), service.generate("IncomeThreshold", Map.of("limit", 50_000)));
    }

    private void startGemini(int status, String responseBody) throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            lastRequest.set(exchange);
            lastRequestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] bytes = responseBody.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(status, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();

        service.apiKey = Optional.of("test-key");
        service.baseUrl = "http://127.0.0.1:" + server.getAddress().getPort() + "/";
    }

    private static String geminiResponse(String generatedText) throws IOException {
        return new ObjectMapper().writeValueAsString(Map.of(
            "candidates", new Object[] {
                Map.of("content", Map.of("parts", new Object[] {Map.of("text", generatedText)}))
            }
        ));
    }
}
