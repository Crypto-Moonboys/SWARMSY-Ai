const fs = require("fs");
const path = require("path");
const prisma = require("../prisma");
const {
  WorkspaceSuggestedMessages,
} = require("../../models/workspacesSuggestedMessages");

const SPARKY_WORKSPACE_NAME = "SPARKY";
const SPARKY_WORKSPACE_SLUG = "sparky";
const SPARKY_CORE_PACK_DIR = path.join(
  __dirname,
  "..",
  "..",
  "sparky",
  "packs",
  "core"
);
const SPARKY_SYSTEM_PROMPT_PATH = path.join(
  SPARKY_CORE_PACK_DIR,
  "sparky-system-prompt.md"
);

const SPARKY_PROMPT_IDENTITY_LINES = [
  "You are SPARKY, the guided project-manager layer inside AnythingLLM.",
  "Your mission is to help users who do not know what to prompt yet by turning uncertainty into clear direction, useful ideas, approved memory, and simple next actions.",
  "You are not a generic chatbot. You are not just a questionnaire.",
  "When the user is only chatting, respond normally and keep the conversation natural.",
  "When the user is building something, help them move through three core layers:",
  "Stay separate from the user's rough ideas until they are approved.",
  "Use the selected AnythingLLM workspace model, tools, retrieval, and settings underneath you.",
  "Do not replace normal AnythingLLM behavior.",
  "Help the user discover, shape, and act on unique identities, projects, brands, characters, businesses, campaigns, art worlds, creative systems, content plans, products, and communities.",
];

const SPARKY_STARTER_SUGGESTED_MESSAGES = [
  {
    heading: "",
    message: "Describe my character first",
  },
  {
    heading: "",
    message: "Start a new character identity build",
  },
  {
    heading: "",
    message: "I have no idea. Create a strong direction for me.",
  },
  {
    heading: "",
    message: "Help me shape my project idea",
  },
  {
    heading: "",
    message: "Build my project identity",
  },
  {
    heading: "",
    message: "Turn this idea into an action plan",
  },
  {
    heading: "",
    message:
      "I have a Moonboy/PFP character. Ask what you need first.",
  },
  {
    heading: "",
    message:
      "I know the name and faction, but I need to describe the look.",
  },
  {
    heading: "",
    message:
      "Turn my avatar into a stencil, icon, poster, merch, and campaign idea.",
  },
  {
    heading: "",
    message:
      "Create a full Crypto Moonboys bio from this name, faction, and traits.",
  },
];

