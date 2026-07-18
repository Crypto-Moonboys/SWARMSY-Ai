jest.mock("../../../utils/prisma", () => ({
  workspaces: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("../../../models/documents", () => ({
  Document: {
    forWorkspace: jest.fn(),
  },
}));

const prisma = require("../../../utils/prisma");
const { Document } = require("../../../models/documents");
const { Workspace } = require("../../../models/workspace");
const { getSparkySystemPrompt } = require("../../../utils/sparky");

describe("SPARKY canonical visibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps a user-created sparky collision private to its owner", async () => {
    const collision = {
      id: 21,
      slug: "sparky",
      name: "Private Sparky",
      openAiPrompt: "user prompt",
      isCanonicalSparky: false,
    };

    jest.spyOn(Workspace, "get").mockResolvedValue(collision);
    prisma.workspaces.findFirst.mockResolvedValue(null);
    prisma.workspaces.findMany.mockResolvedValue([]);

    const user = { id: 88, role: "default" };

    expect(await Workspace.getWithUser(user, { slug: "sparky" })).toBeNull();
    expect(await Workspace.whereWithUser(user, {})).toEqual([]);

    const visibilityClause = prisma.workspaces.findMany.mock.calls[0][0].where
      .AND[1].OR;
    expect(
      visibilityClause.some(
        (entry) =>
          entry.slug === "sparky" &&
          entry.name === "SPARKY" &&
          entry.openAiPrompt === getSparkySystemPrompt()
      )
    ).toBe(true);
    expect(
      visibilityClause.some((entry) => Object.hasOwn(entry, "metadata"))
    ).toBe(false);
  });

  it("recognizes and protects the bootstrapped SPARKY workspace", async () => {
    const canonical = {
      id: 1,
      slug: "sparky",
      name: "SPARKY",
      openAiPrompt: getSparkySystemPrompt(),
      isCanonicalSparky: true,
    };
    const canonicalRecord = {
      ...canonical,
      workspace_users: [{ user_id: 88 }],
    };

    jest.spyOn(Workspace, "get").mockResolvedValue(canonical);
    jest.spyOn(Workspace, "_getContextWindow").mockReturnValue(8192);
    jest.spyOn(Workspace, "_getCurrentContextTokenCount").mockResolvedValue(27);
    Document.forWorkspace.mockResolvedValue([{ id: 1 }]);
    prisma.workspaces.findFirst.mockResolvedValue(canonicalRecord);

    const user = { id: 88, role: "default" };
    const result = await Workspace.getWithUser(user, { slug: "sparky" });

    expect(result).toMatchObject({
      slug: "sparky",
      name: "SPARKY",
      isCanonicalSparky: true,
      workspace_users: [{ user_id: 88 }],
      documents: [{ id: 1 }],
      contextWindow: 8192,
      currentContextTokenCount: 27,
    });
    expect(prisma.workspaces.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "sparky" },
        include: {
          workspace_users: true,
          documents: true,
        },
      })
    );

    prisma.workspaces.delete.mockResolvedValue(canonical);
    expect(await Workspace.delete({ slug: "sparky" })).toBe(false);
    expect(prisma.workspaces.delete).not.toHaveBeenCalled();
  });
});
