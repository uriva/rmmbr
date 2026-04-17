import { i } from "@instantdb/react";

const schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
    }),
    serviceTokens: i.entity({
      tokenHash: i.string().unique().indexed(),
      tokenPrefix: i.string().indexed(),
      label: i.string().optional(),
      status: i.string().indexed(),
      createdAt: i.date().indexed(),
      lastUsedAt: i.date().optional().indexed(),
      revokedAt: i.date().optional().indexed(),
      expiresAt: i.date().optional().indexed(),
    }),
  },
  links: {
    serviceTokenOwner: {
      forward: {
        on: "serviceTokens",
        has: "one",
        label: "$user",
        required: true,
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "serviceTokens",
      },
    },
  },
});

export default schema;
