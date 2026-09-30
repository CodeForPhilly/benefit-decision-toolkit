package org.acme.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class ExampleScreenerExportServiceTest {
    @TempDir
    Path exportRoot;

    @Test
    void resetRemovesOldExportDataAndPreservesReadme() throws Exception {
        Files.writeString(exportRoot.resolve("README.md"), "Seed editing guidance");
        Files.writeString(exportRoot.resolve("manifest.json"), "old manifest");
        Path oldData = exportRoot.resolve("firestore/workingScreener/old.json");
        Files.createDirectories(oldData.getParent());
        Files.writeString(oldData, "old screener");
        Path oldDmn = exportRoot.resolve("storage/check/old.dmn");
        Files.createDirectories(oldDmn.getParent());
        Files.writeString(oldDmn, "old DMN");

        ExampleScreenerExportService.resetExportRoot(exportRoot);

        assertTrue(Files.isDirectory(exportRoot));
        assertEquals("Seed editing guidance", Files.readString(exportRoot.resolve("README.md")));
        try (var files = Files.list(exportRoot)) {
            assertEquals(java.util.List.of(exportRoot.resolve("README.md")), files.toList());
        }
    }
}
