CREATE TABLE "sparky_truths" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspaceId" INTEGER NOT NULL,
    "userId" INTEGER,
    "truth" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sparky_truths_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sparky_truths_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "sparky_truths_workspaceId_idx" ON "sparky_truths"("workspaceId");
CREATE INDEX "sparky_truths_userId_idx" ON "sparky_truths"("userId");
CREATE INDEX "sparky_truths_workspaceId_userId_archived_idx" ON "sparky_truths"("workspaceId", "userId", "archived");
