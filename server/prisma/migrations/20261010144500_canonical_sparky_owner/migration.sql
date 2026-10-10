-- Existing workspaces, including same-name 'SPARKY' collisions, are NOT
-- automatically adopted: only a trusted bootstrap or explicit administrator
-- action may claim durable SPARKY ownership.
ALTER TABLE "workspaces" ADD COLUMN "isCanonicalSparky" BOOLEAN NOT NULL DEFAULT false;
