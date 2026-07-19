const fs = require("fs");
const path = require("path");

jest.mock(
  "uuid",
  () => ({
    v4: jest.fn(() => "test-chat-id"),
  }),
  { virtual: true }
);

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

jest.mock("../../../models/sparkyTruths", () => ({
  SparkyTruths: {
    create: jest.fn(),
    where: jest.fn(),
    archive: jest.fn(),
  },
}));

jest.mock("../../../models/workspaceChats", () => ({
  WorkspaceChats: {
    where: jest.fn(),
  },
}));

jest.mock("../../../utils/chats/commands/reset", () => ({
  resetMemory: jest.fn(),
}));

jest.mock("../../../utils/helpers/chat/responses", () => ({
  convertToPromptHistory: jest.fn((history) => history),
}));

jest.mock("../../../models/slashCommandsPresets", () => ({
  SlashCommandPresets: {
    getUserPresets: jest.fn(async () => []),
    where: jest.fn(async () => []),
  },
}));

jest.mock("../../../utils/memories", () => ({
  promptWithMemories: jest.fn(async ({ systemPrompt }) => systemPrompt),
}));

jest.mock("../../../models/systemPromptVariables", () => ({
  SystemPromptVariables: {
    expandSystemPromptVariables: jest.fn(async (prompt) => prompt),
  },
}));

jest.mock("../../../models/systemSettings", () => ({
  SystemSettings: {
    saneDefaultSystemPrompt: "Default AnythingLLM system prompt.",
  },
}));

const { Workspace } = require("../../../models/workspace");
const {
  WorkspaceSuggestedMessages,
} = require("../../../models/workspacesSuggestedMessages");
const { SparkyTruths } = require("../../../models/sparkyTruths");
const {
  SPARKY_WORKSPACE_NAME,
  SPARKY_WORKSPACE_SLUG,
  getSparkySystemPrompt,
  getSparkyStarterSuggestedMessages,
  getSparkyWorkspaceTemplate,
  isCanonicalSparkyWorkspace,
  ensureSparkyWorkspace,
} = require("../../../utils/sparky");
const {
  createApprovedSparkyTruth,
} = require("../../../utils/sparky/truths");
const { chatPrompt } = require("../../../utils/chats");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

