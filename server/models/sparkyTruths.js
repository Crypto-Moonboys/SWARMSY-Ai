const prisma = require("../utils/prisma");

function normalizeTruthValue(truth = "") {
  return String(truth || "").trim();
}

function normalizeUserId(userId = null) {
  if (userId === null || userId === undefined || userId === "") return null;
  const normalized = Number(userId);
  return Number.isNaN(normalized) ? null : normalized;
}

const SparkyTruths = {
  create: async function ({
    workspaceId = null,
    userId = null,
    truth = null,
  } = {}) {
    const normalizedTruth = normalizeTruthValue(truth);
    if (!workspaceId || !normalizedTruth) {
      return { truth: null, message: "truth cannot be null" };
    }

    try {
      const record = await prisma.sparky_truths.create({
        data: {
          workspaceId: Number(workspaceId),
          userId: normalizeUserId(userId),
          truth: normalizedTruth,
        },
      });

      return { truth: record, message: null };
    } catch (error) {
      console.error(error.message);
      return { truth: null, message: error.message };
    }
  },

  get: async function (clause = {}) {
    try {
      const truth = await prisma.sparky_truths.findFirst({
        where: clause,
      });
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

  archive: async function ({
    id = null,
    workspaceId = null,
    userId = null,
  } = {}) {
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

    try {
      const result = await prisma.sparky_truths.updateMany({
        where,
        data: {
          archived: true,
          lastUpdatedAt: new Date(),
        },
      });

      if (result.count === 0) {
        return { truth: null, message: "truth not found" };
      }

      const truth = await prisma.sparky_truths.findFirst({ where });
      return { truth, message: null };
    } catch (error) {
      console.error(error.message);
      return { truth: null, message: error.message };
    }
  },
};

module.exports = { SparkyTruths };
