package org.acme.persistence;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.constants.CollectionNames;
import org.acme.constants.FieldNames;
import org.acme.model.domain.Benefit;
import org.acme.model.domain.BenefitDetail;
import org.acme.model.domain.Screener;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class BenefitRepositoryImpl implements BenefitRepository {


    public List<Benefit> getAllPublicBenefits(){

        List<Map<String, Object>> benefitMaps = FirestoreUtils.getFirestoreDocsByField(
                CollectionNames.BENEFIT_COLLECTION, FieldNames.IS_PUBLIC, true);

        ObjectMapper mapper = new ObjectMapper();
        List<Benefit> benefits = benefitMaps.stream().map( benefitMap ->  mapper.convertValue(benefitMap, Benefit.class)).toList();

        return benefits;
    }


    public Optional<Benefit> getBenefit(String benefitId){

        List<Map<String, Object>> benefitMaps = FirestoreUtils.getFirestoreDocsByField(
                CollectionNames.BENEFIT_COLLECTION, FieldNames.ID, benefitId);

        ObjectMapper mapper = new ObjectMapper();
        List<Benefit> benefits = benefitMaps.stream().map( benefitMap ->  mapper.convertValue(benefitMap, Benefit.class)).toList();

        if (benefits.isEmpty()) {
            return Optional.empty();
        } else{
            return Optional.of(benefits.getFirst());
        }
    }

    public Optional<Benefit> getCustomBenefit(String screenerId, String benefitId){
        Optional<Map<String, Object>> benefitMap = FirestoreUtils.getFirestoreDocById(
                CollectionNames.SCREENER_COLLECTION + "/" + screenerId + "/customBenefit", benefitId);

        if (benefitMap.isEmpty()) {
            return Optional.empty();
        }
        ObjectMapper mapper = new ObjectMapper();
        return Optional.of(mapper.convertValue(benefitMap.get(), Benefit.class));
    }

    public List<Benefit> getBenefitsInScreener(Screener screener) throws Exception{

        List<String> publicBenefitIds = screener.getBenefits()
                .stream()
                .filter(detail -> detail.getPublic() == true)
                .map(BenefitDetail::getId)
                .toList();

        List<Map<String, Object>> benefitsMaps = FirestoreUtils.getFirestoreDocsByIds(CollectionNames.BENEFIT_COLLECTION, publicBenefitIds);
        List<Map<String, Object>> customBenefitMaps = FirestoreUtils.getAllDocsInCollection(CollectionNames.SCREENER_COLLECTION + "/" + screener.getId() + "/customBenefit");

        benefitsMaps.addAll(customBenefitMaps);
        ObjectMapper mapper = new ObjectMapper();

        return benefitsMaps.stream().map(benefitMap ->  mapper.convertValue(benefitMap, Benefit.class)).toList();
    }

    public String saveNewBenefit(Benefit benefit) throws Exception{
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(benefit, Map.class);
        String benefitDocId = benefit.getId();
        return FirestoreUtils.persistDocumentWithId(CollectionNames.BENEFIT_COLLECTION, benefitDocId, data);
    }

    public void updateCustomBenefit(String screenerId, Benefit benefit) throws Exception {
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(benefit, Map.class);
        String benefitDocId = benefit.getId();
        FirestoreUtils.updateDocument(CollectionNames.SCREENER_COLLECTION + "/" + screenerId + "/customBenefit", data, benefitDocId);
    }

    public String saveNewCustomBenefit(String screenerId, Benefit benefit) throws Exception{
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(benefit, Map.class);
        String benefitDocId = benefit.getId();
        return FirestoreUtils.persistDocumentWithId(CollectionNames.SCREENER_COLLECTION + "/" + screenerId + "/customBenefit", benefitDocId, data);
    }

    public void updateBenefit(Benefit benefit) throws Exception{
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(benefit, Map.class);
        FirestoreUtils.updateDocument(CollectionNames.BENEFIT_COLLECTION, data, benefit.getId());
    }
}
