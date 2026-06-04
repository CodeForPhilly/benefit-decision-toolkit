package org.acme.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;

import io.quarkus.logging.Log;
import io.quarkus.runtime.LaunchMode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.model.domain.Benefit;
import org.acme.model.domain.BenefitDetail;
import org.acme.model.domain.CheckConfig;
import org.acme.model.domain.EligibilityCheck;
import org.acme.model.domain.Screener;
import org.acme.model.dto.ExampleScreener.Manifest;
import org.acme.model.dto.ExampleScreener.ScreenerManifest;
import org.acme.persistence.EligibilityCheckRepository;
import org.acme.persistence.ScreenerRepository;
import org.acme.persistence.StorageService;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
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
    private static final String BUNDLED_SEED_MANIFEST = "seed-data/example-screener/manifest.json";

    private final ScreenerRepository screenerRepository;
    private final EligibilityCheckRepository eligibilityCheckRepository;
    private final StorageService storageService;
    private final ObjectMapper objectMapper;

    @Inject
    public ExampleScreenerImportService(ScreenerRepository screenerRepository,
            EligibilityCheckRepository eligibilityCheckRepository,
            StorageService storageService, @ConfigProperty(
                    name = "example-screener.seed-path") Optional<String> configuredSeedPath) {
        this.screenerRepository = screenerRepository;
        this.eligibilityCheckRepository = eligibilityCheckRepository;
        this.storageService = storageService;
        this.objectMapper = new ObjectMapper();
    }

    public List<String> importForUser(String userId) throws Exception {
        Manifest manifest = readJsonRes(BUNDLED_SEED_MANIFEST, Manifest.class);
        SeedData seedData = loadSeedData(manifest);

        Map<String, String> importedCustomCheckIds = importReferencedCustomChecks(
                seedData,
                userId);
        List<String> importedScreenerIds = new ArrayList<>();

        for (SeedScreenerData seedScreener : seedData.screeners()) {
            List<Benefit> importedBenefits = new ArrayList<>();
            List<BenefitDetail> importedBenefitDetails = new ArrayList<>();
            for (Benefit seedBenefit : seedScreener.benefits()) {
                Benefit importedBenefit = cloneBenefit(
                        seedBenefit,
                        userId,
                        importedCustomCheckIds);
                importedBenefits.add(importedBenefit);
                importedBenefitDetails.add(
                        new BenefitDetail(importedBenefit.getId(),
                                importedBenefit.getName(),
                                importedBenefit.getDescription()));
            }

            Screener importedScreener = new Screener();
            importedScreener.setOwnerId(userId);
            importedScreener
                    .setScreenerName(seedScreener.screener().getScreenerName());
            importedScreener.setBenefits(importedBenefitDetails);

            String newScreenerId = screenerRepository
                    .saveNewWorkingScreener(importedScreener);
            importedScreener.setId(newScreenerId);

            for (Benefit importedBenefit : importedBenefits) {
                screenerRepository
                        .saveNewCustomBenefit(newScreenerId, importedBenefit);
            }

            if (seedScreener.formSchema() != null) {
                String formPath = storageService
                        .getScreenerWorkingFormSchemaPath(newScreenerId);
                storageService.writeJsonToStorage(
                        formPath,
                        seedScreener.formSchema());
            }

            importedScreenerIds.add(newScreenerId);
            Log.info(
                    "Imported example screener " + newScreenerId + " for user "
                            + userId);
        }

        return importedScreenerIds;
    }

    private Map<String, String> importReferencedCustomChecks(SeedData seedData,
            String userId) throws Exception {
        Set<String> referencedCustomCheckIds = new LinkedHashSet<>();
        for (SeedScreenerData seedScreener : seedData.screeners()) {
            for (Benefit benefit : seedScreener.benefits()) {
                if (benefit.getChecks() == null) {
                    continue;
                }
                for (CheckConfig checkConfig : benefit.getChecks()) {
                    String sourceCheckId = resolveSourceCheckId(checkConfig);
                    if (sourceCheckId != null
                            && !isLibraryCheckId(sourceCheckId)) {
                        referencedCustomCheckIds.add(sourceCheckId);
                    }
                }
            }
        }

        Map<String, String> remappedCheckIds = new HashMap<>();
        for (String seedSourceCheckId : referencedCustomCheckIds) {
            SeedCustomCheckVersions seedCustomCheckVersions = findSeedCustomCheckVersions(
                    seedData,
                    seedSourceCheckId);

            if (seedCustomCheckVersions.workingCheck() != null) {
                String newWorkingId = upsertWorkingCustomCheck(
                        userId,
                        seedCustomCheckVersions.workingCheck(),
                        seedData.dmnByCheckId());
                remappedCheckIds.put(
                        seedCustomCheckVersions.workingCheck().getId(),
                        newWorkingId);
            }

            if (seedCustomCheckVersions.publishedCheck() != null) {
                String newPublishedId = upsertPublishedCustomCheck(
                        userId,
                        seedCustomCheckVersions.publishedCheck(),
                        seedData.dmnByCheckId());
                remappedCheckIds.put(
                        seedCustomCheckVersions.publishedCheck().getId(),
                        newPublishedId);
            }

            if (!remappedCheckIds.containsKey(seedSourceCheckId)) {
                throw new IllegalStateException(
                        "No imported check mapping found for seed check "
                                + seedSourceCheckId);
            }
        }

        return remappedCheckIds;
    }

    private SeedCustomCheckVersions findSeedCustomCheckVersions(
            SeedData seedData, String seedSourceCheckId) {
        EligibilityCheck referencedCheck = seedData.workingCustomChecks()
                .get(seedSourceCheckId);
        if (referencedCheck == null) {
            referencedCheck = seedData.publishedCustomChecks()
                    .get(seedSourceCheckId);
        }
        if (referencedCheck == null) {
            throw new IllegalStateException(
                    "Missing seed custom check for referenced id "
                            + seedSourceCheckId);
        }

        String seedWorkingId = buildWorkingCheckId(
                referencedCheck.getOwnerId(),
                referencedCheck.getModule(),
                referencedCheck.getName());
        String seedPublishedId = buildPublishedCheckId(
                referencedCheck.getOwnerId(),
                referencedCheck.getModule(),
                referencedCheck.getName(),
                referencedCheck.getVersion());

        return new SeedCustomCheckVersions(
                seedData.workingCustomChecks().get(seedWorkingId),
                seedData.publishedCustomChecks().get(seedPublishedId));
    }

    private String upsertWorkingCustomCheck(String userId,
            EligibilityCheck seedCheck, Map<String, String> dmnByCheckId)
            throws Exception {
        EligibilityCheck importedCheck = cloneEligibilityCheck(seedCheck);
        importedCheck.setOwnerId(userId);
        importedCheck.setIsArchived(false);

        String newWorkingId = buildWorkingCheckId(
                userId,
                importedCheck.getModule(),
                importedCheck.getName());
        importedCheck.setId(newWorkingId);

        if (eligibilityCheckRepository
                .getWorkingCustomCheck(userId, newWorkingId, true)
                .isPresent()) {
            eligibilityCheckRepository.updateWorkingCustomCheck(importedCheck);
        } else {
            eligibilityCheckRepository.saveNewWorkingCustomCheck(importedCheck);
        }

        writeCheckDmn(newWorkingId, seedCheck, dmnByCheckId);
        return newWorkingId;
    }

    private String upsertPublishedCustomCheck(String userId,
            EligibilityCheck seedCheck, Map<String, String> dmnByCheckId)
            throws Exception {
        EligibilityCheck importedCheck = cloneEligibilityCheck(seedCheck);
        importedCheck.setOwnerId(userId);
        importedCheck.setIsArchived(false);

        String newPublishedId = buildPublishedCheckId(
                userId,
                importedCheck.getModule(),
                importedCheck.getName(),
                importedCheck.getVersion());
        importedCheck.setId(newPublishedId);

        if (eligibilityCheckRepository
                .getPublishedCustomCheck(userId, newPublishedId).isPresent()) {
            eligibilityCheckRepository
                    .updatePublishedCustomCheck(importedCheck);
        } else {
            try {
                eligibilityCheckRepository
                        .saveNewPublishedCustomCheck(importedCheck);
            } catch (Exception e) {
                Log.info(e);
                eligibilityCheckRepository
                        .updatePublishedCustomCheck(importedCheck);
            }
        }

        writeCheckDmn(newPublishedId, seedCheck, dmnByCheckId);
        return newPublishedId;
    }

    private void writeCheckDmn(String newCheckId, EligibilityCheck seedCheck,
            Map<String, String> dmnByCheckId) throws Exception {
        String dmnModel = dmnByCheckId.get(seedCheck.getId());
        if ((dmnModel == null || dmnModel.isBlank())
                && seedCheck.getDmnModel() != null) {
            dmnModel = seedCheck.getDmnModel();
        }
        if (dmnModel == null || dmnModel.isBlank()) {
            throw new IllegalStateException(
                    "Missing DMN model for seed check " + seedCheck.getId());
        }

        storageService.writeStringToStorage(
                storageService.getCheckDmnModelPath(newCheckId),
                dmnModel,
                "application/xml");
    }

    private Benefit cloneBenefit(Benefit seedBenefit, String userId,
            Map<String, String> importedCustomCheckIds) {
        Benefit importedBenefit = objectMapper
                .convertValue(seedBenefit, Benefit.class);
        importedBenefit.setId(UUID.randomUUID().toString());
        importedBenefit.setOwnerId(userId);
        importedBenefit.setChecks(
                remapCheckConfigs(
                        seedBenefit.getChecks(),
                        importedCustomCheckIds));
        return importedBenefit;
    }

    private List<CheckConfig> remapCheckConfigs(List<CheckConfig> seedChecks,
            Map<String, String> importedCustomCheckIds) {
        if (seedChecks == null || seedChecks.isEmpty()) {
            return Collections.emptyList();
        }

        List<CheckConfig> importedChecks = new ArrayList<>();
        for (CheckConfig seedCheck : seedChecks) {
            CheckConfig importedCheck = objectMapper
                    .convertValue(seedCheck, CheckConfig.class);
            importedCheck.setCheckId(UUID.randomUUID().toString());

            String sourceCheckId = resolveSourceCheckId(seedCheck);
            if (sourceCheckId != null) {
                if (isLibraryCheckId(sourceCheckId)) {
                    importedCheck.setSourceCheckId(sourceCheckId);
                } else {
                    String remappedSourceCheckId = importedCustomCheckIds
                            .get(sourceCheckId);
                    if (remappedSourceCheckId == null) {
                        throw new IllegalStateException(
                                "Missing imported custom check id for "
                                        + sourceCheckId);
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
        if (checkConfig.getSourceCheckId() != null
                && !checkConfig.getSourceCheckId().isBlank()) {
            return checkConfig.getSourceCheckId();
        }
        return checkConfig.getCheckId();
    }

    private boolean isLibraryCheckId(String checkId) {
        return checkId != null && checkId.startsWith("L");
    }

    private SeedData loadSeedData(Manifest manifest) throws IOException {
        List<ScreenerManifest> screenerFiles = manifest.screeners();

        List<SeedScreenerData> screeners = new ArrayList<>();
        for (ScreenerManifest screenerManifest : screenerFiles) {
            String screenerPath = screenerManifest.screenerPath();
            Screener screener = readJsonRes(screenerPath, Screener.class);

            List<String> benefitsFiles = screenerManifest.benefits();
            List<Benefit> benefits = new ArrayList<>();
            for (String benefitPath : benefitsFiles) {
                benefits.add(readJsonRes(benefitPath, Benefit.class));
            }

            JsonNode formSchema = screenerManifest.formSchema().length() > 0
                    ? loadFormSchema(screenerManifest.formSchema())
                    : JsonNodeFactory.instance.objectNode();

            screeners.add(new SeedScreenerData(screener, benefits, formSchema));
        }

        return new SeedData(screeners,
                loadChecks(manifest.workingCustomChecks()),
                loadChecks(manifest.publishedCustomChecks()),
                loadDmnFiles(manifest.dmnPaths()));
    }

    private JsonNode loadFormSchema(String formPath) {
        return readJsonRes(formPath, JsonNode.class);
    }

    private Map<String, EligibilityCheck> loadChecks(List<String> checksPaths) {
        Map<String, EligibilityCheck> checksById = new LinkedHashMap<>();

        for (String checkPath : checksPaths) {
            EligibilityCheck check = readJsonRes(
                    checkPath,
                    EligibilityCheck.class);
            checksById.put(check.getId(), check);
        }
        return checksById;
    }

    private Map<String, String> loadDmnFiles(List<String> dmnPaths) {
        Map<String, String> dmnByCheckId = new HashMap<>();

        dmnPaths.stream().forEach(path -> {
            try {
                InputStream stream = getPathStream(path);
                String contents = new String(stream.readAllBytes(),
                        StandardCharsets.UTF_8);
                dmnByCheckId.put(stripExtension(getIdFromPath(path)), contents);
            } catch (IOException exception) {
                Log.info("Error reading DMN file: " + path);
            }
        });

        return dmnByCheckId;
    }

    private <T> T readJsonRes(String path, Class<T> clazz) {
        try {
            InputStream stream = getPathStream(path);
            return objectMapper.readValue(stream, clazz);
        } catch (IOException exception) {
            Log.info("Failed to read resource: " + path);
            throw new IllegalStateException(exception);
        }
    }

    private InputStream getPathStream(String path) throws IOException {
        try {
            if (LaunchMode.current() == LaunchMode.DEVELOPMENT) {
                return Files.newInputStream(
                        Path.of("src", "main", "resources").resolve(path));
            } else {
                InputStream stream = Thread.currentThread()
                        .getContextClassLoader().getResourceAsStream(path);
                if (stream == null) {
                    throw new IOException("Resource not found: " + path);
                }
                return stream;
            }
        } catch (IOException exception) {
            throw new IOException("Could not find: " + path);
        }
    }

    private String buildWorkingCheckId(String ownerId, String module,
            String name) {
        return "W-" + ownerId + "-" + module + "-" + name;
    }

    private String buildPublishedCheckId(String ownerId, String module,
            String name, String version) {
        return "P-" + ownerId + "-" + module + "-" + name + "-" + version;
    }

    private String getIdFromPath(String path) {
        return stripExtension(Paths.get(path).getFileName().toString());
    }

    private String stripExtension(String filename) {
        int extensionIndex = filename.lastIndexOf('.');
        if (extensionIndex == -1) {
            return filename;
        }
        return filename.substring(0, extensionIndex);
    }

    private record SeedData(List<SeedScreenerData> screeners,
            Map<String, EligibilityCheck> workingCustomChecks,
            Map<String, EligibilityCheck> publishedCustomChecks,
            Map<String, String> dmnByCheckId) {
    }

    private record SeedScreenerData(Screener screener, List<Benefit> benefits,
            JsonNode formSchema) {
    }

    private record SeedCustomCheckVersions(EligibilityCheck workingCheck,
            EligibilityCheck publishedCheck) {
    }
}
