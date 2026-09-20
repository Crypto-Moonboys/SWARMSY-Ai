import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { isMobile } from "react-device-detect";
import { SidebarMobileHeader } from "@/components/Sidebar";
import PromptInput, {
  PROMPT_INPUT_EVENT,
  PROMPT_INPUT_ID,
} from "@/components/WorkspaceChat/ChatContainer/PromptInput";
import DnDFileUploaderWrapper, {
  DndUploaderContext,
  DnDFileUploaderProvider,
  PASTE_ATTACHMENT_EVENT,
} from "@/components/WorkspaceChat/ChatContainer/DnDWrapper";
import { useTranslation } from "react-i18next";
import {
  LAST_VISITED_WORKSPACE,
  PENDING_HOME_MESSAGE,
} from "@/utils/constants";
import Workspace from "@/models/workspace";
import paths from "@/utils/paths";
import showToast from "@/utils/toast";
import { safeJsonParse } from "@/utils/request";
import QuickActions from "@/components/lib/QuickActions";
import SuggestedMessages from "@/components/lib/SuggestedMessages";
import useUser from "@/hooks/useUser";
import ChatSettingsMenu from "@/components/WorkspaceChat/ChatContainer/ChatSettingsMenu";
import WorkspaceModelPicker from "@/components/WorkspaceChat/ChatContainer/WorkspaceModelPicker";
import { ChatTooltips } from "@/components/WorkspaceChat/ChatContainer/ChatTooltips";
import { ChatSidebarProvider } from "@/components/WorkspaceChat/ChatContainer/ChatSidebar";
import MemoriesSidebar from "@/components/WorkspaceChat/ChatContainer/MemoriesSidebar";
import { isCanonicalSparkyWorkspace } from "@/utils/sparky";

const SPARKY_FLOATING_CLIP_URL =
  "https://raw.githubusercontent.com/Crypto-Moonboys/SWARMSY-Ai/master/images/SPARKY%20FLOATING%20CLIP.png";

function getSparkyForwardPrompts(latestAssistantText = "") {
  const text = String(latestAssistantText || "").toLowerCase();

  if (text.includes("automation") || text.includes("bot") || text.includes("api") || text.includes("calendar")) {
    return [
      "Map this into Manual Now, Agent-Assisted Next, and Auto Mode later.",
      "Give me the exact tools, accounts, APIs, and permissions needed for this.",
      "Turn this into a 7-day automation setup plan with one simple task per day.",
      "Create the safest no-code version first, then the real auto-mode version.",
    ];
  }

  if (text.includes("pfp") || text.includes("moonboy") || text.includes("avatar") || text.includes("faction") || text.includes("lore")) {
    return [
      "Ask me for the missing PFP character details before inventing traits.",
      "Build the full Moonboy/PFP bio from the known details only.",
      "Turn this character into a stencil, poster, merch, and local campaign pack.",
      "Give me 3 stronger identity routes and pick the best one.",
    ];
  }

  if (text.includes("image") || text.includes("poster") || text.includes("icon") || text.includes("stencil") || text.includes("logo") || text.includes("mascot")) {
    return [
      "Create a copy/paste prompt for GPT or Grok image generation from this idea.",
      "Make this visual idea work as a stencil, poster, sticker, and merch mark.",
      "Give me a cleaner production brief: subject, pose, colours, symbols, and avoid list.",
      "Make it more street-level, bold, local-first, and easy to recognise.",
    ];
  }

  if (text.includes("daily") || text.includes("proof") || text.includes("local") || text.includes("campaign")) {
    return [
      "Turn this into today's Street-To-Digital Proof Card.",
      "Give me the first 3 actions I can actually do today.",
      "Make this local-first: one real-world surface and one digital proof post.",
      "Simplify this into one mission, one asset, one proof, and one next move.",
    ];
  }

  if (text.includes("brand") || text.includes("product") || text.includes("art") || text.includes("music")) {
    return [
      "Build the brand identity: name, mission, look, voice, and street signal.",
      "Turn this into a mascot or mark people can remember locally.",
      "Create a launch pack: lore hook, poster, merch, campaign, and proof loop.",
      "Give me 3 bold directions and choose the one with most traction potential.",
    ];
  }

  return [
    "Give me 3 stronger directions and pick the best one.",
    "Turn this into one clear next step I can do today.",
    "Make this local-first with a real-world proof and digital proof.",
    "Ask me the missing details before building the full plan.",
  ];
}

