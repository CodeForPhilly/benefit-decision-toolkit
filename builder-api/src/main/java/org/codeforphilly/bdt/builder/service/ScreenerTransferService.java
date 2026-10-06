package org.codeforphilly.bdt.builder.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;
import org.codeforphilly.bdt.builder.model.domain.*;
import org.codeforphilly.bdt.builder.model.dto.screener.ScreenerTransfer;
import org.codeforphilly.bdt.builder.persistence.*;

import java.util.*;

@ApplicationScoped
public class ScreenerTransferService {
    private final ScreenerRepository screeners;
    private final EligibilityCheckRepository checks;
    private final StorageService storage;
    private final LibraryApiService library;
    private final ObjectMapper mapper = new ObjectMapper();

    @Inject
    public ScreenerTransferService(ScreenerRepository screeners, EligibilityCheckRepository checks,
            StorageService storage, LibraryApiService library) {
        this.screeners = screeners;
        this.checks = checks;
        this.storage = storage;
        this.library = library;
    }

    public ScreenerTransfer exportScreener(String owner, String id) throws Exception {
        // Authorize before fetching the form, benefits, or check models.
        Screener metadata = screeners.getWorkingScreenerMetaDataOnly(id).orElseThrow(NotFoundException::new);
        if (!owner.equals(metadata.getOwnerId())) throw new ForbiddenException();
        Screener screener = screeners.getWorkingScreener(id).orElseThrow(NotFoundException::new);
        List<Benefit> benefits = new ArrayList<>();
        Map<String, Benefit> byId = new HashMap<>();
        for (Benefit benefit : screeners.getBenefitsInScreener(screener)) byId.put(benefit.getId(), benefit);
        // The screener's benefit list determines the order shown in the editor.
        if (screener.getBenefits() != null) {
            for (BenefitDetail detail : screener.getBenefits()) {
                Benefit benefit = byId.remove(detail.getId());
                if (benefit == null) throw new IllegalStateException("Missing screener benefit");
                benefits.add(copy(benefit, Benefit.class));
            }
        }
        if (!byId.isEmpty()) throw new IllegalStateException("Screener benefit list is inconsistent");
        Map<String, EligibilityCheck> customChecks = new LinkedHashMap<>();
        for (Benefit benefit : benefits) {
            benefit.setOwnerId(null);
            for (CheckConfig config : configs(benefit)) {
                String source = sourceId(config);
                if (source.startsWith("L")) continue;
                if (customChecks.containsKey(source)) continue;
                EligibilityCheck check = loadCheck(owner, source);
                customChecks.put(source, portableCheck(check));
                String workingId = checks.getWorkingId(check);
                if (!customChecks.containsKey(workingId)) {
                    Optional<EligibilityCheck> working = checks.getWorkingCustomCheck(owner, workingId, true);
                    if (working.isPresent()) {
                        requireOwnedCheck(owner, working.get());
                        customChecks.put(workingId, portableCheck(working.get()));
                    }
                }
            }
        }
        return new ScreenerTransfer(ScreenerTransfer.FORMAT, ScreenerTransfer.VERSION,
                screener.getScreenerName(), mapper.valueToTree(screener.getFormSchema()),
                benefits, new ArrayList<>(customChecks.values()));
    }

    private EligibilityCheck loadCheck(String owner, String id) {
        EligibilityCheck check = (id.startsWith("W-")
                ? checks.getWorkingCustomCheck(owner, id, true)
                : checks.getPublishedCustomCheck(owner, id, true))
                .orElseThrow(() -> new IllegalStateException("Missing custom check " + id));
        requireOwnedCheck(owner, check);
        return check;
    }

    private void requireOwnedCheck(String owner, EligibilityCheck check) {
        // Repository lookups do not themselves enforce ownership.
        if (!owner.equals(check.getOwnerId())) throw new ForbiddenException();
    }

    private EligibilityCheck portableCheck(EligibilityCheck original) {
        EligibilityCheck check = copy(original, EligibilityCheck.class);
        if (blank(check.getDmnModel())) throw new IllegalStateException("Missing custom check DMN model");
        check.setOwnerId(null);
        check.setExampleSourceId(null);
        check.setDatePublished(null);
        check.setEvaluationUrl(null);
        return check;
    }

