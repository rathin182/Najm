import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: { path: "prisma/migrations" },
    // Prisma's config requires a datasource URL even for `prisma generate`,
    // which does not connect to the database. Keep builds working when the
    // deployment environment only needs to generate the client.
    datasource: {
        url: process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/realarab?schema=public",
    },
});
