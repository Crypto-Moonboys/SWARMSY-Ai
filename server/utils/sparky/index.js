const fs = require("fs");
const path = require("path");
const { WorkspaceSuggestedMessages } = require("../../models/workspacesSuggestedMessages");

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

const SPARKY_STARTER_SUGGESTED_MESSAGES = [
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
];

const SPARKY_CORE_PACKS = [
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
    summary: "Starter intake for identity, project, brand, and alter ego discovery.",
  },
  {
    id: "do-it-for-me-prompts",
    filename: "do-it-for-me-prompts.md",
    title: "Do It For Me Prompts",
    summary: "A guided route for users who want SPARKY to shape the first draft.",
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
    chatMode: "automatic",
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
  return String(slug || "").trim().toLowerCase() === SPARKY_WORKSPACE_SLUG;
}

function isCanonicalSparkyWorkspace(workspace = null) {
  if (!workspace || workspace.slug !== SPARKY_WORKSPACE_SLUG) return false;
  return (
    String(workspace.name || "").trim() === SPARKY_WORKSPACE_NAME &&
    String(workspace.openAiPrompt || "").trim() === getSparkySystemPrompt()
  );
}

async function seedSparkyStarterSuggestedMessages(workspace = null) {
  if (!isCanonicalSparkyWorkspace(workspace)) return false;

  const existingMessages = await WorkspaceSuggestedMessages.getMessages(
    SPARKY_WORKSPACE_SLUG
  );
  if (existingMessages.length > 0) return false;

  await WorkspaceSuggestedMessages.saveAll(
    getSparkyStarterSuggestedMessages(),
    SPARKY_WORKSPACE_SLUG
  );
  return true;
}

async function ensureSparkyWorkspace() {
  const { Workspace } = require("../../models/workspace");
  const template = getSparkyWorkspaceTemplate();
  const existingWorkspace = await Workspace.get({ slug: template.slug });

  if (isCanonicalSparkyWorkspace(existingWorkspace)) {
    await seedSparkyStarterSuggestedMessages(existingWorkspace);
    return {
      workspace: existingWorkspace,
      error: null,
      collision: false,
      created: false,
      message: "SPARKY workspace is already bootstrapped.",
    };
  }

  if (existingWorkspace) {
    await seedSparkyStarterSuggestedMessages(existingWorkspace);
    return {
      workspace: existingWorkspace,
      error: "sparky_workspace_slug_collision",
      collision: true,
      created: false,
      message:
        "SPARKY workspace slug already exists; leaving existing workspace untouched.",
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
  getSparkyCorePackCatalog,
  getSparkyStarterSuggestedMessages,
  getSparkyWorkspaceTemplate,
  getSparkyBootstrapConfig,
  isSparkyWorkspaceSlug,
  isCanonicalSparkyWorkspace,
  seedSparkyStarterSuggestedMessages,
  ensureSparkyWorkspace,
};
