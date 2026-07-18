import { safeJsonParse } from "@/utils/request";

export const SPARKY_WORKSPACE_SLUG = "sparky";
export const SPARKY_WORKSPACE_METADATA = {
  sparky: { canonical: true },
};

export function isCanonicalSparkyWorkspace(workspace = null) {
  if (!workspace || workspace.slug !== SPARKY_WORKSPACE_SLUG) return false;
  const metadata =
    typeof workspace.metadata === "string"
      ? safeJsonParse(workspace.metadata, {})
      : workspace.metadata || {};
  return metadata?.sparky?.canonical === true;
}
