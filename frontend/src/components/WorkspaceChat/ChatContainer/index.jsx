import { useState, useEffect, useContext, useRef, useCallback } from "react";
import ChatHistory from "./ChatHistory";
import { CLEAR_ATTACHMENTS_EVENT, DndUploaderContext } from "./DnDWrapper";
import PromptInput, {
  PROMPT_INPUT_EVENT,
  PROMPT_INPUT_ID,
} from "./PromptInput";
import Workspace from "@/models/workspace";
import handleChat, { ABORT_STREAM_EVENT } from "@/utils/chat";
import { isMobile } from "react-device-detect";
import { SidebarMobileHeader } from "../../Sidebar";
import { useNavigate } from "react-router-dom";
import { v4 } from "uuid";
import handleSocketResponse, {
  websocketURI,
  AGENT_SESSION_END,
  AGENT_SESSION_START,
  setAgentSessionActive,
  setAgentSessionSocket,
} from "@/utils/chat/agent";
import DnDFileUploaderWrapper from "./DnDWrapper";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { ChatTooltips } from "./ChatTooltips";
import { MetricsProvider } from "./ChatHistory/HistoricalMessage/Actions/RenderMetrics";
import useChatContainerQuickScroll from "@/hooks/useChatContainerQuickScroll";
import { PENDING_HOME_MESSAGE } from "@/utils/constants";
import { clearPromptInputDraft } from "@/hooks/usePromptInputStorage";
import { safeJsonParse } from "@/utils/request";
import { useTranslation } from "react-i18next";
import paths from "@/utils/paths";
import QuickActions from "@/components/lib/QuickActions";
import SuggestedMessages from "@/components/lib/SuggestedMessages";
import ChatSettingsMenu from "./ChatSettingsMenu";
import WorkspaceModelPicker from "./WorkspaceModelPicker";
import { ChatSidebarProvider, useSparkyRecordsSidebar } from "./ChatSidebar";
import SourcesSidebar from "./SourcesSidebar";
import MemoriesSidebar from "./MemoriesSidebar";
import SparkyRecordsSidebar from "./SparkyRecordsSidebar";
import { isCanonicalSparkyWorkspace } from "@/utils/sparky";

const SPARKY_FLOATING_CLIP_URL =
  "https://raw.githubusercontent.com/Crypto-Moonboys/SWARMSY-Ai/master/images/SPARKY%20FLOATING%20CLIP.png";

