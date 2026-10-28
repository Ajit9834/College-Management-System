"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ErrorText } from "@/components/ui";

export function JsonForm({
  action,
  method = "POST",
  children,
  onSuccess,
  submitLabel = "Save",
  successMessage,
}: {
  action: string;
  method?: string;
  children: ReactNode;
  onSuccess?: () => void;
  submitLabel?: string;
  successMessage?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOk("");
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    form.forEach((value, key) => {
      if (typeof value === "string") payload[key] = value === "" ? null : value;
    });
    const res = await fetch(action, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error?.message || "Please check the form and try again.");
      return;
    }
    setOk(successMessage || "Saved.");
    onSuccess?.();
    router.refresh();
    (event.target as HTMLFormElement).reset();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {children}
      <ErrorText>{error}</ErrorText>
      {ok ? <p className="text-sm font-medium text-emerald-700">{ok}</p> : null}
      <button className="btn btn-primary" disabled={loading}>
        {loading ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

export function ConfirmButton({
  action,
  method = "POST",
  body,
  label,
  confirmText,
  variant = "secondary",
  redirectTo,
}: {
  action: string;
  method?: string;
  body?: unknown;
  label: string;
  confirmText: string;
  variant?: "secondary" | "danger";
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    await fetch(action, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    if (redirectTo) {
      router.push(redirectTo);
      return;
    }
    router.refresh();
  }

  return (
    <button className={`btn btn-${variant}`} onClick={run} disabled={busy} type="button">
      {busy ? "Working…" : label}
    </button>
  );
}

export function CsvImportForm({
  action,
  label = "Import CSV",
  hint,
  submitLabel = "Import",
}: {
  action: string;
  label?: string;
  hint?: string;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    created: number;
    failed: { row: number; error: string }[];
  } | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    const input = event.currentTarget.elements.namedItem("csv") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      setError("Choose a .csv file to import.");
      return;
    }
    const text = await file.text();
    setBusy(true);
    const res = await fetch(action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: text }),
    });
    const json = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setError(json?.error?.message || "Import failed. Please check the file and try again.");
      return;
    }
    setResult(json.data);
    (event.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="csv">{label}</label>
        <input id="csv" name="csv" type="file" accept=".csv,text/csv" className="input" disabled={busy} />
        {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      </div>
      <ErrorText>{error}</ErrorText>
      {result ? (
        <div className="text-sm">
          <p className="font-medium text-emerald-700">{result.created} student(s) imported.</p>
          {result.failed.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-rose-700">
              {result.failed.map((item) => (
                <li key={item.row}>
                  Row {item.row}: {item.error}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <button className="btn btn-primary" disabled={busy}>
        {busy ? "Importing…" : submitLabel}
      </button>
    </form>
  );
}

export function UploadField({
  name,
  label = "Attachment",
  accept,
  defaultValue,
  defaultFileName,
  hint,
}: {
  name: string;
  label?: string;
  accept?: string;
  defaultValue?: string;
  defaultFileName?: string | null;
  hint?: string;
}) {
  const [current, setCurrent] = useState<{ id: string; fileName: string } | null>(
    defaultValue && defaultFileName ? { id: defaultValue, fileName: defaultFileName } : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/v1/college/uploads", { method: "POST", body });
    const json = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setError(json?.error?.message || "Upload failed. Please try again.");
      return;
    }
    setCurrent({ id: json.data.id, fileName: json.data.fileName });
  }

  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input
        id={name}
        type="file"
        accept={accept}
        onChange={onChange}
        className="input"
        disabled={busy}
      />
      <input type="hidden" name={name} value={current?.id ?? ""} />
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      {busy ? <p className="mt-1 text-sm text-slate-500">Uploading…</p> : null}
      {current ? (
        <p className="mt-1 flex items-center gap-2 text-sm text-emerald-700">
          <a
            href={`/api/v1/uploads/${current.id}`}
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            {current.fileName}
          </a>
          <button
            type="button"
            className="text-xs text-rose-600 underline"
            onClick={() => setCurrent(null)}
          >
            Remove
          </button>
        </p>
      ) : null}
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
