const { SparkyTruths } = require("../../models/sparkyTruths");
const { isCanonicalSparkyWorkspace } = require("./index");

const SPARKY_TRUTH_PROTECTION_ERROR = "SPARKY is a protected fixed workspace.";

function getTruthOwnerId(user = null) {
  return user?.id ?? null;
}

function buildForbiddenResult() {
  return {
    success: false,
    status: 403,
    error: SPARKY_TRUTH_PROTECTION_ERROR,
    truth: null,
    truths: [],
  };
}

function requireCanonicalSparkyWorkspace(workspace = null) {
  if (!isCanonicalSparkyWorkspace(workspace)) {
    return buildForbiddenResult();
  }

  return null;
}

async function listApprovedSparkyTruths(workspace = null, user = null) {
  const forbidden = requireCanonicalSparkyWorkspace(workspace);
  if (forbidden) return forbidden;

  const truths = await SparkyTruths.where(
    {
      workspaceId: Number(workspace.id),
      userId: getTruthOwnerId(user),
      archived: false,
    },
    null,
    { createdAt: "asc" }
  );

  return {
    success: true,
    status: 200,
    error: null,
    truths,
  };
}

async function getApprovedSparkyTruthsPromptSection(
  workspace = null,
  user = null
) {
  const forbidden = requireCanonicalSparkyWorkspace(workspace);
  if (forbidden) return "";

  const truths = await SparkyTruths.where(
    {
      workspaceId: Number(workspace.id),
      userId: getTruthOwnerId(user),
      archived: false,
    },
    null,
    { createdAt: "asc" }
  );

  const lines = truths
    .map((truth) => `- ${String(truth?.truth ?? "").trim()}`)
    .filter((line) => line !== "- ");

  if (lines.length === 0) return "";

  return `## Approved SPARKY Truths\n${lines.join("\n")}`;
}

async function createApprovedSparkyTruth(
  workspace = null,
  user = null,
  body = {}
) {
  const forbidden = requireCanonicalSparkyWorkspace(workspace);
  if (forbidden) return forbidden;

  const truth = String(body.truth ?? body.text ?? body.decision ?? "").trim();
  if (!truth) {
    return {
      success: false,
      status: 400,
      error: "Approved SPARKY truth is required.",
      truth: null,
      truths: [],
    };
  }

  const { truth: savedTruth, message } = await SparkyTruths.create({
    workspaceId: workspace.id,
    userId: getTruthOwnerId(user),
    truth,
  });

  if (!savedTruth) {
    return {
      success: false,
      status: 500,
      error: message || "Failed to save approved SPARKY truth.",
      truth: null,
      truths: [],
    };
  }

  return {
    success: true,
    status: 200,
    error: null,
    truth: savedTruth,
    truths: [],
  };
}

async function archiveApprovedSparkyTruth(
  workspace = null,
  user = null,
  truthId = null
) {
  const forbidden = requireCanonicalSparkyWorkspace(workspace);
  if (forbidden) return forbidden;

  const { truth, message } = await SparkyTruths.archive({
    id: truthId,
    workspaceId: workspace.id,
    userId: getTruthOwnerId(user),
  });

  if (!truth) {
    return {
      success: false,
      status: 404,
      error: message || "Approved SPARKY truth not found.",
      truth: null,
      truths: [],
    };
  }

  return {
    success: true,
    status: 200,
    error: null,
    truth,
    truths: [],
  };
}

module.exports = {
  SPARKY_TRUTH_PROTECTION_ERROR,
  listApprovedSparkyTruths,
  getApprovedSparkyTruthsPromptSection,
  createApprovedSparkyTruth,
  archiveApprovedSparkyTruth,
  requireCanonicalSparkyWorkspace,
};