function getSparkyForwardPrompts(latestAssistantText = "") {
  const text = String(latestAssistantText || "").toLowerCase();

  if (!text.trim()) {
    return [
      "Show me exactly which AnythingLLM button or tool to use next.",
      "Help me choose a lane: PFP, brand, art/music, website, automation, or normal chat.",
      "Turn a rough idea into a 7-day beginner build path.",
      "Create an external AI prompt for an image, logo, poster, mascot, or mockup.",
      "I need normal AnythingLLM help, not a SWARMSY project flow. Help me with anything.",
    ];
  }

  if (text.includes("automation") || text.includes("bot") || text.includes("api") || text.includes("calendar")) {
    return [
      "Show me the exact AnythingLLM tool path before any automation setup.",
      "Map this into Manual Now, Agent-Assisted Next, and Auto Mode later.",
      "Turn this into a 7-day automation setup plan with one simple task per day.",
      "List the exact tools, accounts, APIs, permissions, and approvals needed.",
      "Create the safest manual/no-code version first, then the real Auto Mode version.",
    ];
  }

  if (text.includes("pfp") || text.includes("moonboy") || text.includes("avatar") || text.includes("faction") || text.includes("lore")) {
    return [
      "Ask me for the missing PFP character details before inventing traits.",
      "Build the full Moonboy/PFP bio from the known details only.",
      "Turn this character into a stencil, poster, merch, and local campaign pack.",
      "Save this as an idea, approved decision, or proof note.",
      "Turn this PFP into a 7-day beginner build path.",
    ];
  }

  if (text.includes("image") || text.includes("poster") || text.includes("icon") || text.includes("stencil") || text.includes("logo") || text.includes("mascot")) {
    return [
      "Create the full GPT/Grok image handoff prompt and tell the new AI the scope.",
      "Make this visual idea work as a stencil, poster, sticker, and merch mark.",
      "Give me a cleaner production brief: subject, pose, colours, symbols, and avoid list.",
      "Turn the finished image into a local proof post and digital proof loop.",
      "Show me which AnythingLLM step comes after the image is made.",
    ];
  }

  if (text.includes("daily") || text.includes("proof") || text.includes("local") || text.includes("campaign")) {
    return [
      "Turn this into today's Street-To-Digital Proof Card.",
      "Show me exactly what to do, click, upload, save, or post next.",
      "Save this as an idea, approved decision, or proof note.",
      "Make this local-first: one real-world surface and one digital proof post.",
      "Turn this into a 7-day beginner build path.",
    ];
  }

  if (text.includes("brand") || text.includes("product") || text.includes("art") || text.includes("music")) {
    return [
      "Build the brand identity: name, mission, look, voice, and street signal.",
      "Turn this into a mascot or mark people can remember locally.",
      "Create a launch pack: lore hook, poster, merch, campaign, and proof loop.",
      "Create the external AI image prompt for the logo, mascot, poster, or mockup.",
      "Turn this brand/project into a 7-day beginner build path.",
    ];
  }

  return [
    "Show me exactly which AnythingLLM button or tool to use next.",
    "Give me 3 stronger directions and pick the best one.",
    "Turn this into one clear next step I can do today.",
    "Save this as an idea, approved decision, or proof note.",
    "Create the external AI prompt if this needs an image, logo, poster, or mascot.",
  ];
}

