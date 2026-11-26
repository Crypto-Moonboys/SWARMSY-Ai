# Moonboys Brand Brain skill

Use this skill in the private, single-user SWARMSY owner instance. It gives SWARMSY a read-only route to current, owner-approved excerpts from the Brand Brain. It uses the model already configured in SWARMSY.

Copy this skill directory into the instance's `plugins/agent-skills` folder under `STORAGE_DIR` (or `server/storage` for development). Set these values in the private SWARMSY server environment and restart the server.

- `BRAIN_SWARMSY_OWNER_INSTANCE=true`
- `BRAIN_ACCESS_CLIENT_ID` and `BRAIN_ACCESS_CLIENT_SECRET` from the dedicated Brain context Access application
- `BRAIN_CONTEXT_TOKEN`, matching the independent secret on the Brain Worker

In the private SPARKY workspace, start with `@agent` and ask a brand question. For example, “Use the Brand Brain to tell me what changed in the brand mission and cite the source and revision.” Check that this skill appears among the available agent tools. A regular chat turn without agent tools may not use the Brain.

Archive excerpts become part of the agent conversation. Use a local SWARMSY model for records you do not want sent to a model provider. This skill uses the existing server's single-user mode check and fails closed if it cannot confirm that mode. It can neither create archive records nor publish content.

Run `node --test skills/moonboys-brand-brain/handler.test.cjs` from the repository root to check the invocation contract. Complete a real owner-only installation and service-access smoke test before use.
