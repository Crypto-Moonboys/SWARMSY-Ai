jest.mock(
  "uuid",
  () => ({
    v4: jest.fn(() => "test-chat-id"),
  }),
  { virtual: true }
);

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

jest.mock("../../../utils/sparky/truths", () => ({
  getApprovedSparkyTruthsPromptSection: jest.fn(),
}));

const { chatPrompt } = require("../../../utils/chats");
const {
  getApprovedSparkyTruthsPromptSection,
} = require("../../../utils/sparky/truths");
const { promptWithMemories } = require("../../../utils/memories");

describe("chatPrompt SPARKY truth injection", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("injects approved truths into canonical SPARKY prompts", async () => {
    getApprovedSparkyTruthsPromptSection.mockResolvedValue(
      "## Approved SPARKY Truths\n- The project is a neon cat brand."
    );

    const workspace = {
      id: 10,
      openAiPrompt: "Base SPARKY prompt",
    };

    const result = await chatPrompt(workspace, { id: 7 }, { prompt: "hi" });

    expect(getApprovedSparkyTruthsPromptSection).toHaveBeenCalledWith(
      workspace,
      { id: 7 }
    );
    expect(promptWithMemories).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining(
          "## Approved SPARKY Truths"
        ),
      })
    );
    expect(result).toContain("## Approved SPARKY Truths");
  });

  it("leaves non-canonical prompts unchanged when no truths exist", async () => {
    getApprovedSparkyTruthsPromptSection.mockResolvedValue("");

    const workspace = {
      id: 11,
      openAiPrompt: "Normal workspace prompt",
    };

    const result = await chatPrompt(workspace, { id: 7 }, { prompt: "hi" });

    expect(getApprovedSparkyTruthsPromptSection).toHaveBeenCalledWith(
      workspace,
      { id: 7 }
    );
    expect(promptWithMemories).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: "Normal workspace prompt",
      })
    );
    expect(result).toBe("Normal workspace prompt");
  });
});
