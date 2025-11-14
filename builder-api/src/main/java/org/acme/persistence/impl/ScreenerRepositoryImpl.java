package org.acme.persistence.impl;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.constants.CollectionNames;
import org.acme.constants.FieldNames;
import org.acme.model.domain.BenefitDetail;
import org.acme.model.domain.Screener;
import org.acme.persistence.FirestoreUtils;
import org.acme.persistence.ScreenerRepository;
import org.acme.persistence.StorageService;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class ScreenerRepositoryImpl implements ScreenerRepository {

    @Inject
    private StorageService storageService;

    @Override
    public List<Screener> getScreeners(String userId) {

        List<Map<String, Object>> screenersMaps = FirestoreUtils.getFirestoreDocsByField(
                CollectionNames.SCREENER_COLLECTION,
                FieldNames.OWNER_ID,
                userId);

        ObjectMapper mapper = new ObjectMapper();
        List<Screener> screeners = screenersMaps.stream().map(screenerMap ->  mapper.convertValue(screenerMap, Screener.class)).toList();

        return screeners;
    }

    @Override
    public Optional<Screener> getScreener(String screenerId){
        Optional<Map<String, Object>> dataOpt = FirestoreUtils.getFirestoreDocById(CollectionNames.SCREENER_COLLECTION, screenerId);
        if (dataOpt.isEmpty()){
            return Optional.empty();
        }
        Map<String, Object> data = dataOpt.get();

        ObjectMapper mapper = new ObjectMapper();
        Screener screener = mapper.convertValue(data, Screener.class);

        String formPath = storageService.getScreenerWorkingFormSchemaPath(screenerId);
        Map<String, Object>  formSchema = storageService.getFormSchemaFromStorage(formPath);
        screener.setFormSchema(formSchema);

        return Optional.of(screener);
    }

    @Override
    public Optional<Screener> getScreenerMetaDataOnly(String screenerId){
        Optional<Map<String, Object>> dataOpt = FirestoreUtils.getFirestoreDocById(CollectionNames.SCREENER_COLLECTION, screenerId);
        if (dataOpt.isEmpty()){
            return Optional.empty();
        }
        Map<String, Object> data = dataOpt.get();
        ObjectMapper mapper = new ObjectMapper();
        Screener screener = mapper.convertValue(data, Screener.class);

        return Optional.of(screener);
    }

    @Override
    public String saveNewScreener(Screener screener) throws Exception{
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(screener, Map.class);
        return FirestoreUtils.persistDocument(CollectionNames.SCREENER_COLLECTION, data);
    }

    @Override
    public void updateScreener(Screener screener) throws Exception {
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(screener, Map.class);

        // Remove DMN model and form schema if included on the model.
        // We don't want to save these artifacts as fields on the firestore document.
        // These are saved separately on in cloud storage.
        data.remove("dmnModel");
        data.remove("formSchema");

        FirestoreUtils.updateDocument(CollectionNames.SCREENER_COLLECTION, data, screener.getId());
    }

    public void addBenefitDetailToScreener(String screenerId, BenefitDetail benefitDetail) throws Exception {
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        Map<String, Object> data = mapper.convertValue(benefitDetail, Map.class);
        FirestoreUtils.addObjectToArrayField(CollectionNames.SCREENER_COLLECTION, screenerId, FieldNames.BENEFITS, data);
    }

    @Override
    public void deleteScreener(String screenerId) throws Exception {
        FirestoreUtils.deleteDocument(CollectionNames.SCREENER_COLLECTION, screenerId);
    }
}
