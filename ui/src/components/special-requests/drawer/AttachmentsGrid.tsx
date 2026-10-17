"use client";

import React, { useRef, useState } from "react";
import { ImageOff, Paperclip, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "@/i18n/client";
import {
  uploadOrderAttachment,
  deleteOrderAttachment,
} from "@/lib/api/specialRequests";

interface AttachmentsGridProps {
  attachments: string[];
  lng: string;
  /** Present → interactive mode (slice 2b): upload + two-step delete. */
  orderId?: string;
  /** SWR revalidation callback after a successful upload/delete. */
  onChanged?: () => Promise<void>;
}

// Attachment thumbnail grid. Read-only without orderId (2a contexts); with
// orderId it offers an upload control and per-thumbnail delete using a
// two-step arm/confirm interaction — hard-delete is irreversible, so no
// window.confirm and no single-click destruction.
export const AttachmentsGrid: React.FC<AttachmentsGridProps> = ({
  attachments,
  lng,
  orderId,
  onChanged,
}) => {
  const { t } = useTranslation(lng, "common");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [armedUrl, setArmedUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const interactive = Boolean(orderId);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !orderId) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        await uploadOrderAttachment(orderId, file);
      }
      await onChanged?.();
    } catch {
      toast.error(t("specialRequests.newRequestForm.attachments.failed"));
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Arm with auto-disarm; the timeout is scheduled from the event handler
  // (never setState synchronously in an effect).
  const armDelete = (url: string) => {
    setArmedUrl(url);
    window.setTimeout(
      () => setArmedUrl((cur) => (cur === url ? null : cur)),
      3000,
    );
  };

  const confirmDelete = async (url: string) => {
    if (!orderId) return;
    setBusy(true);
    try {
      await deleteOrderAttachment(orderId, url);
      setArmedUrl(null);
      await onChanged?.();
    } catch {
      toast.error(t("specialRequests.drawer.attachments.deleteFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="label-md font-bold text-on-surface-variant uppercase tracking-wider">
          {t("specialRequests.drawer.attachments.title")}
        </h3>
        {interactive && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              data-testid="attachments-file-input"
              className="hidden"
              onChange={(e) => {
                void handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              data-testid="attachments-add"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              <Paperclip size={14} />
              {t("specialRequests.drawer.attachments.add")}
            </button>
          </>
        )}
      </div>

      {attachments.length === 0 ? (
        <div
          data-testid="attachments-empty"
          className="flex items-center gap-2 text-sm text-on-surface-variant/60 bg-surface-container-low rounded-xl p-4"
        >
          <ImageOff size={16} />
          {t("specialRequests.drawer.attachments.empty")}
        </div>
      ) : (
        <div data-testid="attachments-grid" className="grid grid-cols-3 gap-3">
          {attachments.map((url) => (
            <div key={url} className="relative group">
              <img
                src={url}
                alt=""
                className="rounded-xl object-cover aspect-square w-full shadow-ambient"
              />
              {interactive && (
                <button
                  type="button"
                  data-testid={
                    armedUrl === url ? "attachment-confirm" : "attachment-delete"
                  }
                  disabled={busy}
                  onClick={() =>
                    armedUrl === url ? void confirmDelete(url) : armDelete(url)
                  }
                  title={
                    armedUrl === url
                      ? t("specialRequests.drawer.attachments.confirmDelete")
                      : undefined
                  }
                  className={`absolute top-1.5 right-1.5 p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                    armedUrl === url
                      ? "bg-[#e53935] text-white"
                      : "bg-on-surface/40 text-white opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <Trash2 size={14} />
                </button>
              )}
              {interactive && armedUrl === url && (
                <span className="absolute bottom-1.5 left-1.5 right-1.5 text-center text-[10px] font-bold text-white bg-[#e53935]/90 rounded px-1 py-0.5">
                  {t("specialRequests.drawer.attachments.confirmDelete")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
