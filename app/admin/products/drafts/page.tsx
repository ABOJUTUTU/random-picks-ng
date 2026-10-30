"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DRAFT_CATEGORIES, DRAFTS_PER_CATEGORY } from "@/lib/draft-categories";
import { draftReadiness, formatDraftPrice, type DraftProduct } from "@/lib/product-drafts";
import { draftCsv, parseDraftCsv } from "@/lib/draft-csv";

type Summary = { category: string; total_count: number; draft_count: number; ready_count: number; published_count: number; rejected_count: number };
const PAGE_SIZE = 50;
const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";
const action = "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold transition hover:border-orange-400 disabled:cursor-not-allowed disabled:opacity-40";

export default function ProductDraftsPage() {
  const router = useRouter();
  const [access, setAccess] = useState<"loading" | "allowed" | "denied" | "setup">("loading");
  const [rows, setRows] = useState<DraftProduct[]>([]);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("draft");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [edit, setEdit] = useState<DraftProduct | null>(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const stop = useRef(false);
  const upload = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const loadVersion = useRef(0);
  const ready = summary.filter((s) => !category || s.category === category).reduce((n, s) => n + Number(s.ready_count), 0);
  const drafts = summary.reduce((n, s) => n + Number(s.draft_count), 0);
  const published = summary.reduce((n, s) => n + Number(s.published_count), 0);

  useEffect(() => {
    let active = true;
    async function authorize() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/admin/login"); return; }
      const { data, error } = await supabase.rpc("catalog_is_admin");
      if (active) setAccess(error ? "setup" : data === true ? "allowed" : "denied");
    }
    void authorize().catch(() => { if (active) setAccess("setup"); });
    return () => { active = false; };
  }, [router]);

  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true); setError("");
    try {
      let request = supabase.from("product_drafts").select("*", { count: "exact" }).order("created_at", { ascending: false }).order("id");
      if (category) request = request.eq("category", category);
      if (status !== "all") request = request.eq("status", status);
      if (search.trim()) request = request.ilike("name", `%${search.trim().replace(/[\\%_]/g, "\\$&")}%`);
      const [products, counts] = await Promise.all([
        request.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1), supabase.rpc("catalog_draft_summary"),
      ]);
      if (products.error || counts.error) throw new Error("Could not load drafts. Please try again.");
      if (version !== loadVersion.current) return;
      setRows(products.data ?? []); setTotal(products.count ?? 0);
      if (page > Math.max(1, Math.ceil((products.count ?? 0) / PAGE_SIZE))) setPage(Math.max(1, Math.ceil((products.count ?? 0) / PAGE_SIZE)));
      setSummary(Array.isArray(counts.data) ? counts.data : []); setSelected(new Set());
    } catch (e) { if (version === loadVersion.current) setError(e instanceof Error ? e.message : "Could not load drafts."); }
    finally { if (version === loadVersion.current) setLoading(false); }
  }, [category, status, search, page]);
  useEffect(() => { if (access === "allowed") void load(); }, [access, load]);
  useEffect(() => {
    if (!edit) return;
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const controls = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handleKey); if (previous instanceof HTMLElement) previous.focus(); };
  }, [edit]);

  async function task(label: string, run: () => Promise<void>) {
    setBusy(label); setError(""); setNotice(""); stop.current = false;
    try { await run(); await load(); }
    catch (e) { await load(); setError(e instanceof Error ? e.message : "The operation failed. Please try again."); }
    finally { setBusy(""); }
  }
  function toggle(id: string) { setSelected((previous) => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }

  async function generate() {
    await task("Creating drafts…", async () => {
      const { data, error } = await supabase.rpc("catalog_generate_drafts", { categories: DRAFT_CATEGORIES, per_category: DRAFTS_PER_CATEGORY });
      if (error) throw new Error("Could not create the drafts. Please check database setup and try again.");
      setNotice(`${Number(data?.inserted_count ?? 0).toLocaleString()} drafts created. Existing drafts were preserved.`);
      setGeneratorOpen(false);
    });
  }
  async function approve(all: boolean) {
    const ids = rows.filter((row) => selected.has(row.id) && draftReadiness(row).length === 0).map((row) => row.id);
    const count = all ? ready : ids.length;
    if (!count) { setError("Complete and verify the product details before approving drafts."); return; }
    const scope = all ? `all ${count.toLocaleString()} valid drafts in ${category || "all categories"}` : `${count} selected valid draft${count === 1 ? "" : "s"}`;
    if (!window.confirm(`Publish ${scope}? Approved products will become visible and orderable in your store. Check that their selling prices, stock and images are correct.`)) return;
    await task("Publishing approved drafts…", async () => {
      let done = 0;
      const maxBatches = all ? Math.ceil(count / 100) + 1 : 1;
      for (let batch = 0; batch < maxBatches && !stop.current; batch++) {
        const { data, error } = await supabase.rpc("catalog_approve_drafts", { ids: all ? null : ids, category_filter: category || null });
        if (error) throw new Error(`Publishing paused after ${done.toLocaleString()} products. Refresh to see the current status; retrying will not create duplicates.`);
        const added = Number(data?.published_count ?? 0);
        done += added;
        setBusy(`Published ${done.toLocaleString()} of ${count.toLocaleString()}…`);
        if (!added || done >= count) break;
      }
      setNotice(`${done.toLocaleString()} products published.${stop.current ? " Stopped after the current batch." : ""}`);
    });
  }
  async function reject() {
    const ids = rows.filter((r) => selected.has(r.id) && r.status !== "published").map((r) => r.id);
    if (!ids.length) return;
    await task("Rejecting drafts…", async () => {
      const { data, error } = await supabase.rpc("catalog_reject_drafts", { ids });
      if (error) throw new Error("Could not reject those drafts.");
      setNotice(`${Number(data?.rejected_count ?? 0)} drafts rejected.`);
    });
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!edit) return;
    const form = new FormData(event.currentTarget);
    const number = (key: string) => String(form.get(key) ?? "").trim() === "" ? null : Number(form.get(key));
    const list = (key: string) => String(form.get(key) ?? "").split(/\n|\|/).map((s) => s.trim()).filter(Boolean);
    const update = { sku: edit.sku, name: String(form.get("name") ?? "").trim(), description: String(form.get("description") ?? "").trim(), price: number("price"), stock: number("stock"), colors: list("colors"), types: list("types"), images: list("images"), verified: form.get("verified") === "on" };
    await task("Saving product details…", async () => {
      const { error } = await supabase.rpc("catalog_update_drafts", { rows: [update] });
      if (error) throw new Error("Could not save this draft. Check the price, whole stock quantity and HTTPS image links.");
      setEdit(null); setNotice("Draft saved.");
    });
  }
  async function exportRows() {
    await task("Preparing CSV…", async () => {
      const records: DraftProduct[] = [];
      for (let offset = 0; offset < 100_000 && !stop.current; offset += 500) {
        let request = supabase.from("product_drafts").select("*").order("sku");
        if (category) request = request.eq("category", category);
        if (status !== "all") request = request.eq("status", status);
        if (search.trim()) request = request.ilike("name", `%${search.trim().replace(/[\\%_]/g, "\\$&")}%`);
        const { data, error } = await request.range(offset, offset + 499);
        if (error) throw new Error("Could not export drafts. Please try again.");
        records.push(...(data ?? []));
        setBusy(`Preparing ${records.length.toLocaleString()} rows…`);
        if (!data || data.length < 500) break;
      }
      if (stop.current) { setNotice("Export stopped."); return; }
      const url = URL.createObjectURL(new Blob([draftCsv(records)], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a"); a.href = url; a.download = "random-picks-product-drafts.csv"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(`${records.length.toLocaleString()} rows exported. Keep each SKU unchanged; fill real details and set verified to true after review.`);
    });
  }
  async function importRows(file: File) {
    await task("Reading CSV…", async () => {
      if (file.size > 15 * 1024 * 1024) throw new Error("Choose a CSV smaller than 15 MB. Split a larger catalog into files.");
      const updates = parseDraftCsv(await file.text());
      let done = 0;
      for (let offset = 0; offset < updates.length && !stop.current; offset += 100) {
        const { data, error } = await supabase.rpc("catalog_update_drafts", { rows: updates.slice(offset, offset + 100) });
        if (error) throw new Error(`Import paused after ${done.toLocaleString()} updates. Check this batch and retry; published products cannot be overwritten by draft import.`);
        done += Number(data?.updated_count ?? 0); setBusy(`Updated ${done.toLocaleString()} drafts…`);
      }
      setNotice(`${done.toLocaleString()} drafts updated.${stop.current ? " Stopped after the current batch." : " Review the valid drafts before publishing."}`);
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#071a3d]">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5"><Link href="/admin" className="text-lg font-extrabold">Random Picks NG <span className="ml-2 text-xs font-medium text-slate-500">Admin</span></Link><Link href="/admin/products" className={action}>← Products</Link></div></header>
      <div className="mx-auto max-w-7xl px-5 py-8">
        <p className="mb-2 text-xs font-bold tracking-[.18em] text-orange-600">CATALOG REVIEW</p>
        <h1 className="text-3xl font-extrabold">Product drafts</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Review product details, then publish in bulk. Generated drafts are planning placeholders. Add actual selling prices, available stock and product images, and mark each completed listing as verified.</p>
        {access === "loading" && <p className="mt-8" role="status">Checking access…</p>}
        {(access === "setup" || access === "denied") && <section className="mt-8 rounded-2xl border border-orange-200 bg-orange-50 p-6"><h2 className="font-bold">{access === "setup" ? "Draft catalog setup is needed" : "Catalog approval access is needed"}</h2><p className="mt-2 text-sm leading-6">The store owner needs to enable the draft database and grant approval access to your admin account. Existing products are available from the Products page.</p></section>}
        {access === "allowed" && <>
          <div className="my-7 grid gap-3 sm:grid-cols-3">{[["Unpublished drafts", drafts], ["Valid in this category", ready], ["Published from drafts", published]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-extrabold">{Number(value).toLocaleString()}</p></div>)}</div>
          {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
          {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
          <div className="mb-5 flex flex-wrap gap-2"><button className={action} onClick={() => setGeneratorOpen(!generatorOpen)} disabled={!!busy}>Create category drafts</button><button className={action} onClick={() => void exportRows()} disabled={!!busy || !total}>Export filtered CSV</button><button className={action} onClick={() => upload.current?.click()} disabled={!!busy}>Import edited CSV</button><input ref={upload} type="file" accept=".csv,text/csv" className="hidden" aria-label="Import edited product CSV" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void importRows(file); }} /></div>
          {generatorOpen && <section className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 p-5"><h2 className="font-bold">Create 30,000 unpublished drafts</h2><p className="mt-2 text-sm leading-6">5,000 each: {DRAFT_CATEGORIES.join(", ")}. Drafts start with no price, stock or image. Running this again preserves existing drafts and edits.</p><button className={`${action} mt-4`} onClick={() => void generate()} disabled={!!busy}>Create missing drafts</button></section>}
          <form className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto]" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(query); }}><label className="text-xs font-semibold">Category<select className={`${field} mt-1`} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} disabled={!!busy}><option value="">All categories</option>{summary.map((s) => <option key={s.category}>{s.category}</option>)}</select></label><label className="text-xs font-semibold">Status<select className={`${field} mt-1`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} disabled={!!busy}>{["draft", "published", "rejected", "all"].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select></label><label className="text-xs font-semibold">Product name<input className={`${field} mt-1`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search drafts" maxLength={120} /></label><button className={`${action} self-end`} disabled={!!busy}>Search</button></form>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><p className="text-sm text-slate-600">{selected.size} selected · {total.toLocaleString()} results</p><div className="flex flex-wrap gap-2"><button className={action} onClick={() => void reject()} disabled={!!busy || loading || !selected.size}>Reject selected</button><button className={action} onClick={() => void approve(false)} disabled={!!busy || loading || !selected.size}>Approve selected</button><button className={`${action} !border-[#071a3d] !bg-[#071a3d] text-white`} onClick={() => void approve(true)} disabled={!!busy || loading || !ready}>Approve all valid drafts ({ready.toLocaleString()})</button></div></div>
            {busy && <div className="flex items-center justify-between gap-3 border-b bg-orange-50 px-4 py-3 text-sm" role="status"><span>{busy}</span><button type="button" className="font-bold underline" onClick={() => { stop.current = true; }}>Stop after this batch</button></div>}
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-4"><input type="checkbox" aria-label="Select this page" checked={rows.length > 0 && rows.every((r) => selected.has(r.id))} disabled={!!busy} onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} /></th><th className="p-4">Product</th><th className="p-4">Price / stock</th><th className="p-4">Review</th><th className="p-4">Action</th></tr></thead><tbody>{rows.map((row) => { const missing = draftReadiness(row); return <tr key={row.id} className="border-t border-slate-100"><td className="p-4"><input type="checkbox" aria-label={`Select ${row.name}`} checked={selected.has(row.id)} onChange={() => toggle(row.id)} disabled={!!busy} /></td><td className="min-w-56 p-4"><p className="font-bold">{row.name}</p><p className="mt-1 text-xs text-slate-500">{row.category} · {row.sku}</p></td><td className="whitespace-nowrap p-4">{formatDraftPrice(row.price)}<p className="mt-1 text-xs text-slate-500">Stock: {row.stock ?? "Not set"}</p></td><td className="min-w-60 p-4">{row.status === "published" ? <span className="font-semibold text-emerald-700">Published</span> : row.status === "rejected" ? <span className="text-slate-500">Rejected</span> : missing.length ? <span className="text-xs leading-5 text-amber-800">{missing.join(" · ")}</span> : <span className="font-semibold text-emerald-700">Ready to approve</span>}</td><td className="p-4">{row.status === "published" && row.product_id ? <Link href={`/product/${row.product_id}`} className="font-semibold underline">View product</Link> : <button className={action} onClick={() => setEdit(row)} disabled={!!busy}>Review</button>}</td></tr>; })}</tbody></table></div>
            {!rows.length && <p className="p-10 text-center text-sm text-slate-500">{loading ? "Loading drafts…" : "No drafts match these filters. Create category drafts to begin."}</p>}
            <div className="flex items-center justify-between border-t p-4 text-sm"><span>Page {page} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span><div className="flex gap-2"><button className={action} disabled={!!busy || page <= 1} onClick={() => setPage(page - 1)}>Previous</button><button className={action} disabled={!!busy || page * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>Next</button></div></div>
          </section>
          <p className="mt-4 text-xs leading-6 text-slate-500">“Approve all” applies to valid drafts across the selected category, including other pages. The name search does not restrict bulk approval. CSV imports update drafts only; they do not publish products. Keep SKUs unchanged.</p>
        </>}
      </div>
      {edit && <div className="fixed inset-0 z-50 overflow-y-auto bg-[#071a3d]/50 p-4"><section ref={dialog} onKeyDown={(event) => { if (event.key === "Escape" && !busy) setEdit(null); }} role="dialog" aria-modal="true" aria-labelledby="review-title" className="mx-auto my-6 max-w-2xl rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between gap-3"><div><h2 id="review-title" className="text-xl font-bold">Review draft</h2><p className="mt-1 text-xs text-slate-500">{edit.sku} · {edit.category}</p></div><button className={action} onClick={() => setEdit(null)} disabled={!!busy}>Close</button></div><form key={edit.id} className="mt-5 grid gap-4" onSubmit={(e) => void save(e)}><label className="text-sm font-semibold">Product name<input name="name" className={`${field} mt-1`} defaultValue={edit.name} maxLength={180} required autoFocus /></label><label className="text-sm font-semibold">Description<textarea name="description" className={`${field} mt-1`} defaultValue={edit.description} maxLength={6000} rows={3} /></label><div className="grid grid-cols-2 gap-4"><label className="text-sm font-semibold">Selling price (₦)<input name="price" type="number" min="0.01" step="0.01" className={`${field} mt-1`} defaultValue={edit.price ?? ""} /></label><label className="text-sm font-semibold">Available stock<input name="stock" type="number" min="0" step="1" className={`${field} mt-1`} defaultValue={edit.stock ?? ""} /></label></div><label className="text-sm font-semibold">Product image links (HTTPS, one per line)<textarea name="images" className={`${field} mt-1`} defaultValue={edit.images.join("\n")} rows={3} /></label><div className="grid grid-cols-2 gap-4"><label className="text-sm font-semibold">Colours (separate with |)<input name="colors" className={`${field} mt-1`} defaultValue={edit.colors.join(" | ")} /></label><label className="text-sm font-semibold">Types / options (separate with |)<input name="types" className={`${field} mt-1`} defaultValue={edit.types.join(" | ")} /></label></div><label className="flex items-start gap-3 rounded-xl bg-orange-50 p-4 text-sm leading-6"><input type="checkbox" name="verified" defaultChecked={edit.verified} className="mt-1" /><span>I checked that this listing describes a real product I can sell, with the correct selling price, stock and images.</span></label><p className="text-xs text-slate-500">Saving keeps this product unpublished. Use an approval action to publish it.</p><button className={`${action} !bg-[#071a3d] text-white`} disabled={!!busy}>Save draft</button></form>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}</section></div>}
    </main>
  );
}
