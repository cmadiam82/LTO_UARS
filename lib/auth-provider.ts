export type AuthenticationProvider = "LOCAL" | "KEYCLOAK";

const requiredKeycloakSettings = ["KEYCLOAK_ISSUER_URL","KEYCLOAK_CLIENT_ID","KEYCLOAK_CLIENT_SECRET","KEYCLOAK_REDIRECT_URI"] as const;

export function authenticationReadiness(){
  const requestedProvider = process.env.AUTH_PROVIDER?.toUpperCase() === "KEYCLOAK" ? "KEYCLOAK" : "LOCAL";
  const missing = requiredKeycloakSettings.filter((key)=>!process.env[key]?.trim());
  return {
    activeProvider: requestedProvider as AuthenticationProvider,
    localAccountsEnabled: requestedProvider === "LOCAL",
    keycloak: {
      prepared: true,
      configured: missing.length === 0,
      implementationStatus: "PREPARED_NOT_ENABLED" as const,
      missingSettings: missing,
      issuerUrl: process.env.KEYCLOAK_ISSUER_URL || "",
      clientId: process.env.KEYCLOAK_CLIENT_ID || "",
      roleClaim: process.env.KEYCLOAK_ROLE_CLAIM || "realm_access.roles",
      scopes: process.env.KEYCLOAK_SCOPES || "openid profile email",
    },
  };
}

export function localAuthenticationAvailable(){return authenticationReadiness().activeProvider === "LOCAL";}