function SparkyFloatingClip({ latestAssistantText = "", sendCommand = null }) {
  const [open, setOpen] = useState(false);
  const prompts = getSparkyForwardPrompts(latestAssistantText);

  async function usePrompt(prompt) {
    sendCommand?.({ text: prompt, writeMode: "replace" });
    try {
      await navigator.clipboard?.writeText(prompt);
    } catch {}
    setOpen(false);
  }

  return (
    <div className="absolute bottom-[24px] right-[42px] z-20 hidden select-none xl:block">
      {open && (
        <div className="absolute bottom-[118px] right-0 w-[330px] rounded-[18px] border border-white/10 bg-zinc-950/95 p-3 text-white shadow-2xl backdrop-blur-md">
          <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-yellow-300">
            SPARKY next ideas
          </div>
          <div className="flex flex-col gap-2">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => usePrompt(prompt)}
                className="rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-left text-sm leading-snug text-white hover:border-yellow-300/60 hover:bg-yellow-300/10"
              >
                {prompt}
              </button>
            ))}
          </div>
          <p className="mt-2 px-1 text-[11px] text-white/45">
            Click one to copy it and load it into the message box.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open SPARKY next ideas"
        className="rounded-full border-none bg-transparent p-0 outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-yellow-300"
      >
        <img
          src={SPARKY_FLOATING_CLIP_URL}
          alt=""
          aria-hidden="true"
          className="pointer-events-none w-[150px] 2xl:w-[170px]"
        />
      </button>
    </div>
  );
}

async function getTargetWorkspace() {
  const lastVisited = safeJsonParse(
    localStorage.getItem(LAST_VISITED_WORKSPACE)
  );
  if (lastVisited?.slug) {
    const workspace = await Workspace.bySlug(lastVisited.slug);
    if (workspace) return workspace;
  }

  const workspaces = await Workspace.all();
  const sparkyWorkspace = workspaces.find((workspace) =>
    isCanonicalSparkyWorkspace(workspace)
  );
  if (sparkyWorkspace) return sparkyWorkspace;
  return workspaces.length > 0 ? workspaces[0] : null;
}

async function createDefaultWorkspace(workspaceName = "My Workspace") {
  const { workspace, message: errorMsg } = await Workspace.new({
    name: workspaceName,
  });
  if (!workspace) {
    showToast(errorMsg || "Failed to create workspace", "error");
    return null;
  }
  return workspace;
}

