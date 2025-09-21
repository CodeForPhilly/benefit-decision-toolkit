package org.acme.persistence;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.constants.CollectionNames;
import org.acme.constants.FieldNames;
import org.acme.model.domain.EligibilityCheck;

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
}
