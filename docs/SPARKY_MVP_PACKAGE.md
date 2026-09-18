# SPARKY MVP Package

This repo should stay a clean AnythingLLM fork with a focused SPARKY mission layer.

SPARKY does not replace AnythingLLM. AnythingLLM remains the engine for workspaces, chat, models, tools, retrieval, agents, documents, and normal user workflows.

SPARKY adds only the product focus needed to make one workspace feel guided, memorable, and project-aware.

## Product Line

Do not build another AI brain. Give existing AI a mission, identity, and memory.

## Included In This Build

- A fixed SPARKY workspace bootstrap.
- A SPARKY system prompt and core markdown packs on disk.
- Starter suggested messages for users who do not know what to prompt yet.
- A small SPARKY record ledger using the existing `sparky_truths` table.
- Record separation between rough ideas, approved decisions, and proof.
- Approved decision/proof injection into the SPARKY chat system prompt.
- Protection against editing or deleting the canonical SPARKY workspace through normal workspace routes.
- Compatibility with normal AnythingLLM workspaces and behavior.

## Record Types

| Kind | Default Status | Enters Prompt? | Use |
|---|---|---:|---|
| `idea` | `draft` | No | Brainstorms, raw project thoughts, unapproved directions. |
| `decision` | `approved` when explicitly saved as truth | Yes, when approved | Project identity, locked choices, user-approved facts. |
| `proof` | `draft` until approved | Yes, when approved | Evidence checks, source notes, verified claims. |

A rough idea must not become a task, schedule, public claim, or permanent truth until the user approves it.

## Runtime Endpoints

These routes live under the normal workspace API and only work against the canonical `sparky` workspace.

- `GET /api/workspace/:slug/sparky-records`
- `POST /api/workspace/:slug/sparky-records`
- `POST /api/workspace/:slug/sparky-records/:recordId/approve`
- `DELETE /api/workspace/:slug/sparky-records/:recordId`
- `GET /api/workspace/:slug/sparky-truths`
- `POST /api/workspace/:slug/sparky-truths`
- `DELETE /api/workspace/:slug/sparky-truths/:truthId`

The `sparky-truths` routes remain as the simple approved-decision API. The newer `sparky-records` routes expose the full idea/decision/proof workflow.

## Not Included On Purpose

These old DIZ-A-REMIX ideas are not part of the lean MVP unless a later product decision proves they are needed:

- Desktop installer and release pipeline.
- ComfyUI/local image generation engine.
- Local Ollama routing layer beyond AnythingLLM's provider support.
- Website NPC control.
- Telegram bot logic.
- Large onboarding UI.
- Blockchain logic.
- Heavy SWARMSY API rebuild.
- AI council, nervous-system, or operating-system style architecture.

## Completion Standard

The build is considered packaged when SPARKY can:

1. Exist as a fixed workspace without hiding normal AnythingLLM.
2. Guide a user toward a clearer mission.
3. Save rough ideas without treating them as truth.
4. Promote approved decisions/proof into prompt memory.
5. Say clearly when local packs exist on disk but are not auto-ingested.
