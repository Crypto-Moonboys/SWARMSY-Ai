import { useEffect, useMemo, useState } from "react";
import { X } from "@phosphor-icons/react";
import { isCanonicalSparkyWorkspace } from "@/utils/sparky";
import ChatSidebar, { useSparkyCalendarSidebar } from "../ChatSidebar";

const WORKFLOW_OPTIONS = [
  "Daily Empire Proof Card",
  "PFP bio / lore build",
  "Brand / art / product identity",
  "Image / poster / logo prompt",
  "Local proof action",
  "Website / wiki / archive update",
  "Social / community post",
  "Tool / automation setup",
  "Review / approve / save proof",
  "Custom workflow",
];

const SCOPE_OPTIONS = [
  { value: "hour", label: "Selected hour" },
  { value: "day", label: "Whole day" },
  { value: "week", label: "Whole week" },
  { value: "month", label: "Whole month" },
];

const HOURS = Array.from({ length: 24 }, (_, hour) =>
  `${String(hour).padStart(2, "0")}:00`
);

function toISODate(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function todayISO() {
  return toISODate(new Date());
}

function parseISODate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(isoDate, days) {
  const date = parseISODate(isoDate);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function addMonths(isoDate, months) {
  const date = parseISODate(isoDate);
  date.setMonth(date.getMonth() + months);
  return toISODate(date);
}

function startOfWeek(isoDate) {
  const date = parseISODate(isoDate);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toISODate(date);
}

function monthKey(isoDate) {
  return isoDate.slice(0, 7);
}

function sameWeek(firstDate, secondDate) {
  return startOfWeek(firstDate) === startOfWeek(secondDate);
}

function formatShortDate(isoDate) {
  return parseISODate(isoDate).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function storageKey(workspaceSlug) {
  return `sparky-workflow-calendar:${workspaceSlug}`;
}

function loadEntries(workspaceSlug) {
  if (!workspaceSlug) return [];
  try {
    const raw = window.localStorage.getItem(storageKey(workspaceSlug));
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(workspaceSlug, entries) {
  if (!workspaceSlug) return;
  window.localStorage.setItem(storageKey(workspaceSlug), JSON.stringify(entries));
}

function isExactDayEntry(entry, isoDate) {
  return ["hour", "day"].includes(entry.scope) && entry.date === isoDate;
}

function isWeekEntry(entry, isoDate) {
  return entry.scope === "week" && sameWeek(entry.date, isoDate);
}

function isMonthEntry(entry, isoDate) {
  return entry.scope === "month" && monthKey(entry.date) === monthKey(isoDate);
}

function entriesForDay(entries, isoDate) {
  return entries.filter(
    (entry) =>
      isExactDayEntry(entry, isoDate) ||
      isWeekEntry(entry, isoDate) ||
      isMonthEntry(entry, isoDate)
  );
}

export default function SparkyWorkflowCalendarSidebar({ workspace }) {
  const { sidebarOpen, closeSidebar } = useSparkyCalendarSidebar();
  const [view, setView] = useState("day");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedHour, setSelectedHour] = useState("09:00");
  const [scope, setScope] = useState("hour");
  const [workflow, setWorkflow] = useState(WORKFLOW_OPTIONS[0]);
  const [customWorkflow, setCustomWorkflow] = useState("");
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!sidebarOpen || !workspace?.slug) return;
    setEntries(loadEntries(workspace.slug));
  }, [sidebarOpen, workspace?.slug]);

  const visibleEntries = useMemo(
    () => entriesForDay(entries, selectedDate),
    [entries, selectedDate]
  );

  function persist(nextEntries) {
    setEntries(nextEntries);
    saveEntries(workspace.slug, nextEntries);
  }

  function attachWorkflow() {
    const label =
      workflow === "Custom workflow"
        ? customWorkflow.trim() || "Custom workflow"
        : workflow;
    const nextEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: selectedDate,
      hour: scope === "hour" ? selectedHour : "",
      scope,
      workflow: label,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };
    persist([nextEntry, ...entries]);
    setNote("");
    if (workflow === "Custom workflow") setCustomWorkflow("");
  }

  function removeEntry(entryId) {
    persist(entries.filter((entry) => entry.id !== entryId));
  }

  function moveDate(direction) {
    if (view === "day") setSelectedDate(addDays(selectedDate, direction));
    if (view === "week") setSelectedDate(addDays(selectedDate, direction * 7));
    if (view === "month") setSelectedDate(addMonths(selectedDate, direction));
  }

  if (!isCanonicalSparkyWorkspace(workspace)) return null;

  return (
    <ChatSidebar isOpen={sidebarOpen}>
      <div
        className="w-[366px] flex-shrink-0 flex flex-col gap-4 mt-[72px] px-5 overflow-y-auto no-scroll"
        style={{ maxHeight: "calc(100% - 88px)" }}
      >
        <SidebarHeader closeSidebar={closeSidebar} />
        <ViewTabs view={view} setView={setView} />
        <DateControls
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          moveDate={moveDate}
        />
        <WorkflowComposer
          scope={scope}
          setScope={setScope}
          selectedHour={selectedHour}
          setSelectedHour={setSelectedHour}
          workflow={workflow}
          setWorkflow={setWorkflow}
          customWorkflow={customWorkflow}
          setCustomWorkflow={setCustomWorkflow}
          note={note}
          setNote={setNote}
          attachWorkflow={attachWorkflow}
        />
        <CalendarBody
          view={view}
          selectedDate={selectedDate}
          entries={entries}
          visibleEntries={visibleEntries}
          removeEntry={removeEntry}
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
          Workflow Calendar
        </p>
        <p className="text-xs leading-4 text-zinc-400 light:text-slate-500 mt-1">
          Plan daily, weekly, and monthly SPARKY workflows. This is a planner,
          not Auto Mode.
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

function ViewTabs({ view, setView }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-900 light:bg-slate-100 p-1">
      {["day", "week", "month"].map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setView(item)}
          className={`h-8 rounded-md border-none text-xs font-semibold capitalize transition-colors ${
            view === item
              ? "bg-yellow-300 text-zinc-950"
              : "bg-transparent text-zinc-300 light:text-slate-600 hover:bg-zinc-800 light:hover:bg-slate-200"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function DateControls({ selectedDate, setSelectedDate, moveDate }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => moveDate(-1)}
        className="h-9 w-9 rounded-lg border border-zinc-700 light:border-slate-300 bg-zinc-900 light:bg-white text-zinc-50 light:text-slate-900 text-sm hover:bg-zinc-800 light:hover:bg-slate-100"
      >
        -
      </button>
      <input
        type="date"
        value={selectedDate}
        onChange={(event) => setSelectedDate(event.target.value || todayISO())}
        className="min-w-0 flex-1 h-9 rounded-lg border border-zinc-700 light:border-slate-300 bg-zinc-900 light:bg-white px-3 text-sm text-zinc-50 light:text-slate-900"
      />
      <button
        type="button"
        onClick={() => setSelectedDate(todayISO())}
        className="h-9 rounded-lg border border-zinc-700 light:border-slate-300 bg-zinc-900 light:bg-white px-3 text-xs font-semibold text-zinc-50 light:text-slate-900 hover:bg-zinc-800 light:hover:bg-slate-100"
      >
        Today
      </button>
      <button
        type="button"
        onClick={() => moveDate(1)}
        className="h-9 w-9 rounded-lg border border-zinc-700 light:border-slate-300 bg-zinc-900 light:bg-white text-zinc-50 light:text-slate-900 text-sm hover:bg-zinc-800 light:hover:bg-slate-100"
      >
        +
      </button>
    </div>
  );
}

function WorkflowComposer({
  scope,
  setScope,
  selectedHour,
  setSelectedHour,
  workflow,
  setWorkflow,
  customWorkflow,
  setCustomWorkflow,
  note,
  setNote,
  attachWorkflow,
}) {
  const needsCustomWorkflow = workflow === "Custom workflow";
  const canAttach = !needsCustomWorkflow || !!customWorkflow.trim();

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 light:border-slate-300 bg-zinc-950/60 light:bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-yellow-300 light:text-yellow-600">
        Attach workflow
      </p>
      <select
        value={workflow}
        onChange={(event) => setWorkflow(event.target.value)}
        className="h-9 rounded-lg border border-zinc-700 light:border-slate-300 bg-zinc-900 light:bg-white px-3 text-sm text-zinc-50 light:text-slate-900"
      >
        {WORKFLOW_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {needsCustomWorkflow && (
        <input
          type="text"
          value={customWorkflow}
          onChange={(event) => setCustomWorkflow(event.target.value)}
          placeholder="Name the workflow..."
          className="h-9 rounded-lg border border-zinc-700 light:border-slate-300 bg-zinc-900 light:bg-white px-3 text-sm text-zinc-50 light:text-slate-900 placeholder:text-zinc-500 light:placeholder:text-slate-400"
        />
      )}
      <div className="grid grid-cols-2 gap-2">
        <select
          value={scope}
          onChange={(event) => setScope(event.target.value)}
          className="h-9 rounded-lg border border-zinc-700 light:border-slate-300 bg-zinc-900 light:bg-white px-3 text-sm text-zinc-50 light:text-slate-900"
        >
          {SCOPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={selectedHour}
          onChange={(event) => setSelectedHour(event.target.value)}
          disabled={scope !== "hour"}
          className="h-9 rounded-lg border border-zinc-700 light:border-slate-300 bg-zinc-900 light:bg-white px-3 text-sm text-zinc-50 light:text-slate-900 disabled:opacity-40"
        >
          {HOURS.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Optional note: what should be completed?"
        rows={3}
        className="rounded-lg border border-zinc-700 light:border-slate-300 bg-zinc-900 light:bg-white p-3 text-sm text-zinc-50 light:text-slate-900 placeholder:text-zinc-500 light:placeholder:text-slate-400 resize-none"
      />
      <button
        type="button"
        disabled={!canAttach}
        onClick={attachWorkflow}
        className="h-9 rounded-lg border-none bg-yellow-300 text-zinc-950 text-sm font-bold hover:bg-yellow-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Attach workflow
      </button>
    </div>
  );
}

function CalendarBody({
  view,
  selectedDate,
  entries,
  visibleEntries,
  removeEntry,
}) {
  if (view === "week") {
    return (
      <WeekView
        selectedDate={selectedDate}
        entries={entries}
        removeEntry={removeEntry}
      />
    );
  }
  if (view === "month") {
    return (
      <MonthView
        selectedDate={selectedDate}
        entries={entries}
        removeEntry={removeEntry}
      />
    );
  }
  return (
    <DayView
      selectedDate={selectedDate}
      entries={visibleEntries}
      removeEntry={removeEntry}
    />
  );
}

function DayView({ selectedDate, entries, removeEntry }) {
  const contextEntries = entries.filter((entry) => entry.scope !== "hour");
  const hourEntries = entries.filter((entry) => entry.scope === "hour");

  return (
    <div className="flex flex-col gap-3 pb-4">
      <SectionTitle title={formatShortDate(selectedDate)} />
      {contextEntries.length > 0 && (
        <EntryStack
          title="Day / week / month workflows"
          entries={contextEntries}
          removeEntry={removeEntry}
        />
      )}
      <div className="flex flex-col gap-2">
        {HOURS.map((hour) => {
          const entriesForHour = hourEntries.filter(
            (entry) => entry.hour === hour
          );
          return (
            <div
              key={hour}
              className="rounded-lg border border-zinc-800 light:border-slate-300 bg-zinc-950/50 light:bg-white p-3"
            >
              <div className="text-xs font-semibold text-zinc-400 light:text-slate-500">
                {hour}
              </div>
              {entriesForHour.length === 0 ? (
                <p className="mt-1 text-xs text-zinc-600 light:text-slate-400">
                  No workflow attached.
                </p>
              ) : (
                <div className="mt-2 flex flex-col gap-2">
                  {entriesForHour.map((entry) => (
                    <WorkflowEntry
                      key={entry.id}
                      entry={entry}
                      removeEntry={removeEntry}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ selectedDate, entries, removeEntry }) {
  const firstDay = startOfWeek(selectedDate);
  const days = Array.from({ length: 7 }, (_, index) => addDays(firstDay, index));

  return (
    <div className="flex flex-col gap-2 pb-4">
      <SectionTitle title={`Week of ${formatShortDate(firstDay)}`} />
      {days.map((day) => (
        <div
          key={day}
          className="rounded-lg border border-zinc-800 light:border-slate-300 bg-zinc-950/50 light:bg-white p-3"
        >
          <p className="text-xs font-semibold text-zinc-300 light:text-slate-700">
            {formatShortDate(day)}
          </p>
          <MiniEntries entries={entriesForDay(entries, day)} removeEntry={removeEntry} />
        </div>
      ))}
    </div>
  );
}

function MonthView({ selectedDate, entries, removeEntry }) {
  const selected = parseISODate(selectedDate);
  const monthStart = new Date(selected.getFullYear(), selected.getMonth(), 1);
  const firstGridDay = startOfWeek(toISODate(monthStart));
  const days = Array.from({ length: 42 }, (_, index) =>
    addDays(firstGridDay, index)
  );
  const monthWideEntries = entries.filter((entry) =>
    isMonthEntry(entry, selectedDate)
  );

  return (
    <div className="flex flex-col gap-3 pb-4">
      <SectionTitle
        title={selected.toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        })}
      />
      {monthWideEntries.length > 0 && (
        <EntryStack
          title="Month workflows"
          entries={monthWideEntries}
          removeEntry={removeEntry}
        />
      )}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-500 light:text-slate-400">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const exactEntries = entries.filter((entry) =>
            isExactDayEntry(entry, day)
          );
          const outsideMonth = monthKey(day) !== monthKey(selectedDate);
          return (
            <div
              key={day}
              className={`min-h-[58px] rounded-lg border border-zinc-800 light:border-slate-300 p-1.5 text-left ${
                outsideMonth
                  ? "bg-zinc-950/25 light:bg-slate-100/60 opacity-50"
                  : "bg-zinc-950/60 light:bg-white"
              }`}
            >
              <p className="text-[11px] font-semibold text-zinc-300 light:text-slate-700">
                {parseISODate(day).getDate()}
              </p>
              {exactEntries.slice(0, 2).map((entry) => (
                <p
                  key={entry.id}
                  className="mt-1 truncate rounded bg-yellow-300/15 px-1 py-0.5 text-[10px] text-yellow-100 light:text-yellow-700"
                  title={entry.workflow}
                >
                  {entry.workflow}
                </p>
              ))}
              {exactEntries.length > 2 && (
                <p className="mt-1 text-[10px] text-zinc-500">
                  +{exactEntries.length - 2} more
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400 light:text-slate-500">
      {title}
    </p>
  );
}

function EntryStack({ title, entries, removeEntry }) {
  return (
    <div className="rounded-lg border border-zinc-800 light:border-slate-300 bg-zinc-950/50 light:bg-white p-3">
      <p className="mb-2 text-xs font-semibold text-zinc-400 light:text-slate-500">
        {title}
      </p>
      <div className="flex flex-col gap-2">
        {entries.map((entry) => (
          <WorkflowEntry
            key={entry.id}
            entry={entry}
            removeEntry={removeEntry}
          />
        ))}
      </div>
    </div>
  );
}

function MiniEntries({ entries, removeEntry }) {
  if (entries.length === 0) {
    return (
      <p className="mt-1 text-xs text-zinc-600 light:text-slate-400">
        No workflow attached.
      </p>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      {entries.map((entry) => (
        <WorkflowEntry key={entry.id} entry={entry} removeEntry={removeEntry} />
      ))}
    </div>
  );
}

function WorkflowEntry({ entry, removeEntry }) {
  const timeLabel =
    entry.scope === "hour"
      ? entry.hour
      : entry.scope === "day"
        ? "Day"
        : entry.scope === "week"
          ? "Week"
          : "Month";

  return (
    <div className="rounded-lg border border-zinc-800 light:border-slate-300 bg-zinc-900 light:bg-slate-50 p-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-50 light:text-slate-900">
            {entry.workflow}
          </p>
          <p className="mt-0.5 text-[11px] uppercase tracking-wide text-yellow-300 light:text-yellow-700">
            {timeLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => removeEntry(entry.id)}
          className="shrink-0 border-none bg-transparent text-xs text-zinc-500 hover:text-red-400"
        >
          Remove
        </button>
      </div>
      {entry.note && (
        <p className="mt-2 text-xs leading-4 text-zinc-400 light:text-slate-600">
          {entry.note}
        </p>
      )}
    </div>
  );
}
