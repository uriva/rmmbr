import type { InstantRules } from "@instantdb/react";

const rules = {
  $default: {
    allow: {
      $default: "false",
    },
  },
  $users: {
    allow: {
      view: "auth.id == data.id",
      update: "auth.id == data.id",
    },
    fields: {
      email: "auth.id == data.id",
    },
  },
  serviceTokens: {
    allow: {
      view: "auth.id != null && auth.id in data.ref('$user.id')",
      create:
        "auth.id != null && auth.id in data.ref('$user.id') && request.modifiedFields.all(field, field in ['tokenHash', 'tokenPrefix', 'label', 'status', 'createdAt', 'expiresAt'])",
      update:
        "auth.id != null && auth.id in data.ref('$user.id') && request.modifiedFields.all(field, field in ['label', 'status', 'lastUsedAt', 'revokedAt', 'expiresAt'])",
      delete: "auth.id != null && auth.id in data.ref('$user.id')",
    },
  },
  attrs: {
    allow: {
      create: "false",
    },
  },
} satisfies InstantRules;

export default rules;
