package org.acme.auth;

import com.google.firebase.auth.FirebaseToken;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Response;

public class AuthUtils {
    public static String getUserId(ContainerRequestContext requestContext){
        FirebaseToken userToken = (FirebaseToken) requestContext.getProperty("user");
        if (userToken == null) {
            return null;
        }

        return userToken.getUid();
    }
}
