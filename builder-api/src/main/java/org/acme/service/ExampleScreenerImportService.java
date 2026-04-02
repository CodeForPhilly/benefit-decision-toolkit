package org.acme.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.model.domain.Benefit;
import org.acme.model.domain.BenefitDetail;
import org.acme.model.domain.CheckConfig;
import org.acme.model.domain.EligibilityCheck;
import org.acme.model.domain.Screener;
import org.acme.persistence.EligibilityCheckRepository;
import org.acme.persistence.ScreenerRepository;
import org.acme.persistence.StorageService;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class ExampleScreenerImportService {

    private final ScreenerRepository screenerRepository;
    private final EligibilityCheckRepository eligibilityCheckRepository;
    private final StorageService storageService;
    private final Optional<String> configuredSeedPath;
    private final ObjectMapper objectMapper;

    @Inject
    public ExampleScreenerImportService(
        ScreenerRepository screenerRepository,
        EligibilityCheckRepository eligibilityCheckRepository,
        StorageService storageService,
        @ConfigProperty(name = "example-screener.seed-path") Optional<String> configuredSeedPath
    ) {
        this.screenerRepository = screenerRepository;
        this.eligibilityCheckRepository = eligibilityCheckRepository;
        this.storageService = storageService;
        this.configuredSeedPath = configuredSeedPath;
        this.objectMapper = new ObjectMapper();
    }

    public String importForUser(String userId) throws Exception {
        Path seedRoot = resolveSeedRoot();
        SeedData seedData = loadSeedData(seedRoot);

        Map<String, String> importedCustomCheckIds = importReferencedCustomChecks(seedData, userId);

        List<Benefit> importedBenefits = new ArrayList<>();
        List<BenefitDetail> importedBenefitDetails = new ArrayList<>();
        for (Benefit seedBenefit : seedData.benefits()) {
            Benefit importedBenefit = cloneBenefit(seedBenefit, userId, importedCustomCheckIds);
            importedBenefits.add(importedBenefit);
            importedBenefitDetails.add(new BenefitDetail(
                importedBenefit.getId(),
                importedBenefit.getName(),
                importedBenefit.getDescription()
            ));
        }

        Screener importedScreener = new Screener();
        importedScreener.setOwnerId(userId);
        importedScreener.setScreenerName(seedData.screener().getScreenerName());
        importedScreener.setBenefits(importedBenefitDetails);

        String newScreenerId = screenerRepository.saveNewWorkingScreener(importedScreener);
        importedScreener.setId(newScreenerId);

        for (Benefit importedBenefit : importedBenefits) {
            screenerRepository.saveNewCustomBenefit(newScreenerId, importedBenefit);
        }

        String formPath = storageService.getScreenerWorkingFormSchemaPath(newScreenerId);
        storageService.writeJsonToStorage(formPath, seedData.formSchema());

        Log.info("Imported example screener " + newScreenerId + " for user " + userId);
        return newScreenerId;
    }

    private Map<String, String> importReferencedCustomChecks(SeedData seedData, String userId) throws Exception {
        Set<String> referencedCustomCheckIds = new LinkedHashSet<>();
        for (Benefit benefit : seedData.benefits()) {
            if (benefit.getChecks() == null) {
                continue;
            }
            for (CheckConfig checkConfig : benefit.getChecks()) {
                String sourceCheckId = resolveSourceCheckId(checkConfig);
                if (sourceCheckId != null && !isLibraryCheckId(sourceCheckId)) {
                    referencedCustomCheckIds.add(sourceCheckId);
                }
            }
        }

        Map<String, String> remappedCheckIds = new HashMap<>();
        for (String seedSourceCheckId : referencedCustomCheckIds) {
            SeedCustomCheckVersions seedCustomCheckVersions = findSeedCustomCheckVersions(seedData, seedSourceCheckId);

            if (seedCustomCheckVersions.workingCheck() != null) {
                String newWorkingId = upsertWorkingCustomCheck(
                    userId,
                    seedCustomCheckVersions.workingCheck(),
                    seedData.dmnByCheckId()
                );
                remappedCheckIds.put(seedCustomCheckVersions.workingCheck().getId(), newWorkingId);
            }

            if (seedCustomCheckVersions.publishedCheck() != null) {
                String newPublishedId = upsertPublishedCustomCheck(
                    userId,
                    seedCustomCheckVersions.publishedCheck(),
                    seedData.dmnByCheckId()
                );
                remappedCheckIds.put(seedCustomCheckVersions.publishedCheck().getId(), newPublishedId);
            }

            if (!remappedCheckIds.containsKey(seedSourceCheckId)) {
                throw new IllegalStateException("No imported check mapping found for seed check " + seedSourceCheckId);
            }
        }

        return remappedCheckIds;
    }

    private SeedCustomCheckVersions findSeedCustomCheckVersions(SeedData seedData, String seedSourceCheckId) {
        EligibilityCheck referencedCheck = seedData.workingCustomChecks().get(seedSourceCheckId);
        if (referencedCheck == null) {
            referencedCheck = seedData.publishedCustomChecks().get(seedSourceCheckId);
        }
        if (referencedCheck == null) {
            throw new IllegalStateException("Missing seed custom check for referenced id " + seedSourceCheckId);
        }

        String seedWorkingId = buildWorkingCheckId(
            referencedCheck.getOwnerId(),
            referencedCheck.getModule(),
            referencedCheck.getName()
        );
        String seedPublishedId = buildPublishedCheckId(
            referencedCheck.getOwnerId(),
            referencedCheck.getModule(),
            referencedCheck.getName(),
            referencedCheck.getVersion()
        );

        return new SeedCustomCheckVersions(
            seedData.workingCustomChecks().get(seedWorkingId),
            seedData.publishedCustomChecks().get(seedPublishedId)
        );
    }

    private String upsertWorkingCustomCheck(
        String userId,
        EligibilityCheck seedCheck,
        Map<String, String> dmnByCheckId
    ) throws Exception {
        EligibilityCheck importedCheck = cloneEligibilityCheck(seedCheck);
        importedCheck.setOwnerId(userId);
        importedCheck.setIsArchived(false);

        String newWorkingId = buildWorkingCheckId(userId, importedCheck.getModule(), importedCheck.getName());
        importedCheck.setId(newWorkingId);

        if (eligibilityCheckRepository.getWorkingCustomCheck(userId, newWorkingId, true).isPresent()) {
            eligibilityCheckRepository.updateWorkingCustomCheck(importedCheck);
        } else {
            eligibilityCheckRepository.saveNewWorkingCustomCheck(importedCheck);
        }

        writeCheckDmn(newWorkingId, seedCheck, dmnByCheckId);
        return newWorkingId;
    }

    private String upsertPublishedCustomCheck(
        String userId,
        EligibilityCheck seedCheck,
        Map<String, String> dmnByCheckId
    ) throws Exception {
        EligibilityCheck importedCheck = cloneEligibilityCheck(seedCheck);
        importedCheck.setOwnerId(userId);
        importedCheck.setIsArchived(false);

        String newPublishedId = buildPublishedCheckId(
            userId,
            importedCheck.getModule(),
            importedCheck.getName(),
            importedCheck.getVersion()
        );
        importedCheck.setId(newPublishedId);

        if (eligibilityCheckRepository.getPublishedCustomCheck(userId, newPublishedId).isPresent()) {
            eligibilityCheckRepository.updatePublishedCustomCheck(importedCheck);
        } else {
            try {
                eligibilityCheckRepository.saveNewPublishedCustomCheck(importedCheck);
            } catch (Exception e) {
                eligibilityCheckRepository.updatePublishedCustomCheck(importedCheck);
            }
        }

        writeCheckDmn(newPublishedId, seedCheck, dmnByCheckId);
        return newPublishedId;
    }

    private void writeCheckDmn(String newCheckId, EligibilityCheck seedCheck, Map<String, String> dmnByCheckId) throws Exception {
        String dmnModel = dmnByCheckId.get(seedCheck.getId());
        if ((dmnModel == null || dmnModel.isBlank()) && seedCheck.getDmnModel() != null) {
            dmnModel = seedCheck.getDmnModel();
        }
        if (dmnModel == null || dmnModel.isBlank()) {
            throw new IllegalStateException("Missing DMN model for seed check " + seedCheck.getId());
        }

        storageService.writeStringToStorage(
            storageService.getCheckDmnModelPath(newCheckId),
            dmnModel,
            "application/xml"
        );
    }

    private Benefit cloneBenefit(Benefit seedBenefit, String userId, Map<String, String> importedCustomCheckIds) {
        Benefit importedBenefit = objectMapper.convertValue(seedBenefit, Benefit.class);
        importedBenefit.setId(UUID.randomUUID().toString());
        importedBenefit.setOwnerId(userId);
        importedBenefit.setChecks(remapCheckConfigs(seedBenefit.getChecks(), importedCustomCheckIds));
        return importedBenefit;
    }

    private List<CheckConfig> remapCheckConfigs(List<CheckConfig> seedChecks, Map<String, String> importedCustomCheckIds) {
        if (seedChecks == null || seedChecks.isEmpty()) {
            return Collections.emptyList();
        }

        List<CheckConfig> importedChecks = new ArrayList<>();
        for (CheckConfig seedCheck : seedChecks) {
            CheckConfig importedCheck = objectMapper.convertValue(seedCheck, CheckConfig.class);
            importedCheck.setCheckId(UUID.randomUUID().toString());

            String sourceCheckId = resolveSourceCheckId(seedCheck);
            if (sourceCheckId != null) {
                if (isLibraryCheckId(sourceCheckId)) {
                    importedCheck.setSourceCheckId(sourceCheckId);
                } else {
                    String remappedSourceCheckId = importedCustomCheckIds.get(sourceCheckId);
                    if (remappedSourceCheckId == null) {
                        throw new IllegalStateException("Missing imported custom check id for " + sourceCheckId);
                    }
                    importedCheck.setSourceCheckId(remappedSourceCheckId);
                }
            }

            importedChecks.add(importedCheck);
        }

        return importedChecks;
    }

    private EligibilityCheck cloneEligibilityCheck(EligibilityCheck seedCheck) {
        return objectMapper.convertValue(seedCheck, EligibilityCheck.class);
    }

    private String resolveSourceCheckId(CheckConfig checkConfig) {
        if (checkConfig.getSourceCheckId() != null && !checkConfig.getSourceCheckId().isBlank()) {
            return checkConfig.getSourceCheckId();
        }
        return checkConfig.getCheckId();
    }

    private boolean isLibraryCheckId(String checkId) {
        return checkId != null && checkId.startsWith("L");
    }

    private SeedData loadSeedData(Path seedRoot) throws IOException {
        Path workingScreenersDir = seedRoot.resolve("firestore").resolve("workingScreener");
        List<Path> screenerFiles = listJsonFiles(workingScreenersDir);
        if (screenerFiles.size() != 1) {
            throw new IllegalStateException("Expected exactly one working screener seed document, found " + screenerFiles.size());
        }

        Path screenerFile = screenerFiles.get(0);
        Screener screener = readJsonFile(screenerFile, Screener.class);
        String screenerDocId = stripExtension(screenerFile.getFileName().toString());

        Path benefitsDir = workingScreenersDir.resolve(screenerDocId).resolve("customBenefit");
        List<Benefit> benefits = new ArrayList<>();
        for (Path benefitFile : listJsonFiles(benefitsDir)) {
            benefits.add(readJsonFile(benefitFile, Benefit.class));
        }

        JsonNode formSchema = objectMapper.readTree(
            Files.readString(seedRoot.resolve("storage").resolve("form").resolve("working").resolve(screenerDocId + ".json"))
        );

        return new SeedData(
            screener,
            benefits,
            formSchema,
            loadChecks(seedRoot.resolve("firestore").resolve("workingCustomCheck")),
            loadChecks(seedRoot.resolve("firestore").resolve("publishedCustomCheck")),
            loadDmnFiles(seedRoot.resolve("storage").resolve("check"))
        );
    }

    private Map<String, EligibilityCheck> loadChecks(Path checksDir) throws IOException {
        Map<String, EligibilityCheck> checksById = new LinkedHashMap<>();
        if (!Files.isDirectory(checksDir)) {
            return checksById;
        }

        for (Path checkFile : listJsonFiles(checksDir)) {
            EligibilityCheck check = readJsonFile(checkFile, EligibilityCheck.class);
            checksById.put(check.getId(), check);
        }
        return checksById;
    }

    private Map<String, String> loadDmnFiles(Path dmnDir) throws IOException {
        Map<String, String> dmnByCheckId = new HashMap<>();
        if (!Files.isDirectory(dmnDir)) {
            return dmnByCheckId;
        }

        try (var stream = Files.list(dmnDir)) {
            stream
                .filter(Files::isRegularFile)
                .filter(path -> path.getFileName().toString().endsWith(".dmn"))
                .sorted(Comparator.comparing(path -> path.getFileName().toString()))
                .forEach(path -> {
                    try {
                        dmnByCheckId.put(stripExtension(path.getFileName().toString()), Files.readString(path));
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to read DMN file " + path, e);
                    }
                });
        } catch (RuntimeException e) {
            if (e.getCause() instanceof IOException ioException) {
                throw ioException;
            }
            throw e;
        }

        return dmnByCheckId;
    }

    private <T> T readJsonFile(Path path, Class<T> clazz) throws IOException {
        return objectMapper.readValue(Files.readString(path), clazz);
    }

    private List<Path> listJsonFiles(Path directory) throws IOException {
        if (!Files.isDirectory(directory)) {
            return Collections.emptyList();
        }

        try (var stream = Files.list(directory)) {
            return stream
                .filter(Files::isRegularFile)
                .filter(path -> path.getFileName().toString().endsWith(".json"))
                .sorted(Comparator.comparing(path -> path.getFileName().toString()))
                .toList();
        }
    }

    private Path resolveSeedRoot() {
        List<Path> candidates = new ArrayList<>();
        configuredSeedPath
            .map(String::trim)
            .filter(path -> !path.isBlank())
            .map(Paths::get)
            .ifPresent(candidates::add);
        candidates.add(Paths.get("seed-data", "example-screener"));
        candidates.add(Paths.get("..", "seed-data", "example-screener"));

        for (Path candidate : candidates) {
            Path absoluteCandidate = candidate.toAbsolutePath().normalize();
            if (Files.isDirectory(absoluteCandidate)) {
                return absoluteCandidate;
            }
        }

        throw new IllegalStateException("Could not find example screener seed data in any expected location");
    }

    private String buildWorkingCheckId(String ownerId, String module, String name) {
        return "W-" + ownerId + "-" + module + "-" + name;
    }

    private String buildPublishedCheckId(String ownerId, String module, String name, String version) {
        return "P-" + ownerId + "-" + module + "-" + name + "-" + version;
    }

    private String stripExtension(String filename) {
        int extensionIndex = filename.lastIndexOf('.');
        if (extensionIndex == -1) {
            return filename;
        }
        return filename.substring(0, extensionIndex);
    }

    private record SeedData(
        Screener screener,
        List<Benefit> benefits,
        JsonNode formSchema,
        Map<String, EligibilityCheck> workingCustomChecks,
        Map<String, EligibilityCheck> publishedCustomChecks,
        Map<String, String> dmnByCheckId
    ) {}

    private record SeedCustomCheckVersions(
        EligibilityCheck workingCheck,
        EligibilityCheck publishedCheck
    ) {}
}
