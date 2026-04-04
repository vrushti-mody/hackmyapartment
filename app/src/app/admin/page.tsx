"use client";

import { useState, useEffect } from "react";
import { PasswordGate } from "@/components/password-gate";
import { getEpisodes, deleteEpisode } from "@/lib/store-service";
import { Episode } from "@/lib/types";

function AdminDashboard() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const eps = await getEpisodes();
    setEpisodes(eps);
    setLoaded(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to permanently delete this bundle?")) return;
    setIsDeleting(id);
    try {
      await deleteEpisode(id);
      await fetchData(); // Refresh
    } catch (err) {
      alert("Failed to delete bundle.");
    } finally {
      setIsDeleting(null);
    }
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-sm text-zinc-400 animate-pulse">Loading bundles…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/shop" className="font-bold text-lg tracking-tight">
            HackMyApartment
          </a>
          <div className="flex items-center gap-4">
            <a href="/shop" className="text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition">Storefront</a>
            <a href="/generator" className="text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition">Studio</a>
            <span className="text-xs bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-semibold shadow-sm">
              Admin Hub
            </span>
            <a
              href="/generator"
              className="ml-2 text-xs font-semibold bg-zinc-900 text-white px-4 py-1.5 rounded-xl transition hover:bg-zinc-800"
            >
              + New Bundle
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-10 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 leading-tight">Bundle Manager</h1>
            <p className="text-sm text-zinc-500 mt-1">Manage, edit, and delete published storefront episodes.</p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                <tr>
                  <th className="px-6 py-4">Reel / Room</th>
                  <th className="px-6 py-4">Theme</th>
                  <th className="px-6 py-4">Stats</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {episodes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-400">
                      No bundles published yet. Run the Generator!
                    </td>
                  </tr>
                ) : (
                  episodes.map((ep) => (
                    <tr key={ep.id} className="hover:bg-zinc-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {ep.roomImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={ep.roomImageUrl} alt={ep.roomType} className="w-10 h-10 rounded-lg object-cover border border-zinc-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-lg">📦</div>
                          )}
                          <div>
                            <p className="font-bold text-zinc-900">{ep.roomType}</p>
                            <p className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 inline-block px-2 py-0.5 rounded-md mt-0.5 uppercase tracking-wide">
                              {ep.reelType || "upgrade"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-zinc-600 font-medium">
                          {ep.theme || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-zinc-900">${ep.rawTotal.toFixed(2)}</p>
                        <p className="text-xs text-zinc-400">{ep.items.length} items</p>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 font-medium">
                        {new Date(ep.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={`/admin/edit?id=${ep.id}`}
                            className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 rounded-lg text-zinc-700 hover:border-zinc-400 transition"
                          >
                            Edit
                          </a>
                          <button
                            onClick={() => handleDelete(ep.id)}
                            disabled={isDeleting === ep.id}
                            className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                          >
                            {isDeleting === ep.id ? "..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <PasswordGate>
      <AdminDashboard />
    </PasswordGate>
  );
}
