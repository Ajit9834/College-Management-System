"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { ErrorText } from "@/components/ui";

/**
 * Approve / reject controls for a college registration request.
 *
 * Both decisions post to the platform-admin-only approval endpoint; the client
 * never decides the resulting status itself. Rejection requires a reason, which
 * the API records on the audit entry for the college.
 */
export function CollegeApprovalActions({
  collegeId,
  collegeName,
  compact = false,
}: {
  collegeId: string;
  collegeName: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function decide(decision: "approve" | "reject") {
    setError("");
    setSuccess("");
    if (decision === "reject" && !note.trim()) {
      setError("Add a short reason for the rejection.");
      return;
    }
    const confirmText =
      decision === "approve"
        ? `Approve ${collegeName}? Its account will be able to sign in to the college portal.`
        : `Reject ${collegeName}? It will stay locked out of the college portal.`;
    if (!window.confirm(confirmText)) return;

    setBusy(decision);
    const res = await fetch(`/api/v1/admin/colleges/${collegeId}/approval`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note: note.trim() || null }),
    });
    const json = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok) {
      setError(json?.error?.message ?? "Could not save the decision. Please try again.");
      return;
    }
    setSuccess(decision === "approve" ? "College approved." : "Application rejected.");
    setNote("");
    router.refresh();
  }

  return (
    <div className={compact ? "w-full space-y-2" : "w-full space-y-2 lg:w-72"}>
      {!compact ? (
        <textarea
          className="input min-h-16 text-sm"
          placeholder="Reviewer note or rejection reason"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={busy !== null}
        />
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-primary flex-1"
          onClick={() => decide("approve")}
          disabled={busy !== null}
        >
          <Check className="h-4 w-4" />
          {busy === "approve" ? "Approving…" : "Approve"}
        </button>
        <button
          type="button"
          className="btn btn-ghost flex-1 text-rose-700"
          onClick={() => decide("reject")}
          disabled={busy !== null}
        >
          <X className="h-4 w-4" />
          {busy === "reject" ? "Rejecting…" : "Reject"}
        </button>
      </div>
      <ErrorText>{error}</ErrorText>
      {success ? <p className="text-xs font-medium text-emerald-700">{success}</p> : null}
    </div>
  );
}
