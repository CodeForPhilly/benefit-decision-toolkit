package org.acme.persistence;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.constants.CollectionNames;
import org.acme.constants.FieldNames;
import org.acme.model.domain.Benefit;
import org.acme.model.domain.EligibilityCheck;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class BenefitRepositoryImpl implements BenefitRepository {


    public List<Benefit> getAllPublicBenefits(){

        List<Map<String, Object>> benefitMaps = FirestoreUtils.getFirestoreDocsByField(
                CollectionNames.BENEFIT_COLLECTION, FieldNames.IS_PUBLIC, true);

        ObjectMapper mapper = new ObjectMapper();
        List<Benefit> benefits = benefitMaps.stream().map( checkMap ->  mapper.convertValue(checkMap, Benefit.class)).toList();

        return benefits;
    }


    public Optional<Benefit> getBenefit(String benefitId){

        List<Map<String, Object>> benefitMaps = FirestoreUtils.getFirestoreDocsByField(
                CollectionNames.BENEFIT_COLLECTION, FieldNames.ID, benefitId);

        ObjectMapper mapper = new ObjectMapper();
        List<Benefit> benefits = benefitMaps.stream().map( checkMap ->  mapper.convertValue(checkMap, Benefit.class)).toList();

        if (benefits.isEmpty()) {
            return Optional.empty();
        } else{
            return Optional.of(benefits.getFirst());
        }
    }

    public String saveNewBenefit(Benefit benefit) throws Exception{
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(benefit, Map.class);
        String benefitDocId = benefit.getId();
        return FirestoreUtils.persistDocumentWithId(CollectionNames.BENEFIT_COLLECTION, benefitDocId, data);
    }


    public String saveNewCustomBenefit(String screenerId, Benefit benefit) throws Exception{
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(benefit, Map.class);
        String benefitDocId = benefit.getId();
        return FirestoreUtils.persistDocumentWithId(CollectionNames.SCREENER_COLLECTION + "/" + screenerId + "/customBenefit", benefitDocId, data);
    }
}