const SPARKY_CORE_PACKS = [
  {
    id: "og-sparky-contract",
    filename: "og-sparky-contract.md",
    title: "OG SPARKY Contract",
    summary:
      "The original SWARMSY/SPARKY product contract without old runtime carryover.",
  },
  {
    id: "project-manager-protocol",
    filename: "project-manager-protocol.md",
    title: "Project Manager Protocol",
    summary: "How SPARKY stays focused, direct, and approval-aware.",
  },
  {
    id: "identity-questionnaire",
    filename: "identity-questionnaire.md",
    title: "Identity Questionnaire",
    summary:
      "Starter intake for identity, project, brand, and alter ego discovery.",
  },
  {
    id: "identity-forge",
    filename: "identity-forge.md",
    title: "Identity Forge",
    summary:
      "Compresses vague ideas, PFPs, brands, products, campaigns, and characters into structured creative DNA and approvable identity direction.",
  },
  {
    id: "crypto-moonboys-latest-canon-brand-vision",
    filename: "crypto-moonboys-latest-canon-brand-vision.md",
    title: "Crypto Moonboys Latest Canon And Brand Vision",
    summary:
      "Current source for Crypto Moonboys brand truth, user paths, user-built IP, SWARMSY/SPARKY positioning, public copy rules, and safe explanation of what users can do now.",
  },
  {
    id: "crypto-moonboys-w81-condensed-canon-digest",
    filename: "crypto-moonboys-w81-condensed-canon-digest.md",
    title: "Crypto Moonboys W81 Condensed Canon Digest",
    summary:
      "Condensed guide to the 94-file W81 archive, including brand, lore spine, factions, SWARMSY/SAM, game ideas, tokens/rewards, characters, and what to keep or filter.",
  },
  {
    id: "moonboy-pfp-identity-builder",
    filename: "moonboy-pfp-identity-builder.md",
    title: "Moonboy PFP Identity Builder",
    summary:
      "Turns Crypto Moonboys, GKniftyHEADS, 1/1 PFPs, avatars, and holder characters into identity, icon, lore, product, campaign, and creator-world routes.",
  },
  {
    id: "crypto-moonboys-w81-canon-biography",
    filename: "crypto-moonboys-w81-canon-biography.md",
    title: "Crypto Moonboys W81 Canon Biography",
    summary:
      "Starts Moonboy, GKniftyHEADS, HODL Warrior, 1/1 PFP, avatar, and faction characters with W81 canon-backed biography, lore, faction, HODL Warrior, visual, collector, and metadata records.",
  },
  {
    id: "visibility-doctrine",
    filename: "visibility-doctrine.md",
    title: "Visibility Doctrine",
    summary:
      "Teaches SPARKY to build physical and digital visibility loops so identities become seen, remembered, and acted on.",
  },
  {
    id: "physical-digital-wall",
    filename: "physical-digital-wall.md",
    title: "Physical Digital Wall",
    summary:
      "Maps identities and campaigns onto real attention surfaces such as posters, merch, websites, social posts, wiki pages, communities, and proof boards.",
  },
  {
    id: "campaign-protocol-engine",
    filename: "campaign-protocol-engine.md",
    title: "Campaign Protocol Engine",
    summary:
      "Applies lawful cultural strategy patterns from public signals, scarcity drops, identity compression, spectacle, category disruption, memes, mysteries, and controlled rebellion.",
  },
  {
    id: "authority-provenance",
    filename: "authority-provenance.md",
    title: "Authority And Provenance",
    summary:
      "Separates verified facts, cited claims, inference, myth, founder thesis, creator-owned lore, community-approved lore, official canon, decisions, proof, and public claims.",
  },
  {
    id: "do-it-for-me-prompts",
    filename: "do-it-for-me-prompts.md",
    title: "Do It For Me Prompts",
    summary:
      "A guided route for users who want SPARKY to shape the first draft.",
  },
  {
    id: "approved-decisions",
    filename: "approved-decisions.md",
    title: "Approved Decisions",
    summary: "Rules for separating rough ideas from committed choices.",
  },
  {
    id: "action-confirmation",
    filename: "action-confirmation.md",
    title: "Action Confirmation",
    summary: "The confirmation gate before plans become tasks or schedules.",
  },
  {
    id: "tasks-and-schedule",
    filename: "tasks-and-schedule.md",
    title: "Tasks And Schedule",
    summary: "Simple next actions and workspace scheduling after approval.",
  },
  {
    id: "proof-review",
    filename: "proof-review.md",
    title: "Proof Review",
    summary: "Review outputs, evidence, and decision history before moving on.",
  },
];

function readMarkdownFile(filePath) {
  return fs.readFileSync(filePath, "utf8").trim();
}

function getSparkySystemPrompt() {
  return readMarkdownFile(SPARKY_SYSTEM_PROMPT_PATH);
}

