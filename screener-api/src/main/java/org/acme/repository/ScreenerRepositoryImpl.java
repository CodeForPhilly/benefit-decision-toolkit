package org.acme.repository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import org.acme.constants.CollectionNames;
import org.acme.model.Screener;

import org.acme.repository.utils.FirestoreUtils;
import org.acme.repository.utils.StorageUtils;

import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class ScreenerRepositoryImpl implements ScreenerRepository {

    @Inject
    StorageUtils storageUtils;

    @Override
    public Optional<Screener> getScreener(String screenerId) {
        Optional<Map<String, Object>> dataOpt = FirestoreUtils.getFirestoreDocById(CollectionNames.SCREENER_COLLECTION, screenerId);

        if (dataOpt.isEmpty()){
            return Optional.empty();
        }

        Map<String, Object> data = dataOpt.get();

        ObjectMapper mapper = new ObjectMapper();
        Screener screener = mapper.convertValue(data, Screener.class);

        String formPath = storageUtils.getScreenerPublishedFormSchemaPath(screenerId);
        Map<String, Object>  formSchema = storageUtils.getFormSchemaFromStorage(formPath);
        screener.setFormSchema(formSchema);

        return Optional.of(screener);
    }
}

