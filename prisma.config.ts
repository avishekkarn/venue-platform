/**
 * Prisma configuration file (Prisma ORM v7+).
 *
 * In Prisma 7, the database connection URL is no longer specified inside
 * prisma/schema.prisma. It is specified here, in prisma.config.ts.
 * The schema's datasource block declares only the provider.
 *
 * Environment loading:
 *   Next.js automatically loads .env.local when running the dev server or
 *   build. However, the Prisma CLI (prisma migrate dev, prisma db seed) runs
 *   outside Next.js, so dotenv must load the variables explicitly.
 *
 *   In this project, local secrets live in .env.local (not .env), so we use
 *   dotenv.config({ path: ".env.local" }) instead of "dotenv/config".
 *
 * Reference: https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference
 */

import * as dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
