const fs = require("fs");
const path = require("path");

jest.mock("../../../models/workspace", () => ({
  Workspace: {
    get: jest.fn(),
    new: jest.fn(),
  },
}));

jest.mock("../../../models/workspacesSuggestedMessages", () => ({
  WorkspaceSuggestedMessages: {
    getMessages: jest.fn(),
    saveAll: jest.fn(),
  },
}));

const { Workspace } = require("../../../models/workspace");
const { WorkspaceSuggestedMessages } = require("../../../models/workspacesSuggestedMessages");

const {
  SPARKY_WORKSPACE_NAME,
  SPARKY_WORKSPACE_SLUG,
  SPARKY_SYSTEM_PROMPT_PATH,
  SPARKY_CORE_PACK_DIR,
  getSparkySystemPrompt,
  getSparkyCanonicalSystemPrompt,
  getSparkyCorePackCatalog,
  getSparkyStarterSuggestedMessages,
  getSparkyWorkspaceTemplate,
  getSparkyBootstrapConfig,
  ensureSparkyWorkspace,
} = require("../../../utils/sparky");

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

describe("SPARKY bootstrap foundation", () => {
  it("keeps the product lock doc in place", () => {
    const productLockPath = path.join(
      process.cwd(),
      "SPARKY_PRODUCT_LOCK.md"
    );
    expect(fs.existsSync(productLockPath)).toBe(true);
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
    expect(getSparkySystemPrompt()).toContain(
      "Use these first-run prompts when they fit:"
    );
    expect(getSparkySystemPrompt()).toContain("Do not force every chat into a project");
  });

  it("keeps the core packs on disk and discoverable", () => {
    const packs = getSparkyCorePackCatalog();
    expect(packs).toHaveLength(7);
    expect(packs.every((pack) => pack.exists)).toBe(true);
    expect(packs.map((pack) => pack.filename)).toEqual([
      "project-manager-protocol.md",
      "identity-questionnaire.md",
      "do-it-for-me-prompts.md",
      "approved-decisions.md",
      "action-confirmation.md",
      "tasks-and-schedule.md",
      "proof-review.md",
    ]);
  });

  it("exposes a fixed SPARKY workspace template with the system prompt attached", () => {
    const template = getSparkyWorkspaceTemplate();
    const bootstrap = getSparkyBootstrapConfig();
    const starterPrompts = getSparkyStarterSuggestedMessages();

    expect(template.name).toBe(SPARKY_WORKSPACE_NAME);
    expect(template.slug).toBe(SPARKY_WORKSPACE_SLUG);
    expect(template.chatMode).toBe("automatic");
    expect(template.openAiPrompt).toBe(getSparkySystemPrompt());

    expect(bootstrap.workspaceTemplate.openAiPrompt).toBe(
      getSparkySystemPrompt()
    );
    expect(bootstrap.corePacks).toHaveLength(7);
    expect(bootstrap.starterSuggestedMessages).toEqual(starterPrompts);
    expect(starterPrompts).toEqual([
      { heading: "", message: "Help me shape my project idea" },
      { heading: "", message: "Build my project identity" },
      { heading: "", message: "Turn this idea into an action plan" },
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
    };

    WorkspaceSuggestedMessages.getMessages.mockResolvedValue([]);
    Workspace.get.mockResolvedValue(null);
    Workspace.new.mockResolvedValue({
      workspace: createdWorkspace,
      message: null,
    });
    WorkspaceSuggestedMessages.saveAll.mockResolvedValue();

    const result = await ensureSparkyWorkspace();

    expect(Workspace.get).toHaveBeenCalledWith({ slug: SPARKY_WORKSPACE_SLUG });
    expect(Workspace.new).toHaveBeenCalledWith(
      SPARKY_WORKSPACE_NAME,
      null,
      expect.objectContaining({
        chatMode: "automatic",
        openAiPrompt: getSparkySystemPrompt(),
      })
    );
    expect(WorkspaceSuggestedMessages.saveAll).toHaveBeenCalledWith(
      getSparkyStarterSuggestedMessages(),
      SPARKY_WORKSPACE_SLUG
    );
    expect(result.workspace).toEqual(createdWorkspace);
    expect(result.collision).toBe(false);
    expect(result.created).toBe(true);
  });

  it("recognizes the PR #1 SPARKY workspace as canonical on upgrade", async () => {
    const existingWorkspace = {
      id: 456,
      name: SPARKY_WORKSPACE_NAME,
      slug: SPARKY_WORKSPACE_SLUG,
      openAiPrompt: getSparkyCanonicalSystemPrompt(),
      chatMode: "automatic",
    };

    Workspace.get.mockResolvedValue(existingWorkspace);
    Workspace.new.mockResolvedValue({
      workspace: null,
      message: "should not be used",
    });
    WorkspaceSuggestedMessages.saveAll.mockResolvedValue();

    const result = await ensureSparkyWorkspace();

    expect(Workspace.get).toHaveBeenCalledWith({ slug: SPARKY_WORKSPACE_SLUG });
    expect(Workspace.new).not.toHaveBeenCalled();
    expect(WorkspaceSuggestedMessages.saveAll).toHaveBeenCalledWith(
      getSparkyStarterSuggestedMessages(),
      SPARKY_WORKSPACE_SLUG
    );
    expect(result.workspace).toBe(existingWorkspace);
    expect(result.collision).toBe(false);
    expect(result.created).toBe(false);
    expect(result.message).toContain("already bootstrapped");
  });

  it("does not overwrite a user-created SPARKY collision", async () => {
    const existingWorkspace = {
      id: 789,
      name: "User SPARKY",
      slug: SPARKY_WORKSPACE_SLUG,
      openAiPrompt: "user prompt",
      chatMode: "chat",
    };

    Workspace.get.mockResolvedValue(existingWorkspace);
    Workspace.new.mockResolvedValue({
      workspace: null,
      message: "should not be used",
    });
    WorkspaceSuggestedMessages.saveAll.mockResolvedValue();

    const result = await ensureSparkyWorkspace();

    expect(Workspace.get).toHaveBeenCalledWith({ slug: SPARKY_WORKSPACE_SLUG });
    expect(Workspace.new).not.toHaveBeenCalled();
    expect(WorkspaceSuggestedMessages.saveAll).not.toHaveBeenCalled();
    expect(result.workspace).toBe(existingWorkspace);
    expect(result.collision).toBe(true);
    expect(result.created).toBe(false);
    expect(result.message).toContain("leaving existing workspace untouched");
  });
});
