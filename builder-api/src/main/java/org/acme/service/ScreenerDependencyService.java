package org.acme.service;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;
import org.acme.model.domain.DmnModel;
import org.acme.model.domain.Screener;
import org.acme.model.dto.DmnImportRequest;
import org.acme.persistence.DmnModelRepository;
import org.acme.persistence.ScreenerRepository;

import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class ScreenerDependencyService {

    @Inject
    ScreenerRepository screenerRepository;

    @Inject
    DmnModelRepository dmnModelRepository;

    public Response addDependency(DmnImportRequest request, String userId) {
        String screenerId = request.screenerId;
        String groupId = request.groupId;
        String artifactId = request.artifactId;
        String version = request.version;

        if (screenerId == null || screenerId.isBlank() ||
                groupId == null || groupId.isBlank() ||
                artifactId == null || artifactId.isBlank() ||
                version == null || version.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required data.")
                    .build();
        }

        if (!isUserAuthorizedToAccessScreener(userId, screenerId)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        try {
            Optional<DmnModel> modelOpt = dmnModelRepository.getDmnModel(groupId, artifactId, version);

            if (modelOpt.isEmpty()) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "The DMN Model you are trying to import is not found."))
                        .build();
            }

            screenerRepository.addDmnDependency(screenerId, modelOpt.get());

            return Response.ok().build();

        } catch (Exception e) {
            Log.error("Failed to add DMN dependency to screener: " + screenerId, e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }


    public Response deleteDependency(DmnImportRequest request, String userId) {
        String screenerId = request.screenerId;
        String groupId = request.groupId;
        String artifactId = request.artifactId;
        String version = request.version;

        if (screenerId == null || screenerId.isBlank() ||
                groupId == null || groupId.isBlank() ||
                artifactId == null || artifactId.isBlank() ||
                version == null || version.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Error: Missing required data.")
                    .build();
        }

        if (!isUserAuthorizedToAccessScreener(userId, screenerId)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        try {
            screenerRepository.deleteDmnDependency(screenerId, groupId, artifactId, version);
            return Response.ok().build();

        } catch (Exception e) {
            Log.error("Failed to delete DMN dependency from screener: " + screenerId, e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    public Response getScreenerDependencies(String screenerId, String userId){
        if (!isIdValid(screenerId)){
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

        if (!isUserAuthorizedToAccessScreener(userId, screenerId)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        return Response.status(Response.Status.OK).build();
    }

    private boolean isUserAuthorizedToAccessScreener(String userId, String screenerId) {
        Optional<Screener> screenerOptional = screenerRepository.getScreenerMetaDataOnly(screenerId);
        if (screenerOptional.isEmpty()){
            return false;
        }
        Screener screener = screenerOptional.get();
        String ownerId = screener.getOwnerId();
        if (userId.equals(ownerId)){
            return true;
        }
        return false;
    }

    // validate Ids coming from URL to avoid injection attacks
    public boolean isIdValid(String id){
        if (!id.matches("^[a-zA-Z0-9_-]{5,64}$")) {
            return false;
        }
        return true;
    }

}
