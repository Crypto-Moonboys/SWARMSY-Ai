const {
  SparkyTruths,
  normalizeRecordKind,
  normalizeRecordStatus,
} = require("../../models/sparkyTruths");
const { isCanonicalSparkyWorkspace } = require("./index");

const SPARKY_TRUTH_PROTECTION_ERROR = "SPARKY is a protected fixed workspace.";
const APPROVED_PROMPT_KINDS = ["decision", "proof"];

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
    record: null,
    records: [],
  };
}

function requireCanonicalSparkyWorkspace(workspace = null) {
  if (!isCanonicalSparkyWorkspace(workspace)) {
    return buildForbiddenResult();
  }

  return null;
}

function recordTextFromBody(body = {}) {
  return String(
    body.truth ?? body.text ?? body.decision ?? body.idea ?? body.proof ?? ""
  ).trim();
}

function recordFiltersFromQuery(query = {}) {
  const filters = { archived: false };
  if (query.kind) filters.kind = normalizeRecordKind(query.kind);
  if (query.status) {
    const status = normalizeRecordStatus(query.status);
    filters.status = status;
    filters.archived = status === "archived";
  }
  return filters;
}

async function listSparkyRecords(workspace = null, user = null, query = {}) {
  const forbidden = requireCanonicalSparkyWorkspace(workspace);
  if (forbidden) return forbidden;

  const records = await SparkyTruths.where(
    {
      workspaceId: Number(workspace.id),
      userId: getTruthOwnerId(user),
      ...recordFiltersFromQuery(query),
    },
    null,
    { createdAt: "asc" }
  );

  return {
    success: true,
    status: 200,
    error: null,
    records,
  };
}

async function listApprovedSparkyTruths(workspace = null, user = null) {
  const forbidden = requireCanonicalSparkyWorkspace(workspace);
  if (forbidden) return forbidden;

  const truths = await SparkyTruths.where(
    {
      workspaceId: Number(workspace.id),
      userId: getTruthOwnerId(user),
      archived: false,
      status: "approved",
      kind: { in: APPROVED_PROMPT_KINDS },
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

  const result = await listApprovedSparkyTruths(workspace, user);
  const lines = (result.truths || [])
    .map((truth) => {
      const value = String(truth?.truth ?? "").trim();
      if (!value) return "";
      const kind = String(truth?.kind || "decision").toUpperCase();
      return `- [${kind}] ${value}`;
    })
    .filter(Boolean);

  if (lines.length === 0) return "";

  return `## Approved SPARKY Decisions And Proof\n${lines.join("\n")}`;
}

async function createSparkyRecord(workspace = null, user = null, body = {}) {
  const forbidden = requireCanonicalSparkyWorkspace(workspace);
  if (forbidden) return forbidden;

  const truth = recordTextFromBody(body);
  if (!truth) {
    return {
      success: false,
      status: 400,
      error: "SPARKY record text is required.",
      record: null,
      records: [],
    };
  }

  const kind = normalizeRecordKind(body.kind || "idea");
  const status = normalizeRecordStatus(body.status || "draft");
  const { truth: savedRecord, message } = await SparkyTruths.create({
    workspaceId: workspace.id,
    userId: getTruthOwnerId(user),
    truth,
    kind,
    status,
    source: body.source,
    notes: body.notes,
  });

  if (!savedRecord) {
    return {
      success: false,
      status: 500,
      error: message || "Failed to save SPARKY record.",
      record: null,
      records: [],
    };
  }

  return {
    success: true,
    status: 200,
    error: null,
    record: savedRecord,
    records: [],
  };
}

async function createApprovedSparkyTruth(
  workspace = null,
  user = null,
  body = {}
) {
  const forbidden = requireCanonicalSparkyWorkspace(workspace);
  if (forbidden) return forbidden;

  const truth = recordTextFromBody(body);
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
    kind: normalizeRecordKind(body.kind || "decision"),
    status: "approved",
    source: body.source,
    notes: body.notes,
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

async function approveSparkyRecord(
  workspace = null,
  user = null,
  recordId = null,
  body = {}
) {
  const forbidden = requireCanonicalSparkyWorkspace(workspace);
  if (forbidden) return forbidden;

  const { truth: record, message } = await SparkyTruths.update({
    id: recordId,
    workspaceId: workspace.id,
    userId: getTruthOwnerId(user),
    data: {
      ...(body.kind ? { kind: body.kind } : {}),
      ...(body.truth || body.text ? { truth: recordTextFromBody(body) } : {}),
      ...(body.source !== undefined ? { source: body.source } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      status: "approved",
    },
  });

  if (!record) {
    return {
      success: false,
      status: 404,
      error: message || "SPARKY record not found.",
      record: null,
      records: [],
    };
  }

  return {
    success: true,
    status: 200,
    error: null,
    record,
    records: [],
  };
}

async function archiveSparkyRecord(
  workspace = null,
  user = null,
  recordId = null
) {
  const forbidden = requireCanonicalSparkyWorkspace(workspace);
  if (forbidden) return forbidden;

  const { truth: record, message } = await SparkyTruths.archive({
    id: recordId,
    workspaceId: workspace.id,
    userId: getTruthOwnerId(user),
  });

  if (!record) {
    return {
      success: false,
      status: 404,
      error: message || "SPARKY record not found.",
      record: null,
      records: [],
    };
  }

  return {
    success: true,
    status: 200,
    error: null,
    record,
    records: [],
  };
}

async function archiveApprovedSparkyTruth(
  workspace = null,
  user = null,
  truthId = null
) {
  const result = await archiveSparkyRecord(workspace, user, truthId);
  return {
    success: result.success,
    status: result.status,
    error: result.error,
    truth: result.record,
    truths: [],
  };
}

module.exports = {
  SPARKY_TRUTH_PROTECTION_ERROR,
  listSparkyRecords,
  listApprovedSparkyTruths,
  getApprovedSparkyTruthsPromptSection,
  createSparkyRecord,
  createApprovedSparkyTruth,
  approveSparkyRecord,
  archiveSparkyRecord,
  archiveApprovedSparkyTruth,
  requireCanonicalSparkyWorkspace,
};
