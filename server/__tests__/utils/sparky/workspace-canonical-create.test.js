jest.mock("../../../utils/prisma", () => ({
  workspaces: {
    create: jest.fn(),
  },
}));

jest.mock("../../../models/documents", () => ({ Document: {} }));
jest.mock("../../../models/workspaceUsers", () => ({
  WorkspaceUser: { create: jest.fn() },
}));
jest.mock("../../../models/user", () => ({ User: {} }));
jest.mock("../../../models/promptHistory", () => ({ PromptHistory: {} }));
jest.mock("../../../models/systemSettings", () => ({
  SystemSettings: { get: jest.fn() },
}));
jest.mock("../../../utils/sparky", () => ({
  SPARKY_WORKSPACE_NAME: "SPARKY",
  SPARKY_WORKSPACE_SLUG: "sparky",
  isCanonicalSparkyWorkspace: (workspace) =>
    workspace?.slug === "sparky" && workspace?.isCanonicalSparky === true,
}));

const prisma = require("../../../utils/prisma");
const { Workspace } = require("../../../models/workspace");

describe("canonical SPARKY creation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates canonical ownership atomically with the reserved slug", async () => {
    const createdWorkspace = {
      id: 123,
      name: "SPARKY",
      slug: "sparky",
      chatMode: "chat",
      openAiPrompt: "SPARKY prompt",
      isCanonicalSparky: true,
    };
    prisma.workspaces.create.mockResolvedValue(createdWorkspace);

    const result = await Workspace.newCanonicalSparky("SPARKY", "sparky", {
      chatMode: "chat",
      openAiPrompt: "SPARKY prompt",
    });

    expect(prisma.workspaces.create).toHaveBeenCalledWith({
      data: {
        name: "SPARKY",
        slug: "sparky",
        chatMode: "chat",
        openAiPrompt: "SPARKY prompt",
        isCanonicalSparky: true,
      },
    });
    expect(result.workspace).toEqual(createdWorkspace);
    expect(result.workspace.isCanonicalSparky).toBe(true);
  });

  it("refuses non-canonical identities without creating or elevating a row", async () => {
    const result = await Workspace.newCanonicalSparky("User SPARKY", "sparky", {
      openAiPrompt: "User prompt",
    });

    expect(result.workspace).toBeNull();
    expect(result.message).toContain("reserved identity");
    expect(prisma.workspaces.create).not.toHaveBeenCalled();
  });

  it("does not retry a reserved-slug conflict with a generated slug", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    prisma.workspaces.create.mockRejectedValue(
      new Error("Unique constraint failed")
    );

    const result = await Workspace.newCanonicalSparky("SPARKY", "sparky", {
      chatMode: "chat",
      openAiPrompt: "SPARKY prompt",
    });

    expect(prisma.workspaces.create).toHaveBeenCalledTimes(1);
    expect(prisma.workspaces.create.mock.calls[0][0].data.slug).toBe("sparky");
    expect(result.workspace).toBeNull();
    expect(result.message).toBe("Unique constraint failed");
    consoleError.mockRestore();
  });
});
