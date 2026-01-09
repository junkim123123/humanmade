// @ts-nocheck
import React, { forwardRef } from "react";
import { ReportSlideTitle } from "@/components/report/ReportSlideTitle";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
  children: React.ReactNode;
  dataIndex: number;

  // Allow inner scroll for specific slides if needed
  allowInnerScroll?: boolean;
};

export const SlideShell = forwardRef<HTMLDivElement, Props>(
  (
    {
      title,
      subtitle,
      height,
      className,
      children,
      dataIndex,
      allowInnerScroll = false,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        data-index={dataIndex}
        className={cn(
          "snap-start snap-always w-full shrink-0 overflow-hidden isolate h-full",
          className
        )}
        style={height ? { height } : undefined}
      >
        <div className="max-w-7xl mx-auto px-6 pt-6 md:pt-8 pb-6 md:pb-8 h-full flex flex-col min-h-0">
          {title ? (
            <ReportSlideTitle title={title} subtitle={subtitle} align="left" />
          ) : null}

          <div
            className={cn(
              "flex-1 min-h-0",
              allowInnerScroll ? "overflow-y-auto overscroll-contain" : "overflow-hidden"
            )}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);

SlideShell.displayName = "SlideShell";