export default function Home() {
  const { t } = useTranslation();
  const { user } = useUser();
  const [workspace, setWorkspace] = useState(null);
  const [threadSlug, setThreadSlug] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const pendingFilesRef = useRef([]);

  useEffect(() => {
    async function init() {
      const ws = await getTargetWorkspace();
      if (ws) {
        const [suggestedMessages, { showAgentCommand }] = await Promise.all([
          Workspace.getSuggestedMessages(ws.slug),
          Workspace.agentCommandAvailable(ws.slug),
        ]);
        setWorkspace({
          ...ws,
          suggestedMessages,
          showAgentCommand,
        });
      }
      setWorkspaceLoading(false);
    }
    init();
  }, []);

  // When workspace/thread becomes available and we have pending files, trigger upload
  useEffect(() => {
    if (workspace && threadSlug && pendingFilesRef.current.length > 0) {
      const files = pendingFilesRef.current;
      pendingFilesRef.current = [];
      window.dispatchEvent(
        new CustomEvent(PASTE_ATTACHMENT_EVENT, { detail: { files } })
      );
    }
  }, [workspace, threadSlug]);

  // Handle paste events when no thread exists yet
  useEffect(() => {
    if (threadSlug) return;

    async function handlePaste(e) {
      const files = e.detail?.files;
      if (!files?.length) return;

      pendingFilesRef.current = files;
      let ws = workspace;
      if (!ws) {
        ws = await createDefaultWorkspace(t("new-workspace.placeholder"));
        if (!ws) return;
        setWorkspace(ws);
      }
      const { thread } = await Workspace.threads.new(ws.slug);
      if (thread) setThreadSlug(thread.slug);
    }

    window.addEventListener(PASTE_ATTACHMENT_EVENT, handlePaste);
    return () =>
      window.removeEventListener(PASTE_ATTACHMENT_EVENT, handlePaste);
  }, [workspace, threadSlug]);

  async function handleDropWithoutWorkspace(acceptedFiles) {
    setDragging(false);
    pendingFilesRef.current = acceptedFiles;
    const ws = await createDefaultWorkspace(t("new-workspace.placeholder"));
    if (!ws) return;
    setWorkspace(ws);
    const { thread } = await Workspace.threads.new(ws.slug);
    if (thread) setThreadSlug(thread.slug);
  }

  async function handleDropWithWorkspace(acceptedFiles) {
    setDragging(false);
    pendingFilesRef.current = acceptedFiles;
    const { thread } = await Workspace.threads.new(workspace.slug);
    if (thread) setThreadSlug(thread.slug);
  }

  if (workspaceLoading) {
    return (
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="transition-all duration-500 relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-zinc-900 light:bg-white w-full h-full overflow-hidden"
      />
    );
  }

  if (!workspace && user?.role === "default") {
    return <NoWorkspacesAssigned />;
  }

  if (workspace && threadSlug) {
    return (
      <DnDFileUploaderProvider workspace={workspace} threadSlug={threadSlug}>
        <HomeContent
          workspace={workspace}
          setWorkspace={setWorkspace}
          threadSlug={threadSlug}
          setThreadSlug={setThreadSlug}
        />
      </DnDFileUploaderProvider>
    );
  }

  return (
    <DndUploaderContext.Provider
      value={{
        files: [],
        ready: true,
        dragging,
        setDragging,
        onDrop: workspace
          ? handleDropWithWorkspace
          : handleDropWithoutWorkspace,
        parseAttachments: () => [],
      }}
    >
      <HomeContent
        workspace={workspace}
        setWorkspace={setWorkspace}
        threadSlug={null}
        setThreadSlug={setThreadSlug}
      />
    </DndUploaderContext.Provider>
  );
}

