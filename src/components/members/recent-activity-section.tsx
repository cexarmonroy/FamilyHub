"use client";

import { FileText, History, RefreshCw } from "lucide-react";

export type ActivityItem = {
  id: string;
  title: string;
  atLabel: string;
  variant: "secondary" | "primary";
};

const iconWrap = {
  secondary: "bg-fh-secondary-container text-fh-secondary",
  primary: "bg-fh-primary-container text-fh-primary"
} as const;

const Icon = ({ variant }: { variant: ActivityItem["variant"] }) =>
  variant === "secondary" ? (
    <RefreshCw className="size-6" strokeWidth={1.75} />
  ) : (
    <FileText className="size-6" strokeWidth={1.75} />
  );

export function RecentActivitySection({ items }: { items: ActivityItem[] }) {
  if (!items.length) return null;

  return (
    <section className="mt-16 sm:mt-20">
      <h2 className="mb-8 flex items-center gap-3 text-2xl font-bold text-fh-on-surface">
        <History className="size-7 text-fh-tertiary" strokeWidth={1.75} />
        Actividad reciente
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-xl bg-fh-surface-container-low p-6"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconWrap[item.variant]}`}
            >
              <Icon variant={item.variant} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-fh-on-surface">{item.title}</p>
              <p className="text-xs text-fh-line">{item.atLabel}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