    public Screener importScreener(String owner, ScreenerTransfer transfer) throws Exception {
        // Validate the complete file and resolve library references before any writes.
        Map<String, EligibilityCheck> originals = validate(transfer);
        Map<String, EligibilityCheck> libraryChecks = new HashMap<>();
        for (Benefit benefit : transfer.benefits()) {
            for (CheckConfig config : configs(benefit)) {
                String source = sourceId(config);
                if (source.startsWith("L") && !libraryChecks.containsKey(source)) {
                    libraryChecks.put(source, library.getScreenerCheckById(source).orElseThrow(() ->
                            new BadRequestException("Library check " + source + " is unavailable on this server.")));
                }
            }
        }
        Map<String, String> newWorkingIds = new LinkedHashMap<>();
        Map<String, EligibilityCheck> workingCopies = new LinkedHashMap<>();
        for (EligibilityCheck original : originals.values()) {
            String family = checks.getWorkingId(original);
            newWorkingIds.computeIfAbsent(family, ignored -> checks.newWorkingId());
            EligibilityCheck candidate = workingCopies.get(family);
            if (candidate == null || original.getId().startsWith("W-")
                    || (!candidate.getId().startsWith("W-")
                        && CheckVersion.compare(original.getVersion(), candidate.getVersion()) > 0)) {
                workingCopies.put(family, copy(original, EligibilityCheck.class));
            }
        }
        Deque<Cleanup> cleanup = new ArrayDeque<>();
        try {
            // A collision gets a separate module, keeping decision names and DMN XML intact.
            List<EligibilityCheck> existing = checks.getAllWorkingCustomChecks(owner);
            for (var entry : workingCopies.entrySet()) {
                EligibilityCheck working = entry.getValue();
                working.setId(newWorkingIds.get(entry.getKey()));
                resetCheckOwnership(working, owner);
                reserveImportedName(working, existing);
                cleanup.push(() -> checks.releaseCheckName(owner, working.getModule(), working.getName(), working.getId()));
                existing = new ArrayList<>(existing);
                existing.add(working);
            }
            Map<String, String> remappedIds = new HashMap<>();
            for (var entry : workingCopies.entrySet()) {
                EligibilityCheck working = entry.getValue();
                remappedIds.put(entry.getKey(), working.getId());
                cleanup.push(() -> checks.deleteWorkingCustomCheck(working.getId()));
                saveCheck(working, false, cleanup);
            }
            for (EligibilityCheck original : originals.values()) {
                if (!original.getId().startsWith("P-")) continue;
                String family = checks.getWorkingId(original);
                EligibilityCheck published = copy(original, EligibilityCheck.class);
                resetCheckOwnership(published, owner);
                published.setModule(workingCopies.get(family).getModule());
                published.setId(newWorkingIds.get(family));
                published.setId(checks.getPublishedId(published, published.getVersion()));
                remappedIds.put(original.getId(), published.getId());
                cleanup.push(() -> checks.deletePublishedCustomCheck(published.getId()));
                saveCheck(published, true, cleanup);
            }
            List<Benefit> benefits = new ArrayList<>();
            List<BenefitDetail> details = new ArrayList<>();
            for (Benefit original : transfer.benefits()) {
                Benefit benefit = copy(original, Benefit.class);
                benefit.setId(UUID.randomUUID().toString());
                benefit.setOwnerId(owner);
                for (CheckConfig config : configs(benefit)) {
                    String source = sourceId(config);
                    config.setCheckId(UUID.randomUUID().toString());
                    if (source.startsWith("L")) {
                        // Use this server's endpoint, never a URL supplied by the file.
                        config.setSourceCheckId(source);
                        config.setEvaluationUrl(libraryChecks.get(source).getEvaluationUrl());
                    } else {
                        config.setSourceCheckId(remappedIds.get(source));
                        config.setEvaluationUrl(null);
                        config.setCheckModule(workingCopies.get(checks.getWorkingId(originals.get(source))).getModule());
                    }
                }
                benefits.add(benefit);
                details.add(new BenefitDetail(benefit.getId(), benefit.getName(), benefit.getDescription()));
            }
            Screener screener = Screener.create(owner, transfer.screenerName(), null);
            // Make the draft visible only once all its artifacts have been saved.
            screener.setId(UUID.randomUUID().toString());
            String id = screener.getId();
            for (Benefit benefit : benefits) {
                cleanup.push(() -> screeners.deleteCustomBenefit(id, benefit.getId()));
                screeners.saveNewCustomBenefit(id, benefit);
            }
            if (transfer.formSchema() != null && !transfer.formSchema().isNull()) {
                String path = storage.getScreenerWorkingFormSchemaPath(id);
                cleanup.push(() -> storage.deleteFile(path));
                storage.writeStringToStorage(path, mapper.writeValueAsString(transfer.formSchema()), "application/json");
            }
            screener.setBenefits(details);
            cleanup.push(() -> screeners.deleteWorkingScreener(id));
            screeners.saveNewWorkingScreener(screener);
            return screener;
        } catch (Exception failure) {
            while (!cleanup.isEmpty()) {
                try { cleanup.pop().run(); }
                catch (Exception rollbackFailure) { Log.error("Failed to clean up screener import", rollbackFailure); }
            }
            throw failure;
        }
    }

    private void saveCheck(EligibilityCheck check, boolean published, Deque<Cleanup> cleanup) throws Exception {
        String dmn = check.getDmnModel();
        check.setDmnModel(null);
        String path = storage.getCheckDmnModelPath(check.getId());
        cleanup.push(() -> storage.deleteFile(path));
        storage.writeStringToStorage(path, dmn, "application/xml");
        if (published) checks.saveNewPublishedCustomCheck(check);
        else checks.saveNewWorkingCustomCheck(check);
    }

