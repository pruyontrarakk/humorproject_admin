"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ImageRow = {
  id: string;
  url?: string | null;
  created_datetime_utc?: string | null;
  [key: string]: unknown;
};

type Mode = "idle" | "create" | "edit";

const PAGE_SIZE = 50;
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic"
];
const ACCEPT_STRING = ACCEPTED_TYPES.join(",");

const IMAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BUCKET || "images";

export function ImagesPanel() {
  const [rows, setRows] = useState<ImageRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [selected, setSelected] = useState<ImageRow | null>(null);
  const [jsonText, setJsonText] = useState("{\n  \n}");
  const [mutating, setMutating] = useState(false);
  const [mutateError, setMutateError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function resetCreateForm() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setJsonText("{\n  \"url\": \"https://…\",\n  \"user_id\": \"…\"\n}");
  }

  async function load() {
    setLoading(true);
    setError(null);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const [countRes, dataRes] = await Promise.all([
      supabase.from("images").select("*", { count: "exact", head: true }),
      supabase
        .from("images")
        .select("*")
        .order("created_datetime_utc", { ascending: false })
        .range(from, to)
    ]);

    if (countRes.error) {
      setError(countRes.error.message);
      setRows([]);
      setTotalCount(0);
    } else if (dataRes.error) {
      setError(dataRes.error.message);
      setRows([]);
      setTotalCount(countRes.count ?? 0);
    } else {
      setRows((dataRes.data as ImageRow[]) ?? []);
      setTotalCount(countRes.count ?? 0);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [page]);

  function openCreate() {
    setMode("create");
    setSelected(null);
    setMutateError(null);
    resetCreateForm();
  }

  function openEdit(row: ImageRow) {
    setMode("edit");
    setSelected(row);
    setMutateError(null);
    setJsonText(JSON.stringify(row, null, 2));
  }

  function closeForm() {
    setMode("idle");
    setSelected(null);
    setMutateError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
  }

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Unsupported format. Use JPEG, PNG, WebP, GIF, or HEIC.";
    }
    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large. Max size: ${maxSizeMB}MB.`;
    }
    return null;
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);

    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setMutateError(validationError);
      return;
    }

    setMutateError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSave() {
    setMutating(true);
    setMutateError(null);
    try {
      if (mode === "create") {
        if (!selectedFile) {
          setMutateError("Please choose an image file to upload.");
          return;
        }

        const {
          data: { user },
          error: userError
        } = await supabase.auth.getUser();

        if (userError) {
          setMutateError(userError.message);
          return;
        }
        if (!user) {
          setMutateError("You must be signed in to upload images.");
          return;
        }

        const filePath = `${Date.now()}-${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from(IMAGE_BUCKET)
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: selectedFile.type
          });

        if (uploadError) {
          setMutateError(uploadError.message);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from(IMAGE_BUCKET)
          .getPublicUrl(filePath);

        const payload: Record<string, unknown> = {
          url: publicUrlData.publicUrl,
          user_id: user.id
        };

        const { error } = await supabase.from("images").insert([payload]);
        if (error) {
          setMutateError(error.message);
          return;
        }

        closeForm();
        await load();
      } else if (mode === "edit" && selected) {
        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(jsonText);
        } catch {
          setMutateError("Invalid JSON. Please fix the syntax and try again.");
          return;
        }

      const { error } = await supabase.from("images").update(payload).eq("id", selected.id);
      if (error) {
        setMutateError(error.message);
      } else {
        closeForm();
        await load();
      }
      }
    } finally {
      setMutating(false);
    }
  }

  async function handleDelete(row: ImageRow) {
    if (!row.id) return;
    const confirmed = window.confirm("Delete this image row? This cannot be undone.");
    if (!confirmed) return;

    setMutating(true);
    setMutateError(null);

    const { error } = await supabase.from("images").delete().eq("id", row.id);
    if (error) {
      setMutateError(error.message);
    } else if (selected && selected.id === row.id) {
      closeForm();
      await load();
    } else {
      await load();
    }

    setMutating(false);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Images
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-xs" onClick={() => load()} disabled={loading}>
            Refresh
          </button>
          <button className="btn-primary text-xs" onClick={openCreate}>
            New image row
          </button>
        </div>
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p className="font-medium">Unable to load images.</p>
          <p className="mt-1 text-xs text-red-700/90">{error}</p>
        </div>
      )}

      <div className={mode === "idle" ? "" : "grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]"}>
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-700">
            <span>
              Showing {(totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1)}–
              {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} images
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={loading || page <= 1}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
              >
                Previous
              </button>
              <span className="text-slate-500">
                Page {page} of {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
              </span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(Math.ceil(totalCount / PAGE_SIZE), p + 1))}
                disabled={loading || page >= Math.ceil(totalCount / PAGE_SIZE)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
              >
                Next
              </button>
            </div>
          </div>
          <div className="max-h-[360px] overflow-auto text-xs">
            <table className="min-w-full border-separate border-spacing-y-1 px-2">
              <thead className="sticky top-0 z-10 bg-white backdrop-blur">
                <tr className="text-[0.7rem] uppercase tracking-[0.16em] text-brand-700">
                  <th className="px-3 py-2 text-left">Image</th>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-slate-500/80"
                      colSpan={4}
                    >
                      Loading image rows…
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-slate-500/80"
                      colSpan={4}
                    >
                      No image rows found yet.
                    </td>
                  </tr>
                )}
                {!loading &&
                  rows.map(row => (
                    <tr key={row.id} className="transition hover:bg-brand-50">
                      <td className="max-w-[320px] px-3 py-2 align-top">
                        <ImagePreview row={row} />
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {row.created_datetime_utc
                          ? new Date(row.created_datetime_utc).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {row.id ? (
                          <code className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[0.7rem]">
                            {row.id}
                          </code>
                        ) : (
                          <span className="text-slate-500/80">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right align-top">
                        <div className="flex justify-end gap-2">
                          <button
                            className="btn-ghost px-2 py-1 text-[0.7rem]"
                            onClick={() => openEdit(row)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-ghost px-2 py-1 text-[0.7rem] text-red-300 hover:border-red-500/60 hover:bg-red-950/50"
                            onClick={() => handleDelete(row)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {mode !== "idle" && (
          <div className="card flex min-h-[260px] flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <div className="flex flex-col text-xs">
                <span className="font-semibold text-slate-900">
                  {mode === "create"
                    ? "Upload new image"
                    : "Edit selected row"}
                </span>
                <span className="text-slate-600">
                  {mode === "create"
                    ? "Upload a file to Supabase Storage; a row will be created in the images table."
                    : "You can work with arbitrary columns by editing raw JSON."}
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 px-4 py-3 text-xs">
              {mode === "create" ? (
                <>
                  <div className="space-y-2">
                    <label className="block text-[0.7rem] font-medium text-slate-700">
                      Image file
                    </label>
                    <input
                      type="file"
                      accept={ACCEPT_STRING}
                      className="block w-full text-xs file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-50"
                      onChange={handleFileChange}
                    />
                    {previewUrl && (
                      <div className="mt-2 flex items-center gap-3">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="h-24 w-40 rounded-xl border border-slate-200 bg-slate-100 object-cover"
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <textarea
                  className="input min-h-[200px] flex-1 font-mono text-[0.75rem]"
                  value={jsonText}
                  onChange={e => setJsonText(e.target.value)}
                  spellCheck={false}
                />
              )}

              {mutateError && (
                <p className="text-[0.7rem] text-red-700/90">{mutateError}</p>
              )}
              <div className="mt-1 flex justify-end gap-2">
                <button
                  className="btn-ghost text-xs"
                  onClick={closeForm}
                  disabled={mutating}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary text-xs"
                  onClick={handleSave}
                  disabled={mutating}
                >
                  {mutating
                    ? "Saving…"
                    : mode === "create"
                    ? "Upload & create row"
                    : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ImagePreview({ row }: { row: ImageRow }) {
  const anyRow = row as Record<string, unknown>;
  const url =
    (anyRow.url as string | undefined) ??
    (anyRow.image_url as string | undefined) ??
    (anyRow.public_url as string | undefined) ??
    (anyRow.src as string | undefined);

  if (!url) {
    return <span className="text-slate-500/80">No image URL</span>;
  }

  return (
    <div className="flex items-center gap-3">
      <img
        src={url}
        alt="Image"
        className="h-24 w-40 rounded-xl border border-slate-200 bg-slate-100 object-cover"
      />
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-[0.7rem] font-medium text-sky-700 hover:text-sky-900"
      >
        Open
      </a>
    </div>
  );
}

