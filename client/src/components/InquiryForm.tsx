"use client";

import { useState, type FormEvent } from "react";
import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api";

export function InquiryForm({ propertyId }: { propertyId: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      await apiClient.post(
        "/api/inquiries",
        {
          propertyId,
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          message: form.message,
          website: form.website || undefined,
        },
        { auth: false }
      );
      setStatus("success");
      setForm({ name: "", email: "", phone: "", message: "", website: "" });
    } catch (err) {
      setStatus("error");
      if (err instanceof ApiError) {
        setError(err.code === "DUPLICATE_INQUIRY" ? "You already sent an inquiry for this property recently." : err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
        Thanks! Your message has been sent to the owner.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-800">Contact owner</h3>

      {/* Honeypot: hidden from real users via CSS, bots typically fill every field they see in the DOM */}
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <input
        required
        placeholder="Your name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        required
        type="email"
        placeholder="Your email"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        placeholder="Phone (optional)"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <textarea
        required
        placeholder="I'm interested in this property..."
        value={form.message}
        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
        rows={3}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {status === "submitting" ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
