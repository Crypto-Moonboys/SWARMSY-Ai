#!/usr/bin/env node
// Explicit one-time upgrade for installations predating the canonical-owner
// database field. Never infer ownership from a mutable name or prompt.
const prisma = require("../utils/prisma");

async function main() {
  const args = process.argv.slice(2);
  const idArg = args.find((arg) => arg.startsWith("--workspace-id="));
  const id = Number(idArg?.split("=")[1]);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error(
      "Usage: node scripts/claim-sparky-workspace.js --workspace-id=123 [--confirm]"
    );
  }
  const target = await prisma.workspaces.findUnique({ where: { id } });
  if (!target || target.slug !== "sparky" || target.name !== "SPARKY") {
    throw new Error(
      "The selected workspace does not match the reviewed SPARKY ID, name and slug."
    );
  }
  const other = await prisma.workspaces.findFirst({
    where: { isCanonicalSparky: true, NOT: { id } },
  });
  if (other)
    throw new Error(
      "A different workspace is already canonical; refusing to change ownership."
    );

  if (!args.includes("--confirm")) {
    console.log(
      "DRY RUN: workspace #" +
        id +
        " can be explicitly claimed. Verify its history and ownership and back up the database before repeating with --confirm. Names and prompts do not prove ownership."
    );
    return;
  }
  const outcome = await prisma.workspaces.updateMany({
    where: { id, slug: "sparky", name: "SPARKY", isCanonicalSparky: false },
    data: { isCanonicalSparky: true },
  });
  if (outcome.count !== 1 && target.isCanonicalSparky !== true) {
    throw new Error(
      "Claim was not applied. Inspect the database and retry only after review."
    );
  }
  console.log("Canonical SPARKY workspace ownership confirmed for ID " + id);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
