package org.acme.controller;
import jakarta.ws.rs.core.Response;
import org.acme.model.domain.Screener;
import org.acme.model.dto.DmnImportRequest;
import org.acme.persistence.ScreenerRepository;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.acme.service.ScreenerDependencyService;
import org.junit.jupiter.api.extension.ExtendWith;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ScreenerResourceTest {

    @Mock
    ScreenerRepository screenerRepository;

    @InjectMocks
    ScreenerDependencyService importService = new ScreenerDependencyService();

    private final String TEST_USER_ID = "TEST_USER_ID";
    private final String TEST_SCREENER_ID = "TEST_SCREENER_ID";

    @Test
    void test_whenMissingScreenerId_addImport_returnsStatus400(){
        DmnImportRequest request = getTestRequest();
        request.screenerId = null;
        Response response = importService.addDependency(request, TEST_USER_ID);
        assertEquals(Response.Status.BAD_REQUEST.getStatusCode(), response.getStatus());
    }

    @Test
    void test_whenMissingGroupId_addImport_returnsStatus400(){
        DmnImportRequest request = getTestRequest();
        request.groupId = null;
        Response response = importService.addDependency(request, TEST_USER_ID);
        assertEquals(Response.Status.BAD_REQUEST.getStatusCode(), response.getStatus());
    }

    @Test
    void test_whenMissingArtifactId_addImport_returnsStatus400(){
        DmnImportRequest request = getTestRequest();
        request.artifactId = null;
        Response response = importService.addDependency(request, TEST_USER_ID);
        assertEquals(Response.Status.BAD_REQUEST.getStatusCode(), response.getStatus());
    }

    @Test
    void test_whenMissingVersion_addImport_returnsStatus400(){
        DmnImportRequest request = getTestRequest();
        request.version = null;
        Response response = importService.addDependency(request, TEST_USER_ID);
        assertEquals(Response.Status.BAD_REQUEST.getStatusCode(), response.getStatus());
    }

    @Test
    void test_whenMissingUserId_addImport_resturnsStatus401(){
        DmnImportRequest request = getTestRequest();
        Response response = importService.addDependency(request, null);
        assertEquals(Response.Status.UNAUTHORIZED.getStatusCode(), response.getStatus());
    }

    @Test
    void test(){
        DmnImportRequest request = getTestRequest();
        Screener screener = getTestScreener();
        when(screenerRepository.getScreenerMetaDataOnly(eq(TEST_SCREENER_ID))).thenReturn(Optional.of(screener));
        Response response = importService.addDependency(request, TEST_USER_ID);
        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
    }

    private DmnImportRequest getTestRequest(){
        DmnImportRequest request = new DmnImportRequest();
        request.screenerId = "TEST_SCREENER_ID";
        request.groupId = "TEST_GROUP_ID";
        request.artifactId = "TEST_ARTIFACT_ID";
        request.version = "TEST_VERSION";
        return request;
    }

    private Screener getTestScreener(){
        Screener screener = new Screener();
        screener.setOwnerId(TEST_USER_ID);
        return screener;
    }
}
