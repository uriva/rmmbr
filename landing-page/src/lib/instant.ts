import { init } from "@instantdb/react";
import schema from "../../instant.schema";

export const instantAppId = import.meta.env.VITE_INSTANT_APP_ID?.trim() || "";

export const instantDb = init({
  appId: instantAppId || "missing-instant-app-id",
  apiURI: "https://api.instantdb.uriv.me",
  websocketURI: "wss://api.instantdb.uriv.me/runtime/session",
  schema,
});

export const hasInstantAppId = Boolean(instantAppId);
