import { useEffect, useMemo, useRef, useState } from "react";
import "@/utils/creatorMemory";
import { X } from "@phosphor-icons/react";
import Workspace from "@/models/workspace";
import { isCanonicalSparkyWorkspace } from "@/utils/sparky";
import ChatSidebar, { useSparkyRecordsSidebar } from "../ChatSidebar";

const KIND_LABELS = {
  idea: "Idea",
  decision: "Decision",
  proof: "Proof",
};

const STATUS_LABELS = {
  draft: "Draft",
  approved: "Approved",
  archived: "Archived",
};

export default function SparkyRecordsSidebar({ workspace }) {
  const { sidebarOpen, closeSidebar } = useSparkyRecordsSidebar();
  const [records, setRecords] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [memoryMessage, setMemoryMessage] = useState("");
  const [loadedPack, setLoadedPack] = useState(null);
  const importRef = useRef(null);

  const activeRecords = useMemo(
    () => records.filter((record) => record.status !== "archived"),
    [records]
  );

  async function fetchRecords() {
    if (!workspace?.slug) return;
    setLoading(true);
    const result = await Workspace.sparkyRecords.list(workspace.slug);
    setRecords(result?.records || []);
    setError(result?.success === false ? result.error : null);
    setLoading(false);
    return result?.records || [];
  }

  useEffect(() => {
    if (sidebarOpen) fetchRecords();
  }, [sidebarOpen, workspace?.slug]);

  async function saveRecord(kind, status) {
    const text = draft.trim();
    if (!text || saving) return;

    setSaving(true);
    const result = await Workspace.sparkyRecords.create(workspace.slug, {
      text,
      kind,
      status,
    });
    setSaving(false);

    if (result?.success === false) {
      setError(result.error || "Could not save SPARKY record.");
      return;
    }

    setDraft("");
    setError(null);
    fetchRecords();
  }

  async function approveRecord(record) {
    if (!record?.id) return;
    const updates =
      record.kind === "idea"
        ? { kind: "decision" }
        : { kind: record.kind || "decision" };
    const result = await Workspace.sparkyRecords.approve(
      workspace.slug,
      record.id,
      updates
    );
    if (result?.success === false) {
      setError(result.error || "Could not approve SPARKY record.");
      return;
    }
    setError(null);
    fetchRecords();
  }

  async function archiveRecord(record) {
    if (!record?.id) return;
    const result = await Workspace.sparkyRecords.archive(
      workspace.slug,
      record.id
    );
    if (result?.success === false) {
      setError(result.error || "Could not archive SPARKY record.");
      return;
    }
    setError(null);
    fetchRecords();
  }


  function getPortableRecord(recordList = records) {
    const M = window.SPARKY_CREATOR_MEMORY;
    const pack = loadedPack
      ? M.normalise(loadedPack)
      : M.create({ title: workspace?.name || "SPARKY project", kind: "creative-project" });
    // Existing server-side SPARKY Records are the source of truth for imported
    // approved decisions. Proof notes are NEVER exported as verified evidence.
    const union = (before, after) => {
      const seen = new Set();
      return [...before, ...after].filter(entry => {
        const key = entry.text.trim();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 100);
    };
    pack.decisions = union(pack.decisions, recordList.filter(r => r.kind === "decision" && r.status === "approved")
      .map(r => ({ text: r.truth, approved_at: "", source: "SPARKY Records" })));
    pack.ideas = union(pack.ideas, recordList.filter(r => r.kind === "idea" && r.status !== "archived")
      .map(r => ({ text: r.truth, created_at: "" })));
    pack.proofs = union(pack.proofs, recordList.filter(r => r.kind === "proof" && r.status !== "archived")
      .map(r => ({ text: r.truth, reference: "", status: "unverified" })));
    return pack;
  }

  async function exportMemory(asMarkdown = false) {
    try {
      const latestRecords = await fetchRecords();
      const M = window.SPARKY_CREATOR_MEMORY;
      const pack = getPortableRecord(latestRecords);
      const text = asMarkdown ? M.markdown(pack) : M.serialize(pack);
      const objectUrl = URL.createObjectURL(new Blob([text], {
        type: asMarkdown ? "text/markdown" : "application/json"
      }));
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = M.filename(pack, asMarkdown ? "md" : "json");
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setMemoryMessage(asMarkdown ? "Readable Markdown downloaded. Keep JSON for re-import." : "Portable JSON downloaded.");
    } catch (err) {
      setMemoryMessage(err.message || "Export failed.");
    }
  }

  async function copyMemoryHandoff() {
    try {
      await navigator.clipboard.writeText(window.SPARKY_CREATOR_MEMORY.handoff(getPortableRecord()));
      setMemoryMessage("Handoff copied. Paste it into the chat; it was not submitted automatically.");
    } catch (err) {
      setMemoryMessage(err.message || "Clipboard unavailable. Export JSON and attach it to your chat.");
    }
  }

  async function importMemory(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const M = window.SPARKY_CREATOR_MEMORY;
    if (file.size > M.MAX_BYTES) {
      setMemoryMessage("File exceeds 256 KB.");
      return;
    }
    try {
      const pack = M.parse(await file.text());
      // Imported project information is only offered for manual handoff.
      // Saving it does not confer official canon authority or factual proof.
      setLoadedPack(pack);
      const count = pack.decisions.length + pack.ideas.length;
      if (!count) {
        setMemoryMessage("Pack loaded for handoff. There are no decisions or ideas to import into SPARKY Records.");
        return;
      }
      if (count > 50) {
        setMemoryMessage("Pack loaded for handoff. Bulk Records import is limited to 50 entries.");
        return;
      }
      if (!window.confirm("Import " + pack.decisions.length + " creator-approved decisions and " +
        pack.ideas.length + " draft ideas as new SPARKY Records? Only approve this if these decisions are genuinely yours. No proof or canon status will be imported.")) {
        setMemoryMessage("Pack loaded for handoff only; existing records unchanged.");
        return;
      }
      setSaving(true);
      // Re-read to avoid repeating already-saved records after an interrupted import.
      const latest = await Workspace.sparkyRecords.list(workspace.slug);
      if (latest?.success === false) throw new Error(latest.error || "Records could not be refreshed.");
      const existing = new Set((latest?.records || []).map(r => r.kind + ":" + r.status + ":" + String(r.truth || "").trim()));
      const requested = [
        ...pack.decisions.map(x => ({ kind: "decision", status: "approved", text: x.text })),
        ...pack.ideas.map(x => ({ kind: "idea", status: "draft", text: x.text }))
      ];
      let added = 0;
      let skipped = 0;
      let failed = 0;
      for (const item of requested) {
        const key = item.kind + ":" + item.status + ":" + item.text.trim();
        if (existing.has(key)) { skipped++; continue; }
        const result = await Workspace.sparkyRecords.create(workspace.slug, item);
        if (result?.success === false) { failed++; break; }
        existing.add(key);
        added++;
      }
      await fetchRecords();
      setMemoryMessage(added + " records imported; " + skipped + " duplicates skipped; " + failed +
        " failed. Review the Records list before trying again. The remaining project fields stay in the imported pack for handoff.");
    } catch (err) {
      setMemoryMessage(err.message || "Could not import the project file.");
    } finally {
      setSaving(false);
    }
  }

  if (!isCanonicalSparkyWorkspace(workspace)) return null;

  return (
    <ChatSidebar isOpen={sidebarOpen}>
      <div
        className="w-[366px] flex-shrink-0 flex flex-col gap-5 mt-[72px] px-5 overflow-y-auto no-scroll"
        style={{ maxHeight: "calc(100% - 88px)" }}
      >
        <SidebarHeader closeSidebar={closeSidebar} />
        <div className="flex flex-col gap-2 border border-zinc-700 light:border-slate-300 rounded-lg p-3">
          <p className="text-sm font-medium text-zinc-50 light:text-slate-900">Portable creator memory</p>
          <p className="text-xs text-zinc-400 light:text-slate-600">
            Move your creator-approved decisions, drafts and project context between SPARKY and other AI tools.
            JSON travels between tools; image files must be shared separately.
          </p>
          <input ref={importRef} type="file" accept=".json,application/json" onChange={importMemory}
            aria-label="Import portable creator memory JSON" className="hidden" />
          <ActionButton label="Import project JSON" disabled={saving} onClick={() => importRef.current?.click()} />
          <ActionButton label="Export SPARKY Records as JSON" disabled={saving} onClick={() => exportMemory(false)} />
          <ActionButton label="Download readable Markdown" disabled={saving} onClick={() => exportMemory(true)} />
          <ActionButton label="Copy AI handoff for this project" disabled={saving} onClick={copyMemoryHandoff} />
          {loadedPack && <p className="text-xs text-zinc-400 light:text-slate-600">
            Loaded: {loadedPack.project.title || "Unnamed project"} — identity, assets and sources available in AI handoff.
          </p>}
          <p role="status" aria-live="polite" className="text-xs text-zinc-400 light:text-slate-600">{memoryMessage}</p>
        </div>
        <RecordComposer
          draft={draft}
          setDraft={setDraft}
          saving={saving}
          saveRecord={saveRecord}
        />
        {error && (
          <p className="text-xs leading-4 text-red-400 light:text-red-600">
            {error}
          </p>
        )}
        <RecordList
          loading={loading}
          records={activeRecords}
          approveRecord={approveRecord}
          archiveRecord={archiveRecord}
        />
      </div>
    </ChatSidebar>
  );
}

function SidebarHeader({ closeSidebar }) {
  return (
    <div className="flex items-start justify-between shrink-0">
      <div>
        <p className="font-medium text-base leading-6 text-zinc-50 light:text-slate-900">
          SPARKY Records
        </p>
        <p className="text-xs leading-4 text-zinc-400 light:text-slate-500 mt-1">
          Draft ideas stay separate until you approve them.
        </p>
      </div>
      <button
        onClick={closeSidebar}
        type="button"
        className="text-zinc-50 light:text-slate-900 hover:text-white light:hover:text-slate-400 transition-colors border-none bg-transparent cursor-pointer"
      >
        <X size={16} weight="bold" />
      </button>
    </div>
  );
}

function RecordComposer({ draft, setDraft, saving, saveRecord }) {
  const disabled = saving || !draft.trim();

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Capture a project idea, decision, or proof note..."
        rows={4}
        className="w-full bg-zinc-800 light:bg-white text-zinc-50 light:border light:border-slate-300 light:text-slate-700 placeholder:text-zinc-500 light:placeholder:text-slate-400 text-sm rounded-lg p-3 resize-none outline-none focus:border-zinc-500 light:focus:border-slate-400"
      />
      <div className="grid grid-cols-1 gap-2">
        <ActionButton
          disabled={disabled}
          label="Save rough idea"
          onClick={() => saveRecord("idea", "draft")}
        />
        <ActionButton
          disabled={disabled}
          label="Approve as decision"
          onClick={() => saveRecord("decision", "approved")}
        />
        <ActionButton
          disabled={disabled}
          label="Save proof note"
          onClick={() => saveRecord("proof", "draft")}
        />
      </div>
    </div>
  );
}

