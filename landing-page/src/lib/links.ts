const DEFAULT_INSTANTDB_APP_URL = "https://instantdb.com";

export const INSTANTDB_APP_URL =
  import.meta.env.VITE_INSTANTDB_APP_URL?.trim() || DEFAULT_INSTANTDB_APP_URL;
