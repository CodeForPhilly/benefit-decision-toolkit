package org.acme.model.domain;

import java.util.Comparator;
import java.util.Optional;

/* Check versions are stored as free-form strings, so a stored version can be anything at all.
   Parsing yields an empty result for values that are not versions, which lets callers ignore
   corrupt data instead of failing every later read and publish of the check. */
public final class CheckVersion {

    private static final int PART_COUNT = 3;

    public static final Comparator<int[]> ORDER = Comparator
            .<int[]>comparingInt(version -> version[0])
            .thenComparingInt(version -> version[1])
            .thenComparingInt(version -> version[2]);

    private CheckVersion() {
    }

    /* A version is dot-separated numbers; missing parts count as zero. */
    public static Optional<int[]> parse(String version) {
        if (version == null) {
            return Optional.empty();
        }

        String[] parts = version.split("\\.");
        int[] numbers = new int[PART_COUNT];
        for (int i = 0; i < parts.length && i < PART_COUNT; i++) {
            try {
                numbers[i] = Integer.parseInt(parts[i]);
            } catch (NumberFormatException e) {
                return Optional.empty();
            }
        }
        return Optional.of(numbers);
    }

    /* Orders stored versions, treating one that cannot be read as older than one that can. */
    public static int compare(String version1, String version2) {
        Optional<int[]> parsed1 = parse(version1);
        Optional<int[]> parsed2 = parse(version2);
        if (parsed1.isPresent() && parsed2.isPresent()) {
            return ORDER.compare(parsed1.get(), parsed2.get());
        }
        return Boolean.compare(parsed1.isPresent(), parsed2.isPresent());
    }
}
