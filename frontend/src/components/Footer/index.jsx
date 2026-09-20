import System from "@/models/system";
import paths from "@/utils/paths";
import {
  BookOpen,
  DiscordLogo,
  GithubLogo,
  Briefcase,
  Envelope,
  Globe,
  HouseLine,
  Info,
  LinkSimple,
} from "@phosphor-icons/react";
import React, { useEffect, useState } from "react";
import SettingsButton from "../SettingsButton";
import { isMobile } from "react-device-detect";
import { Tooltip } from "react-tooltip";
import { Link } from "react-router-dom";

export const MAX_ICONS = 3;
const SWARMSY_GITHUB_URL = "https://github.com/Crypto-Moonboys/SWARMSY-Ai";
const HODL_WARRIORS_CHAT_URL = "https://t.me/gkniftyheads/46556";
const HODL_WARRIORS_BUTTON_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGmWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgMTAuMC1jMDAwIDI1LkcuZDIwZTQ2NiwgMjAyNS8xMi8wOC0yMDo1MDoyMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI3LjcgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNi0wOC0xOFQwODoxNjowNCswMTowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjYtMDktMjBUMTk6MDE6MjUrMDE6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjYtMDktMjBUMTk6MDE6MjUrMDE6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmI2MzhhNGYzLTg1MTEtODY0YS05NzFjLWJlYjQ1MmExNTAwZCIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjRkODAxMjg3LTA3MmUtZjE0OC04MTEyLTY0Y2RhZGQxNTAzYSIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjkzNzQ4Njc2LTJjYjktNDg0Ni1hMWUxLTZlNWY3NDlhYjZmMyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6OTM3NDg2NzYtMmNiOS00ODQ2LWExZTEtNmU1Zjc0OWFiNmYzIiBzdEV2dDp3aGVuPSIyMDI2LTA4LTE4VDA4OjE2OjA0KzAxOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjcuNyAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjM4MjkwMzFkLTkwOWItZTE0OC1hNDkzLTYxMGYzNzMxY2E5YSIgc3RFdnQ6d2hlbj0iMjAyNi0wOC0xOFQwODoyNDo0NiswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI3LjcgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpiNjM4YTRmMy04NTExLTg2NGEtOTcxYy1iZWI0NTJhMTUwMGQiIHN0RXZ0OndoZW49IjIwMjYtMDktMjBUMTk6MDE6MjUrMDE6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyNy43IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7qbC2PAAApk0lEQVR4nN19B3QVVff9fqkvhRASEjqhg/ROQKVIB6kqqEhHxY/mByh8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";

export const ICON_COMPONENTS = {
  BookOpen: BookOpen,
  DiscordLogo: DiscordLogo,
  GithubLogo: GithubLogo,
  Envelope: Envelope,
  LinkSimple: LinkSimple,
  HouseLine: HouseLine,
  Globe: Globe,
  Briefcase: Briefcase,
  Info: Info,
};

function HodlWarriorsButton() {
  return (
    <div className="flex w-fit">
      <a
        href={HODL_WARRIORS_CHAT_URL}
        target="_blank"
        rel="noreferrer"
        className="transition-all duration-300 flex h-9 w-9 items-center justify-center bg-transparent"
        style={{ borderRadius: 0, filter: "none", mixBlendMode: "normal" }}
        aria-label="HODL Warriors Chat"
        data-tooltip-id="footer-item"
        data-tooltip-content="HODL WARRIORS CHAT"
      >
        <span
          aria-hidden="true"
          className="block h-9 w-9"
          style={{
            backgroundColor: "transparent",
            backgroundImage: `url("${HODL_WARRIORS_BUTTON_URL}")`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "contain",
            borderRadius: 0,
            filter: "invert(1)",
            mixBlendMode: "normal",
          }}
        />
      </a>
    </div>
  );
}

export default function Footer() {
  const [footerData, setFooterData] = useState(false);

  useEffect(() => {
    async function fetchFooterData() {
      const { footerData } = await System.fetchCustomFooterIcons();
      setFooterData(footerData);
    }
    fetchFooterData();
  }, []);

  // wait for some kind of non-false response from footer data first
  // to prevent pop-in.
  if (footerData === false) return null;

  if (!Array.isArray(footerData) || footerData.length === 0) {
    return (
      <div className="flex justify-center mb-2">
        <div className="flex space-x-4">
          <div className="flex w-fit">
            <Link
              to={SWARMSY_GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="transition-all duration-300 p-2 rounded-full bg-theme-sidebar-footer-icon hover:bg-theme-sidebar-footer-icon-hover"
              aria-label="Find us on GitHub"
              data-tooltip-id="footer-item"
              data-tooltip-content="View Source Code"
            >
              <GithubLogo
                weight="fill"
                className="h-5 w-5 text-white light:text-slate-800"
              />
            </Link>
          </div>
          <div className="flex w-fit">
            <Link
              to={paths.docs()}
              target="_blank"
              rel="noreferrer"
              className="transition-all duration-300 p-2 rounded-full bg-theme-sidebar-footer-icon hover:bg-theme-sidebar-footer-icon-hover"
              aria-label="Docs"
              data-tooltip-id="footer-item"
              data-tooltip-content="Open AnythingLLM help docs"
            >
              <BookOpen
                weight="fill"
                className="h-5 w-5 text-white light:text-slate-800"
              />
            </Link>
          </div>
          <div className="flex w-fit">
            <Link
              to={paths.discord()}
              target="_blank"
              rel="noreferrer"
              className="transition-all duration-300 p-2 rounded-full bg-theme-sidebar-footer-icon hover:bg-theme-sidebar-footer-icon-hover"
              aria-label="Join our Discord server"
              data-tooltip-id="footer-item"
              data-tooltip-content="Join the AnythingLLM Discord"
            >
              <DiscordLogo
                weight="fill"
                className="h-5 w-5 text-white light:text-slate-800"
              />
            </Link>
          </div>
          <HodlWarriorsButton />
          {!isMobile && <SettingsButton />}
        </div>
        <Tooltip
          id="footer-item"
          place="top"
          delayShow={300}
          className="tooltip !text-xs z-99"
        />
      </div>
    );
  }

  return (
    <div className="flex justify-center mb-2">
      <div className="flex space-x-4">
        {footerData.map((item, index) => (
          <a
            key={index}
            href={
              index === 0 && item.icon === "GithubLogo"
                ? SWARMSY_GITHUB_URL
                : item.url
            }
            target="_blank"
            rel="noreferrer"
            className="transition-all duration-300 flex w-fit h-fit p-2 p-2 rounded-full bg-theme-sidebar-footer-icon hover:bg-theme-sidebar-footer-icon-hover hover:border-slate-100"
            data-tooltip-id="footer-item"
            data-tooltip-content={
              index === 0 && item.icon === "GithubLogo"
                ? "View Source Code"
                : item.url
            }
          >
            {React.createElement(
              ICON_COMPONENTS?.[item.icon] ?? ICON_COMPONENTS.Info,
              {
                weight: "fill",
                className: "h-5 w-5",
                color: "var(--theme-sidebar-footer-icon-fill)",
              }
            )}
          </a>
        ))}
        <HodlWarriorsButton />
        {!isMobile && <SettingsButton />}
      </div>
      <Tooltip
        id="footer-item"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99"
      />
    </div>
  );
}
