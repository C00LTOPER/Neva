"use client";
import { useEffect, useState } from "react";
import { Search, Trash2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminChannels() {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const PAGE = 20;

  const load = async (q: string, p: number) => {
    setLoading(true);
    let query = supabase.from("channels").select("*, profiles!channels_owner_id_fkey(full_name, username)", { count: "exact" }).is("deleted_at", null).range(p * PAGE, p * PAGE + PAGE - 1).order("created_at", { ascending: false });
    if (q) query = query.ilike("name", `%${q}%`);
    const { data, count } = await query;
    setChannels(data || []); setTotal(count || 0); setLoading(false);
  };

  useEffect(() => { load(search, page); }, [page]);

  const deleteChannel = async (id: string) => {
    if (!confirm("Удалить канал?")) return;
    await supabase.from("channels").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    setChannels(prev => prev.filter(c => c.id !== id));
    setTotal(t => t - 1);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold">Каналы</h1>
        <p className="text-white/40 text-sm mt-1">Всего: {total}</p>
      </div>
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && (setPage(0), load(search, 0))}
            placeholder="Поиск по названию..." className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-white text-sm placeholder-white/25 focus:outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }} />
        </div>
        <button onClick={() => { setPage(0); load(search, 0); }} className="px-5 py-2.5 rounded-2xl text-white text-sm" style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>Найти</button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Канал", "Владелец", "@username", "Дата", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-white/40 text-xs font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={5} className="py-12 text-center"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              : channels.map(ch => (
                <tr key={ch.id} className="hover:bg-white/[0.02] transition" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                        {ch.avatar_url ? <img src={ch.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-xs font-bold">{ch.name?.[0] || "?"}</span>}
                      </div>
                      <span className="text-white text-sm">{ch.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/60 text-sm">{ch.profiles?.full_name || "—"}</td>
                  <td className="px-4 py-3 text-white/40 text-sm">@{ch.username || "—"}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">{new Date(ch.created_at).toLocaleDateString("ru-RU")}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <a href={`/channel/${ch.id}`} target="_blank" className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-white/10 transition">
                        <ExternalLink className="w-3.5 h-3.5 text-white/50" />
                      </a>
                      <button onClick={() => deleteChannel(ch.id)} className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-white/30 text-sm">{page * PAGE + 1}–{Math.min((page + 1) * PAGE, total)} из {total}</span>
        <div className="flex gap-2">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-30" style={{ background: "rgba(255,255,255,0.06)" }}><ChevronLeft className="w-4 h-4 text-white" /></button>
          <button disabled={(page + 1) * PAGE >= total} onClick={() => setPage(p => p + 1)} className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-30" style={{ background: "rgba(255,255,255,0.06)" }}><ChevronRight className="w-4 h-4 text-white" /></button>
        </div>
      </div>
    </div>
  );
}