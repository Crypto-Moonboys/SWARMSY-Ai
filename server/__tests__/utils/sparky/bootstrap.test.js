const fs = require("fs");
const path = require("path");

jest.mock("../../../utils/prisma", () => ({
  workspaces: { findUnique: jest.fn(), update: jest.fn() },
}));

jest.mock("../../../models/workspace", () => ({
  Workspace: {
    get: jest.fn(),
    new: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock("../../../models/workspacesSuggestedMessages", () => ({
  WorkspaceSuggestedMessages: {
    getMessages: jest.fn(),
    saveAll: jest.fn(),
  },
}));

const prisma = require("../../../utils/prisma");
const { Workspace } = require("../../../models/workspace");
const { WorkspaceSuggestedMessages } = require("../../../models/workspacesSuggestedMessages");

const {
  SPARKY_WORKSPACE_NAME,
  SPARKY_WORKSPACE_SLUG,
  SPARKY_SYSTEM_PROMPT_PATH,
  SPARKY_CORE_PACK_DIR,
  getSparkySystemPrompt,
  promptHasSparkyCoreIdentity,
  getSparkyCorePackCatalog,
  getSparkyStarterSuggestedMessages,
  getSparkyWorkspaceTemplate,
  getSparkyBootstrapConfig,
  ensureSparkyWorkspace,
} = require("../../../utils/sparky");

const PR2_SPARKY_SYSTEM_PROMPT = [
  "You are SPARKY, the guided project-manager layer inside AnythingLLM.",
  "Your mission is to help users who do not know what to prompt yet by turning uncertainty into clear direction.",
  "When the user is only chatting, respond normally and keep the conversation natural.",
  "When the user is building something, help them move through three core layers:",
  "Stay separate from the user's rough ideas until they are approved.",
  "Use the selected AnythingLLM workspace model, tools, retrieval, and settings underneath you.",
  "Do not replace normal AnythingLLM behavior.",
  "Help the user discover, shape, and act on unique identities, projects, brands, characters, businesses, campaigns, and creative plans.",
  "When the user does not know what to prompt, offer simple starter directions instead of forcing a project.",
  "Use these first-run prompts when they fit:",
  "",
  "- Help me shape my project idea",
  "- Build my project identity",
  "- Turn this idea into an action plan",
].join("\n");

beforeEach(() => {
  prisma.workspaces.findUnique.mockResolvedValue(null);
  WorkspaceSuggestedMessages.getMessages.mockResolvedValue([]);
});

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

describe("SPARKY bootstrap foundation", () => {
  it("keeps the release README in place", () => {
    const readmePath = path.join(process.cwd(), "README.md");
    expect(fs.existsSync(readmePath)).toBe(true);
    expect(fs.readFileSync(readmePath, "utf8")).toContain("SWARMSY-Ai");
  });

  it("keeps the SPARKY system prompt on disk", () => {
    expect(fs.existsSync(SPARKY_SYSTEM_PROMPT_PATH)).toBe(true);
    expect(SPARKY_SYSTEM_PROMPT_PATH).toContain(
      path.join("server", "sparky", "packs", "core")
    );
    expect(SPARKY_SYSTEM_PROMPT_PATH).not.toContain(
      path.join("server", "storage")
    );
    expect(SPARKY_CORE_PACK_DIR).toContain(
      path.join("server", "sparky", "packs", "core")
    );
    expect(getSparkySystemPrompt()).toContain("You are SPARKY");
    expect(getSparkySystemPrompt()).toContain("Creator Empire For Beginners");
    expect(getSparkySystemPrompt()).toContain("AnythingLLM Tool Workflow For Beginners");
    expect(getSparkySystemPrompt()).toContain("Portable Creator Memory");
    expect(getSparkySystemPrompt()).toContain("approved");
  });

  it("keeps the core packs on disk and discoverable", () => {
    const packs = getSparkyCorePackCatalog();
    expect(packs).toHaveLength(21);
    expect(packs.every((pack) => pack.exists)).toBe(true);
    expect(packs.map((pack) => pack.filename)).toEqual(expect.arrayContaining([
      "og-sparky-contract.md",
      "project-manager-protocol.md",
      "identity-questionnaire.md",
      "do-it-for-me-prompts.md",
      "approved-decisions.md",
      "action-confirmation.md",
      "tasks-and-schedule.md",
      "proof-review.md",
    ]));
    expect(
      fs.readFileSync(
        path.join(
          process.cwd(),
          "server",
          "sparky",
          "packs",
          "core",
          "approved-decisions.md"
        ),
        "utf8"
      )
    ).toContain("Suggestions are drafts, not truth.");
  });

  it("exposes a fixed SPARKY workspace template with the system prompt attached", () => {
    const template = getSparkyWorkspaceTemplate();
    const bootstrap = getSparkyBootstrapConfig();
    const starterPrompts = getSparkyStarterSuggestedMessages();

    expect(template.name).toBe(SPARKY_WORKSPACE_NAME);
    expect(template.slug).toBe(SPARKY_WORKSPACE_SLUG);
    expect(template.chatMode).toBe("chat");
    expect(template.openAiPrompt).toBe(getSparkySystemPrompt());

    expect(bootstrap.workspaceTemplate.openAiPrompt).toBe(
      getSparkySystemPrompt()
    );
    expect(bootstrap.corePacks).toHaveLength(21);
    expect(bootstrap.starterSuggestedMessages).toEqual(starterPrompts);
    expect(starterPrompts).toEqual([
      { heading: "", message: "Plan today’s local empire build." },
      { heading: "", message: "I have a Moonboy/PFP to build." },
      { heading: "", message: "I have a brand, product or art project." },
      { heading: "", message: "I have no idea. Build me a local-first direction." },
      { heading: "", message: "Make a street-level lore, stencil, merch and campaign pack." },
      { heading: "", message: "Map the tools, bots and automation needed." },
    ]);
  });

  it("leaves normal AnythingLLM workspace support intact", () => {
    const workspaceModelPath = path.join(
      process.cwd(),
      "server",
      "models",
      "workspace.js"
    );
    const workspaceApiPath = path.join(
      process.cwd(),
      "server",
      "endpoints",
      "api",
      "workspace",
      "index.js"
    );

    const workspaceModelSource = fs.readFileSync(workspaceModelPath, "utf8");
    const workspaceApiSource = fs.readFileSync(workspaceApiPath, "utf8");

    expect(workspaceModelSource).toContain(
      'VALID_CHAT_MODES: ["chat", "query", "automatic"]'
    );
    expect(workspaceApiSource).toContain('app.get("/v1/workspaces"');
    expect(workspaceApiSource).toContain("Workspace._findMany");
    expect(workspaceApiSource).not.toContain("SPARKY_WORKSPACE_SLUG");
  });

  it("creates SPARKY only when missing", async () => {
    const createdWorkspace = {
      id: 123,
      name: SPARKY_WORKSPACE_NAME,
      slug: SPARKY_WORKSPACE_SLUG,
      openAiPrompt: getSparkySystemPrompt(),
      chatMode: "chat",
      isCanonicalSparky: true,
    };

    WorkspaceSuggestedMessages.getMessages.mockResolvedValue([]);
    prisma.workspaces.findUnique.mockResolvedValue(null);
    prisma.workspaces.update.mockResolvedValue(createdWorkspace);
    Workspace.new.mockResolvedValue({
      workspace: { ...createdWorkspace, isCanonicalSparky: false },
      message: null,
    });
    WorkspaceSuggestedMessages.saveAll.mockResolvedValue();

    const result = await ensureSparkyWorkspace();

    expect(prisma.workspaces.findUnique).toHaveBeenCalledWith({
      where: { slug: SPARKY_WORKSPACE_SLUG },
    });
    expect(Workspace.new).toHaveBeenCalledWith(
      SPARKY_WORKSPACE_NAME,
      null,
      expect.objectContaining({
        chatMode: "chat",
        openAiPrompt: getSparkySystemPrompt(),
      })
    );
    expect(Workspace.update).not.toHaveBeenCalled();
    expect(prisma.workspaces.update).toHaveBeenCalledWith({
      where: { id: createdWorkspace.id },
      data: { isCanonicalSparky: true },
    });
    expect(WorkspaceSuggestedMessages.saveAll).toHaveBeenCalledWith(
      getSparkyStarterSuggestedMessages(),
      SPARKY_WORKSPACE_SLUG
    );
    expect(result.workspace).toEqual(createdWorkspace);
    expect(result.collision).toBe(false);
    expect(result.created).toBe(true);
  });

  it("refreshes the PR #2 SPARKY workspace prompt on upgrade", async () => {
    const existingWorkspace = {
      id: 456,
      name: SPARKY_WORKSPACE_NAME,
      slug: SPARKY_WORKSPACE_SLUG,
      openAiPrompt: PR2_SPARKY_SYSTEM_PROMPT,
      chatMode: "chat",
      isCanonicalSparky: true,
    };
    const updatedWorkspace = {
      ...existingWorkspace,
      openAiPrompt: getSparkySystemPrompt(),
    };

    prisma.workspaces.findUnique.mockResolvedValue(existingWorkspace);
    Workspace.new.mockResolvedValue({
      workspace: null,
      message: "should not be used",
    });
    Workspace.update.mockResolvedValue({
      workspace: updatedWorkspace,
      message: null,
    });
    WorkspaceSuggestedMessages.saveAll.mockResolvedValue();

    const result = await ensureSparkyWorkspace();

    expect(prisma.workspaces.findUnique).toHaveBeenCalledWith({
      where: { slug: SPARKY_WORKSPACE_SLUG },
    });
    expect(Workspace.new).not.toHaveBeenCalled();
    expect(Workspace.update).toHaveBeenCalledWith(existingWorkspace.id, {
      name: SPARKY_WORKSPACE_NAME,
      chatMode: "chat",
      openAiPrompt: getSparkySystemPrompt(),
    });
    expect(WorkspaceSuggestedMessages.saveAll).toHaveBeenCalledWith(
      getSparkyStarterSuggestedMessages(),
      SPARKY_WORKSPACE_SLUG
    );
    expect(result.workspace).toBe(updatedWorkspace);
    expect(result.collision).toBe(false);
    expect(result.created).toBe(false);
    expect(result.message).toContain("bootstrapped and refreshed");
  });

  it("keeps the current PR #4 SPARKY prompt when already current", async () => {
    const existingWorkspace = {
      id: 457,
      name: SPARKY_WORKSPACE_NAME,
      slug: SPARKY_WORKSPACE_SLUG,
      openAiPrompt: getSparkySystemPrompt(),
      chatMode: "chat",
      isCanonicalSparky: true,
    };

    prisma.workspaces.findUnique.mockResolvedValue(existingWorkspace);
    Workspace.new.mockResolvedValue({
      workspace: null,
      message: "should not be used",
    });
    WorkspaceSuggestedMessages.saveAll.mockResolvedValue();

    const result = await ensureSparkyWorkspace();

    expect(prisma.workspaces.findUnique).toHaveBeenCalledWith({
      where: { slug: SPARKY_WORKSPACE_SLUG },
    });
    expect(Workspace.new).not.toHaveBeenCalled();
    expect(Workspace.update).not.toHaveBeenCalled();
    expect(WorkspaceSuggestedMessages.saveAll).toHaveBeenCalledWith(
      getSparkyStarterSuggestedMessages(),
      SPARKY_WORKSPACE_SLUG
    );
    expect(promptHasSparkyCoreIdentity(existingWorkspace.openAiPrompt)).toBe(
      true
    );
    expect(result.workspace).toBe(existingWorkspace);
    expect(result.collision).toBe(false);
    expect(result.created).toBe(false);
    expect(result.message).toContain("bootstrapped and refreshed");
  });

  it("does not overwrite a user-created SPARKY collision", async () => {
    const existingWorkspace = {
      id: 789,
      name: SPARKY_WORKSPACE_NAME,
      slug: SPARKY_WORKSPACE_SLUG,
      openAiPrompt: getSparkySystemPrompt(),
      chatMode: "chat",
      isCanonicalSparky: false,
    };

    prisma.workspaces.findUnique.mockResolvedValue(existingWorkspace);
    Workspace.new.mockResolvedValue({
      workspace: null,
      message: "should not be used",
    });
    Workspace.update.mockResolvedValue({
      workspace: null,
      message: "should not be used",
    });
    WorkspaceSuggestedMessages.saveAll.mockResolvedValue();

    const result = await ensureSparkyWorkspace();

    expect(prisma.workspaces.findUnique).toHaveBeenCalledWith({
      where: { slug: SPARKY_WORKSPACE_SLUG },
    });
    expect(Workspace.new).not.toHaveBeenCalled();
    expect(Workspace.update).not.toHaveBeenCalled();
    expect(prisma.workspaces.update).not.toHaveBeenCalled();
    expect(WorkspaceSuggestedMessages.saveAll).not.toHaveBeenCalled();
    // The exact system prompt may match, but this is still NOT canonical.
    expect(promptHasSparkyCoreIdentity(existingWorkspace.openAiPrompt)).toBe(
      true
    );
    expect(result.workspace).toBe(existingWorkspace);
    expect(result.collision).toBe(true);
    expect(result.created).toBe(false);
    expect(result.message).toContain("leaving existing workspace untouched");
  });
});
