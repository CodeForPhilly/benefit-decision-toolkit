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

    /* A version is one to three dot-separated non-negative numbers; missing parts count as zero. */
    public static Optional<int[]> parse(String version) {
        if (version == null) {
            return Optional.empty();
        }

        // Java drops trailing empty parts, so dot-only strings such as "." split into no parts at all
        String[] parts = version.split("\\.");
        if (parts.length == 0 || parts.length > PART_COUNT) {
            return Optional.empty();
        }

        int[] numbers = new int[PART_COUNT];
        for (int i = 0; i < parts.length; i++) {
            try {
                numbers[i] = Integer.parseInt(parts[i]);
            } catch (NumberFormatException e) {
                return Optional.empty();
            }
            if (numbers[i] < 0) {
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

    public static int[] initial() {
        return new int[]{1, 0, 0};
    }

    public static int[] nextMajor(int[] version) {
        return new int[]{version[0] + 1, 0, 0};    // increment major, reset minor and patch
    }

    public static String format(int[] version) {
        return version[0] + "." + version[1] + "." + version[2];
    }
}
