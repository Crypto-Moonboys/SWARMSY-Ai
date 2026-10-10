# Canonical SPARKY ownership upgrade (database-backed)

## Why this is necessary

A workspace is **not** canonical merely because its name is `SPARKY`, its
slug is `sparky`, or it contains the current SPARKY prompt. Creator-owned
workspaces with that exact name must never be silently taken over. Canonical
ownership is now a persisted `workspaces.isCanonicalSparky` boolean, defaulting
to `false`. Client/API updates cannot change this field through the generic
Workspace writable-field allowlist. The backend checks this persisted field
plus the expected slug; frontend flags are derived from trusted DB reads.

**Deployment requires a Prisma database migration.** This is not a Cloudflare
Worker or D1 change.

## Release sequence — keep existing workspaces safe

1. Back up the actual AnythingLLM/SWARMSY database before deploying.
2. Apply migrations and regenerate the Prisma client against the same database:
   `cd server && npx prisma migrate deploy && npx prisma generate`.
3. An empty/new installation can start the app normally. The bootstrap creates
   SPARKY with the reserved slug, then marks that newly created row as canonical.
4. **Existing installs:** the migration deliberately leaves *all* existing
   workspaces unclaimed, even an exact name + slug match. Verify the **actual**
   system-owned workspace ID, not just its name/prompt. Inspect with:
   `cd server && node -e "const p=require('./utils/prisma');p.workspaces.findMany({where:{slug:'sparky'},select:{id:true,name:true,isCanonicalSparky:true}}).then(console.log).finally(()=>p.$disconnect())"`
5. With a verified ID and database backup, run the explicit claim utility
   first without `--confirm`: `cd server && node scripts/claim-sparky-workspace.js --workspace-id=YOUR_VERIFIED_ID`.
   The dry run must show the intended workspace.
6. Then run `cd server && node scripts/claim-sparky-workspace.js --workspace-id=YOUR_VERIFIED_ID --confirm`.
   It refuses missing/differently named workspaces or any conflicting canonical
   owner. **Never claim an unverified user-created collision.**
7. Restart/deploy SWARMSY, verify the canonical UI, multi-user access, records
   permissions and that an unrelated workspace with the same name is not
   promoted. No silent adoption or backup restoration occurs.

If an existing workspace occupies the reserved slug without proven system
ownership, bootstrap returns an explicit collision and does **not** rewrite its
prompt, name, chat mode or records. Resolve the ownership/slug conflict as an
administrator before expecting the canonical SPARKY workspace to become
available. Do not bypass this protection by matching the prompt.

## Creator-memory exports

The v1 JSON/Markdown handoff preserves existing record text longer than 2,000
characters. If a record/combined pack exceeds the 256 KiB format limit, export
fails visibly instead of shortening content. A 100-record overflow also fails
rather than deleting entries. The website's matching format source is kept in
sync and both repositories have regression coverage.
