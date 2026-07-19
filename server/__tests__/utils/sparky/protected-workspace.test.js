const fs = require("fs");
const path = require("path");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

describe("SPARKY fixed workspace protection", () => {
  it("keeps SPARKY out of storage, visible to default users, and protected from delete actions", () => {
    const workspaceModel = read("server/models/workspace.js");
    const workspacesEndpoint = read("server/endpoints/workspaces.js");
    const apiWorkspaceEndpoint = read("server/endpoints/api/workspace/index.js");
    const adminEndpoint = read("server/endpoints/admin.js");
    const sparkyUtil = read("server/utils/sparky/index.js");
    const sparkyTruthsHelper = read("server/utils/sparky/truths.js");
    const sparkyTruthsModel = read("server/models/sparkyTruths.js");
    const sparkyTruthsSchema = read("server/prisma/schema.prisma");
    const sparkyPrompt = read("server/sparky/packs/core/sparky-system-prompt.md");

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
    expect(workspacesEndpoint).toContain("isCanonicalSparkyWorkspace(workspace)");
    expect(workspacesEndpoint).toContain("SPARKY is a protected fixed workspace.");
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
    expect(apiWorkspaceEndpoint).toContain("SPARKY is a protected fixed workspace.");

    expect(adminEndpoint).toContain("await ensureSparkyWorkspace();");
    expect(adminEndpoint).toContain("isCanonicalSparkyWorkspace(workspace)");
    expect(adminEndpoint).toContain('"/admin/workspaces"');
    expect(adminEndpoint).toContain("SPARKY is a protected fixed workspace.");

    expect(sparkyUtil).toContain('path.join(__dirname, "..", "..", "sparky"');
    expect(sparkyUtil).not.toContain('path.join(__dirname, "..", "..", "storage"');
    expect(sparkyUtil).not.toContain("SPARKY_WORKSPACE_METADATA");
    expect(sparkyPrompt).toContain("You are SPARKY");
    expect(sparkyTruthsHelper).toContain("SPARKY is a protected fixed workspace.");
    expect(sparkyTruthsHelper).toContain("userId: getTruthOwnerId(user)");
    expect(sparkyTruthsHelper).toContain("archived: false");
    expect(sparkyTruthsModel).toContain("normalizeTruthValue(truth = \"\")");
    expect(sparkyTruthsModel).toContain("normalizeUserId(userId = null)");
    expect(sparkyTruthsModel).toContain("prisma.sparky_truths.create");
    expect(sparkyTruthsModel).toContain("prisma.sparky_truths.updateMany");
    expect(sparkyTruthsSchema).toContain("model sparky_truths");
    expect(sparkyTruthsSchema).toContain("truth         String");
    expect(sparkyTruthsSchema).toContain("archived      Boolean    @default(false)");
  });

  it("exposes a clear Continue with SPARKY entry point", () => {
    const activeWorkspaces = read("frontend/src/components/Sidebar/ActiveWorkspaces/index.jsx");
    const homePage = read("frontend/src/pages/Main/Home/index.jsx");
    const generalAppearance = read("frontend/src/pages/WorkspaceSettings/GeneralAppearance/index.jsx");
    const workspaceRow = read("frontend/src/pages/Admin/Workspaces/WorkspaceRow/index.jsx");
    const sparkyHelper = read("frontend/src/utils/sparky.js");

    expect(activeWorkspaces).toContain("Continue with SPARKY");
    expect(activeWorkspaces).toContain("isCanonicalSparkyWorkspace(workspace)");
    expect(activeWorkspaces).toContain("reorderedWorkspaces.map((w) => w.id)");
    expect(homePage).toContain("isCanonicalSparkyWorkspace(workspace)");
    expect(generalAppearance).toContain("isCanonicalSparkyWorkspace(workspace)");
    expect(workspaceRow).toContain("isCanonicalSparkyWorkspace(workspace)");
    expect(sparkyHelper).toContain("workspace?.isCanonicalSparky === true");
    expect(sparkyHelper).not.toContain("metadata");
  });
});
