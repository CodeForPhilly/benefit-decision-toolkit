package org.acme.persistence;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.constants.CollectionNames;
import org.acme.constants.FieldNames;
import org.acme.model.domain.Benefit;
import org.acme.model.domain.EligibilityCheck;
import org.acme.model.domain.Screener;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class EligibilityCheckRepositoryImpl implements EligibilityCheckRepository {

    public List<EligibilityCheck> getAllPublicChecks(){

        List<Map<String, Object>> checkMaps = FirestoreUtils.getFirestoreDocsByField(
                CollectionNames.ELIGIBILITY_CHECK_COLLECTION, FieldNames.IS_PUBLIC, true);

        ObjectMapper mapper = new ObjectMapper();
        List<EligibilityCheck> checks = checkMaps.stream().map( checkMap ->  mapper.convertValue(checkMap, EligibilityCheck.class)).toList();

        return checks;    }

    public Optional<EligibilityCheck> getCheck(String checkId){

        List<Map<String, Object>> checkMaps = FirestoreUtils.getFirestoreDocsByField(
                CollectionNames.ELIGIBILITY_CHECK_COLLECTION, FieldNames.ID, checkId);

        ObjectMapper mapper = new ObjectMapper();
        List<EligibilityCheck> checks = checkMaps.stream().map( checkMap ->  mapper.convertValue(checkMap, EligibilityCheck.class)).toList();

        if (checks.isEmpty()){
            return Optional.empty();
        } else {
            return Optional.of(checks.getFirst());
        }
    }

    public List<EligibilityCheck> getChecksInBenefit(Benefit benefit){

        List<String> checkIds = benefit.getChecks().stream().map(checkConfig -> checkConfig.getCheckId()).toList();
        List<Map<String, Object>> checkMaps = FirestoreUtils.getFirestoreDocsByIds(
                CollectionNames.ELIGIBILITY_CHECK_COLLECTION, checkIds);

        ObjectMapper mapper = new ObjectMapper();
        return checkMaps.stream().map(checkMap ->  mapper.convertValue(checkMap, EligibilityCheck.class)).toList();
    }

    public String saveNewCheck(EligibilityCheck check) throws Exception{
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(check, Map.class);
        String checkDocId = check.getModule() + "-" + check.getId();
        return FirestoreUtils.persistDocumentWithId(CollectionNames.ELIGIBILITY_CHECK_COLLECTION, checkDocId, data);
    }

    public void updateCheck(EligibilityCheck check) throws Exception{
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(check, Map.class);
        FirestoreUtils.updateDocument(CollectionNames.ELIGIBILITY_CHECK_COLLECTION, data, check.getId());
    }
}