function HomeContent({ workspace, setWorkspace, threadSlug, setThreadSlug }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { files, parseAttachments } = useContext(DndUploaderContext);

  useEffect(() => {
    if (!threadSlug) {
      window.dispatchEvent(
        new CustomEvent(PROMPT_INPUT_EVENT, {
          detail: { messageContent: "", writeMode: "replace" },
        })
      );
    }
  }, []);

  async function submitMessage(message, attachments = []) {
    if (!message || loading) return;
    setLoading(true);
    try {
      let targetWorkspace = workspace;
      let targetThread = threadSlug;

      if (!targetWorkspace) {
        targetWorkspace = await createDefaultWorkspace(
          t("new-workspace.placeholder")
        );
        if (!targetWorkspace) {
          setLoading(false);
          return;
        }
        setWorkspace(targetWorkspace);
      }

      if (!targetThread) {
        const { thread } = await Workspace.threads.new(targetWorkspace.slug);
        targetThread = thread?.slug;
        if (thread) setThreadSlug(thread.slug);
      }

      sessionStorage.setItem(
        PENDING_HOME_MESSAGE,
        JSON.stringify({ message, attachments })
      );

      if (targetThread) {
        navigate(paths.workspace.thread(targetWorkspace.slug, targetThread));
      } else {
        navigate(paths.workspace.chat(targetWorkspace.slug));
      }
    } catch (error) {
      console.error("Error submitting message:", error);
      showToast("Failed to send message", "error");
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const currentMessage =
      document.getElementById(PROMPT_INPUT_ID)?.value?.trim() || "";
    await submitMessage(currentMessage, parseAttachments());
  }

  function sendCommand({
    text = "",
    autoSubmit = false,
    writeMode = "replace",
  }) {
    if (autoSubmit) {
      if (writeMode === "append") {
        const currentText =
          document.getElementById(PROMPT_INPUT_ID)?.value ?? "";
        text = currentText + text;
      }
      if (!text.trim()) return;
      submitMessage(text.trim());
      return;
    }
    window.dispatchEvent(
      new CustomEvent(PROMPT_INPUT_EVENT, {
        detail: { messageContent: text, writeMode },
      })
    );
  }

  async function handleEditWorkspace() {
    let targetWorkspace = workspace;

    if (!targetWorkspace) {
      targetWorkspace = await createDefaultWorkspace(
        t("new-workspace.placeholder")
      );
      if (!targetWorkspace) return;
      setWorkspace(targetWorkspace);
    }

    navigate(paths.workspace.settings.generalAppearance(targetWorkspace.slug));
  }

  return (
    <ChatSidebarProvider>
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative flex md:ml-[2px] md:mr-[16px] md:my-[16px] w-full h-full z-[2]"
      >
        <ChatSettingsMenu />
        <div className="flex-1 min-w-0 transition-all duration-500 relative md:rounded-[16px] bg-zinc-900 light:bg-white w-full h-full overflow-hidden border-none light:border-solid light:border light:border-theme-modal-border">
          {isMobile && <SidebarMobileHeader />}
          <WorkspaceModelPicker workspaceSlug={workspace?.slug} />
          <DnDFileUploaderWrapper>
            <div className="flex flex-col h-full w-full items-center justify-center">
              <div className="flex flex-col items-center w-full max-w-[750px]">
                <h1 className="text-white text-xl md:text-2xl mb-11 text-center">
                  {t("main-page.greeting")}
                </h1>
                <PromptInput
                  workspace={workspace}
                  submit={handleSubmit}
                  isStreaming={loading}
                  sendCommand={sendCommand}
                  attachments={files}
                  centered={true}
                  workspaceSlug={workspace?.slug}
                  threadSlug={threadSlug}
                />
                <QuickActions
                  hasAvailableWorkspace={!!workspace}
                  onCreateAgent={() => navigate(paths.settings.agentSkills())}
                  onEditWorkspace={handleEditWorkspace}
                  onUploadDocument={() =>
                    document.getElementById("dnd-chat-file-uploader")?.click()
                  }
                />
              </div>
              <SuggestedMessages
                suggestedMessages={workspace?.suggestedMessages}
                sendCommand={sendCommand}
              />
            </div>
          </DnDFileUploaderWrapper>
          <SparkyFloatingClip sendCommand={sendCommand} />
          <ChatTooltips />
        </div>
        <MemoriesSidebar workspace={workspace} />
      </div>
    </ChatSidebarProvider>
  );
}

function NoWorkspacesAssigned() {
  const { t } = useTranslation();
  return (
    <div
      style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
      className="transition-all duration-500 relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-zinc-900 light:bg-white w-full h-full overflow-hidden"
    >
      <div className="flex flex-col h-full w-full items-center justify-center">
        <p className="text-white/60 text-sm text-center whitespace-pre-line">
          {t("home.notAssigned")}
        </p>
      </div>
    </div>
  );
}
