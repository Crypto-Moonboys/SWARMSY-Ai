import React, { useEffect, useRef, useState } from "react";
import { List, Plus } from "@phosphor-icons/react";
import NewWorkspaceModal, {
  useNewWorkspaceModal,
} from "../Modals/NewWorkspace";
import ActiveWorkspaces from "./ActiveWorkspaces";
import useLogo from "@/hooks/useLogo";
import useUser from "@/hooks/useUser";
import Footer from "../Footer";
import SettingsButton from "../SettingsButton";
import { Link } from "react-router-dom";
import paths from "@/utils/paths";
import { useTranslation } from "react-i18next";
import { useSidebarToggle, ToggleSidebarButton } from "./SidebarToggle";
import SearchBox from "./SearchBox";
import { Tooltip } from "react-tooltip";
import { createPortal } from "react-dom";

const SWARMSY_APP_LOGO_URL =
  "https://raw.githubusercontent.com/Crypto-Moonboys/SWARMSY-Ai/master/images/anythingLLM%20SWARMSY.jpg";

export default function Sidebar() {
  const { user } = useUser();
  const sidebarRef = useRef(null);
  const { showSidebar, setShowSidebar, canToggleSidebar } = useSidebarToggle();
  const {
    showing: showingNewWsModal,
    showModal: showNewWsModal,
    hideModal: hideNewWsModal,
  } = useNewWorkspaceModal();

  return (
    <>
      <style>{`
        @keyframes swarmsySidebarDotField {
          0%, 100% {
            opacity: 0.58;
            transform: translate3d(-22px, -18px, 0) scale(1);
          }
          35% {
            opacity: 0.95;
            transform: translate3d(28px, 18px, 0) scale(1.12);
          }
          70% {
            opacity: 0.72;
            transform: translate3d(-12px, 34px, 0) scale(1.02);
          }
        }

        @keyframes swarmsySidebarGlowField {
          0%, 100% {
            opacity: 0.78;
            transform: translate3d(-42px, 34px, 0) scale(1.05);
          }
          45% {
            opacity: 0.96;
            transform: translate3d(42px, -48px, 0) scale(1.3);
          }
          75% {
            opacity: 0.86;
            transform: translate3d(18px, 38px, 0) scale(1.16);
          }
        }

        .swarmsy-sidebar-shell {
          background:
            radial-gradient(circle at 20% 18%, rgba(120, 120, 120, 0.28), transparent 28%),
            radial-gradient(circle at 78% 72%, rgba(90, 90, 90, 0.24), transparent 34%),
            linear-gradient(145deg, #020202 0%, #151515 52%, #030303 100%);
          isolation: isolate;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 0 110px rgba(160,160,160,0.18);
        }

        .swarmsy-sidebar-shell::before,
        .swarmsy-sidebar-shell::after {
          content: "";
          position: absolute;
          inset: -18%;
          pointer-events: none;
          z-index: 0;
        }

        .swarmsy-sidebar-shell::before {
          background-image:
            radial-gradient(circle, rgba(255, 255, 255, 0.72) 1.2px, transparent 2.2px),
            radial-gradient(circle, rgba(255, 255, 255, 0.34) 1.4px, transparent 2.6px);
          background-position: 0 0, 7px 7px;
          background-size: 13px 13px, 29px 29px;
          animation: swarmsySidebarDotField 18s ease-in-out infinite;
        }

        .swarmsy-sidebar-shell::after {
          background:
            radial-gradient(circle at 22% 22%, rgba(180, 180, 180, 0.7), transparent 24%),
            radial-gradient(circle at 78% 34%, rgba(150, 150, 150, 0.54), transparent 30%),
            radial-gradient(circle at 46% 78%, rgba(135, 135, 135, 0.5), transparent 34%),
            radial-gradient(circle at 14% 64%, rgba(120, 120, 120, 0.44), transparent 28%),
            radial-gradient(circle at 62% 52%, rgba(165, 165, 165, 0.42), transparent 32%);
          filter: blur(3px);
          animation: swarmsySidebarGlowField 10s ease-in-out infinite;
        }

        body.swarmsy-thinking .swarmsy-sidebar-shell::before {
          animation-duration: 3.6s;
          opacity: 1;
        }

        body.swarmsy-thinking .swarmsy-sidebar-shell::after {
          animation-duration: 2.2s;
          opacity: 1;
        }
      `}</style>
      <div
        style={{
          width: showSidebar ? "292px" : "0px",
          paddingLeft: showSidebar ? "0px" : "16px",
        }}
        className="relative transition-all duration-500"
      >
        {canToggleSidebar && (
          <ToggleSidebarButton
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
          />
        )}
        <div className="overflow-hidden h-full">
          <div className="flex shrink-0 w-full justify-center mt-0 mb-[8px]">
            <div className="flex w-full min-w-[292px] justify-center bg-black">
              <Link
                to={paths.home()}
                aria-label="Home"
                className="block w-full"
              >
                <img
                  src={SWARMSY_APP_LOGO_URL}
                  alt="AnythingLLM SWARMSY"
                  className={`block h-[150px] w-full object-cover transition-opacity duration-500 ${showSidebar ? "opacity-100" : "opacity-0"}`}
                />
              </Link>
            </div>
          </div>
          <div
            ref={sidebarRef}
            className="swarmsy-sidebar-shell relative mx-[16px] mb-[16px] mt-[8px] overflow-hidden rounded-[20px] light:bg-slate-200 min-w-[250px] p-[10px] h-[calc(100%-182px)]"
          >
            <div className="relative z-[1] flex flex-col h-full overflow-hidden">
              <div className="flex-grow flex flex-col min-w-[235px] min-h-0">
                <div className="relative h-[calc(100%-60px)] flex flex-col w-full justify-between pt-[10px] overflow-y-scroll no-scroll">
                  <div className="flex flex-col gap-y-[14px]">
                    <SearchBox user={user} showNewWsModal={showNewWsModal} />
                    <ActiveWorkspaces showNewWsModal={showNewWsModal} />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 pb-3 rounded-b-[20px] bg-black/10 light:bg-slate-200 bg-opacity-80 backdrop-filter backdrop-blur-md z-10">
                  <Footer />
                </div>
              </div>
            </div>
          </div>
        </div>
        {showingNewWsModal && <NewWorkspaceModal hideModal={hideNewWsModal} />}
      </div>
      <WorkspaceAndThreadTooltips />
    </>
  );
}

