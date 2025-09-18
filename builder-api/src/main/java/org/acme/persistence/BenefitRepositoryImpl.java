package org.acme.persistence;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.constants.CollectionNames;
import org.acme.model.domain.Benefit;

import java.util.List;
import java.util.Map;

@ApplicationScoped
public class BenefitRepositoryImpl implements BenefitRepository {


    public List<Benefit> getAllBenefits(){

        List<Map<String, Object>> benefitMaps = FirestoreUtils.getAllDocsInCollection(
                CollectionNames.BENEFIT_COLLECTION);

        ObjectMapper mapper = new ObjectMapper();
        List<Benefit> benefits = benefitMaps.stream().map( checkMap ->  mapper.convertValue(checkMap, Benefit.class)).toList();

        return benefits;
    }
}