function ActionButton({ label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-9 px-3 rounded-lg border border-zinc-700 light:border-slate-300 bg-zinc-900 light:bg-white text-zinc-50 light:text-slate-900 text-sm font-medium cursor-pointer hover:bg-zinc-800 light:hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );
}

function RecordList({ loading, records, approveRecord, archiveRecord }) {
  if (loading) {
    return (
      <p className="text-sm leading-5 text-zinc-400 light:text-slate-600">
        Loading SPARKY records...
      </p>
    );
  }

  if (records.length === 0) {
    return (
      <p className="text-sm leading-5 text-zinc-400 light:text-slate-600 text-center">
        No SPARKY records yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 pb-4">
      {records.map((record) => (
        <RecordCard
          key={record.id}
          record={record}
          approveRecord={approveRecord}
          archiveRecord={archiveRecord}
        />
      ))}
    </div>
  );
}

function RecordCard({ record, approveRecord, archiveRecord }) {
  const approved = record.status === "approved";
  const kind = record.kind || "decision";
  const status = record.status || "draft";
  const approveLabel = kind === "proof" ? "Approve proof" : "Approve decision";

  return (
    <div className="bg-zinc-900 light:bg-white light:border light:border-slate-300 rounded-lg p-3 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Pill label={KIND_LABELS[kind] || KIND_LABELS.decision} />
        <Pill label={STATUS_LABELS[status] || STATUS_LABELS.draft} muted />
      </div>
      <p className="text-sm leading-5 text-zinc-50 light:text-slate-900">
        {record.truth}
      </p>
      <div className="flex items-center gap-2">
        {!approved && (
          <button
            type="button"
            onClick={() => approveRecord(record)}
            className="h-8 px-3 rounded-lg border-none bg-zinc-50 light:bg-slate-900 text-zinc-900 light:text-white text-xs font-medium cursor-pointer hover:bg-white light:hover:bg-slate-800 transition-colors"
          >
            {approveLabel}
          </button>
        )}
        <button
          type="button"
          onClick={() => archiveRecord(record)}
          className="h-8 px-3 rounded-lg border border-zinc-700 light:border-slate-300 bg-transparent text-zinc-300 light:text-slate-700 text-xs font-medium cursor-pointer hover:bg-zinc-800 light:hover:bg-slate-100 transition-colors"
        >
          Archive
        </button>
      </div>
    </div>
  );
}

function Pill({ label, muted = false }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[11px] leading-4 ${
        muted
          ? "bg-zinc-800 light:bg-slate-100 text-zinc-400 light:text-slate-500"
          : "bg-zinc-50 light:bg-slate-900 text-zinc-900 light:text-white"
      }`}
    >
      {label}
    </span>
  );
}