export function SidebarMobileHeader() {
  const { logo } = useLogo();
  const sidebarRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showBgOverlay, setShowBgOverlay] = useState(false);
  const {
    showing: showingNewWsModal,
    showModal: showNewWsModal,
    hideModal: hideNewWsModal,
  } = useNewWorkspaceModal();
  const { user } = useUser();

  useEffect(() => {
    // Darkens the rest of the screen
    // when sidebar is open.
    function handleBg() {
      if (showSidebar) {
        setTimeout(() => {
          setShowBgOverlay(true);
        }, 300);
      } else {
        setShowBgOverlay(false);
      }
    }
    handleBg();
  }, [showSidebar]);

  return (
    <>
      <div
        aria-label="Show sidebar"
        className="fixed top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2 bg-theme-bg-sidebar light:bg-white text-slate-200 shadow-lg h-16"
      >
        <button
          onClick={() => setShowSidebar(true)}
          className="rounded-md p-2 flex items-center justify-center text-theme-text-secondary"
        >
          <List className="h-6 w-6" />
        </button>
        <div className="flex items-center justify-center flex-grow">
          <img
            src={logo}
            alt="Logo"
            className="block mx-auto h-6 w-auto"
            style={{ maxHeight: "40px", objectFit: "contain" }}
          />
        </div>
        <div className="w-12"></div>
      </div>
      <div
        style={{
          transform: showSidebar ? `translateX(0vw)` : `translateX(-100vw)`,
        }}
        className={`z-99 fixed top-0 left-0 transition-all duration-500 w-[100vw] h-[100vh]`}
      >
        <div
          className={`${
            showBgOverlay
              ? "transition-all opacity-1"
              : "transition-none opacity-0"
          }  duration-500 fixed top-0 left-0 bg-theme-bg-secondary bg-opacity-75 w-screen h-screen`}
          onClick={() => setShowSidebar(false)}
        />
        <div
          ref={sidebarRef}
          className="relative h-[100vh] fixed top-0 left-0  rounded-r-[26px] bg-theme-bg-sidebar w-[80%] p-[18px] "
        >
          <div className="w-full h-full flex flex-col overflow-x-hidden items-between">
            {/* Header Information */}
            <div className="flex w-full items-center justify-between gap-x-4">
              <div className="flex shrink-1 w-fit items-center justify-start">
                <img
                  src={logo}
                  alt="Logo"
                  className="rounded w-full max-h-[40px]"
                  style={{ objectFit: "contain" }}
                />
              </div>
              {(!user || user?.role !== "default") && (
                <div className="flex gap-x-2 items-center text-slate-500 shink-0">
                  <SettingsButton />
                </div>
              )}
            </div>

            {/* Primary Body */}
            <div className="h-full flex flex-col w-full justify-between pt-4 ">
              <div className="h-auto md:sidebar-items">
                <div className=" flex flex-col gap-y-4 overflow-y-scroll no-scroll pb-[60px]">
                  <NewWorkspaceButton
                    user={user}
                    showNewWsModal={showNewWsModal}
                  />
                  <ActiveWorkspaces showNewWsModal={showNewWsModal} />
                </div>
              </div>
              <div className="z-99 absolute bottom-0 left-0 right-0 pt-2 pb-6 rounded-br-[26px] bg-theme-bg-sidebar bg-opacity-80 backdrop-filter backdrop-blur-md">
                <Footer />
              </div>
            </div>
          </div>
        </div>
        {showingNewWsModal && <NewWorkspaceModal hideModal={hideNewWsModal} />}
      </div>
    </>
  );
}

function NewWorkspaceButton({ user, showNewWsModal }) {
  const { t } = useTranslation();
  if (!!user && user?.role === "default") return null;

  return (
    <div className="flex gap-x-2 items-center justify-between">
      <button
        onClick={showNewWsModal}
        className="flex flex-grow w-[75%] h-[44px] gap-x-2 py-[5px] px-4 bg-white rounded-lg text-sidebar justify-center items-center hover:bg-opacity-80 transition-all duration-300"
      >
        <Plus className="h-5 w-5" />
        <p className="text-sidebar text-sm font-semibold">
          {t("new-workspace.title")}
        </p>
      </button>
    </div>
  );
}

function WorkspaceAndThreadTooltips() {
  return createPortal(
    <React.Fragment>
      <Tooltip
        id="workspace-name"
        place="right"
        delayShow={800}
        className="tooltip !text-xs z-99"
      />
      <Tooltip
        id="workspace-thread-name"
        place="right"
        delayShow={800}
        className="tooltip !text-xs z-99"
      />
      <Tooltip
        id="upload-workspace"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99"
      />
      <Tooltip
        id="gear-workspace"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99"
      />
    </React.Fragment>,
    document.body
  );
}