describe("SPARKY v1 normal-user journey sandbox", () => {
  const canonicalWorkspace = {
    id: 42,
    name: SPARKY_WORKSPACE_NAME,
    slug: SPARKY_WORKSPACE_SLUG,
    chatMode: "automatic",
    openAiPrompt: getSparkySystemPrompt(),
  };
  const defaultUser = { id: 7, role: "default" };
  const secondDefaultUser = { id: 8, role: "default" };

  beforeEach(() => {
    WorkspaceSuggestedMessages.getMessages.mockResolvedValue([]);
    WorkspaceSuggestedMessages.saveAll.mockResolvedValue();
    SparkyTruths.where.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("fresh install creates and opens the canonical SPARKY workspace for a first-time user with no idea", async () => {
    Workspace.get.mockResolvedValue(null);
    Workspace.new.mockResolvedValue({
      workspace: canonicalWorkspace,
      message: null,
    });

    const result = await ensureSparkyWorkspace();
    const starterMessages = getSparkyStarterSuggestedMessages();

    expect(Workspace.new).toHaveBeenCalledWith(
      SPARKY_WORKSPACE_NAME,
      null,
      expect.objectContaining({
        chatMode: "automatic",
        openAiPrompt: getSparkySystemPrompt(),
      })
    );
    expect(WorkspaceSuggestedMessages.saveAll).toHaveBeenCalledWith(
      starterMessages,
      SPARKY_WORKSPACE_SLUG
    );
    expect(result).toEqual(
      expect.objectContaining({
        workspace: canonicalWorkspace,
        collision: false,
        created: true,
      })
    );
    expect(starterMessages.map(({ message }) => message)).toEqual([
      "Help me shape my project idea",
      "Build my project identity",
      "Turn this idea into an action plan",
    ]);
    expect(getSparkySystemPrompt()).toContain(
      "When the user does not know what to prompt, offer simple starter directions instead of forcing a project."
    );
  });

  it("helps rough project ideas without saving them as approved truths", async () => {
    const systemPrompt = getSparkySystemPrompt();
    const approvedDecisionsPack = read(
      "server/sparky/packs/core/approved-decisions.md"
    );

    const prompt = await chatPrompt(canonicalWorkspace, defaultUser, {
      prompt: "maybe a masked pizza brand, not sure yet",
    });

    expect(prompt).toContain(systemPrompt);
    expect(prompt).not.toContain("## Approved SPARKY Truths");
    expect(SparkyTruths.where).toHaveBeenCalledWith(
      {
        workspaceId: canonicalWorkspace.id,
        userId: defaultUser.id,
        archived: false,
      },
      null,
      { createdAt: "asc" }
    );
    expect(SparkyTruths.create).not.toHaveBeenCalled();
    expect(systemPrompt).toContain(
      "Stay separate from the user's rough ideas until they are approved."
    );
    expect(approvedDecisionsPack).toContain(
      "Suggestions are drafts, not truth."
    );
  });

  it("does not force a user who only wants normal chat into a project workflow", async () => {
    const systemPrompt = getSparkySystemPrompt();
    const normalAnythingLlmWorkspace = {
      id: 99,
      name: "Normal Research",
      slug: "normal-research",
      chatMode: "chat",
      openAiPrompt: "Answer like normal AnythingLLM.",
    };

    const prompt = await chatPrompt(normalAnythingLlmWorkspace, defaultUser, {
      prompt: "explain why the sky is blue",
    });

    expect(prompt).toBe("Answer like normal AnythingLLM.");
    expect(SparkyTruths.create).not.toHaveBeenCalled();
    expect(systemPrompt).toContain(
      "When the user is only chatting, respond normally and keep the conversation natural."
    );
    expect(systemPrompt).toContain(
      "Do not force every chat into a project or planning flow."
    );
    expect(systemPrompt).toContain(
      "Do not replace normal AnythingLLM behavior."
    );
  });

  it("saves approved project truths and injects them into later SPARKY prompts", async () => {
    SparkyTruths.create.mockResolvedValue({
      truth: {
        id: 123,
        workspaceId: canonicalWorkspace.id,
        userId: defaultUser.id,
        truth: "The project name is Masked Pizza Radio.",
        archived: false,
      },
      message: null,
    });

    const saveResult = await createApprovedSparkyTruth(
      canonicalWorkspace,
      defaultUser,
      { decision: "The project name is Masked Pizza Radio." }
    );

    SparkyTruths.where.mockResolvedValue([
      {
        id: 123,
        workspaceId: canonicalWorkspace.id,
        userId: defaultUser.id,
        truth: "The project name is Masked Pizza Radio.",
        archived: false,
      },
    ]);

    const prompt = await chatPrompt(canonicalWorkspace, defaultUser, {
      prompt: "continue",
    });

    expect(saveResult).toEqual(
      expect.objectContaining({
        success: true,
        truth: expect.objectContaining({
          truth: "The project name is Masked Pizza Radio.",
        }),
      })
    );
    expect(SparkyTruths.create).toHaveBeenCalledWith({
      workspaceId: canonicalWorkspace.id,
      userId: defaultUser.id,
      truth: "The project name is Masked Pizza Radio.",
    });
    expect(prompt).toContain("## Approved SPARKY Truths");
    expect(prompt).toContain("- The project name is Masked Pizza Radio.");
  });

  it("keeps default multi-user access to canonical SPARKY while non-canonical sparky collisions stay private and unprotected", () => {
    const workspaceModel = read("server/models/workspace.js");
    const workspacesEndpoint = read("server/endpoints/workspaces.js");
    const adminWorkspaceUi = read(
      "frontend/src/pages/Admin/Workspaces/WorkspaceRow/index.jsx"
    );
    const canonicalCollision = {
      ...canonicalWorkspace,
      isCanonicalSparky: true,
    };
    const userCreatedCollision = {
      id: 777,
      name: "sparky",
      slug: SPARKY_WORKSPACE_SLUG,
      chatMode: "chat",
      openAiPrompt: "This is my private workspace.",
    };

    expect(isCanonicalSparkyWorkspace(canonicalCollision)).toBe(true);
    expect(isCanonicalSparkyWorkspace(userCreatedCollision)).toBe(false);
    expect(workspaceModel).toContain("whereWithUser");
    expect(workspaceModel).toContain("workspace_users");
    expect(workspaceModel).toContain(`slug: SPARKY_WORKSPACE_SLUG`);
    expect(workspaceModel).toContain(`name: "SPARKY"`);
    expect(workspaceModel).toContain("openAiPrompt: getSparkySystemPrompt()");
    expect(workspacesEndpoint).toContain("flexUserRoleValid([ROLES.all])");
    expect(workspacesEndpoint).toContain(
      '"/workspace/:slug/sparky-truths"'
    );
    expect(adminWorkspaceUi).toContain("isCanonicalSparkyWorkspace(workspace)");
  });

  it("keeps normal AnythingLLM advanced mode available beside SPARKY", () => {
    const template = getSparkyWorkspaceTemplate();
    const workspaceModel = read("server/models/workspace.js");
    const apiWorkspaceEndpoint = read(
      "server/endpoints/api/workspace/index.js"
    );
    const activeWorkspaces = read(
      "frontend/src/components/Sidebar/ActiveWorkspaces/index.jsx"
    );
    const homePage = read("frontend/src/pages/Main/Home/index.jsx");

    expect(template.chatMode).toBe("automatic");
    expect(workspaceModel).toContain(
      'VALID_CHAT_MODES: ["chat", "query", "automatic"]'
    );
    expect(workspaceModel).toContain('"chatProvider"');
    expect(workspaceModel).toContain('"agentProvider"');
    expect(apiWorkspaceEndpoint).toContain('app.post("/v1/workspace/new"');
    expect(apiWorkspaceEndpoint).toContain("additionalFields");
    expect(activeWorkspaces).toContain("Continue with SPARKY");
    expect(activeWorkspaces).toContain("otherWorkspaces.map");
    expect(homePage).toContain("WorkspaceModelPicker");
    expect(homePage).toContain("QuickActions");
  });

  it("scopes approved truths by user so one default user's SPARKY memory is not injected for another", async () => {
    SparkyTruths.where.mockResolvedValue([]);

    const prompt = await chatPrompt(canonicalWorkspace, secondDefaultUser, {
      prompt: "continue",
    });

    expect(prompt).not.toContain("## Approved SPARKY Truths");
    expect(SparkyTruths.where).toHaveBeenCalledWith(
      {
        workspaceId: canonicalWorkspace.id,
        userId: secondDefaultUser.id,
        archived: false,
      },
      null,
      { createdAt: "asc" }
    );
  });
});
