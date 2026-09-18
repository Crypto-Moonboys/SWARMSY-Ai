const prisma = require("../utils/prisma");

const SPARKY_RECORD_KINDS = ["idea", "decision", "proof"];
const SPARKY_RECORD_STATUSES = ["draft", "approved", "archived"];

function normalizeTruthValue(truth = "") {
  return String(truth || "").trim();
}

function normalizeUserId(userId = null) {
  if (userId === null || userId === undefined || userId === "") return null;
  const normalized = Number(userId);
  return Number.isNaN(normalized) ? null : normalized;
}

function normalizeRecordKind(kind = "decision") {
  const normalized = String(kind || "decision").trim().toLowerCase();
  return SPARKY_RECORD_KINDS.includes(normalized) ? normalized : "decision";
}

function normalizeRecordStatus(status = "approved") {
  const normalized = String(status || "approved").trim().toLowerCase();
  return SPARKY_RECORD_STATUSES.includes(normalized) ? normalized : "approved";
}

function normalizeOptionalText(value = null) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function buildRecordData({
  workspaceId = null,
  userId = null,
  truth = null,
  kind = "decision",
  status = "approved",
  source = null,
  notes = null,
} = {}) {
  return {
    workspaceId: Number(workspaceId),
    userId: normalizeUserId(userId),
    truth: normalizeTruthValue(truth),
    kind: normalizeRecordKind(kind),
    status: normalizeRecordStatus(status),
    source: normalizeOptionalText(source),
    notes: normalizeOptionalText(notes),
    archived: normalizeRecordStatus(status) === "archived",
  };
}

const SparkyTruths = {
  create: async function (input = {}) {
    const data = buildRecordData(input);
    if (!data.workspaceId || !data.truth) {
      return { truth: null, message: "truth cannot be null" };
    }

    try {
      const record = await prisma.sparky_truths.create({ data });
      return { truth: record, message: null };
    } catch (error) {
      console.error(error.message);
      return { truth: null, message: error.message };
    }
  },

  get: async function (clause = {}) {
    try {
      const truth = await prisma.sparky_truths.findFirst({ where: clause });
      return truth || null;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  },

  where: async function (clause = {}, limit = null, orderBy = null) {
    try {
      const truths = await prisma.sparky_truths.findMany({
        where: clause,
        ...(limit !== null ? { take: limit } : {}),
        ...(orderBy !== null ? { orderBy } : { orderBy: { createdAt: "asc" } }),
      });
      return truths;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },

  update: async function ({ id = null, workspaceId = null, userId = null, data = {} } = {}) {
    if (!id || !workspaceId) {
      return { truth: null, message: "truth id and workspace id are required" };
    }

    const where = {
      id: Number(id),
      workspaceId: Number(workspaceId),
      ...(userId !== null && userId !== undefined
        ? { userId: normalizeUserId(userId) }
        : {}),
    };

    const updateData = {
      ...(data.truth !== undefined ? { truth: normalizeTruthValue(data.truth) } : {}),
      ...(data.kind !== undefined ? { kind: normalizeRecordKind(data.kind) } : {}),
      ...(data.status !== undefined
        ? {
            status: normalizeRecordStatus(data.status),
            archived: normalizeRecordStatus(data.status) === "archived",
          }
        : {}),
      ...(data.source !== undefined ? { source: normalizeOptionalText(data.source) } : {}),
      ...(data.notes !== undefined ? { notes: normalizeOptionalText(data.notes) } : {}),
      lastUpdatedAt: new Date(),
    };

    try {
      const existing = await prisma.sparky_truths.findFirst({ where });
      if (!existing) return { truth: null, message: "truth not found" };

      const truth = await prisma.sparky_truths.update({
        where: { id: existing.id },
        data: updateData,
      });
      return { truth, message: null };
    } catch (error) {
      console.error(error.message);
      return { truth: null, message: error.message };
    }
  },

  archive: async function ({ id = null, workspaceId = null, userId = null } = {}) {
    return this.update({
      id,
      workspaceId,
      userId,
      data: { status: "archived" },
    });
  },
};

module.exports = {
  SparkyTruths,
  SPARKY_RECORD_KINDS,
  SPARKY_RECORD_STATUSES,
  normalizeRecordKind,
  normalizeRecordStatus,
};
