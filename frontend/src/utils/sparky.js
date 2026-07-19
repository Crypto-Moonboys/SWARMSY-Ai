export const SPARKY_WORKSPACE_SLUG = "sparky";

export function isCanonicalSparkyWorkspace(workspace = null) {
  return (
    workspace?.slug === SPARKY_WORKSPACE_SLUG &&
    workspace?.isCanonicalSparky === true
  );
}
