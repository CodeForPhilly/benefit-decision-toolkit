package org.acme.persistence;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import org.acme.constants.CollectionNames;
import org.acme.constants.FieldNames;
import org.acme.enums.OptionalBoolean;
import org.acme.model.domain.Benefit;
import org.acme.model.domain.EligibilityCheck;
import org.acme.model.domain.Screener;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class EligibilityCheckRepositoryImpl implements EligibilityCheckRepository {

    @Inject
    private StorageService storageService;

    public List<EligibilityCheck> getAllPublicChecks(){

        List<Map<String, Object>> checkMaps = FirestoreUtils.getFirestoreDocsByField(
                CollectionNames.ELIGIBILITY_CHECK_COLLECTION, FieldNames.IS_PUBLIC, true);

        ObjectMapper mapper = new ObjectMapper();
        List<EligibilityCheck> checks = checkMaps.stream().map( checkMap ->  mapper.convertValue(checkMap, EligibilityCheck.class)).toList();

        return checks;    }

    public Optional<EligibilityCheck> getCheck(String checkId){
        Optional<Map<String, Object>> dataOpt = FirestoreUtils.getFirestoreDocById(CollectionNames.ELIGIBILITY_CHECK_COLLECTION, checkId);
        if (dataOpt.isEmpty()){
            return Optional.empty();
        }
        Map<String, Object> data = dataOpt.get();

        ObjectMapper mapper = new ObjectMapper();
        EligibilityCheck check = mapper.convertValue(data, EligibilityCheck.class);

        String dmnPath = storageService.getCheckDmnModelPath(check.getModule(), checkId, check.getVersion());
        Optional<String> dmnModel = storageService.getStringFromStorage(dmnPath);
        dmnModel.ifPresent(check::setDmnModel);

        return Optional.of(check);
    }

    public List<EligibilityCheck> getChecksInBenefit(Benefit benefit){
        List<String> checkIds = benefit.getChecks().stream().map(checkConfig -> checkConfig.getCheckId()).toList();
        List<Map<String, Object>> checkMaps = FirestoreUtils.getFirestoreDocsByIds(
                CollectionNames.ELIGIBILITY_CHECK_COLLECTION, checkIds);

        ObjectMapper mapper = new ObjectMapper();
        return checkMaps.stream().map(checkMap -> mapper.convertValue(checkMap, EligibilityCheck.class)).toList();
    }

    public String saveNewCheck(EligibilityCheck check) throws Exception{
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(check, Map.class);
        String checkDocId = check.getId();
        return FirestoreUtils.persistDocumentWithId(CollectionNames.ELIGIBILITY_CHECK_COLLECTION, checkDocId, data);
    }

    public void updateCheck(EligibilityCheck check) throws Exception{
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(check, Map.class);
        FirestoreUtils.updateDocument(CollectionNames.ELIGIBILITY_CHECK_COLLECTION, data, check.getId());
    }
}
