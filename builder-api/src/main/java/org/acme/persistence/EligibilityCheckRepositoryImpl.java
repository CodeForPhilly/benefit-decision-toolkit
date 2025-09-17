package org.acme.persistence;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.constants.CollectionNames;
import org.acme.model.domain.EligibilityCheck;

import java.util.List;
import java.util.Map;

@ApplicationScoped
public class EligibilityCheckRepositoryImpl implements EligibilityCheckRepository {

    public List<EligibilityCheck> getAllChecks(){

        List<Map<String, Object>> checkMaps = FirestoreUtils.getAllDocsInCollection(
                CollectionNames.ELIGIBILITY_CHECK_COLLECTION);

        ObjectMapper mapper = new ObjectMapper();
        List<EligibilityCheck> checks = checkMaps.stream().map( checkMap ->  mapper.convertValue(checkMap, EligibilityCheck.class)).toList();

        return checks;    }
}
