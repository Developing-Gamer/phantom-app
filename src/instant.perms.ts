// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const rules = {
  // Add your permission rules here
  //
  // IMPORTANT: When creating entities linked to users, make sure to:
  // 1. Use .link({ label: userId }) to connect the entity to $users
  // 2. Set appropriate permission rules that check auth.id
  //
  // Example for a user profile entity:
  // profiles: {
  //   allow: {
  //     view: "true",
  //     // Ensure user can only create their own profile
  //     create: "auth.id != null && auth.id == data.userId",
  //     // Allow update if user owns the profile (via link or direct userId field)
  //     update: "auth.id != null && (auth.id in data.ref('user.id') || auth.id == data.userId)",
  //     delete: "auth.id != null && auth.id == data.userId",
  //   },
  // },
  //
  // Example for posts owned by users:
  // posts: {
  //   allow: {
  //     view: "true",
  //     create: "isOwner",
  //     update: "isOwner",
  //     delete: "isOwner",
  //   },
  //   bind: ["isOwner", "auth.id != null && auth.id == data.ownerId"],
  // },
} satisfies InstantRules;

export default rules;
