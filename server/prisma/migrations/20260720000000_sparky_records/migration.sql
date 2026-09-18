ALTER TABLE "sparky_truths" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'decision';
ALTER TABLE "sparky_truths" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE "sparky_truths" ADD COLUMN "source" TEXT;
ALTER TABLE "sparky_truths" ADD COLUMN "notes" TEXT;

CREATE INDEX "sparky_truths_kind_idx" ON "sparky_truths"("kind");
CREATE INDEX "sparky_truths_status_idx" ON "sparky_truths"("status");
CREATE INDEX "sparky_truths_workspaceId_userId_kind_status_archived_idx" ON "sparky_truths"("workspaceId", "userId", "kind", "status", "archived");
