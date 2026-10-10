"use client";

import { useId, useState } from "react";
import { CITIES } from "@/lib/catalog";
import { SERVICE_TYPES, type Dict, type FieldError, type ServiceType } from "@/lib/i18n";
import {
  isoDate,
  MAX_NAME,
  MAX_NOTES,
  validateRequest,
  type FieldErrors,
  type RequestField,
  type RequestInput,
} from "@/lib/request-validate";
import type { CitySlug, ErrorEnvelope, PlaceCard } from "@/lib/types";

export interface FormPrefill {
  kind: "venue" | "hotel";
  place: PlaceCard | null; // venue requests
  serviceType: ServiceType | null;
  city: CitySlug | null;
  date: string | null;
  time: string | null;
  partySize: number | null;
}

interface Props {
  t: Dict;
  prefill: FormPrefill;
  onLogged: (id: number, what: string) => void;
  onCancel: () => void;
}

const inputClass =
  "h-11 w-full rounded-md border border-line bg-paper px-3 text-base text-ink outline-none transition-colors focus:border-ink aria-[invalid=true]:border-danger";

export default function RequestForm({ t, prefill, onLogged, onCancel }: Props) {
  const f = t.form;
  const uid = useId();
  const isVenue = prefill.kind === "venue";
  const [service, setService] = useState<ServiceType | "">(prefill.serviceType ?? "");
  const [city, setCity] = useState<CitySlug | "">(prefill.city ?? "");
  const [date, setDate] = useState(prefill.date ?? "");
  const [time, setTime] = useState(prefill.time ?? "");
  const [party, setParty] = useState(String(prefill.partySize ?? 2));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);

  const id = (field: string) => `${uid}-${field}`;

  function field(key: RequestField, label: string, control: React.ReactNode, optional = false) {
    const error: FieldError | undefined = errors[key];
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id(key)} className="text-sm font-medium text-ink">
          {label}
          {optional && <span className="ms-1 font-normal text-muted">({f.optional})</span>}
        </label>
        {control}
        {error && (
          <p id={id(`${key}-error`)} className="text-sm text-danger">
            {f.fieldErrors[error]}
          </p>
        )}
      </div>
    );
  }

  function aria(key: RequestField) {
    return {
      id: id(key),
      "aria-invalid": errors[key] ? true : undefined,
      "aria-describedby": errors[key] ? id(`${key}-error`) : undefined,
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    const input: RequestInput = {
      requestType: isVenue ? "venue" : "hotel_service",
      placeId: isVenue ? (prefill.place?.id ?? null) : null,
      serviceType: isVenue ? null : service || null,
      city: isVenue ? null : city || null,
      date,
      time,
      partySize: Number(party),
      name,
      email,
      notes,
    };
    const found = validateRequest(input, isoDate(0));
    setErrors(found);
    setFailed(false);
    if (Object.keys(found).length > 0) {
      document.getElementById(id(Object.keys(found)[0]))?.focus();
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        const body = (await res.json()) as { id: number };
        onLogged(body.id, isVenue ? (prefill.place?.name ?? "") : f.services[input.serviceType as ServiceType]);
        return;
      }
      const body = (await res.json().catch(() => null)) as ErrorEnvelope | null;
      if (body?.error.fields) setErrors(body.error.fields as FieldErrors);
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-4"
      aria-label={isVenue ? f.typeVenue : f.typeHotel}
    >
      <div className="flex flex-col gap-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{f.typeLabel}</p>
        <p className="text-[15px] font-bold text-ink">{isVenue ? f.typeVenue : f.typeHotel}</p>
      </div>

      {isVenue ? (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-ink">{f.place}</p>
          <p className="rounded-md bg-mist px-3 py-2.5 text-base text-ink">
            {prefill.place?.countryFlag} {prefill.place?.name} · {prefill.place?.cityName}
          </p>
        </div>
      ) : (
        <>
          {field(
            "service",
            f.service,
            <select
              {...aria("service")}
              value={service}
              onChange={(e) => setService(e.target.value as ServiceType | "")}
              className={inputClass}
            >
              <option value="">{f.pickService}</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {f.services[s]}
                </option>
              ))}
            </select>,
          )}
          {field(
            "city",
            f.city,
            <select
              {...aria("city")}
              value={city}
              onChange={(e) => setCity(e.target.value as CitySlug | "")}
              className={inputClass}
            >
              <option value="">{f.pickCity}</option>
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>,
          )}
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        {field(
          "date",
          f.date,
          <input
            {...aria("date")}
            type="date"
            min={isoDate(0)}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />,
        )}
        {field(
          "time",
          f.time,
          <input
            {...aria("time")}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          />,
        )}
      </div>

      {field(
        "partySize",
        f.partySize,
        <input
          {...aria("partySize")}
          type="number"
          inputMode="numeric"
          min={1}
          max={20}
          value={party}
          onChange={(e) => setParty(e.target.value)}
          className={inputClass}
        />,
      )}
      {field(
        "name",
        f.name,
        <input
          {...aria("name")}
          type="text"
          autoComplete="name"
          maxLength={MAX_NAME + 20}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />,
      )}
      {field(
        "email",
        f.email,
        <input
          {...aria("email")}
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />,
      )}
      {field(
        "notes",
        f.notes,
        <textarea
          {...aria("notes")}
          rows={3}
          maxLength={MAX_NOTES + 100}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={`${inputClass} h-auto py-2.5`}
        />,
        true,
      )}

      <p className="rounded-md bg-mist px-3 py-2 text-sm leading-5 text-ink-soft">{f.notice}</p>

      {failed && (
        <p className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger" role="alert">
          {f.submitFailed}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={sending}
          className="flex h-11 flex-1 items-center justify-center rounded-md bg-ink font-mono text-xs uppercase tracking-[0.08em] text-paper transition-colors hover:bg-ink-soft disabled:opacity-60"
        >
          {sending ? f.submitting : f.submit}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={sending}
          className="h-11 rounded-md border border-line px-4 text-sm font-medium text-ink hover:border-ink disabled:opacity-60"
        >
          {f.cancel}
        </button>
      </div>
    </form>
  );
}
