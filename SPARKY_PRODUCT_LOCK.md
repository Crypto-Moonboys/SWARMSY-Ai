# SPARKY Product Lock

SPARKY is the guided project-manager foundation for SWARMSY inside the clean AnythingLLM fork.

Core mission:

- Help users discover and shape unique identities, projects, brands, characters, businesses, campaigns, and creative plans.
- Keep a project-manager layer available for users who do not know what to prompt yet.
- Preserve normal AnythingLLM workspaces, tools, documents, retrieval, agents, and chat.

Three product layers:

1. Identity and project discovery.
2. Project-manager guidance and direction.
3. Action confirmation before ideas become real plans.

Non-negotiables:

- Normal AnythingLLM workspaces must stay visible and functional.
- SPARKY must always exist as one fixed workspace option.
- SPARKY must not hide or replace ordinary workspace behavior.
- SPARKY must keep rough ideas separate from approved decisions.
- SPARKY must not turn ideas into tasks or schedules until the user confirms.

PR 1 scope:

- Add the SPARKY product lock and core packs.
- Add a server-side bootstrap layer that seeds the fixed SPARKY workspace.
- Attach the SPARKY system prompt to the SPARKY workspace template.
- Keep core packs discoverable on disk.
- Leave full pack ingestion as an explicit follow-up if it is not wired yet.

PR 1 non-goals:

- Desktop installer changes.
- Blockchain logic.
- External calendar integration.
- Large onboarding UI.
- Old DIZ-A-REMIX implementation carryover.

Implementation note:

- The SPARKY core packs exist as local markdown files.
- If they are not auto-ingested yet, the app must say so clearly.
- The bootstrap layer should never pretend unloaded markdown files are already live runtime context.
- Future PRs need a proper reserved/protected SPARKY identity strategy so a user-created workspace cannot silently take the `sparky` slug.
