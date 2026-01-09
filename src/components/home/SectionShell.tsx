"use client";

import { ReactNode, forwardRef } from "react";
import * as React from "react";

interface SectionShellProps {
  children: ReactNode;
  index: number;
  className?: string;
  contentAlign?: "top" | "center"; // Content area alignment (not title)
  density?: "default" | "tight";
  budgets?: {
    titleBlock?: number;
    controlRow?: number;
    mainContent?: number;
    detailPanel?: number;
    actionRow?: number;
    footerNote?: number;
    badgesRow?: number;
  };
}

const SECTION_IDS = [
  "upload",
  "baseline",
  "adjust",
  "evidence",
  "three-steps",
  "verify",
  "after-verification",
  "pricing",
  "faq",
];

type SlotKey = "title" | "control" | "main" | "detail";

const SLOT_CLASS: Record<SlotKey, string> = {
  title: "slot-title-block",
  control: "slot-control-row",
  main: "slot-main-content",
  detail: "slot-detail-panel",
};

function extractSlots(children: React.ReactNode) {
  const found: Record<SlotKey, React.ReactElement | null> = {
    title: null,
    control: null,
    main: null,
    detail: null,
  };

  const done = () => Object.values(found).every(Boolean);

  const walk = (node: React.ReactNode) => {
    if (!node || done()) return;

    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    if (!React.isValidElement(node)) return;

    const props = node.props as { className?: string; children?: React.ReactNode };
    const className = (props?.className ?? "") as string;

    // Detect wrapper div (div with classes like w-full h-full flex flex-col)
    const isWrapper = 
      typeof className === "string" &&
      className.includes("w-full") &&
      className.includes("h-full") &&
      (className.includes("flex") || className.includes("flex-col"));

    // Check slots only when it's not a wrapper div (the wrapper itself is not a slot)
    if (!isWrapper) {
      (Object.keys(SLOT_CLASS) as SlotKey[]).forEach((k) => {
        if (!found[k] && className.includes(SLOT_CLASS[k])) {
          found[k] = React.cloneElement(node, {
            key: k,
          });
        }
      });
    }

    if (done()) return;

    // Explore children (explore children whether it's a wrapper or not)
    const child = props?.children;
    if (child) {
      walk(child);
    }
  };

  walk(children);

  const hasAny = Object.values(found).some(Boolean);
  return { found, hasAny };
}

export const SectionShell = forwardRef<HTMLElement, SectionShellProps>(
  ({ children, index, className = "", contentAlign = "center", density = "default", budgets }, ref) => {
    const sectionId = SECTION_IDS[index] || `section-${index}`;
    const isHero = index === 0;

    const bg = isHero
      ? "bg-white"
      : index % 2 === 0
        ? "bg-white"
        : "bg-slate-50/50";

    const densityClass = density === "tight" ? "landing-section-tight" : "landing-section-default";
    const titleSlotClass = density === "tight" ? "landing-section-title-slot tight" : "landing-section-title-slot";

    // Apply budget styles as CSS variables
    const budgetStyles: React.CSSProperties & Record<string, string> = {};
    if (budgets) {
      if (budgets.titleBlock) budgetStyles["--home-title-max"] = `${budgets.titleBlock}px`;
      if (budgets.controlRow) budgetStyles["--budget-control-row"] = `${budgets.controlRow}px`;
      if (budgets.mainContent) budgetStyles["--budget-main-content"] = `${budgets.mainContent}px`;
      if (budgets.detailPanel) budgetStyles["--budget-detail-panel"] = `${budgets.detailPanel}px`;
      if (budgets.actionRow) budgetStyles["--budget-action-row"] = `${budgets.actionRow}px`;
      if (budgets.footerNote) budgetStyles["--budget-footer-note"] = `${budgets.footerNote}px`;
      if (budgets.badgesRow) budgetStyles["--budget-badges-row"] = `${budgets.badgesRow}px`;
    }

    const { found, hasAny } = extractSlots(children);

    return (
      <section
        ref={ref}
        id={sectionId}
        data-section-index={index}
        className={[
          bg,
          "slide-section",
          "snap-start",
          index === 2 ? "scroll-mt-24 sm:scroll-mt-28 lg:scroll-mt-32" : "",
          className,
        ].join(" ")}
        style={{
          height: "calc(100svh - var(--siteHeaderH, 0px))",
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
          scrollMarginTop: `var(--siteHeaderH, 0px)`,
        }}
      >
        <div 
          className={`landing-section-inner ${isHero ? "hero" : ""} ${densityClass}`}
          style={budgetStyles}
        >
          <div className={titleSlotClass}>
            {hasAny ? found.title : children}
          </div>

          <div className="landing-section-control-slot">
            {hasAny ? found.control : null}
          </div>

          <div className="landing-section-main-slot">
            {hasAny ? found.main : null}
          </div>

          <div className="landing-section-detail-slot">
            {hasAny ? found.detail : null}
          </div>
        </div>
      </section>
    );
  }
);

SectionShell.displayName = "SectionShell";
