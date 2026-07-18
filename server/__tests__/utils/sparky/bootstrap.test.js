const fs = require("fs");
const path = require("path");

jest.mock("../../../models/workspace", () => ({
  Workspace: {
    get: jest.fn(),
    new: jest.fn(),
  },
}));

const { Workspace } = require("../../../models/workspace");

const {
  SPARKY_WORKSPACE_NAME,
  SPARKY_WORKSPACE_SLUG,
  SPARKY_SYSTEM_PROMPT_PATH,
  SPARKY_CORE_PACK_DIR,
  getSparkySystemPrompt,
  getSparkyCorePackCatalog,
  getSparkyWorkspaceTemplate,
  getSparkyBootstrapConfig,
  ensureSparkyWorkspace,
} = require("../../../utils/sparky");

afterEach(() => {
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
    expect(getSparkySystemPrompt()).toContain("Action Confirmation");
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

    expect(template.name).toBe(SPARKY_WORKSPACE_NAME);
    expect(template.slug).toBe(SPARKY_WORKSPACE_SLUG);
    expect(template.chatMode).toBe("automatic");
    expect(template.openAiPrompt).toBe(getSparkySystemPrompt());

    expect(bootstrap.workspaceTemplate.openAiPrompt).toBe(
      getSparkySystemPrompt()
    );
    expect(bootstrap.corePacks).toHaveLength(7);
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

    Workspace.get.mockResolvedValue(null);
    Workspace.new.mockResolvedValue({
      workspace: createdWorkspace,
      message: null,
    });

    const result = await ensureSparkyWorkspace();

    expect(Workspace.get).toHaveBeenCalledWith({
      slug: SPARKY_WORKSPACE_SLUG,
    });
    expect(Workspace.new).toHaveBeenCalledWith(
      SPARKY_WORKSPACE_NAME,
      null,
      expect.objectContaining({
        chatMode: "automatic",
        openAiPrompt: getSparkySystemPrompt(),
      })
    );
    expect(result.workspace).toEqual(createdWorkspace);
    expect(result.collision).toBe(false);
    expect(result.created).toBe(true);
  });

  it("does not overwrite an existing SPARKY workspace", async () => {
    const existingWorkspace = {
      id: 456,
      name: "User SPARKY",
      slug: SPARKY_WORKSPACE_SLUG,
      openAiPrompt: "user prompt",
      chatMode: "chat",
    };

    Workspace.get.mockResolvedValue(existingWorkspace);

    const result = await ensureSparkyWorkspace();

    expect(Workspace.get).toHaveBeenCalledWith({
      slug: SPARKY_WORKSPACE_SLUG,
    });
    expect(Workspace.new).not.toHaveBeenCalled();
    expect(result.workspace).toBe(existingWorkspace);
    expect(result.collision).toBe(true);
    expect(result.created).toBe(false);
    expect(result.message).toContain("leaving existing workspace untouched");
  });
});
