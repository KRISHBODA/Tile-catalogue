"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "./primitives";
export function Modal({
  title,
  children,
  onClose,
  busy = false,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  busy?: boolean;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = ref.current;
    node?.showModal();
    node?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => node?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`workspace-modal ${wide ? "wide" : ""}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header>
        <h2>{title}</h2>
        <Button
          type="button"
          className="icon-button"
          aria-label={`Close ${title}`}
          disabled={busy}
          onClick={onClose}
        >
          <X size={19} />
        </Button>
      </header>
      {children}
    </dialog>
  );
}
