const fs = require("fs");
const path = require("path");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

describe("SPARKY fixed workspace protection", () => {
  it("keeps SPARKY in workspace list paths and protects delete actions", () => {
    const workspaceModel = read("server/models/workspace.js");
    const workspacesEndpoint = read("server/endpoints/workspaces.js");
    const apiWorkspaceEndpoint = read("server/endpoints/api/workspace/index.js");
    const adminEndpoint = read("server/endpoints/admin.js");

    expect(workspaceModel).toContain("SPARKY_WORKSPACE_SLUG");
    expect(workspaceModel).toContain("if (workspace?.slug === SPARKY_WORKSPACE_SLUG) return false;");

    expect(workspacesEndpoint).toContain("await ensureSparkyWorkspace();");
    expect(workspacesEndpoint).toContain("SPARKY is a protected fixed workspace.");
    expect(workspacesEndpoint).toContain('"/workspaces"');

    expect(apiWorkspaceEndpoint).toContain("await ensureSparkyWorkspace();");
    expect(apiWorkspaceEndpoint).toContain('"/v1/workspaces"');
    expect(apiWorkspaceEndpoint).toContain("SPARKY is a protected fixed workspace.");

    expect(adminEndpoint).toContain("await ensureSparkyWorkspace();");
    expect(adminEndpoint).toContain('"/admin/workspaces"');
    expect(adminEndpoint).toContain("SPARKY is a protected fixed workspace.");
  });

  it("exposes a clear Continue with SPARKY entry point", () => {
    const activeWorkspaces = read("frontend/src/components/Sidebar/ActiveWorkspaces/index.jsx");
    const homePage = read("frontend/src/pages/Main/Home/index.jsx");
    const generalAppearance = read("frontend/src/pages/WorkspaceSettings/GeneralAppearance/index.jsx");
    const workspaceRow = read("frontend/src/pages/Admin/Workspaces/WorkspaceRow/index.jsx");

    expect(activeWorkspaces).toContain("Continue with SPARKY");
    expect(activeWorkspaces).toContain('workspace.slug === "sparky"');
    expect(homePage).toContain('workspace.slug === "sparky"');
    expect(generalAppearance).toContain('workspace.slug !== "sparky"');
    expect(workspaceRow).toContain('workspace.slug !== "sparky"');
  });
});
