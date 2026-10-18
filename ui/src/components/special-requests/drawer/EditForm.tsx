"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Resolver } from "react-hook-form";
import toast from "react-hot-toast";
import { useTranslation } from "@/i18n/client";
import { SpecialOrder } from "@/lib/api/types";
import { updateOrderDetails } from "@/lib/api/specialRequests";
import {
  specialRequestSchema,
  SpecialRequestFormData,
} from "@/lib/validations/specialRequest";
import { DateTimeInput } from "../DateTimeInput";

interface EditFormProps {
  order: SpecialOrder;
  lng: string;
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}

function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function orderToFormValues(order: SpecialOrder): SpecialRequestFormData {
  return {
    title: order.title,
    description: order.description,
    deadline: isoToLocalInput(order.deadline),
    phase: order.phase ?? "",
    progressPct: order.progressPct,
    gastoTerceros: order.gastoTerceros,
    serviceFee: order.serviceFee,
  };
}

// Presentational edit form (RHF + zod). Save is revalidate-only: PATCH, then
// mutate the SWR cache. Failure shows an error toast and restores prior values.
// Numeric fields rely on the schema's z.preprocess ('' -> null / 0), matching
// the plain-register pattern proven in the board tests.
export const EditForm: React.FC<EditFormProps> = ({
  order,
  lng,
  onCancel,
  onSaved,
}) => {
  const { t } = useTranslation(lng, "common");
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SpecialRequestFormData>({
    resolver: zodResolver(
      specialRequestSchema,
    ) as Resolver<SpecialRequestFormData>,
    defaultValues: orderToFormValues(order),
    mode: "onBlur",
  });

  const getErrorMessage = (errorKey?: string): string | undefined =>
    errorKey ? t(errorKey) : undefined;

  const deadline = watch("deadline");

  const onSubmit = async (values: SpecialRequestFormData) => {
    try {
      await updateOrderDetails(order.orderId, {
        title: values.title,
        task_description: values.description,
        deadline: values.deadline
          ? new Date(values.deadline).toISOString()
          : null,
        phase: values.phase,
        progress_pct: values.progressPct,
        gasto_terceros: values.gastoTerceros,
        service_fee: values.serviceFee,
      });
      toast.success(t("specialRequests.drawer.success.saved"));
      await onSaved();
    } catch {
      toast.error(t("specialRequests.drawer.loadError"));
      reset(orderToFormValues(order));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      data-testid="drawer-edit-form"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="drawer-title-input"
          className="text-xs font-medium text-on-surface-variant label-md"
        >
          {t("specialRequests.drawer.fields.title")}
        </label>
        <input
          id="drawer-title-input"
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
          htmlFor="drawer-description-input"
          className="text-xs font-medium text-on-surface-variant label-md"
        >
          {t("specialRequests.drawer.fields.description")}
        </label>
        <textarea
          id="drawer-description-input"
          rows={3}
          {...register("description")}
          className="bg-surface-container-lowest rounded-xl px-4 py-3 text-sm text-on-surface outline outline-1 outline-outline-variant/15 focus:outline-primary-container focus:outline-2 transition-colors resize-none"
        />
      </div>

      <DateTimeInput
        id="drawer-deadline-input"
        label={t("specialRequests.drawer.fields.deadline")}
        value={deadline ?? ""}
        onChange={(v) => setValue("deadline", v)}
        error={getErrorMessage(errors.deadline?.message)}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="drawer-phase-input"
            className="text-xs font-medium text-on-surface-variant label-md"
          >
            {t("specialRequests.drawer.fields.phase")}
          </label>
          <input
            id="drawer-phase-input"
            type="text"
            {...register("phase")}
            className="bg-surface-container-lowest rounded-xl px-4 py-3 text-sm text-on-surface outline outline-1 outline-outline-variant/15 focus:outline-primary-container focus:outline-2 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="drawer-progress-input"
            className="text-xs font-medium text-on-surface-variant label-md"
          >
            {t("specialRequests.drawer.fields.progressPct")}
          </label>
          <input
            id="drawer-progress-input"
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
            htmlFor="drawer-gasto-input"
            className="text-xs font-medium text-on-surface-variant label-md"
          >
            {t("specialRequests.drawer.fields.gastoTerceros")}
          </label>
          <input
            id="drawer-gasto-input"
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
            htmlFor="drawer-service-input"
            className="text-xs font-medium text-on-surface-variant label-md"
          >
            {t("specialRequests.drawer.fields.serviceFee")}
          </label>
          <input
            id="drawer-service-input"
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

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          data-testid="drawer-cancel"
          className="px-5 py-3 rounded-xl bg-surface-container-high text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
        >
          {t("specialRequests.drawer.buttons.cancel")}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          data-testid="drawer-save"
          className="px-5 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white text-sm font-bold shadow-ambient hover:shadow-lg transition-shadow disabled:opacity-50"
        >
          {t("specialRequests.drawer.buttons.save")}
        </button>
      </div>
    </form>
  );
};