function SparkyFloatingClip({
  latestAssistantText = "",
  sendCommand = null,
  workspace = null,
}) {
  const [open, setOpen] = useState(false);
  const { toggleSidebar } = useSparkyRecordsSidebar();
  const prompts = getSparkyForwardPrompts(latestAssistantText);
  const showRecordsAction = isCanonicalSparkyWorkspace(workspace);

  async function usePrompt(prompt) {
    sendCommand?.({ text: prompt, writeMode: "replace" });
    try {
      await navigator.clipboard?.writeText(prompt);
    } catch {}
    setOpen(false);
  }

  function openRecords() {
    toggleSidebar();
    setOpen(false);
  }

  return (
    <>
      <style>{`
        @keyframes sparkyBeeFlight {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          18% { transform: translate3d(-18px, -8px, 0) rotate(-3deg); }
          38% { transform: translate3d(16px, -20px, 0) rotate(3deg); }
          58% { transform: translate3d(24px, 4px, 0) rotate(2deg); }
          78% { transform: translate3d(-14px, 14px, 0) rotate(-4deg); }
        }
      `}</style>
      <div className="absolute bottom-[24px] right-[42px] z-20 hidden select-none xl:block">
      {open && (
        <div className="absolute bottom-[118px] right-0 w-[330px] rounded-[18px] border border-white/10 bg-zinc-950/95 p-3 text-white shadow-2xl backdrop-blur-md">
          <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-yellow-300">
            SPARKY wider ideas
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
          {showRecordsAction && (
            <button
              type="button"
              onClick={openRecords}
              className="mt-2 w-full rounded-[10px] border border-yellow-300/30 bg-yellow-300/10 px-3 py-2 text-left text-sm font-semibold leading-snug text-yellow-100 hover:border-yellow-300/70 hover:bg-yellow-300/15"
            >
              Open SPARKY Records / Proof
            </button>
          )}
          <p className="mt-2 px-1 text-[11px] text-white/45">
            Click one to load a wider helper prompt into the message box.
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
          style={{ animation: "sparkyBeeFlight 7.5s ease-in-out infinite" }}
        />
      </button>
      </div>
    </>
  );
}

export default function ChatContainer({
  workspace,
  threadSlug = null,
  knownHistory = [],
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [chatHistory, setChatHistory] = useState(knownHistory);
  const [socketId, setSocketId] = useState(null);
  const [websocket, setWebsocket] = useState(null);
  const { files, parseAttachments } = useContext(DndUploaderContext);
  const { chatHistoryRef } = useChatContainerQuickScroll();
  const pendingMessageChecked = useRef(false);
  const pendingResetRef = useRef(false);
  const activeThreadSlug = threadSlug;

  const isEmpty =
    chatHistory.length === 0 && !sessionStorage.getItem(PENDING_HOME_MESSAGE);
  const latestAssistantText =
    [...chatHistory]
      .reverse()
      .find((message) => message.role === "assistant" && !!message.content)
      ?.content || "";

  useEffect(() => {
    document.body.classList.toggle("swarmsy-thinking", loadingResponse);
    return () => document.body.classList.remove("swarmsy-thinking");
  }, [loadingResponse]);

  /**
   * Keep chat history bottom-padding in sync with the prompt input's
   * actual rendered height so expanding input never covers messages.
   */
  useEffect(() => {
    if (isEmpty) return;
    const wrapper = document.getElementById("prompt-input-wrapper");
    const chatEl = document.getElementById("chat-history");
    if (!wrapper || !chatEl) return;

    const observer = new ResizeObserver(([entry]) => {
      const inputHeight =
        entry.borderBoxSize?.[0]?.blockSize ?? entry.target.offsetHeight;
      chatEl.style.paddingBottom = `${inputHeight}px`;
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [isEmpty]);

  const { listening, resetTranscript } = useSpeechRecognition({
    clearTranscriptOnListen: true,
  });

  /**
   * Emit an update to the state of the prompt input without directly
   * passing a prop in so that it does not re-render constantly.
   * @param {string} messageContent - The message content to set
   * @param {'replace' | 'append'} writeMode - Replace current text or append to existing text (default: replace)
   */
  function setMessageEmit(messageContent = "", writeMode = "replace") {
    window.dispatchEvent(
      new CustomEvent(PROMPT_INPUT_EVENT, {
        detail: { messageContent, writeMode },
      })
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const currentMessage =
      document.getElementById(PROMPT_INPUT_ID)?.value || "";
    if (!currentMessage) return false;

    // Clear the localStorage draft for this thread/workspace so that if the
    // PromptInput remounts (empty→chat transition), it won't restore stale text
    clearPromptInputDraft(activeThreadSlug ?? workspace.slug);

    // If we're on a bare workspace route (no thread) and no chats exist yet,
    // create a new thread and navigate to it — mimicking Home page behavior.
    if (!activeThreadSlug && chatHistory.length === 0) {
      const { thread } = await Workspace.threads.new(workspace.slug);
      if (thread) {
        sessionStorage.setItem(
          PENDING_HOME_MESSAGE,
          JSON.stringify({
            message: currentMessage,
            attachments: parseAttachments(),
          })
        );
        navigate(paths.workspace.thread(workspace.slug, thread.slug));
        return;
      }
    }

    const prevChatHistory = [
      ...chatHistory,
      {
        content: currentMessage,
        role: "user",
        attachments: parseAttachments(),
      },
      {
        content: "",
        role: "assistant",
        pending: true,
        userMessage: currentMessage,
        animate: true,
      },
    ];

    if (listening) {
      endSTTSession();
    }
    setChatHistory(prevChatHistory);
    setMessageEmit("");
    setLoadingResponse(true);
  };

  function endSTTSession() {
    SpeechRecognition.stopListening();
    resetTranscript();
  }

  const sendCommandRef = useRef(null);

  /**
   * Send a command to the LLM prompt input.
   * @param {Object} options - Arguments to send to the LLM
   * @param {string} options.text - The text to send to the LLM
   * @param {boolean} options.autoSubmit - Determines if the text should be sent immediately or if it should be added to the message state (default: false)
   * @param {Object[]} options.history - The history of the chat prior to this message for overriding the current chat history
   * @param {Object[import("./DnDWrapper").Attachment]} options.attachments - The attachments to send to the LLM for this message
   * @param {'replace' | 'append' | 'prepend'} options.writeMode - Replace current text or append to existing text (default: replace)
   * @returns {void}
   */
  const sendCommand = async ({
    text = "",
    autoSubmit = false,
    history = [],
    attachments = [],
    writeMode = "replace",
  } = {}) => {
    // If we are not auto-submitting, we can just emit the text to the prompt input.
    if (!autoSubmit) {
      setMessageEmit(text, writeMode);
      return;
    }

    if (writeMode === "prepend") {
      const currentText = document.getElementById(PROMPT_INPUT_ID)?.value ?? "";
      text = currentText + " " + text;
    }

    // If we are auto-submitting in append mode
    // than we need to update text with whatever is in the prompt input + the text we are sending.
    // @note: `message` will not work here since it is not updated yet.
    // If text is still empty, after this, then we should just return.
    if (writeMode === "append") {
      const currentText = document.getElementById(PROMPT_INPUT_ID)?.value ?? "";
      text = currentText + text;
    }

    if (!text || text === "") return false;

    // If on a bare workspace route with no thread and no chat yet, create a
    // virtual thread and navigate — same as handleSubmit does.
    if (!activeThreadSlug && chatHistory.length === 0 && history.length === 0) {
      const { thread } = await Workspace.threads.new(workspace.slug);
      if (thread) {
        sessionStorage.setItem(
          PENDING_HOME_MESSAGE,
          JSON.stringify({ message: text, attachments })
        );
        navigate(paths.workspace.thread(workspace.slug, thread.slug));
        return;
      }
    }

    // Clear the localStorage draft so that if the PromptInput remounts
    // (e.g. /reset causing empty→chat or chat→empty transitions),
    // it won't restore stale text.
    clearPromptInputDraft(activeThreadSlug ?? workspace.slug);

    // If we are auto-submitting
    // Then we can replace the current text since this is not accumulating.
    let prevChatHistory;
    if (history.length > 0) {
      // use pre-determined history chain.
      prevChatHistory = [
        ...history,
        {
          content: "",
          role: "assistant",
          pending: true,
          userMessage: text,
          attachments,
          animate: true,
        },
      ];
    } else {
      prevChatHistory = [
        ...chatHistory,
        {
          content: text,
          role: "user",
          attachments,
        },
        {
          content: "",
          role: "assistant",
          pending: true,
          userMessage: text,
          attachments,
          animate: true,
        },
      ];
    }

    setChatHistory(prevChatHistory);
    setMessageEmit("");
    setLoadingResponse(true);
  };

  sendCommandRef.current = sendCommand;
  const chatHistoryRef2 = useRef(chatHistory);
  chatHistoryRef2.current = chatHistory;

  const regenerateAssistantMessage = useCallback(
    (chatId) => {
      const filteredHistory = chatHistoryRef2.current.slice(0, -1);
      const lastUserMessage = filteredHistory.findLast(
        (msg) => msg.role === "user"
      );
      Workspace.deleteChats(workspace.slug, [chatId])
        .then(() =>
          sendCommandRef.current({
            text: lastUserMessage.content,
            autoSubmit: true,
            history: filteredHistory,
            attachments: lastUserMessage?.attachments,
          })
        )
        .catch((e) => console.error(e));
    },
    [workspace.slug]
  );

  useEffect(() => {
    if (pendingMessageChecked.current || !workspace?.slug) return;
    pendingMessageChecked.current = true;

    const pending = safeJsonParse(sessionStorage.getItem(PENDING_HOME_MESSAGE));
    if (pending?.message) {
      setTimeout(() => {
        sessionStorage.removeItem(PENDING_HOME_MESSAGE);
        sendCommand({
          text: pending.message,
          attachments: pending.attachments || [],
          autoSubmit: true,
        });
      }, 100);
    }
  }, [workspace?.slug]);

  useEffect(() => {
    async function fetchReply() {
      const promptMessage =
        chatHistory.length > 0 ? chatHistory[chatHistory.length - 1] : null;
      const remHistory = chatHistory.length > 0 ? chatHistory.slice(0, -1) : [];
      var _chatHistory = [...remHistory];

      // Override hook for new messages to now go to agents until the connection closes
      if (!!websocket) {
        if (!promptMessage || !promptMessage?.userMessage) return false;
        const attachments = promptMessage?.attachments ?? parseAttachments();
        window.dispatchEvent(new CustomEvent(CLEAR_ATTACHMENTS_EVENT));
        websocket.send(
          JSON.stringify({
            type: "awaitingFeedback",
            feedback: promptMessage?.userMessage,
            attachments,
          })
        );

        // /reset during an active agent session should end the session AND
        // clear the chat in a single action. The send above triggers the
        // server to abort the agent and close the socket; fall through to the
        // /reset flow below which resets memory + clears chat history.
        if (promptMessage.userMessage.trim() !== "/reset") return;
        pendingResetRef.current = true;
      }

      if (!promptMessage || !promptMessage?.userMessage) return false;

      // If running and edit or regeneration, this history will already have attachments
      // so no need to parse the current state.
      const attachments = promptMessage?.attachments ?? parseAttachments();
      window.dispatchEvent(new CustomEvent(CLEAR_ATTACHMENTS_EVENT));

      await Workspace.multiplexStream({
        workspaceSlug: workspace.slug,
        threadSlug: activeThreadSlug,
        prompt: promptMessage.userMessage,
        chatHandler: (chatResult) =>
          handleChat(
            chatResult,
            setLoadingResponse,
            setChatHistory,
            remHistory,
            _chatHistory,
            setSocketId
          ),
        attachments,
      });
      return;
    }
    loadingResponse === true && fetchReply();
  }, [loadingResponse, chatHistory, workspace]);

  // TODO: Simplify this WSS stuff
  useEffect(() => {
    let socket = null;

    function handleWSS() {
      try {
        if (!socketId || !!websocket) return;
        socket = new WebSocket(
          `${websocketURI()}/api/agent-invocation/${socketId}`
        );
        socket.supportsAgentStreaming = false;

        window.addEventListener(ABORT_STREAM_EVENT, () => {
          setAgentSessionActive(false);
          setAgentSessionSocket(null);
          window.dispatchEvent(new CustomEvent(AGENT_SESSION_END));
          socket?.close();
        });

        socket.addEventListener("message", (event) => {
          setLoadingResponse(true);
          try {
            handleSocketResponse(socket, event, setChatHistory);
          } catch {
            console.error("Failed to parse data");
            setAgentSessionActive(false);
            window.dispatchEvent(new CustomEvent(AGENT_SESSION_END));
            socket.close();
          }
          setLoadingResponse(false);
        });

        socket.addEventListener("close", (_event) => {
          setAgentSessionActive(false);
          setAgentSessionSocket(null);
          window.dispatchEvent(new CustomEvent(AGENT_SESSION_END));
          // When the close was triggered by /reset, skip the "Agent session
          // complete." status - the pending /reset flow will clear history.
          if (pendingResetRef.current) {
            pendingResetRef.current = false;
          } else {
            setChatHistory((prev) => [
              ...prev.filter((msg) => !!msg.content),
              {
                uuid: v4(),
                type: "statusResponse",
                content: "Agent session complete.",
                role: "assistant",
                sources: [],
                closed: true,
                error: null,
                animate: false,
                pending: false,
              },
            ]);
          }
          setLoadingResponse(false);
          setWebsocket(null);
          setSocketId(null);
        });
        setWebsocket(socket);
        setAgentSessionActive(true);
        setAgentSessionSocket(socket);
        window.dispatchEvent(new CustomEvent(AGENT_SESSION_START));
        window.dispatchEvent(new CustomEvent(CLEAR_ATTACHMENTS_EVENT));
      } catch (e) {
        setChatHistory((prev) => [
          ...prev.filter((msg) => !!msg.content),
          {
            uuid: v4(),
            type: "abort",
            content: e.message,
            role: "assistant",
            sources: [],
            closed: true,
            error: e.message,
            animate: false,
            pending: false,
          },
        ]);
        setLoadingResponse(false);
        setWebsocket(null);
        setSocketId(null);
      }
    }
    handleWSS();

    return () => {
      if (socket) {
        setAgentSessionActive(false);
        window.dispatchEvent(new CustomEvent(AGENT_SESSION_END));
        socket.close();
      }
    };
  }, [socketId]);

  if (isEmpty) {
    return (
      <ChatSidebarProvider>
        <div
          style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
          className="relative flex md:ml-[2px] md:mr-[16px] md:my-[16px] w-full h-full z-[2]"
        >
          <ChatSettingsMenu
            history={chatHistory}
            workspace={workspace}
            threadSlug={activeThreadSlug}
          />
          <div className="flex-1 min-w-0 relative md:rounded-[16px] bg-zinc-900 light:bg-white w-full h-full overflow-hidden border-none light:border-solid light:border light:border-theme-modal-border">
            {isMobile && <SidebarMobileHeader />}
            <WorkspaceModelPicker workspaceSlug={workspace.slug} />
            <DnDFileUploaderWrapper>
              <div className="flex flex-col h-full w-full items-center justify-center">
                <div className="flex flex-col items-center w-full max-w-[750px]">
                  <h1 className="text-white text-xl md:text-2xl mb-11 text-center">
                    {t("main-page.greeting")}
                  </h1>
                  <PromptInput
                    workspace={workspace}
                    submit={handleSubmit}
                    isStreaming={loadingResponse}
                    sendCommand={sendCommand}
                    attachments={files}
                    centered={true}
                  />
                  <QuickActions
                    hasAvailableWorkspace={!!workspace}
                    onCreateAgent={() => navigate(paths.settings.agentSkills())}
                    onEditWorkspace={() =>
                      navigate(
                        paths.workspace.settings.generalAppearance(
                          workspace.slug
                        )
                      )
                    }
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
            <SparkyFloatingClip
              latestAssistantText={latestAssistantText}
              sendCommand={sendCommand}
              workspace={workspace}
            />
            <ChatTooltips />
          </div>
          <MemoriesSidebar workspace={workspace} />
          <SparkyRecordsSidebar workspace={workspace} />
        </div>
      </ChatSidebarProvider>
    );
  }

  return (
    <ChatSidebarProvider>
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative flex md:ml-[2px] md:mr-[16px] md:my-[16px] w-full h-full z-[2]"
      >
        <ChatSettingsMenu
          history={chatHistory}
          workspace={workspace}
          threadSlug={activeThreadSlug}
        />
        <div className="flex-1 min-w-0 relative md:rounded-[16px] bg-zinc-900 light:bg-white text-white light:text-slate-900 h-full overflow-hidden border-none light:border-solid light:border light:border-theme-modal-border">
          {isMobile && <SidebarMobileHeader />}
          <WorkspaceModelPicker workspaceSlug={workspace.slug} />
          <DnDFileUploaderWrapper>
            <div className="flex flex-col h-full w-full pb-20 md:pb-0">
              <div className="contents">
                <MetricsProvider>
                  <ChatHistory
                    ref={chatHistoryRef}
                    history={chatHistory}
                    workspace={workspace}
                    sendCommand={sendCommand}
                    updateHistory={setChatHistory}
                    regenerateAssistantMessage={regenerateAssistantMessage}
                    websocket={websocket}
                  />
                </MetricsProvider>
                <PromptInput
                  workspace={workspace}
                  submit={handleSubmit}
                  isStreaming={loadingResponse}
                  sendCommand={sendCommand}
                  attachments={files}
                  centered={false}
                />
              </div>
            </div>
          </DnDFileUploaderWrapper>
          <SparkyFloatingClip
            latestAssistantText={latestAssistantText}
            sendCommand={sendCommand}
            workspace={workspace}
          />
          <ChatTooltips />
        </div>
        <SourcesSidebar />
        <MemoriesSidebar workspace={workspace} />
        <SparkyRecordsSidebar workspace={workspace} />
      </div>
    </ChatSidebarProvider>
  );
}
