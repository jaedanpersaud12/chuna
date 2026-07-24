"use client";

import { useState } from "react";
import { Tuning } from "@/lib/tunings";
import { midiLabel } from "@/lib/notes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CheckIcon, PencilSimpleIcon, TrashIcon, XIcon } from "@phosphor-icons/react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savedTunings: Tuning[];
  onApply: (notes: number[], name: string) => void;
  onRename: (oldName: string, newName: string) => void;
  onDelete: (name: string) => void;
}

export default function ManageTuningsDialog({
  open,
  onOpenChange,
  savedTunings,
  onApply,
  onRename,
  onDelete,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage tunings</DialogTitle>
          <DialogDescription>
            Load a tuning to edit its notes (then Save to update it), or rename
            and delete here.
          </DialogDescription>
        </DialogHeader>

        {savedTunings.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No saved tunings yet. Set up a tuning and hit “Save tuning”.
          </p>
        ) : (
          <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
            {savedTunings.map((t) => (
              <TuningRow
                key={t.name}
                tuning={t}
                existingNames={savedTunings.map((x) => x.name)}
                onApply={() => {
                  onApply(t.notes, t.name);
                  onOpenChange(false);
                }}
                onRename={(newName) => onRename(t.name, newName)}
                onDelete={() => onDelete(t.name)}
              />
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TuningRow({
  tuning,
  existingNames,
  onApply,
  onRename,
  onDelete,
}: {
  tuning: Tuning;
  existingNames: string[];
  onApply: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [draft, setDraft] = useState(tuning.name);

  const trimmed = draft.trim();
  const collides =
    trimmed !== tuning.name && existingNames.includes(trimmed);
  const canSave = trimmed.length > 0 && !collides;

  const commit = () => {
    if (!canSave) return;
    if (trimmed !== tuning.name) onRename(trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(tuning.name);
    setEditing(false);
  };

  if (confirming) {
    return (
      <li className="flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-2 pl-3">
        <span className="min-w-0 flex-1 truncate text-sm">
          Delete <span className="font-medium">{tuning.name}</span>?
        </span>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={() => {
            onDelete();
            setConfirming(false);
          }}
        >
          Delete
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setConfirming(false)}
        >
          Cancel
        </Button>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 rounded-2xl border border-border bg-card/50 p-2 pl-3">
      {editing ? (
        <form
          className="flex flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            commit();
          }}
        >
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
            }}
            aria-invalid={collides}
            className="h-8"
          />
          <Button
            type="submit"
            size="icon-sm"
            variant="ghost"
            disabled={!canSave}
            aria-label="Save name"
          >
            <CheckIcon />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={cancel}
            aria-label="Cancel rename"
          >
            <XIcon />
          </Button>
        </form>
      ) : (
        <>
          <button
            type="button"
            onClick={onApply}
            className="flex min-w-0 flex-1 flex-col items-start text-left"
            title="Load this tuning"
          >
            <span className="truncate text-sm font-medium">{tuning.name}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {tuning.notes.map(midiLabel).join(" ")}
            </span>
          </button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => {
              setDraft(tuning.name);
              setEditing(true);
            }}
            aria-label={`Rename ${tuning.name}`}
          >
            <PencilSimpleIcon />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="destructive"
            onClick={() => setConfirming(true)}
            aria-label={`Delete ${tuning.name}`}
          >
            <TrashIcon />
          </Button>
        </>
      )}
    </li>
  );
}
