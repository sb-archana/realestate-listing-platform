"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api";
import { resolveImageUrl } from "@/lib/format";
import { LISTING_TYPE_LABELS, PROPERTY_TYPE_LABELS, type Property } from "@/lib/types";
import { ImageUploader } from "./ImageUploader";

interface Props {
  mode: "create" | "edit";
  initial?: Property;
}

interface FormState {
  title: string;
  description: string;
  propertyType: string;
  listingType: string;
  price: string;
  areaSqft: string;
  bedrooms: string;
  bathrooms: string;
  city: string;
  locality: string;
  state: string;
  pincode: string;
  address: string;
}

function toFormState(p?: Property): FormState {
  return {
    title: p?.title ?? "",
    description: p?.description ?? "",
    propertyType: p?.propertyType ?? "APARTMENT",
    listingType: p?.listingType ?? "SALE",
    price: p?.price ?? "",
    areaSqft: p ? String(p.areaSqft) : "",
    bedrooms: p?.bedrooms != null ? String(p.bedrooms) : "",
    bathrooms: p?.bathrooms != null ? String(p.bathrooms) : "",
    city: p?.city ?? "",
    locality: p?.locality ?? "",
    state: p?.state ?? "",
    pincode: p?.pincode ?? "",
    address: p?.address ?? "",
  };
}

export function PropertyForm({ mode, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toFormState(initial));
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const remainingExistingImages = (initial?.images ?? []).filter((img) => !removedImageIds.includes(img.id));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("propertyType", form.propertyType);
    fd.append("listingType", form.listingType);
    fd.append("price", form.price);
    fd.append("areaSqft", form.areaSqft);
    if (form.bedrooms) fd.append("bedrooms", form.bedrooms);
    if (form.bathrooms) fd.append("bathrooms", form.bathrooms);
    fd.append("city", form.city);
    fd.append("locality", form.locality);
    fd.append("state", form.state);
    fd.append("pincode", form.pincode);
    fd.append("address", form.address);
    newFiles.forEach((file) => fd.append("images", file));
    removedImageIds.forEach((id) => fd.append("removeImageIds", id));

    try {
      if (mode === "create") {
        const { data } = await apiClient.post<{ data: Property }>("/api/properties", fd);
        router.push(`/properties/${data.id}`);
      } else if (initial) {
        const { data } = await apiClient.put<{ data: Property }>(`/api/properties/${initial.id}`, fd);
        router.push(`/properties/${data.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="Title">
        <input required value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
      </Field>

      <Field label="Description">
        <textarea
          required
          rows={5}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Property Type">
          <select value={form.propertyType} onChange={(e) => set("propertyType", e.target.value)} className={inputClass}>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Listing Type">
          <select value={form.listingType} onChange={(e) => set("listingType", e.target.value)} className={inputClass}>
            {Object.entries(LISTING_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Price (₹)">
          <input required type="number" min={1} value={form.price} onChange={(e) => set("price", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Area (sqft)">
          <input required type="number" min={1} value={form.areaSqft} onChange={(e) => set("areaSqft", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Bedrooms">
          <input type="number" min={0} value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Bathrooms">
          <input type="number" min={0} value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Pincode">
          <input required value={form.pincode} onChange={(e) => set("pincode", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="City">
          <input required value={form.city} onChange={(e) => set("city", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Locality">
          <input required value={form.locality} onChange={(e) => set("locality", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <Field label="State">
        <input required value={form.state} onChange={(e) => set("state", e.target.value)} className={inputClass} />
      </Field>

      <Field label="Full Address">
        <input required value={form.address} onChange={(e) => set("address", e.target.value)} className={inputClass} />
      </Field>

      {remainingExistingImages.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-slate-600">Current photos</label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {remainingExistingImages.map((img) => (
              <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element -- cross-origin uploads host, next/image config not needed for a simple thumbnail */}
                <img src={resolveImageUrl(img.url)} alt="Existing" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setRemovedImageIds((ids) => [...ids, img.id])}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <ImageUploader files={newFiles} onChange={setNewFiles} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {submitting ? "Saving…" : mode === "create" ? "Publish listing" : "Save changes"}
      </button>
    </form>
  );
}

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
