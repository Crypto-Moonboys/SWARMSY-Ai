const fs = require("fs");
const path = require("path");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

const WORKSPACE_MODEL_PATH = "server/models/workspace.js";
const WORKSPACES_ENDPOINT_PATH = "server/endpoints/workspaces.js";
const API_WORKSPACE_ENDPOINT_PATH =
  "server/endpoints/api/workspace/index.js";
const ADMIN_ENDPOINT_PATH = "server/endpoints/admin.js";
const SPARKY_UTIL_PATH = "server/utils/sparky/index.js";
const SPARKY_TRUTHS_HELPER_PATH = "server/utils/sparky/truths.js";
const SPARKY_TRUTHS_MODEL_PATH = "server/models/sparkyTruths.js";
const SPARKY_TRUTHS_SCHEMA_PATH = "server/prisma/schema.prisma";
const SPARKY_PROMPT_PATH = "server/sparky/packs/core/sparky-system-prompt.md";
const ACTIVE_WORKSPACES_PATH =
  "frontend/src/components/Sidebar/ActiveWorkspaces/index.jsx";
const HOME_PAGE_PATH = "frontend/src/pages/Main/Home/index.jsx";
const GENERAL_APPEARANCE_PATH =
  "frontend/src/pages/WorkspaceSettings/GeneralAppearance/index.jsx";
const WORKSPACE_ROW_PATH =
  "frontend/src/pages/Admin/Workspaces/WorkspaceRow/index.jsx";
const SPARKY_HELPER_PATH = "frontend/src/utils/sparky.js";
const PROTECTED_WORKSPACE_MESSAGE =
  "SPARKY is a protected fixed workspace.";
const SPARKY_TRUTHS_ARCHIVED_FIELD = "archived      Boolean    @default(false)";

describe("SPARKY fixed workspace protection", () => {
  it("keeps SPARKY protected and visible to default users", () => {
    const workspaceModel = read(WORKSPACE_MODEL_PATH);
    const workspacesEndpoint = read(WORKSPACES_ENDPOINT_PATH);
    const apiWorkspaceEndpoint = read(API_WORKSPACE_ENDPOINT_PATH);
    const adminEndpoint = read(ADMIN_ENDPOINT_PATH);
    const sparkyUtil = read(SPARKY_UTIL_PATH);
    const sparkyTruthsHelper = read(SPARKY_TRUTHS_HELPER_PATH);
    const sparkyTruthsModel = read(SPARKY_TRUTHS_MODEL_PATH);
    const sparkyTruthsSchema = read(SPARKY_TRUTHS_SCHEMA_PATH);
    const sparkyPrompt = read(SPARKY_PROMPT_PATH);

    expect(workspaceModel).toContain("isCanonicalSparkyWorkspace");
    expect(workspaceModel).toContain("workspace_users");
    expect(workspaceModel).toContain("name: \"SPARKY\"");
    expect(workspaceModel).toContain("openAiPrompt: getSparkySystemPrompt()");
    expect(workspaceModel).not.toContain("SPARKY_WORKSPACE_METADATA");
    expect(workspaceModel).toContain("OR:");

    expect(workspacesEndpoint).toContain("await ensureSparkyWorkspace();");
    expect(workspacesEndpoint).toContain('"/workspace/:slug/update"');
    expect(workspacesEndpoint).toContain(
      "isCanonicalSparkyWorkspace(currWorkspace)"
    );
    expect(workspacesEndpoint).toContain("Object.keys(data).length");
    expect(workspacesEndpoint).not.toContain('slug === "sparky"');
    expect(workspacesEndpoint).toContain(
      "isCanonicalSparkyWorkspace(workspace)"
    );
    expect(workspacesEndpoint).toContain(PROTECTED_WORKSPACE_MESSAGE);
    expect(workspacesEndpoint).toContain('"/workspaces"');
    expect(workspacesEndpoint).toContain('"/workspace/:slug/sparky-truths"');
    expect(workspacesEndpoint).toContain("listApprovedSparkyTruths");
    expect(workspacesEndpoint).toContain("createApprovedSparkyTruth");
    expect(workspacesEndpoint).toContain("archiveApprovedSparkyTruth");

    expect(apiWorkspaceEndpoint).toContain("await ensureSparkyWorkspace();");
    expect(apiWorkspaceEndpoint).toContain(
      "isCanonicalSparkyWorkspace(workspace)"
    );
    expect(apiWorkspaceEndpoint).toContain(
      '"/v1/workspace/:slug/update"'
    );
    expect(apiWorkspaceEndpoint).toContain(
      "isCanonicalSparkyWorkspace(currWorkspace)"
    );
    expect(apiWorkspaceEndpoint).toContain('"/v1/workspaces"');
    expect(apiWorkspaceEndpoint).toContain(PROTECTED_WORKSPACE_MESSAGE);

    expect(adminEndpoint).toContain("await ensureSparkyWorkspace();");
    expect(adminEndpoint).toContain("isCanonicalSparkyWorkspace(workspace)");
    expect(adminEndpoint).toContain('"/admin/workspaces"');
    expect(adminEndpoint).toContain(PROTECTED_WORKSPACE_MESSAGE);

    expect(sparkyUtil).toContain("SPARKY_CORE_PACK_DIR = path.join(");
    expect(sparkyUtil).toContain('"sparky",');
    expect(sparkyUtil).not.toContain(
      'path.join(__dirname, "..", "..", "storage"'
    );
    expect(sparkyUtil).not.toContain("SPARKY_WORKSPACE_METADATA");
    expect(sparkyPrompt).toContain("You are SPARKY");
    expect(sparkyTruthsHelper).toContain(PROTECTED_WORKSPACE_MESSAGE);
    expect(sparkyTruthsHelper).toContain("userId: getTruthOwnerId(user)");
    expect(sparkyTruthsHelper).toContain("archived: false");
    expect(sparkyTruthsModel).toContain("normalizeTruthValue(truth = \"\")");
    expect(sparkyTruthsModel).toContain("normalizeUserId(userId = null)");
    expect(sparkyTruthsModel).toContain("prisma.sparky_truths.create");
    expect(sparkyTruthsModel).toContain("prisma.sparky_truths.updateMany");
    expect(sparkyTruthsSchema).toContain("model sparky_truths");
    expect(sparkyTruthsSchema).toContain("truth         String");
    expect(sparkyTruthsSchema).toContain(SPARKY_TRUTHS_ARCHIVED_FIELD);
  });

  it("exposes a clear Continue with SPARKY entry point", () => {
    const activeWorkspaces = read(ACTIVE_WORKSPACES_PATH);
    const homePage = read(HOME_PAGE_PATH);
    const generalAppearance = read(GENERAL_APPEARANCE_PATH);
    const workspaceRow = read(WORKSPACE_ROW_PATH);
    const sparkyHelper = read(SPARKY_HELPER_PATH);

    expect(activeWorkspaces).toContain("Continue with SPARKY");
    expect(activeWorkspaces).toContain("isCanonicalSparkyWorkspace(workspace)");
    expect(activeWorkspaces).toContain("reorderedWorkspaces.map((w) => w.id)");
    expect(homePage).toContain("isCanonicalSparkyWorkspace(workspace)");
    expect(generalAppearance).toContain(
      "isCanonicalSparkyWorkspace(workspace)"
    );
    expect(workspaceRow).toContain("isCanonicalSparkyWorkspace(workspace)");
    expect(sparkyHelper).toContain("workspace?.isCanonicalSparky === true");
    expect(sparkyHelper).not.toContain("metadata");
  });
});