function normalizeSparkySystemPrompt(prompt = "") {
  return String(prompt)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getSparkyCanonicalSystemPrompt() {
  return SPARKY_PROMPT_IDENTITY_LINES.join("\n");
}

function promptHasSparkyCoreIdentity(prompt = "") {
  const normalizedPrompt = normalizeSparkySystemPrompt(prompt);
  return SPARKY_PROMPT_IDENTITY_LINES.every((line) =>
    normalizedPrompt.includes(line)
  );
}

function sparkyPromptNeedsRefresh(workspace = null) {
  return (
    isCanonicalSparkyWorkspace(workspace) &&
    normalizeSparkySystemPrompt(workspace.openAiPrompt) !==
      normalizeSparkySystemPrompt(getSparkySystemPrompt())
  );
}

function getSparkyCorePackCatalog() {
  return SPARKY_CORE_PACKS.map((pack) => {
    const absolutePath = path.join(SPARKY_CORE_PACK_DIR, pack.filename);
    return {
      ...pack,
      path: absolutePath,
      exists: fs.existsSync(absolutePath),
      loaded: false,
      status: "available-on-disk-not-auto-ingested",
    };
  });
}

function getSparkyStarterSuggestedMessages() {
  return SPARKY_STARTER_SUGGESTED_MESSAGES.map((message) => ({ ...message }));
}

function getSparkyWorkspaceTemplate() {
  return {
    name: SPARKY_WORKSPACE_NAME,
    slug: SPARKY_WORKSPACE_SLUG,
    chatMode: "chat",
    openAiPrompt: getSparkySystemPrompt(),
  };
}

function getSparkyBootstrapConfig() {
  return {
    workspaceTemplate: getSparkyWorkspaceTemplate(),
    corePacks: getSparkyCorePackCatalog(),
    starterSuggestedMessages: getSparkyStarterSuggestedMessages(),
    systemPromptPath: SPARKY_SYSTEM_PROMPT_PATH,
  };
}

function isSparkyWorkspaceSlug(slug) {
  return (
    String(slug || "")
      .trim()
      .toLowerCase() === SPARKY_WORKSPACE_SLUG
  );
}

function isCanonicalSparkyWorkspace(workspace = null) {
  if (!workspace || workspace.slug !== SPARKY_WORKSPACE_SLUG) return false;
  return String(workspace.name || "").trim() === SPARKY_WORKSPACE_NAME;
}

function suggestedMessagesNeedRefresh(existingMessages = []) {
  const starterMessages = getSparkyStarterSuggestedMessages();
  if (existingMessages.length !== starterMessages.length) return true;

  return starterMessages.some((message, index) => {
    const existingMessage = existingMessages[index];
    return (
      existingMessage?.heading !== message.heading ||
      existingMessage?.message !== message.message
    );
  });
}

async function seedSparkyStarterSuggestedMessages(workspace = null) {
  if (!isSparkyWorkspaceSlug(workspace?.slug)) return false;

  const existingMessages = await WorkspaceSuggestedMessages.getMessages(
    SPARKY_WORKSPACE_SLUG
  );
  if (!suggestedMessagesNeedRefresh(existingMessages)) return false;

  await WorkspaceSuggestedMessages.saveAll(
    getSparkyStarterSuggestedMessages(),
    SPARKY_WORKSPACE_SLUG
  );
  return true;
}

async function refreshSparkySystemPrompt(Workspace, workspace = null) {
  if (!workspace) return workspace;

  const template = getSparkyWorkspaceTemplate();
  const promptNeedsRefresh =
    normalizeSparkySystemPrompt(workspace.openAiPrompt) !==
    normalizeSparkySystemPrompt(template.openAiPrompt);
  const chatModeNeedsRefresh = workspace.chatMode !== template.chatMode;
  const nameNeedsRefresh = String(workspace.name || "").trim() !== template.name;

  if (!promptNeedsRefresh && !chatModeNeedsRefresh && !nameNeedsRefresh) {
    return workspace;
  }

  const { workspace: updatedWorkspace } = await Workspace.update(workspace.id, {
    name: template.name,
    chatMode: template.chatMode,
    openAiPrompt: template.openAiPrompt,
  });

  return (
    updatedWorkspace || {
      ...workspace,
      name: template.name,
      chatMode: template.chatMode,
      openAiPrompt: template.openAiPrompt,
    }
  );
}

async function ensureSparkyWorkspace() {
  const { Workspace } = require("../../models/workspace");
  const template = getSparkyWorkspaceTemplate();
  const existingWorkspace = await prisma.workspaces.findUnique({
    where: { slug: template.slug },
  });

  if (existingWorkspace) {
    const workspace = await refreshSparkySystemPrompt(
      Workspace,
      existingWorkspace
    );
    await seedSparkyStarterSuggestedMessages(workspace);
    return {
      workspace,
      error: null,
      collision: false,
      created: false,
      message: "SPARKY workspace is bootstrapped and refreshed.",
    };
  }

  // TODO: reserve/protect the SPARKY slug so user-created workspaces cannot
  // collide with this identity in future releases.
  const { workspace, message } = await Workspace.new(template.name, null, {
    chatMode: template.chatMode,
    openAiPrompt: template.openAiPrompt,
  });

  await seedSparkyStarterSuggestedMessages(workspace);

  return {
    workspace,
    error: message,
    collision: false,
    created: !!workspace,
    message,
  };
}

module.exports = {
  SPARKY_WORKSPACE_NAME,
  SPARKY_WORKSPACE_SLUG,
  SPARKY_CORE_PACK_DIR,
  SPARKY_SYSTEM_PROMPT_PATH,
  SPARKY_CORE_PACKS,
  getSparkySystemPrompt,
  normalizeSparkySystemPrompt,
  getSparkyCanonicalSystemPrompt,
  promptHasSparkyCoreIdentity,
  sparkyPromptNeedsRefresh,
  getSparkyCorePackCatalog,
  getSparkyStarterSuggestedMessages,
  suggestedMessagesNeedRefresh,
  getSparkyWorkspaceTemplate,
  getSparkyBootstrapConfig,
  isSparkyWorkspaceSlug,
  isCanonicalSparkyWorkspace,
  seedSparkyStarterSuggestedMessages,
  refreshSparkySystemPrompt,
  ensureSparkyWorkspace,
};