    private void resetCheckOwnership(EligibilityCheck check, String owner) {
        check.setOwnerId(owner);
        check.setIsArchived(false);
        check.setExampleSourceId(null);
        check.setDatePublished(null);
        check.setEvaluationUrl(null);
    }

    private void reserveImportedName(EligibilityCheck check, List<EligibilityCheck> existing) throws Exception {
        String module = check.getModule();
        for (int attempt = 1; attempt <= 100; attempt++) {
            String candidate = attempt == 1 ? module : module + " (imported " + attempt + ")";
            if (existing.stream().anyMatch(other -> Objects.equals(candidate, other.getModule())
                    && Objects.equals(check.getName(), other.getName()))) continue;
            try {
                checks.reserveCheckName(check.getOwnerId(), candidate, check.getName(), check.getId());
                check.setModule(candidate);
                return;
            } catch (DocumentAlreadyExistsException collision) {
                // Another import or check creation may have claimed this name since the read.
            }
        }
        throw new BadRequestException("Could not find an available module for imported check " + check.getName());
    }

    private Map<String, EligibilityCheck> validate(ScreenerTransfer transfer) {
        if (transfer == null || !ScreenerTransfer.FORMAT.equals(transfer.format())
                || transfer.formatVersion() != ScreenerTransfer.VERSION)
            throw new BadRequestException("This file is not a supported BDT screener export.");
        if (blank(transfer.screenerName()) || transfer.benefits() == null || transfer.customChecks() == null)
            throw new BadRequestException("The screener file is missing required fields.");
        if (transfer.formSchema() != null && !transfer.formSchema().isNull() && !transfer.formSchema().isObject())
            throw new BadRequestException("The form schema must be an object.");
        Map<String, EligibilityCheck> byId = new LinkedHashMap<>();
        for (EligibilityCheck check : transfer.customChecks()) {
            if (check == null || blank(check.getId()) || blank(check.getName()) || blank(check.getModule())
                    || blank(check.getVersion()) || CheckVersion.parse(check.getVersion()).isEmpty()
                    || blank(check.getDmnModel())
                    || !(check.getId().startsWith("W-") || check.getId().startsWith("P-")))
                throw new BadRequestException("A custom check is incomplete.");
            try {
                checks.getWorkingId(check);
                new CustomCheckDmnRenameValidator().validate(check.getDmnModel(), check.getDmnModel(),
                        check.getName(), check.getName());
            } catch (Exception invalid) { throw new BadRequestException("Invalid DMN model or ID for check " + check.getName()); }
            if (byId.putIfAbsent(check.getId(), check) != null)
                throw new BadRequestException("Duplicate custom check ID.");
        }
        Set<String> benefitIds = new HashSet<>();
        Set<String> referencedFamilies = new HashSet<>();
        Set<String> referencedIds = new HashSet<>();
        for (Benefit benefit : transfer.benefits()) {
            if (benefit == null || blank(benefit.getId()) || blank(benefit.getName()) || !benefitIds.add(benefit.getId()))
                throw new BadRequestException("Invalid or duplicate benefit.");
            for (CheckConfig config : configs(benefit)) {
                if (config == null || blank(config.getCheckName())) throw new BadRequestException("Invalid configured check.");
                String source = sourceId(config);
                if (source.startsWith("L")) continue;
                EligibilityCheck check = byId.get(source);
                if (check == null) throw new BadRequestException("Missing custom check " + source);
                if (!Objects.equals(config.getCheckName(), check.getName())
                        || !Objects.equals(config.getCheckVersion(), check.getVersion()))
                    throw new BadRequestException("Custom check configuration does not match its model.");
                referencedIds.add(source);
                referencedFamilies.add(checks.getWorkingId(check));
            }
        }
        for (EligibilityCheck check : byId.values()) {
            if (!referencedFamilies.contains(checks.getWorkingId(check))
                    || (check.getId().startsWith("P-") && !referencedIds.contains(check.getId())))
                throw new BadRequestException("The file contains an unrelated custom check.");
        }
        return byId;
    }

    private List<CheckConfig> configs(Benefit benefit) {
        return benefit.getChecks() == null ? List.of() : benefit.getChecks();
    }

    private String sourceId(CheckConfig config) {
        String id = blank(config.getSourceCheckId()) ? config.getCheckId() : config.getSourceCheckId();
        if (blank(id)) throw new BadRequestException("A configured check is missing its source ID.");
        return id;
    }

    private boolean blank(String value) { return value == null || value.isBlank(); }
    private <T> T copy(T value, Class<T> type) { return mapper.convertValue(value, type); }
    @FunctionalInterface private interface Cleanup { void run() throws Exception; }
}
