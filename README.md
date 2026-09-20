<a name="readme-top"></a>

![SWARMSY AnythingLLM](images/SWARMSY%20ANYTHINGLLM.jpg)

![SWARMSY Window](images/SWARMSY%20WINDOW.jpg)

# SWARMSY-Ai

SWARMSY-Ai is an underground creator operating system built on top of AnythingLLM, with a fixed **SPARKY** workspace at the centre.

https://cryptomoonboys.com/

Yes, it helps people plan projects. But the point is bigger than another planner app.

SPARKY turns AnythingLLM into a street-level creator engine: part project manager, part art director, part lawful guerrilla-marketing operator. It is built around the model used by street artists, Graffiti Kings, Crypto Moonboys, mascot-led culture brands, underground campaigns, and wall-to-web proof loops: create a message, build a mascot or mark, make it visible locally, push it online, document the proof, and repeat until it becomes a movement.

SPARKY is the world's GRAFFITI KING inside AnythingLLM. It helps beginners use normal AnythingLLM chat, uploads, tools, agents, records, calendars, and integrations as an AI swarm for creator work: PFPs, mascots, lore, posters, stencils, websites, proof logs, social content, bot plans, and daily actions.

No-install ChatGPT version:

- [SPARKY For ChatGPT Users](https://crypto-moonboys.github.io/SWARMSY-Ai/gpt-users.html)

The upstream AnythingLLM README is kept below for base product, provider, hosting, and development documentation.

## Current Build

### SPARKY Workspace

The app seeds and protects a canonical workspace:

- **Name:** SPARKY
- **Slug:** `sparky`
- **Mode:** chat
- **Prompt source:** `server/sparky/packs/core/sparky-system-prompt.md`
- **Seed/bootstrap code:** `server/utils/sparky/index.js`

SPARKY is refreshed by the Prisma seed step. The seed updates the SPARKY system prompt and suggested starter messages when the canonical files change.

### SPARKY Operating Spine

SPARKY is not meant to behave like a generic chatbot, bland branding assistant, or ordinary productivity planner.

Its current spine is:

- the world's GRAFFITI KING inside AnythingLLM
- lawful Graffiti Bot / guerrilla brand strategist
- underground street-level creator operator
- local-first campaign planner
- PFP-to-identity builder
- stencil/icon art director
- cyber-street lore builder
- proof-focused project manager
- beginner-friendly creator empire operator

SPARKY should think in terms of:

- message
- mascot, mark, stencil, icon, or character
- underground hook
- local visibility
- lawful real-world proof surface
- digital proof echo
- next action
- website/archive
- following/community
- AI swarm handoff

Physical activation must stay lawful, permissioned, safe, and non-harmful. SWARMSY studies the mechanics of street art, shock advertising, mascot culture, mystery campaigns, and guerrilla marketing, then converts them into legal creator workflows.

### Beginner Creator Empire Model

SPARKY should make the build simple enough for non-technical, non-marketing users to follow every day:

1. Choose a lane.
2. Create a message.
3. Create a mascot, mark, signal, or character.
4. Give it lore, a world, or a story hook.
5. Define the look.
6. Make one lawful local proof.
7. Echo it online.
8. Document it on a website, wiki, proof log, or archive.
9. Build a following from repeated proof.
10. Use AnythingLLM tools, uploads, agents, image prompts, calendars, records, and integrations to remove friction.
11. Give the next daily action.

The user should not need to know strategy language. SPARKY should pick sensible defaults, recommend one route, and keep the user moving. The mission is: follow SPARKY and do the next proof-building action.

### Main User Paths

SPARKY currently supports three main lanes:

1. **PFP / Avatar Holder**
   - Builds a PFP, Moonboy, NFT, avatar, or character into lore, identity, icon/stencil direction, merch/poster surfaces, local activation, and digital proof.

2. **Brand / Product / Art / Music Project**
   - Helps artists, singers, musicians, painters, products, local businesses, services, events, and brands build an underground street-level identity campaign that can start locally and snowball online.

3. **No-Idea User**
   - Gives strong local-first directions without forcing the user through a generic marketing questionnaire.

### Deterministic Starter Replies

The six starter messages are now handled in code before the model is called.

File:

- `server/utils/sparky/starterReplies.js`

Chat hook:

- `server/endpoints/chat.js`

This avoids small local models drifting into generic output for starter buttons.

Current starter messages:

- `Plan today’s local empire build.`
- `I have a Moonboy/PFP to build.`
- `I have a brand, product or art project.`
- `I have no idea. Build me a local-first direction.`
- `Make a street-level lore, stencil, merch and campaign pack.`
- `Map the tools, bots and automation needed.`

Only exact starter messages are short-circuited. Normal user replies still go through the configured LLM.

### Crypto Moonboys Packs

SPARKY core packs live in:

- `server/sparky/packs/core/`

Important current packs include:

- `sparky-system-prompt.md`
- `daily-empire-operating-system.md`
- `creator-empire-for-beginners.md`
- `moonboy-pfp-identity-builder.md`
- `crypto-moonboys-latest-canon-brand-vision.md`
- `crypto-moonboys-w81-condensed-canon-digest.md`
- `crypto-moonboys-w81-canon-biography.md`
- `visibility-doctrine.md`
- `physical-digital-wall.md`
- `campaign-protocol-engine.md`
- `authority-provenance.md`

Source order for Crypto Moonboys lore should stay:

1. latest canon and brand vision
2. W81 condensed canon digest
3. W81 canon biography pack
4. raw W81 archive or specific faction files when available
5. old public wiki/category pages for style and links only

### Image Creation Reality

SPARKY does not automatically create images unless AnythingLLM Image Generation or another real image-generation/editing tool is connected.

When the user asks for an image, poster, logo, mascot, stencil, merch visual, toy, PFP variant, or icon, SPARKY should try to keep them inside AnythingLLM first:

```text
/img [image prompt]
```

Important: `/img` depends on **Settings -> AI Providers -> Image Generation**. Ollama selected as the LLM does not automatically make `/img` work.

If `/img` is not configured, not available in the current build, or falls through as normal chat text, SPARKY should explain that the image command did not run and provide:

- Visual Production Brief
- exact AnythingLLM `/img` prompt to try
- setup note: **Settings -> AI Providers -> Image Generation**
- external fallback prompt for GPT image generation, Grok, Midjourney, Leonardo, Ideogram, Firefly, Stable Diffusion, or another image/design tool

SPARKY must not pretend an image was created when it was only described.

External fallback prompts should not be bare prompts only. They should include a short message to the external AI explaining the project scope so GPT, Grok, Midjourney, Leonardo, Ideogram, Firefly, Stable Diffusion, or another design tool can continue the brainstorm instead of producing a one-shot generic image.

### Automation Reality

SPARKY separates work into:

- **Manual Now:** plan, copy, prompts, checklists, proof cards, and next actions
- **Agent-Assisted:** available tools can help after approval
- **Auto Mode:** only active after real calendars, APIs, bots, webhooks, background jobs, or accounts are connected and approved

SPARKY must not claim it scheduled, posted, emailed, uploaded, deployed, scraped, bought, or automated anything unless a real runtime tool actually did it.

## Local Setup Notes

Standard setup is inherited from AnythingLLM, but this repo currently needs these commands often during local Windows development.

Clone and install:

```bat
git clone https://github.com/Crypto-Moonboys/SWARMSY-Ai.git
cd SWARMSY-Ai
yarn setup
```

On Windows, if `yarn setup` fails because `cp` is not available, copy env files manually:

```bat
copy frontend\.env.example frontend\.env
copy server\.env.example server\.env.development
copy collector\.env.example collector\.env
copy docker\.env.example docker\.env
```

If local certificate inspection causes Prisma or package download errors:

```bat
set NODE_TLS_REJECT_UNAUTHORIZED=0
```

Refresh SPARKY after pulling prompt, pack, starter, or seed changes:

```bat
set NODE_TLS_REJECT_UNAUTHORIZED=0
yarn prisma:seed
```

Run the app in three terminals:

```bat
yarn dev:server
yarn dev:collector
yarn dev:frontend
```

Default frontend is usually:

```text
http://localhost:3000
```

## Development Rules For This Fork

When editing SPARKY behavior:

- Protect the positioning: SWARMSY is an underground street-level creator system built on AnythingLLM, not a generic planner skin.
- Keep SPARKY thinking like the world's GRAFFITI KING: message, mascot, mark, wall, proof, archive, following, next action.
- Keep deterministic starter replies in sync with `sparky-system-prompt.md`.
- Do not make starter replies claim Auto Mode, image generation, posting, scheduling, uploading, or deployment is active by default.
- Do not invent PFP traits, faction facts, image details, template IDs, rarity, or canon.
- Do not turn HODL Warriors Army into a normal faction; it is the higher wartime unity layer.
- Keep local-first activation lawful and permissioned.
- Keep upstream AnythingLLM behavior intact unless a change is explicitly SPARKY-specific.
- Keep SPARKY changes scoped to `server/sparky/`, `server/utils/sparky/`, and small chat/bootstrap hooks unless a broader change is genuinely needed.

---

> [!NOTE]
> We are also working on [Open Computer](/open-computer) which gives an entire computer environment for AI Agents to use.
>
> This will bring AnythingLLM's agent capabilities to a new level and a novel UX paradigm for AI Agent use.
>
> ⭐ Star the repo to stay updated!

<p align="center">
  <a href="https://anythingllm.com"><img src="https://github.com/Mintplex-Labs/anything-llm/blob/master/images/wordmark.png?raw=true" alt="AnythingLLM logo"></a>
</p>

<div align='center'>
<a href="https://trendshift.io/repositories/2415" target="_blank"><img src="https://trendshift.io/api/badge/repositories/2415" alt="Mintplex-Labs%2Fanything-llm | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
</div>

<p align="center">
    <b>AnythingLLM:</b> The all-in-one AI app you were looking for.<br />
    Chat with your docs, use AI Agents, hyper-configurable, multi-user, & no frustrating setup required.
</p>

<p align="center">
  <a href="https://discord.gg/6UyHPeGZAC" target="_blank">
      <img src="https://img.shields.io/badge/chat-mintplex_labs-blue.svg?style=flat&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAH1UExURQAAAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////r6+ubn5+7u7/3+/v39/enq6urq6/v7+97f39rb26eoqT1BQ0pOT4+Rkuzs7cnKykZKS0NHSHl8fdzd3ejo6UxPUUBDRdzc3RwgIh8jJSAkJm5xcvHx8aanqB4iJFBTVezt7V5hYlJVVuLj43p9fiImKCMnKZKUlaaoqSElJ21wcfT09O3u7uvr6zE0Nr6/wCUpK5qcnf7+/nh7fEdKTHx+f0tPUOTl5aipqiouMGtubz5CRDQ4OsTGxufn515hY7a3uH1/gXBydIOFhlVYWvX29qaoqCQoKs7Pz/Pz87/AwUtOUNfY2dHR0mhrbOvr7E5RUy8zNXR2d/f39+Xl5UZJSx0hIzQ3Odra2/z8/GlsbaGjpERHSezs7L/BwScrLTQ4Odna2zM3Obm7u3x/gKSmp9jZ2T1AQu/v71pdXkVISr2+vygsLiInKTg7PaOlpisvMcXGxzk8PldaXPLy8u7u7rm6u7S1tsDBwvj4+MPExbe4ueXm5s/Q0Kyf7ewAAAAodFJOUwAABClsrNjx/QM2l9/7lhmI6jTB/kA1GgKJN+nea6vy/MLZQYeVKK3rVA5tAAAAAWJLR0QB/wIt3gAAAAd0SU1FB+cKBAAmMZBHjXIAAAISSURBVDjLY2CAAkYmZhZWNnYODnY2VhZmJkYGVMDIycXNw6sBBbw8fFycyEoYGfkFBDVQgKAAPyMjQl5IWEQDDYgIC8FUMDKKsmlgAWyiEBWMjGJY5YEqxMAqGMWFNXAAYXGgAkYJSQ2cQFKCkYFRShq3AmkpRgYJbghbU0tbB0Tr6ukbgGhDI10gySfBwCwDUWBsYmpmDqQtLK2sbTQ0bO3sHYA8GWYGWWj4WTs6Obu4ami4OTm7exhqeHp5+4DCVJZBDmqdr7ufn3+ArkZgkJ+fU3CIRmgYWFiOARYGvo5OQUHhEUAFTkF+kVHRsLBgkIeyYmLjwoOc4hMSk5JTnINS06DC8gwcEEZ6RqZGlpOfc3ZObl5+gZ+TR2ERWFyBQQFMF5eklmqUpQb5+ReU61ZUOvkFVVXXQBSAraitq29o1GiKcfLzc29u0mjxBzq0tQ0kww5xZHtHUGeXhkZhdxBYgZ4d0LI6c4gjwd7siQQraOp1AivQ6CuAKZCDBBRQQQNQgUb/BGf3cqCCiZOcnCe3QQIKHNRTpk6bDgpZjRkzg3pBQTBrdtCcuZCgluAD0vPmL1gIdvSixUuWgqNs2YJ+DUhkEYxuggkGmOQUcckrioPTJCOXEnZ5JS5YslbGnuyVERlDDFvGEUPOWvwqaH6RVkHKeuDMK6SKnHlVhTgx8jeTmqy6Eij7K6nLqiGyPwChsa1MUrnq1wAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMy0xMC0wNFQwMDozODo0OSswMDowMB9V0a8AAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjMtMTAtMDRUMDA6Mzg6NDkrMDA6MDBuCGkTAAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDIzLTEwLTA0VDAwOjM4OjQ5KzAwOjAwOR1IzAAAAABJRU5ErkJggg==" alt="Discord">
  </a> |
  <a href="https://github.com/Mintplex-Labs/anything-llm/blob/master/LICENSE" target="_blank">
      <img src="https://img.shields.io/static/v1?label=license&message=MIT&color=white" alt="License">
  </a> |
  <a href="https://docs.anythingllm.com" target="_blank">
    Docs
  </a> |
   <a href="https://my.mintplexlabs.com/aio-checkout?product=anythingllm" target="_blank">
    Hosted Instance
  </a>
</p>

<p align="center">
  <b>English</b> · <a href='./locales/README.zh-CN.md'>简体中文</a> · <a href='./locales/README.ja-JP.md'>日本語</a>
</p>

<p align="center">
👉 AnythingLLM for desktop (Mac, Windows, & Linux)! <a href="https://anythingllm.com/download" target="_blank"> Download Now</a>
</p>

Chat with your docs. Automate complex workflows with AI Agents. Hyper-configurable, multi-user ready, battle-tested—and runs locally by default with zero setup friction.

![Chatting](https://github.com/Mintplex-Labs/anything-llm/releases/download/v1.11.2/AnythingLLM720p.gif)

<details>
<summary><kbd>Watch the demo!</kbd></summary>

[![Watch the video](/images/youtube.png)](https://youtu.be/f95rGD9trL0)

</details>

### Product Overview

AnythingLLM is the all-in-one AI application that lets you build a private, fully-featured ChatGPT—without compromises. Connect your favorite local or cloud LLM, ingest your documents, and start chatting in minutes. Out of the box you get built-in agents, multi-user support, vector databases, and document pipelines — no extra configuration required.

AnythingLLM supports multiple users as well where you can control the access and experience per user without compromising the security or privacy of the instance or your intellectual property.

## Cool Features of AnythingLLM

- [Dynamic Model Routing](https://docs.anythingllm.com/model-router/overview) - Automatically route chats to the best provider & model for the conversation based on rules you define.
- [Automatic & User Managed Memories](https://docs.anythingllm.com/features/memories) - Have your LLM remember important information about you or your workspace.
- [Scheduled Tasks](https://docs.anythingllm.com/scheduled-jobs/overview) - Run recurring tasks or prompts on a cron schedule with full agent capabilities.
- [Intelligent Skill Selection](https://docs.anythingllm.com/agent/intelligent-tool-selection) Enable **unlimited** tools for your models while reducing token usage by up to 80% per query
- [No-code AI Agent builder](https://docs.anythingllm.com/agent-flows/overview)
- [MCP-compatibility](https://docs.anythingllm.com/mcp-compatibility/overview)
- [Multi-modal support (both closed and open-source LLMs!)](https://docs.anythingllm.com/features/multimodal)
- [Custom AI Agents](https://docs.anythingllm.com/agent/custom/introduction)
- 👤 Multi-user instance support and permissioning _Docker version only_
- 🦾 Agents inside your workspace (browse the web, etc)
- 💬 [Custom Embeddable Chat widget for your website](https://github.com/Mintplex-Labs/anythingllm-embed/blob/main/README.md) _Docker version only_
- 📖 Multiple document type support (PDF, TXT, DOCX, etc)
- Intuitive chat UI with drag-and-drop uploads and source citations.
- Production-ready for any cloud deployment.
- Works with all popular [closed and open-source LLM providers](#supported-llms-embedder-models-speech-models-and-vector-databases).
- Built-in optimizations for large document sets—lower costs and faster responses than other chat UIs.
- Full Developer API for custom integrations!
- ...and much more—install in minutes and see for yourself.

### Supported LLMs, Embedder Models, Speech models, and Vector Databases

**Large Language Models (LLMs):**

- [Any open-source llama.cpp compatible model](/server/storage/models/README.md#text-generation-llm-selection)
- [OpenAI](https://openai.com)
- [OpenAI (Generic)](https://openai.com)
- [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
- [AWS Bedrock](https://aws.amazon.com/bedrock/)
- [Anthropic](https://www.anthropic.com/)
- [NVIDIA NIM (chat models)](https://build.nvidia.com/explore/discover)
- [Google Gemini Pro](https://ai.google.dev/)
- [Ollama (chat models)](https://ollama.ai/)
- [LM Studio (all models)](https://lmstudio.ai)
- [LocalAI (all models)](https://localai.io/)
- [Together AI (chat models)](https://www.together.ai/)
- [Fireworks AI (chat models)](https://fireworks.ai/)
- [Perplexity (chat models)](https://www.perplexity.ai/)
- [OpenRouter (chat models)](https://openrouter.ai/)
- [DeepSeek (chat models)](https://deepseek.com/)
- [Mistral](https://mistral.ai/)
- [Groq](https://groq.com/)
- [Cohere](https://cohere.com/)
- [KoboldCPP](https://github.com/LostRuins/koboldcpp)
- [LiteLLM](https://github.com/BerriAI/litellm)
- [Text Generation Web UI](https://github.com/oobabooga/text-generation-webui)
- [Apipie](https://apipie.ai/)
- [xAI](https://x.ai/)
- [Z.AI (chat models)](https://z.ai/model-api)
- [Novita AI (chat models)](https://novita.ai/model-api/product/llm-api?utm_source=github_anything-llm&utm_medium=github_readme&utm_campaign=link)
- [PPIO](https://ppinfra.com?utm_source=github_anything-llm)
- [Gitee AI](https://ai.gitee.com/)
- [Moonshot AI](https://www.moonshot.ai/)
- [Microsoft Foundry Local](https://github.com/microsoft/Foundry-Local)
- [CometAPI (chat models)](https://api.cometapi.com/)
- [Docker Model Runner](https://docs.docker.com/ai/model-runner/)
- [PrivateModeAI (chat models)](https://privatemode.ai/)
- [SambaNova Cloud (chat models)](https://cloud.sambanova.ai/)
- [Lemonade by AMD](https://lemonade-server.ai)
- [Minimax](https://platform.minimax.io)
- [Cerebras (chat models)](https://www.cerebras.ai/)
- [oMLX](https://github.com/jundot/omlx)

**Embedder models:**

- [AnythingLLM Native Embedder](/server/storage/models/README.md) (default)
- [OpenAI](https://openai.com)
- [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
- [Gemini](https://ai.google.dev/)
- [LocalAI (all)](https://localai.io/)
- [Ollama (all)](https://ollama.ai/)
- [LM Studio (all)](https://lmstudio.ai)
- [Lemonade](https://lemonade-server.ai)
- [OpenRouter](https://openrouter.ai/)
- [LiteLLM](https://github.com/BerriAI/litellm)
- [Cohere](https://cohere.com/)
- [Voyage AI](https://www.voyageai.com/)
- [Mistral](https://mistral.ai/)
- Generic OpenAI-compatible embedding APIs

**Audio Transcription models:**

- [AnythingLLM Built-in](https://github.com/Mintplex-Labs/anything-llm/tree/master/server/storage/models#audiovideo-transcription) (default)
- [OpenAI](https://openai.com/)

**TTS (text-to-speech) support:**

- Native Browser Built-in (default)
- [PiperTTSLocal - runs in browser](https://github.com/rhasspy/piper)
- [OpenAI TTS](https://platform.openai.com/docs/guides/text-to-speech/voice-options)
- [ElevenLabs](https://elevenlabs.io/)
- Any OpenAI Compatible TTS service.

**STT (speech-to-text) support:**

- Native Browser Built-in (default)

**Vector Databases:**

- [LanceDB](https://github.com/lancedb/lancedb) (default)
- [PGVector](https://github.com/pgvector/pgvector)
- [Astra DB](https://www.datastax.com/products/datastax-astra)
- [Pinecone](https://pinecone.io)
- [Chroma & ChromaCloud](https://trychroma.com)
- [Weaviate](https://weaviate.io)
- [Qdrant](https://qdrant.tech)
- [Milvus](https://milvus.io)
- [Zilliz](https://zilliz.com)

### Technical Overview

This monorepo consists of six main sections:

- `frontend`: A viteJS + React frontend that you can run to easily create and manage all your content the LLM can use.
- `server`: A NodeJS express server to handle all the interactions and do all the vectorDB management and LLM interactions.
- `collector`: NodeJS express server that processes and parses documents from the UI.
- `docker`: Docker instructions and build process + information for building from source.
- `embed`: Submodule for generation & creation of the [web embed widget](https://github.com/Mintplex-Labs/anythingllm-embed).
- `browser-extension`: Submodule for the [chrome browser extension](https://github.com/Mintplex-Labs/anythingllm-extension).

## 🛳 Self-Hosting

Mintplex Labs & the community maintain a number of deployment methods, scripts, and templates that you can use to run AnythingLLM locally. Refer to the table below to read how to deploy on your preferred environment or to automatically deploy.
| Docker | AWS | GCP | Digital Ocean | Render.com |
|----------------------------------------|----|-----|---------------|------------|
| [![Deploy on Docker][docker-btn]][docker-deploy] | [![Deploy on AWS][aws-btn]][aws-deploy] | [![Deploy on GCP][gcp-btn]][gcp-deploy] | [![Deploy on DigitalOcean][do-btn]][do-deploy] | [![Deploy on Render.com][render-btn]][render-deploy] |

| Railway                                             | RepoCloud                                                 | Elestio                                             | Northflank                                                   |
| --------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| [![Deploy on Railway][railway-btn]][railway-deploy] | [![Deploy on RepoCloud][repocloud-btn]][repocloud-deploy] | [![Deploy on Elestio][elestio-btn]][elestio-deploy] | [![Deploy on Northflank][northflank-btn]][northflank-deploy] |

[or set up a production AnythingLLM instance without Docker →](./BARE_METAL.md)

## How to setup for development

- `yarn setup` To fill in the required `.env` files you'll need in each of the application sections (from root of repo).
  - Go fill those out before proceeding. Ensure `server/.env.development` is filled or else things won't work right.
- `yarn dev:server` To boot the server locally (from root of repo).
- `yarn dev:frontend` To boot the frontend locally (from root of repo).
- `yarn dev:collector` To then run the document collector (from root of repo).

[Learn about documents](./server/storage/documents/DOCUMENTS.md)

## Telemetry & Privacy

AnythingLLM by Mintplex Labs Inc contains a telemetry feature that collects anonymous usage information.

<details>
<summary><kbd>More about Telemetry & Privacy for AnythingLLM</kbd></summary>

### Why?

We use this information to help us understand how AnythingLLM is used, to help us prioritize work on new features and bug fixes, and to help us improve AnythingLLM's performance and stability.

### Opting out

Set `DISABLE_TELEMETRY` in your server or docker .env settings to "true" to opt out of telemetry. You can also do this in-app by going to the sidebar > `Privacy` and disabling telemetry.

### What do you explicitly track?

We will only track usage details that help us make product and roadmap decisions, specifically:

- Type of your installation (Docker or Desktop)

- When a document is added or removed. No information _about_ the document. Just that the event occurred. This gives us an idea of use.

- Type of vector database in use. This helps us prioritize changes when updates arrive for that provider.

- Type of LLM provider & model tag in use. This helps us prioritize changes when updates arrive for that provider or model, or combination thereof. eg: reasoning vs regular, multi-modal models, etc.

- When a chat is sent. This is the most regular "event" and gives us an idea of the daily-activity of this project across all installations. Again, only the **event** is sent - we have no information on the nature or content of the chat itself.

You can verify these claims by finding all locations `Telemetry.sendTelemetry` is called. Additionally these events are written to the output log so you can also see the specific data which was sent - if enabled. **No IP or other identifying information is collected**. The Telemetry provider is [PostHog](https://posthog.com/) - an open-source telemetry collection service.

We take privacy very seriously, and we hope you understand that we want to learn how our tool is used, without using annoying popup surveys, so we can build something worth using. The anonymous data is _never_ shared with third parties, ever.

[View all telemetry events in source code](https://github.com/search?q=repo%3AMintplex-Labs%2Fanything-llm%20.sendTelemetry(&type=code)

### Other outbound connections

If you disable telemetry, you would still see outbound connections to the following services:

- If using an external tool, LLM, Embedding models, or Vector databases, you will still see outbound connections to the respective service provider.
- `cdn.anythingllm.com` for pulling models from our mirror CDN. This is not tracked by telemetry and is actually useful for those in VPN restricted regions.
- `github/githubusercontent.com` There are some various flat files that are downloaded from these domains for context window caching.

Basically, if telemetry is disabled we don't collect anything. However, depending on your setup you may still see outbound connections and would be subject to the terms of service of the respective service provider.

</details>

## 👋 Contributing

- [Contributing to AnythingLLM](./CONTRIBUTING.md) - How to contribute to AnythingLLM.

## 💖 Sponsors

### Premium Sponsors

<!-- premium-sponsors (reserved for $100/mth sponsors who request to be called out here and/or are non-private sponsors) -->
<a href="https://www.dcsdigital.co.uk" target="_blank">
  <img src="https://a8cforagenciesportfolio.wordpress.com/wp-content/uploads/2024/08/logo-image-232621379.png" height="100px" alt="User avatar: DCS DIGITAL" />
</a>
<!-- premium-sponsors -->

### All Sponsors

<!-- all-sponsors --><a href="https://github.com/jaschadub"><img src="https:&#x2F;&#x2F;github.com&#x2F;jaschadub.png" width="60px" alt="User avatar: Jascha" /></a><a href="https://github.com/KickingAss2024"><img src="https:&#x2F;&#x2F;github.com&#x2F;KickingAss2024.png" width="60px" alt="User avatar: KickAss" /></a><a href="https://github.com/ShadowArcanist"><img src="https:&#x2F;&#x2F;github.com&#x2F;ShadowArcanist.png" width="60px" alt="User avatar: ShadowArcanist" /></a><a href="https://github.com/AtlasVIA"><img src="https:&#x2F;&#x2F;github.com&#x2F;AtlasVIA.png" width="60px" alt="User avatar: Atlas" /></a><a href="https://github.com/cope"><img src="https:&#x2F;&#x2F;github.com&#x2F;cope.png" width="60px" alt="User avatar: Predrag Stojadinović" /></a><a href="https://github.com/DiegoSpinola"><img src="https:&#x2F;&#x2F;github.com&#x2F;DiegoSpinola.png" width="60px" alt="User avatar: Diego Spinola" /></a><a href="https://github.com/PortlandKyGuy"><img src="https:&#x2F;&#x2F;github.com&#x2F;PortlandKyGuy.png" width="60px" alt="User avatar: Kyle" /></a><a href="https://github.com/peperunas"><img src="https:&#x2F;&#x2F;github.com&#x2F;peperunas.png" width="60px" alt="User avatar: Giulio De Pasquale" /></a><a href="https://github.com/jasoncdavis0"><img src="https:&#x2F;&#x2F;github.com&#x2F;jasoncdavis0.png" width="60px" alt="User avatar: " /></a><a href="https://github.com/macstadium"><img src="https:&#x2F;&#x2F;github.com&#x2F;macstadium.png" width="60px" alt="User avatar: MacStadium" /></a><a href="https://github.com/armlynobinguar"><img src="https:&#x2F;&#x2F;github.com&#x2F;armlynobinguar.png" width="60px" alt="User avatar: " /></a><a href="https://github.com/MikeHago"><img src="https:&#x2F;&#x2F;github.com&#x2F;MikeHago.png" width="60px" alt="User avatar: " /></a><a href="https://github.com/maaisde"><img src="https:&#x2F;&#x2F;github.com&#x2F;maaisde.png" width="60px" alt="User avatar: " /></a><a href="https://github.com/mhollier117"><img src="https:&#x2F;&#x2F;github.com&#x2F;mhollier117.png" width="60px" alt="User avatar: " /></a><a href="https://github.com/pleabargain"><img src="https:&#x2F;&#x2F;github.com&#x2F;pleabargain.png" width="60px" alt="User avatar: Dennis" /></a><a href="https://github.com/broichan"><img src="https:&#x2F;&#x2F;github.com&#x2F;broichan.png" width="60px" alt="User avatar: Michael Hamilton, Ph.D." /></a><a href="https://github.com/azim-charaniya"><img src="https:&#x2F;&#x2F;github.com&#x2F;azim-charaniya.png" width="60px" alt="User avatar: " /></a><a href="https://github.com/gabriellemon"><img src="https:&#x2F;&#x2F;github.com&#x2F;gabriellemon.png" width="60px" alt="User avatar: TernaryLabs" /></a><a href="https://github.com/CelaDaniel"><img src="https:&#x2F;&#x2F;github.com&#x2F;CelaDaniel.png" width="60px" alt="User avatar: Daniel Cela" /></a><a href="https://github.com/altrsadmin"><img src="https:&#x2F;&#x2F;github.com&#x2F;altrsadmin.png" width="60px" alt="User avatar: Alesso" /></a><a href="https://github.com/bitjungle"><img src="https:&#x2F;&#x2F;github.com&#x2F;bitjungle.png" width="60px" alt="User avatar: Rune Mathisen" /></a><a href="https://github.com/pcrossleyAC"><img src="https:&#x2F;&#x2F;github.com&#x2F;pcrossleyAC.png" width="60px" alt="User avatar: " /></a><a href="https://github.com/saroj-pattnaik"><img src="https:&#x2F;&#x2F;github.com&#x2F;saroj-pattnaik.png" width="60px" alt="User avatar: " /></a><a href="https://github.com/techmedic5"><img src="https:&#x2F;&#x2F;github.com&#x2F;techmedic5.png" width="60px" alt="User avatar: Alan" /></a><a href="https://github.com/ddocta"><img src="https:&#x2F;&#x2F;github.com&#x2F;ddocta.png" width="60px" alt="User avatar: Damien Peters" /></a><a href="https://github.com/dcsdigital"><img src="https:&#x2F;&#x2F;github.com&#x2F;dcsdigital.png" width="60px" alt="User avatar: DCS Digital" /></a><a href="https://github.com/pm7y"><img src="https:&#x2F;&#x2F;github.com&#x2F;pm7y.png" width="60px" alt="User avatar: Paul Mcilreavy" /></a><a href="https://github.com/tilwolf"><img src="https:&#x2F;&#x2F;github.com&#x2F;tilwolf.png" width="60px" alt="User avatar: Til Wolf" /></a><a href="https://github.com/ozzyoss77"><img src="https:&#x2F;&#x2F;github.com&#x2F;ozzyoss77.png" width="60px" alt="User avatar: Leopoldo Crhistian Riverin Gomez" /></a><a href="https://github.com/AlphaEcho11"><img src="https:&#x2F;&#x2F;github.com&#x2F;AlphaEcho11.png" width="60px" alt="User avatar: AJEsau" /></a><a href="https://github.com/svanomm"><img src="https:&#x2F;&#x2F;github.com&#x2F;svanomm.png" width="60px" alt="User avatar: Steven VanOmmeren" /></a><a href="https://github.com/socketbox"><img src="https:&#x2F;&#x2F;github.com&#x2F;socketbox.png" width="60px" alt="User avatar: Casey Boettcher" /></a><a href="https://github.com/zebbern"><img src="https:&#x2F;&#x2F;github.com&#x2F;zebbern.png" width="60px" alt="User avatar: " /></a><a href="https://github.com/avineetbespin"><img src="https:&#x2F;&#x2F;github.com&#x2F;avineetbespin.png" width="60px" alt="User avatar: Avineet" /></a><a href="https://github.com/invictus-1"><img src="https:&#x2F;&#x2F;github.com&#x2F;invictus-1.png" width="60px" alt="User avatar: Chris" /></a><a href="https://github.com/mirbyte"><img src="https:&#x2F;&#x2F;github.com&#x2F;mirbyte.png" width="60px" alt="User avatar: " /></a><a href="https://github.com/bisonbet"><img src="https:&#x2F;&#x2F;github.com&#x2F;bisonbet.png" width="60px" alt="User avatar: Tim Champ" /></a><a href="https://github.com/Sinkingdev"><img src="https:&#x2F;&#x2F;github.com&#x2F;Sinkingdev.png" width="60px" alt="User avatar: Peter Mathisen" /></a><a href="https://github.com/Ed-STEM"><img src="https:&#x2F;&#x2F;github.com&#x2F;Ed-STEM.png" width="60px" alt="User avatar: Ed di Girolamo" /></a><a href="https://github.com/milkowski"><img src="https:&#x2F;&#x2F;github.com&#x2F;milkowski.png" width="60px" alt="User avatar: Wojciech Miłkowski" /></a><a href="https://github.com/ADS-Fund"><img src="https:&#x2F;&#x2F;github.com&#x2F;ADS-Fund.png" width="60px" alt="User avatar: ADS Fund" /></a><a href="https://github.com/arc46-io"><img src="https:&#x2F;&#x2F;github.com&#x2F;arc46-io.png" width="60px" alt="User avatar: arc46 GmbH" /></a><a href="https://github.com/liyin2015"><img src="https:&#x2F;&#x2F;github.com&#x2F;liyin2015.png" width="60px" alt="User avatar: Li Yin" /></a><a href="https://github.com/SylphAI-Inc"><img src="https:&#x2F;&#x2F;github.com&#x2F;SylphAI-Inc.png" width="60px" alt="User avatar: SylphAI" /></a><a href="https://github.com/breesait"><img src="https:&#x2F;&#x2F;github.com&#x2F;breesait.png" width="60px" alt="User avatar: " /></a><a href="https://github.com/mgMsquared"><img src="https:&#x2F;&#x2F;github.com&#x2F;mgMsquared.png" width="60px" alt="User avatar: Mik" /></a><!-- all-sponsors -->

## 🌟 Contributors

[![anythingllm contributors](https://contrib.rocks/image?repo=mintplex-labs/anything-llm)](https://github.com/mintplex-labs/anything-llm/graphs/contributors)

[![Star History Chart](https://api.star-history.com/svg?repos=mintplex-labs/anything-llm&type=Timeline)](https://star-history.com/#mintplex-labs/anything-llm&Date)

## 🔗 More Products

- **[AnythingLLM Mobile (MIT Licensed)][anythingllm-mobile]:** A mobile application that allows you to use AnythingLLM on your mobile device.
- **[AnythingLLM Browser Extension][anythingllm-extension]:** A browser extension that allows you to use AnythingLLM in your browser.
- **[AnythingLLM Embed][anythingllm-embed]:** A widget that allows you to embed AnythingLLM in your website.

<div align="right">

[![][back-to-top]](#readme-top)

</div>

---

Copyright © 2026 [Mintplex Labs][profile-link]. <br />
This project is [MIT](./LICENSE) licensed.

<!-- LINK GROUP -->

[back-to-top]: https://img.shields.io/badge/-BACK_TO_TOP-222628?style=flat-square
[profile-link]: https://github.com/mintplex-labs
[anythingllm-mobile]: https://github.com/Mintplex-Labs/anythingllm-mobile
[anythingllm-extension]: https://github.com/Mintplex-Labs/anythingllm-extension
[anythingllm-embed]: https://github.com/Mintplex-Labs/anythingllm-embed
[docker-btn]: ./images/deployBtns/docker.png
[docker-deploy]: ./docker/HOW_TO_USE_DOCKER.md
[aws-btn]: ./images/deployBtns/aws.png
[aws-deploy]: ./cloud-deployments/aws/cloudformation/DEPLOY.md
[gcp-btn]: https://deploy.cloud.run/button.svg
[gcp-deploy]: ./cloud-deployments/gcp/deployment/DEPLOY.md
[do-btn]: https://www.deploytodo.com/do-btn-blue.svg
[do-deploy]: ./cloud-deployments/digitalocean/terraform/DEPLOY.md
[render-btn]: https://render.com/images/deploy-to-render-button.svg
[render-deploy]: https://render.com/deploy?repo=https://github.com/Mintplex-Labs/anything-llm&branch=render
[render-btn]: https://render.com/images/deploy-to-render-button.svg
[render-deploy]: https://render.com/deploy?repo=https://github.com/Mintplex-Labs/anything-llm&branch=render
[railway-btn]: https://railway.app/button.svg
[railway-deploy]: https://railway.app/template/HNSCS1?referralCode=WFgJkn
[repocloud-btn]: https://d16t0pc4846x52.cloudfront.net/deploylobe.svg
[repocloud-deploy]: https://repocloud.io/details/?app_id=276
[elestio-btn]: https://elest.io/images/logos/deploy-to-elestio-btn.png
[elestio-deploy]: https://elest.io/open-source/anythingllm
[northflank-btn]: https://assets.northflank.com/deploy_to_northflank_smm_36700fb050.svg
[northflank-deploy]: https://northflank.com/stacks/deploy-anythingllm
