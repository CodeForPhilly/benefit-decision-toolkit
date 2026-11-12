package org.codeforphilly.bdt.library.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;
import java.math.BigDecimal;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;
import java.util.stream.Stream;

/**
 * Worked examples for references, taken from Bruno tests that have a {@code docs} block.
 * The Maven build copies {@code test/bdt/**}{@code /*.bru} to the classpath under {@code bruno/}.
 */
final class BrunoExamples {

    private static final Logger log = LoggerFactory.getLogger(BrunoExamples.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    static final String ROOT = "bruno/";
    private static final String HOST_PREFIX = "{{host}}/";

    /** One example: the test's name, its docs prose, the request body and the asserted top-level results. */
    record Example(String name, int seq, String description, Object request, Map<String, Object> expected) {
    }

    private BrunoExamples() {
    }

    /** Examples on the classpath keyed by model path (e.g. {@code benefits/pa/liheap-cash}), in Bruno order. */
    static Map<String, List<Example>> load() {
        Map<String, List<Example>> byPath = new HashMap<>();
        forEachBruFile((name, content) -> {
            try {
                Parsed parsed = parse(content);
                if (parsed != null) {
                    byPath.computeIfAbsent(parsed.path, key -> new ArrayList<>()).add(parsed.example);
                }
            } catch (RuntimeException e) {
                throw new IllegalStateException("Could not read Bruno example " + name, e);
            }
        });
        Map<String, List<Example>> sorted = new HashMap<>();
        byPath.forEach((path, examples) -> {
            examples.sort((a, b) -> a.seq() != b.seq() ? Integer.compare(a.seq(), b.seq()) : a.name().compareTo(b.name()));
            sorted.put(path, List.copyOf(examples));
        });
        return Collections.unmodifiableMap(sorted);
    }

    private record Parsed(String path, Example example) {
    }

    /** Returns null for a test that is not an example (no docs block, or not a POST with a JSON body). */
    static Parsed parse(String content) {
        Map<String, String> blocks = blocks(content);
        String docs = blocks.get("docs");
        String post = blocks.get("post");
        String body = blocks.get("body:json");
        if (docs == null || docs.isBlank() || post == null || body == null) {
            return null;
        }
        Map<String, String> meta = keyValues(blocks.getOrDefault("meta", ""));
        String url = keyValues(post).get("url");
        if (url == null || !url.startsWith(HOST_PREFIX)) {
            return null;
        }
        Object request;
        try {
            request = MAPPER.readValue(body, Object.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("body:json is not valid JSON", e);
        }
        Map<String, Object> expected = new LinkedHashMap<>();
        keyValues(blocks.getOrDefault("assert", "")).forEach((key, assertion) -> {
            if (key.startsWith("res.body.") && key.indexOf('.', "res.body.".length()) < 0
                && assertion.startsWith("eq ")) {
                expected.put(key.substring("res.body.".length()), literal(assertion.substring(3).trim()));
            }
        });
        String description = String.join(" ", docs.trim().split("\\s*\\n\\s*"));
        int seq = Integer.parseInt(meta.getOrDefault("seq", "0"));
        return new Parsed(url.substring(HOST_PREFIX.length()),
            new Example(meta.getOrDefault("name", "Example"), seq, description, request,
                Collections.unmodifiableMap(expected)));
    }

    private static Object literal(String value) {
        return switch (value) {
            case "true" -> true;
            case "false" -> false;
            case "null" -> null;
            default -> {
                try {
                    yield new BigDecimal(value);
                } catch (NumberFormatException e) {
                    yield value.length() >= 2 && value.startsWith("\"") && value.endsWith("\"")
                        ? value.substring(1, value.length() - 1) : value;
                }
            }
        };
    }

    /** Top-level {@code name { ... }} blocks, with their two-space indentation removed. */
    private static Map<String, String> blocks(String content) {
        Map<String, String> blocks = new LinkedHashMap<>();
        String name = null;
        StringBuilder body = new StringBuilder();
        for (String line : content.split("\\R", -1)) {
            if (name == null) {
                if (line.endsWith(" {") && !line.startsWith(" ")) {
                    name = line.substring(0, line.length() - 2).trim();
                    body.setLength(0);
                }
            } else if (line.equals("}")) {
                blocks.put(name, body.toString());
                name = null;
            } else {
                body.append(line.startsWith("  ") ? line.substring(2) : line).append('\n');
            }
        }
        return blocks;
    }

    private static Map<String, String> keyValues(String block) {
        Map<String, String> values = new LinkedHashMap<>();
        for (String line : block.split("\\R")) {
            int colon = line.indexOf(": ");
            if (colon > 0 && !line.startsWith(" ")) {
                values.put(line.substring(0, colon).trim(), line.substring(colon + 2).trim());
            }
        }
        return values;
    }

    private interface BruConsumer {
        void accept(String name, String content);
    }

    private static void forEachBruFile(BruConsumer consumer) {
        URL anchor = Thread.currentThread().getContextClassLoader().getResource(ROOT + "collection.bru");
        if (anchor == null) {
            log.warn("No Bruno tests on the classpath; references will have no examples");
            return;
        }
        try {
            if ("file".equals(anchor.getProtocol())) {
                Path root = Paths.get(anchor.toURI()).getParent();
                try (Stream<Path> paths = Files.walk(root)) {
                    for (Path path : paths.filter(p -> p.toString().endsWith(".bru")).sorted().toList()) {
                        consumer.accept(root.relativize(path).toString(), Files.readString(path, StandardCharsets.UTF_8));
                    }
                }
            } else if ("jar".equals(anchor.getProtocol())) {
                String jarPath = anchor.getPath().substring(0, anchor.getPath().indexOf('!'));
                if (jarPath.startsWith("file:")) {
                    jarPath = jarPath.substring(5);
                }
                try (JarFile jar = new JarFile(jarPath)) {
                    Enumeration<JarEntry> entries = jar.entries();
                    while (entries.hasMoreElements()) {
                        JarEntry entry = entries.nextElement();
                        if (entry.getName().startsWith(ROOT) && entry.getName().endsWith(".bru")) {
                            try (InputStream is = jar.getInputStream(entry)) {
                                consumer.accept(entry.getName(), new String(is.readAllBytes(), StandardCharsets.UTF_8));
                            }
                        }
                    }
                }
            }
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Could not read Bruno examples", e);
        }
    }
}
