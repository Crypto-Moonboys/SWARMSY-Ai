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
  "https://raw.githubusercontent.com/Crypto-Moonboys/SWARMSY-Ai/master/images/HODL%20WARRIORS%20BUTTON.png";

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
        className="transition-all duration-300 flex h-9 w-9 items-center justify-center bg-transparent hover:scale-105"
        aria-label="HODL Warriors Chat"
        data-tooltip-id="footer-item"
        data-tooltip-content="HODL WARRIORS CHAT"
      >
        <img
          src={HODL_WARRIORS_BUTTON_URL}
          alt=""
          aria-hidden="true"
          className="h-9 w-9 object-contain"
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
