"use client";

import React, { useRef, useState } from "react";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Paperclip, X } from "lucide-react";
import { useTranslation } from "@/i18n/client";
import { uploadImage } from "@/lib/api/storage";
import { createSpecialRequest } from "@/lib/api/specialRequests";
import {
  specialRequestCreateSchema,
  SpecialRequestCreateFormData,
} from "@/lib/validations/specialRequest";
import { deriveIva, deriveTotal } from "@/lib/special-requests/fiscal";
import { DateTimeInput } from "../DateTimeInput";

interface PendingFile {
  id: string;
  file: File;
  url?: string;
  status: "pending" | "uploading" | "done" | "error";
}

interface CreateFormProps {
  lng: string;
  onCreated: () => Promise<void>;
}

const formatMoney = (v: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    v,
  );

// New Request form (slice 2b). Upload-before-create: every pending file is
// uploaded first; any upload failure blocks the POST and keeps form values.
// Plain register + z.preprocess (never override register onChange).
export const CreateForm: React.FC<CreateFormProps> = ({ lng, onCreated }) => {
  const { t } = useTranslation(lng, "common");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SpecialRequestCreateFormData>({
    resolver: zodResolver(
      specialRequestCreateSchema,
    ) as Resolver<SpecialRequestCreateFormData>,
    defaultValues: {
      customerName: "",
      customerWa: "",
      title: "",
      description: "",
      deadline: "",
      phase: "",
      progressPct: null,
      gastoTerceros: 0,
      serviceFee: 0,
    },
    mode: "onBlur",
  });

  const getErrorMessage = (errorKey?: string): string | undefined =>
    errorKey ? t(errorKey) : undefined;

  const gasto = Number(watch("gastoTerceros")) || 0;
  const service = Number(watch("serviceFee")) || 0;

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const added: PendingFile[] = Array.from(files).map((file, i) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${i}`,
      file,
      status: "pending",
    }));
    setPendingFiles((prev) => [...prev, ...added]);
  };

  const removePending = (id: string) =>
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));

  const onSubmit = async (values: SpecialRequestCreateFormData) => {
    setSubmitting(true);
    try {
      // 1. Upload every pending file; any failure blocks the POST (spec).
      const urls: string[] = [];
      for (const pf of pendingFiles) {
        if (pf.status === "done" && pf.url) {
          urls.push(pf.url);
          continue;
        }
        setPendingFiles((prev) =>
          prev.map((f) => (f.id === pf.id ? { ...f, status: "uploading" } : f)),
        );
        try {
          const url = await uploadImage(pf.file);
          urls.push(url);
          setPendingFiles((prev) =>
            prev.map((f) => (f.id === pf.id ? { ...f, status: "done", url } : f)),
          );
        } catch {
          setPendingFiles((prev) =>
            prev.map((f) => (f.id === pf.id ? { ...f, status: "error" } : f)),
          );
          toast.error(t("specialRequests.newRequestForm.errors.upload_failed"));
          return; // values kept; no POST
        }
      }

      // 2. Single POST carrying the uploaded URLs.
      await createSpecialRequest({
        title: values.title,
        task_description: values.description,
        deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
        phase: values.phase,
        progress_pct: values.progressPct,
        gasto_terceros: values.gastoTerceros,
        service_fee: values.serviceFee,
        customer_name: values.customerName,
        ...(values.customerWa ? { customer_wa: values.customerWa } : {}),
        attachments: urls,
      });
      toast.success(t("specialRequests.newRequestForm.success.created"));
      await onCreated();
    } catch {
      toast.error(t("specialRequests.newRequestForm.errors.create_failed"));
      // Values kept and drawer stays open (spec: create failure restores).
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      data-testid="create-form"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="create-customer-name"
            className="text-xs font-medium text-on-surface-variant label-md"
          >
            {t("specialRequests.newRequestForm.fields.customerName")}
          </label>
          <input
            id="create-customer-name"
            type="text"
            {...register("customerName")}
            className="bg-surface-container-lowest rounded-xl px-4 py-3 text-sm text-on-surface outline outline-1 outline-outline-variant/15 focus:outline-primary-container focus:outline-2 transition-colors"
          />
          {errors.customerName && (
            <p className="text-xs text-[#e53935] font-medium">
              {getErrorMessage(errors.customerName.message)}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="create-customer-wa"
            className="text-xs font-medium text-on-surface-variant label-md"
          >
            {t("specialRequests.newRequestForm.fields.customerWa")}
          </label>
          <input
            id="create-customer-wa"
            type="text"
            {...register("customerWa")}
            className="bg-surface-container-lowest rounded-xl px-4 py-3 text-sm text-on-surface outline outline-1 outline-outline-variant/15 focus:outline-primary-container focus:outline-2 transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="create-title"
          className="text-xs font-medium text-on-surface-variant label-md"
        >
          {t("specialRequests.newRequestForm.fields.title")}
        </label>
        <input
          id="create-title"
          type="text"
          {...register("title")}
          className="bg-surface-container-lowest rounded-xl px-4 py-3 text-sm text-on-surface outline outline-1 outline-outline-variant/15 focus:outline-primary-container focus:outline-2 transition-colors"
        />
        {errors.title && (
          <p className="text-xs text-[#e53935] font-medium">
            {getErrorMessage(errors.title.message)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="create-description"
          className="text-xs font-medium text-on-surface-variant label-md"
        >
          {t("specialRequests.newRequestForm.fields.description")}
        </label>
        <textarea
          id="create-description"
          rows={3}
          {...register("description")}
          className="bg-surface-container-lowest rounded-xl px-4 py-3 text-sm text-on-surface outline outline-1 outline-outline-variant/15 focus:outline-primary-container focus:outline-2 transition-colors resize-none"
        />
      </div>

      <DateTimeInput
        id="create-deadline"
        label={t("specialRequests.newRequestForm.fields.deadline")}
        value={watch("deadline") ?? ""}
        onChange={(v) => setValue("deadline", v)}
        error={getErrorMessage(errors.deadline?.message)}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="create-phase"
            className="text-xs font-medium text-on-surface-variant label-md"
          >
            {t("specialRequests.newRequestForm.fields.phase")}
          </label>
          <input
            id="create-phase"
            type="text"
            {...register("phase")}
            className="bg-surface-container-lowest rounded-xl px-4 py-3 text-sm text-on-surface outline outline-1 outline-outline-variant/15 focus:outline-primary-container focus:outline-2 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="create-progress"
            className="text-xs font-medium text-on-surface-variant label-md"
          >
            {t("specialRequests.newRequestForm.fields.progressPct")}
          </label>
          <input
            id="create-progress"
            type="number"
            {...register("progressPct")}
            className="bg-surface-container-lowest rounded-xl px-4 py-3 text-sm text-on-surface outline outline-1 outline-outline-variant/15 focus:outline-primary-container focus:outline-2 transition-colors"
          />
          {errors.progressPct && (
            <p className="text-xs text-[#e53935] font-medium">
              {getErrorMessage(errors.progressPct.message)}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="create-gasto"
            className="text-xs font-medium text-on-surface-variant label-md"
          >
            {t("specialRequests.newRequestForm.fields.gastoTerceros")}
          </label>
          <input
            id="create-gasto"
            type="number"
            step="0.01"
            {...register("gastoTerceros")}
            className="bg-surface-container-lowest rounded-xl px-4 py-3 text-sm text-on-surface outline outline-1 outline-outline-variant/15 focus:outline-primary-container focus:outline-2 transition-colors"
          />
          {errors.gastoTerceros && (
            <p className="text-xs text-[#e53935] font-medium">
              {getErrorMessage(errors.gastoTerceros.message)}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="create-service"
            className="text-xs font-medium text-on-surface-variant label-md"
          >
            {t("specialRequests.newRequestForm.fields.serviceFee")}
          </label>
          <input
            id="create-service"
            type="number"
            step="0.01"
            {...register("serviceFee")}
            className="bg-surface-container-lowest rounded-xl px-4 py-3 text-sm text-on-surface outline outline-1 outline-outline-variant/15 focus:outline-primary-container focus:outline-2 transition-colors"
          />
          {errors.serviceFee && (
            <p className="text-xs text-[#e53935] font-medium">
              {getErrorMessage(errors.serviceFee.message)}
            </p>
          )}
        </div>
      </div>

      {/* Live fiscal preview (derived at render, no state) */}
      <div
        data-testid="create-fiscal-preview"
        className="bg-surface-container-low rounded-xl p-4 flex justify-between text-sm text-on-surface-variant"
      >
        <span>
          {t("specialRequests.newRequestForm.fiscal.iva")}{" "}
          <span data-testid="create-fiscal-iva">{formatMoney(deriveIva(service))}</span>
        </span>
        <span className="font-bold text-on-surface">
          {t("specialRequests.newRequestForm.fiscal.total")}{" "}
          <span data-testid="create-fiscal-total">
            {formatMoney(deriveTotal(gasto, service))}
          </span>
        </span>
      </div>

      {/* Attachments (upload-before-create) */}
      <section className="flex flex-col gap-2">
        <h3 className="label-md font-bold text-on-surface-variant uppercase tracking-wider">
          {t("specialRequests.newRequestForm.attachments.title")}
        </h3>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          data-testid="create-file-input"
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          data-testid="create-add-files"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          <Paperclip size={16} />
          {t("specialRequests.newRequestForm.attachments.add")}
        </button>
        {pendingFiles.map((pf) => (
          <div
            key={pf.id}
            data-testid={`pending-file-${pf.status}`}
            className="flex items-center justify-between bg-surface-container-low rounded-xl px-4 py-2 text-sm"
          >
            <span className="truncate text-on-surface-variant">{pf.file.name}</span>
            <span className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant/60">
                {pf.status === "uploading"
                  ? t("specialRequests.newRequestForm.attachments.uploading")
                  : pf.status === "error"
                    ? t("specialRequests.newRequestForm.attachments.failed")
                    : ""}
              </span>
              {pf.status !== "uploading" && (
                <button
                  type="button"
                  aria-label={t("specialRequests.newRequestForm.buttons.cancel")}
                  onClick={() => removePending(pf.id)}
                  className="p-1 rounded hover:bg-surface-container-high"
                >
                  <X size={14} />
                </button>
              )}
            </span>
          </div>
        ))}
      </section>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          data-testid="create-submit"
          className="px-5 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white text-sm font-bold shadow-ambient hover:shadow-lg transition-shadow disabled:opacity-50"
        >
          {t("specialRequests.newRequestForm.buttons.create")}
        </button>
      </div>
    </form>
  );
};
