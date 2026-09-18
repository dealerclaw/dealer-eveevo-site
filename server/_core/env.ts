export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  // Evolution Funding API
  EVOLUTION_FUNDING_API_URL: process.env.EVOLUTION_FUNDING_API_URL ?? "",
  EVOLUTION_FUNDING_API_ID: process.env.EVOLUTION_FUNDING_API_ID ?? "",
  EVOLUTION_FUNDING_API_PASSWORD: process.env.EVOLUTION_FUNDING_API_PASSWORD ?? "",
  // OneAuto API for address lookup
  ONEAUTO_API_KEY: process.env.ONEAUTO_API_KEY ?? "",
  ONEAUTO_API_URL: process.env.ONEAUTO_API_URL ?? "",
};
