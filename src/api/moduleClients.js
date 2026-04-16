import { createClient } from "@base44/sdk";
import { appParams } from "@/lib/app-params";

function getEnvValue(primaryKey, fallbackValue = "") {
  const value = import.meta.env[primaryKey];
  return value && String(value).trim() ? value : fallbackValue;
}

function createModuleClient({ appId, appBaseUrl }) {
  if (!appId || !appBaseUrl) {
    return {
      entities: new Proxy(
        {},
        {
          get(_, entityName) {
            return {
              list() {
                return Promise.reject(
                  new Error(`Base44 client is not configured for entity "${String(entityName)}".`),
                );
              },
              filter() {
                return Promise.reject(
                  new Error(`Base44 client is not configured for entity "${String(entityName)}".`),
                );
              },
              create() {
                return Promise.reject(
                  new Error(`Base44 client is not configured for entity "${String(entityName)}".`),
                );
              },
              update() {
                return Promise.reject(
                  new Error(`Base44 client is not configured for entity "${String(entityName)}".`),
                );
              },
              delete() {
                return Promise.reject(
                  new Error(`Base44 client is not configured for entity "${String(entityName)}".`),
                );
              },
            };
          },
        },
      ),
    };
  }

  return createClient({
    appId,
    token: appParams.token,
    functionsVersion: appParams.functionsVersion,
    serverUrl: "",
    requiresAuth: false,
    appBaseUrl,
  });
}

export const challengeBase44 = createModuleClient({
  appId: getEnvValue("VITE_CHALLENGE_BASE44_APP_ID", appParams.appId),
  appBaseUrl: getEnvValue("VITE_CHALLENGE_BASE44_APP_BASE_URL", appParams.appBaseUrl),
});

export const laboratoiresBase44 = createModuleClient({
  appId: getEnvValue("VITE_LABOS_BASE44_APP_ID", "69bc0b5dfa80bc34aa4fbf80"),
  appBaseUrl: getEnvValue("VITE_LABOS_BASE44_APP_BASE_URL", "https://suivilabrosny2.base44.app"),
});

export const tgBase44 = createModuleClient({
  appId: getEnvValue("VITE_TG_BASE44_APP_ID", "69cfa51c5eb5406b72c786b8"),
  appBaseUrl: getEnvValue("VITE_TG_BASE44_APP_BASE_URL", "https://suivitgrosny2.base44.app"),
});

export const vigilanceBase44 = createModuleClient({
  appId: getEnvValue("VITE_VIGILANCE_BASE44_APP_ID", "69ce417478efad2b62979a1a"),
  appBaseUrl: getEnvValue("VITE_VIGILANCE_BASE44_APP_BASE_URL", "https://vigilancerefsrosny2.base44.app"),
});
