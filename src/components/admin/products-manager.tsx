"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Product = { id: string; label: string; amount: number; active: boolean };

const money = (n: number) => n.toLocaleString("en-GH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Super Admin: add, rename, re-price, hide or delete the items students can pay for. */
export function ProductsManager() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [editing, setEditing] = useState<{ id: string; label: string; amount: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await fetch("/api/admin/products").then((r) => r.json());
      if (d.error) setError(d.error); else { setError(""); setProducts(d.products); }
    } catch { setError("Unable to load items"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function call(url: string, init: RequestInit, id: string | null, okMessage: string) {
    setBusyId(id ?? "new"); setError(""); setNotice("");
    try {
      const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d.error || "Something went wrong"); return false; }
      setNotice(okMessage); await load(); return true;
    } catch { setError("Network error. Please try again."); return false; }
    finally { setBusyId(null); }
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    const ok = await call("/api/admin/products", { method: "POST", body: JSON.stringify({ label: newLabel, amount: newAmount }) }, null, `Added “${newLabel.trim()}”.`);
    if (ok) { setNewLabel(""); setNewAmount(""); }
  }
  async function saveEdit() {
    if (!editing) return;
    const ok = await call(`/api/admin/products/${editing.id}`, { method: "PATCH", body: JSON.stringify({ label: editing.label, amount: editing.amount }) }, editing.id, "Item updated. New payments use the new name and price; past receipts are unchanged.");
    if (ok) setEditing(null);
  }
  const toggle = (p: Product) => call(`/api/admin/products/${p.id}`, { method: "PATCH", body: JSON.stringify({ active: !p.active }) }, p.id, p.active ? `“${p.label}” is now hidden from students.` : `“${p.label}” is now on sale.`);
  async function remove(p: Product) {
    if (!window.confirm(`Delete “${p.label}”? Past receipts that include it are not affected. To just stop selling it, use Hide instead.`)) return;
    await call(`/api/admin/products/${p.id}`, { method: "DELETE" }, p.id, `Deleted “${p.label}”.`);
  }

  const canAdd = newLabel.trim().length > 0 && Number(newAmount) > 0 && busyId !== "new";

  return (
    <section className="portal-card-glass max-w-3xl space-y-6 p-6">
      <div>
        <h2 className="text-xl font-semibold text-portal-text">Items &amp; prices</h2>
        <p className="mt-1 text-sm text-portal-muted">These are the items students can choose at checkout. Changes apply immediately to new payments; receipts already issued keep the name and price they were bought at.</p>
      </div>

      {notice && <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
        <label className="block text-sm text-portal-muted">New item name
          <input value={newLabel} maxLength={120} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Measuring wheel" className="portal-input mt-1" />
        </label>
        <label className="block text-sm text-portal-muted">Price (GHS)
          <input value={newAmount} inputMode="decimal" onChange={(e) => setNewAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.00" className="portal-input mt-1" />
        </label>
        <button disabled={!canAdd} className="portal-btn-primary">{busyId === "new" ? "Adding…" : "Add item"}</button>
      </form>

      <div className="divide-y divide-black/10 rounded-lg border border-black/10 bg-white/50">
        {products === null && <p className="p-4 text-sm text-portal-muted">Loading…</p>}
        {products?.length === 0 && <p className="p-4 text-sm text-portal-muted">No items yet. Add your first item above; students will see nothing to buy until you do.</p>}
        {products?.map((p) => {
          const isEditing = editing?.id === p.id;
          return (
            <div key={p.id} className="flex flex-wrap items-center gap-3 p-3">
              {isEditing ? (
                <>
                  <input aria-label="Item name" value={editing.label} maxLength={120} onChange={(e) => setEditing({ ...editing, label: e.target.value })} className="portal-input min-w-[10rem] flex-1" />
                  <input aria-label="Price in GHS" value={editing.amount} inputMode="decimal" onChange={(e) => setEditing({ ...editing, amount: e.target.value.replace(/[^0-9.]/g, "") })} className="portal-input w-28" />
                  <button type="button" disabled={busyId === p.id || !editing.label.trim() || !(Number(editing.amount) > 0)} onClick={saveEdit} className="portal-btn-primary !px-3 !py-1.5 text-sm">Save</button>
                  <button type="button" onClick={() => setEditing(null)} className="portal-btn-ghost !px-3 !py-1.5 text-sm">Cancel</button>
                </>
              ) : (
                <>
                  <div className="min-w-[10rem] flex-1">
                    <p className={`text-sm font-medium ${p.active ? "text-portal-text" : "text-portal-muted line-through"}`}>{p.label}</p>
                    {!p.active && <p className="text-xs text-amber-700">Hidden from students</p>}
                  </div>
                  <strong className="w-28 text-sm text-portal-accent">GHS {money(p.amount)}</strong>
                  <button type="button" onClick={() => setEditing({ id: p.id, label: p.label, amount: String(p.amount) })} className="portal-btn-ghost !px-3 !py-1.5 text-sm">Edit</button>
                  <button type="button" disabled={busyId === p.id} onClick={() => toggle(p)} className="portal-btn-ghost !px-3 !py-1.5 text-sm">{p.active ? "Hide" : "Show"}</button>
                  <button type="button" disabled={busyId === p.id} onClick={() => remove(p)} className="portal-btn-ghost !px-3 !py-1.5 text-sm !text-red-600">Delete</button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
