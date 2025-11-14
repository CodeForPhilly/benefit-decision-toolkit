package org.acme.auth;

import io.quarkus.security.identity.SecurityIdentity;
import org.eclipse.microprofile.jwt.JsonWebToken;

public class AuthUtils {
    public static String getUserId(SecurityIdentity identity){
        return ((JsonWebToken)identity.getPrincipal()).getClaim("user_id");
    }
}
