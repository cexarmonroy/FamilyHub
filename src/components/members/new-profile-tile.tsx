"use client";

import { Plus } from "lucide-react";

export function NewProfileTile({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-h-[280px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-fh-line-variant/30 bg-fh-surface-container-low p-8 text-center transition-colors hover:border-fh-primary/50"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-fh-surface-container-highest transition-transform group-hover:scale-110">
        <Plus className="size-8 text-fh-line-variant transition-colors group-hover:text-fh-primary" strokeWidth={1.75} />
      </div>
      <p className="font-bold text-fh-on-surface-variant transition-colors group-hover:text-fh-primary">Nuevo perfil</p>
      <p className="mt-1 text-xs text-fh-line">Añade a un cuidador o familiar</p>
    </button>
  );
}
