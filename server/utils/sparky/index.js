const fs = require("fs");
const path = require("path");

const SPARKY_WORKSPACE_NAME = "SPARKY";
const SPARKY_WORKSPACE_SLUG = "sparky";
const SPARKY_CORE_PACK_DIR = path.join(
  __dirname,
  "..",
  "..",
  "storage",
  "sparky",
  "packs",
  "core"
);
const SPARKY_SYSTEM_PROMPT_PATH = path.join(
  SPARKY_CORE_PACK_DIR,
  "sparky-system-prompt.md"
);

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
    systemPromptPath: SPARKY_SYSTEM_PROMPT_PATH,
  };
}

async function ensureSparkyWorkspace() {
  const { Workspace } = require("../../models/workspace");
  const template = getSparkyWorkspaceTemplate();

  return await Workspace.upsert(
    { slug: template.slug },
    {
      name: template.name,
      slug: template.slug,
      chatMode: template.chatMode,
      openAiPrompt: template.openAiPrompt,
    },
    {
      name: template.name,
      chatMode: template.chatMode,
      openAiPrompt: template.openAiPrompt,
    }
  );
}

module.exports = {
  SPARKY_WORKSPACE_NAME,
  SPARKY_WORKSPACE_SLUG,
  SPARKY_CORE_PACK_DIR,
  SPARKY_SYSTEM_PROMPT_PATH,
  SPARKY_CORE_PACKS,
  getSparkySystemPrompt,
  getSparkyCorePackCatalog,
  getSparkyWorkspaceTemplate,
  getSparkyBootstrapConfig,
  ensureSparkyWorkspace,
};
