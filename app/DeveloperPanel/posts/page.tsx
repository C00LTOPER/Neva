"use client";
import { useEffect, useState } from "react";
import { Search, Trash2, ChevronLeft, ChevronRight, X, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [preview, setPreview] = useState<any>(null);
  const PAGE = 20;

  const load = async (q: string, p: number) => {
    setLoading(true);
    let query = supabase.from("posts").select("*, profiles(full_name, avatar_url, username), channels(name, username)", { count: "exact" }).range(p * PAGE, p * PAGE + PAGE - 1).order("created_at", { ascending: false });
    if (q) query = query.ilike("content", `%${q}%`);
    const { data, count } = await query;
    setPosts(data || []); setTotal(count || 0); setLoading(false);
  };

  useEffect(() => { load(search, page); }, [page]);

  const deletePost = async (id: string) => {
    await supabase.from("posts").delete().eq("id", id);
    setPosts(prev => prev.filter(p => p.id !== id));
    setTotal(t => t - 1);
    setPreview(null);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold">Посты</h1>
        <p className="text-white/40 text-sm mt-1">Всего: {total}</p>
      </div>
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && (setPage(0), load(search, 0))}
            placeholder="Поиск по тексту..." className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-white text-sm placeholder-white/25 focus:outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }} />
        </div>
        <button onClick={() => { setPage(0); load(search, 0); }} className="px-5 py-2.5 rounded-2xl text-white text-sm" style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>Найти</button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Автор", "Канал", "Текст", "Просмотры", "Дата", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-white/40 text-xs font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={6} className="py-12 text-center"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              : posts.map(post => (
                <tr key={post.id} className="hover:bg-white/[0.02] transition" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                        {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-xs font-bold">{post.profiles?.full_name?.[0] || "?"}</span>}
                      </div>
                      <span className="text-white/80 text-sm truncate max-w-[100px]">{post.profiles?.full_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/50 text-sm truncate max-w-[100px]">{post.channels?.name || "—"}</td>
                  <td className="px-4 py-3 text-white/60 text-sm max-w-[200px]">
                    <p className="truncate">{post.content || "(медиа)"}</p>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-sm">
                    <div className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{post.views || 0}</div>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">{new Date(post.created_at).toLocaleDateString("ru-RU")}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setPreview(post)} className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-white/10 transition">
                        <Eye className="w-3.5 h-3.5 text-white/50" />
                      </button>
                      <button onClick={() => deletePost(post.id)} className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition">
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

      {preview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{ background: "rgba(12,12,22,0.99)", border: "1px solid rgba(255,255,255,0.08)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="text-white font-bold">Просмотр поста</h2>
              <button onClick={() => setPreview(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><X className="w-4 h-4 text-white" /></button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                  {preview.profiles?.avatar_url ? <img src={preview.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-sm font-bold">{preview.profiles?.full_name?.[0] || "?"}</span>}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{preview.profiles?.full_name || "—"}</p>
                  <p className="text-white/40 text-xs">@{preview.profiles?.username || "—"} {preview.channels?.name ? `· ${preview.channels.name}` : ""}</p>
                </div>
              </div>
              {preview.content && <p className="text-white/80 text-sm leading-relaxed mb-4">{preview.content}</p>}
              {preview.image_url && <img src={preview.image_url} alt="" className="w-full rounded-2xl mb-4 object-cover max-h-64" />}
              {preview.video_url && <video src={preview.video_url} controls className="w-full rounded-2xl mb-4 max-h-64" />}
              <div className="flex gap-3 text-white/30 text-xs mb-4">
                <span>👁 {preview.views || 0} просмотров</span>
                <span>📅 {new Date(preview.created_at).toLocaleString("ru-RU")}</span>
              </div>
              <button onClick={() => deletePost(preview.id)} className="w-full py-2.5 rounded-2xl text-red-400 text-sm flex items-center justify-center gap-2" style={{ background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,60,60,0.2)" }}>
                <Trash2 className="w-4 h-4" /> Удалить пост
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}