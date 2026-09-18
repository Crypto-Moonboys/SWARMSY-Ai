jest.mock("../../../models/sparkyTruths", () => ({
  SparkyTruths: {
    create: jest.fn(),
    get: jest.fn(),
    where: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
  },
}));

jest.mock("../../../models/workspacesSuggestedMessages", () => ({
  WorkspaceSuggestedMessages: {
    getMessages: jest.fn(),
    saveAll: jest.fn(),
  },
}));

const { SparkyTruths } = require("../../../models/sparkyTruths");
const {
  SPARKY_WORKSPACE_NAME,
  SPARKY_WORKSPACE_SLUG,
  getSparkySystemPrompt,
} = require("../../../utils/sparky");
const {
  listApprovedSparkyTruths,
  listSparkyRecords,
  getApprovedSparkyTruthsPromptSection,
  createApprovedSparkyTruth,
  createSparkyRecord,
  approveSparkyRecord,
  archiveApprovedSparkyTruth,
  SPARKY_TRUTH_PROTECTION_ERROR,
} = require("../../../utils/sparky/truths");

describe("SPARKY truths", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const canonicalWorkspace = {
    id: 42,
    name: SPARKY_WORKSPACE_NAME,
    slug: SPARKY_WORKSPACE_SLUG,
    openAiPrompt: getSparkySystemPrompt(),
  };

  const collisionWorkspace = {
    id: 99,
    name: "User SPARKY",
    slug: SPARKY_WORKSPACE_SLUG,
    openAiPrompt: "user prompt",
  };

  it("rejects non-canonical sparky collisions from truth routes", async () => {
    const listResult = await listApprovedSparkyTruths(collisionWorkspace, {
      id: 7,
    });
    const createResult = await createApprovedSparkyTruth(collisionWorkspace, {
      id: 7,
    });
    const archiveResult = await archiveApprovedSparkyTruth(
      collisionWorkspace,
      { id: 7 },
      1
    );

    expect(listResult).toEqual(
      expect.objectContaining({
        success: false,
        status: 403,
        error: SPARKY_TRUTH_PROTECTION_ERROR,
      })
    );
    expect(createResult).toEqual(
      expect.objectContaining({
        success: false,
        status: 403,
        error: SPARKY_TRUTH_PROTECTION_ERROR,
      })
    );
    expect(archiveResult).toEqual(
      expect.objectContaining({
        success: false,
        status: 403,
        error: SPARKY_TRUTH_PROTECTION_ERROR,
      })
    );
    expect(SparkyTruths.where).not.toHaveBeenCalled();
    expect(SparkyTruths.create).not.toHaveBeenCalled();
    expect(SparkyTruths.archive).not.toHaveBeenCalled();
  });

  it("saves draft ideas without making them approved prompt truths", async () => {
    SparkyTruths.create.mockResolvedValue({
      truth: {
        id: 3,
        workspaceId: canonicalWorkspace.id,
        userId: 7,
        truth: "Maybe use a neon cat mascot.",
        kind: "idea",
        status: "draft",
        archived: false,
      },
      message: null,
    });

    const result = await createSparkyRecord(
      canonicalWorkspace,
      { id: 7 },
      { text: "Maybe use a neon cat mascot.", kind: "idea", status: "draft" }
    );

    expect(SparkyTruths.create).toHaveBeenCalledWith({
      workspaceId: canonicalWorkspace.id,
      userId: 7,
      truth: "Maybe use a neon cat mascot.",
      kind: "idea",
      status: "draft",
      source: undefined,
      notes: undefined,
    });
    expect(result.record).toEqual(
      expect.objectContaining({
        kind: "idea",
        status: "draft",
      })
    );
  });

  it("lists SPARKY records by kind and status filters", async () => {
    SparkyTruths.where.mockResolvedValue([
      {
        id: 4,
        workspaceId: canonicalWorkspace.id,
        userId: 7,
        truth: "The brand voice is sharp.",
        kind: "decision",
        status: "approved",
        archived: false,
      },
    ]);

    const result = await listSparkyRecords(
      canonicalWorkspace,
      { id: 7 },
      { kind: "decision", status: "approved" }
    );

    expect(SparkyTruths.where).toHaveBeenCalledWith(
      {
        workspaceId: canonicalWorkspace.id,
        userId: 7,
        archived: false,
        kind: "decision",
        status: "approved",
      },
      null,
      { createdAt: "asc" }
    );
    expect(result.records).toHaveLength(1);
  });

  it("scopes approved truths to the current workspace and user", async () => {
    SparkyTruths.where.mockResolvedValue([
      {
        id: 1,
        workspaceId: canonicalWorkspace.id,
        userId: 7,
        truth: "The brand is called Neon Cat.",
        kind: "decision",
        status: "approved",
        archived: false,
      },
    ]);
    SparkyTruths.create.mockResolvedValue({
      truth: {
        id: 2,
        workspaceId: canonicalWorkspace.id,
        userId: 7,
        truth: "The project uses a neon cat brand.",
        kind: "decision",
        status: "approved",
        archived: false,
      },
      message: null,
    });
    SparkyTruths.archive.mockResolvedValue({
      truth: {
        id: 2,
        workspaceId: canonicalWorkspace.id,
        userId: 7,
        truth: "The project uses a neon cat brand.",
        kind: "decision",
        status: "archived",
        archived: true,
      },
      message: null,
    });

    const listResult = await listApprovedSparkyTruths(canonicalWorkspace, {
      id: 7,
    });
    const createResult = await createApprovedSparkyTruth(
      canonicalWorkspace,
      { id: 7 },
      { decision: "The project uses a neon cat brand." }
    );
    const archiveResult = await archiveApprovedSparkyTruth(
      canonicalWorkspace,
      { id: 7 },
      2
    );

    expect(SparkyTruths.where).toHaveBeenCalledWith(
      {
        workspaceId: canonicalWorkspace.id,
        userId: 7,
        archived: false,
        status: "approved",
        kind: { in: ["decision", "proof"] },
      },
      null,
      { createdAt: "asc" }
    );
    expect(SparkyTruths.create).toHaveBeenCalledWith({
      workspaceId: canonicalWorkspace.id,
      userId: 7,
      truth: "The project uses a neon cat brand.",
      kind: "decision",
      status: "approved",
      source: undefined,
      notes: undefined,
    });
    expect(SparkyTruths.archive).toHaveBeenCalledWith({
      id: 2,
      workspaceId: canonicalWorkspace.id,
      userId: 7,
    });
    expect(listResult.truths).toHaveLength(1);
    expect(createResult.truth.truth).toBe(
      "The project uses a neon cat brand."
    );
    expect(archiveResult.truth.archived).toBe(true);
  });

  it("approves draft records into prompt-safe records", async () => {
    SparkyTruths.update.mockResolvedValue({
      truth: {
        id: 9,
        workspaceId: canonicalWorkspace.id,
        userId: 7,
        truth: "The mascot is Neon Cat.",
        kind: "decision",
        status: "approved",
        archived: false,
      },
      message: null,
    });

    const result = await approveSparkyRecord(
      canonicalWorkspace,
      { id: 7 },
      9,
      { kind: "decision" }
    );

    expect(SparkyTruths.update).toHaveBeenCalledWith({
      id: 9,
      workspaceId: canonicalWorkspace.id,
      userId: 7,
      data: {
        kind: "decision",
        status: "approved",
      },
    });
    expect(result.record.status).toBe("approved");
  });

  it("formats approved truths for prompt injection", async () => {
    SparkyTruths.where.mockResolvedValue([
      {
        id: 11,
        workspaceId: canonicalWorkspace.id,
        userId: 7,
        truth: "The project is a neon cat brand.",
        kind: "decision",
        status: "approved",
        archived: false,
      },
      {
        id: 12,
        workspaceId: canonicalWorkspace.id,
        userId: 7,
        truth: "The voice is sharp and playful.",
        kind: "proof",
        status: "approved",
        archived: false,
      },
    ]);

    const promptSection = await getApprovedSparkyTruthsPromptSection(
      canonicalWorkspace,
      { id: 7 }
    );

    expect(SparkyTruths.where).toHaveBeenCalledWith(
      {
        workspaceId: canonicalWorkspace.id,
        userId: 7,
        archived: false,
        status: "approved",
        kind: { in: ["decision", "proof"] },
      },
      null,
      { createdAt: "asc" }
    );
    expect(promptSection).toBe(
      [
        "## Approved SPARKY Decisions And Proof",
        "- [DECISION] The project is a neon cat brand.",
        "- [PROOF] The voice is sharp and playful.",
      ].join("\n")
    );
  });
});
