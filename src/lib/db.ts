import { init } from "@instantdb/react";
import schema, { type AppSchema } from "@/instant.schema";

export const db = init<AppSchema>({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  schema,
  devtool: false,
});
