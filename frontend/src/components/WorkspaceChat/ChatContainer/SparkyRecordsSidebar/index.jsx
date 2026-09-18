import { useEffect, useMemo, useState } from "react";
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

  if (!isCanonicalSparkyWorkspace(workspace)) return null;

  return (
    <ChatSidebar isOpen={sidebarOpen}>
      <div
        className="w-[366px] flex-shrink-0 flex flex-col gap-5 mt-[72px] px-5 overflow-y-auto no-scroll"
        style={{ maxHeight: "calc(100% - 88px)" }}
      >
        <SidebarHeader closeSidebar={closeSidebar} />
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
