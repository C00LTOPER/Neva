"use client";
import { useEffect, useState } from "react";
import { Search, Ban, Eye, ChevronLeft, ChevronRight, X, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

const BAN_DURATIONS = [
  { label: "1 час", value: "1h", ms: 3600000 },
  { label: "1 день", value: "1d", ms: 86400000 },
  { label: "7 дней", value: "7d", ms: 604800000 },
  { label: "30 дней", value: "30d", ms: 2592000000 },
  { label: "Навсегда", value: "forever", ms: null },
];

const BAN_REASONS = [
  "Спам",
  "Оскорбления и угрозы",
  "Мошенничество",
  "Нарушение правил сообщества",
  "Распространение запрещённого контента",
  "Другое",
];

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userChannels, setUserChannels] = useState<any[]>([]);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banDuration, setBanDuration] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banConfirm, setBanConfirm] = useState(false);
  const [banning, setBanning] = useState(false);
  const PAGE = 20;

  const load = async (q: string, p: number) => {
    setLoading(true);
    let query = supabase.from("profiles").select("*", { count: "exact" }).range(p * PAGE, p * PAGE + PAGE - 1).order("created_at", { ascending: false });
    if (q) query = query.ilike("full_name", `%${q}%`);
    const { data, count } = await query;
    setUsers(data || []); setTotal(count || 0); setLoading(false);
  };

  useEffect(() => { load(search, page); }, [page]);

  const openUser = async (user: any) => {
    setSelectedUser(user);
    const { data: posts } = await supabase.from("posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
    const { data: channels } = await supabase.from("channels").select("*").eq("owner_id", user.id);
    setUserPosts(posts || []); setUserChannels(channels || []);
  };

  const handleBan = async () => {
    if (!banDuration || !banReason || !selectedUser) return;
    setBanning(true);
    const dur = BAN_DURATIONS.find(d => d.value === banDuration);
    const banned_until = dur?.ms ? new Date(Date.now() + dur.ms).toISOString() : null;
    const { data: banData } = await supabase.from("bans").insert({
      user_id: selectedUser.id,
      admin_reason: banReason,
      duration: banDuration,
      banned_until,
      is_active: true,
    }).select().single();
    await supabase.from("profiles").update({ is_banned: true, ban_id: banData?.id }).eq("id", selectedUser.id);
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, is_banned: true } : u));
    setSelectedUser((prev: any) => ({ ...prev, is_banned: true }));
    setBanning(false); setShowBanModal(false); setBanConfirm(false); setBanDuration(""); setBanReason("");
  };

  const handleUnban = async (user: any) => {
    await supabase.from("bans").update({ is_active: false }).eq("user_id", user.id).eq("is_active", true);
    await supabase.from("profiles").update({ is_banned: false, ban_id: null }).eq("id", user.id);
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_banned: false } : u));
    if (selectedUser?.id === user.id) setSelectedUser((prev: any) => ({ ...prev, is_banned: false }));
  };

  const getDurLabel = () => BAN_DURATIONS.find(d => d.value === banDuration)?.label || "";

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold">Пользователи</h1>
        <p className="text-white/40 text-sm mt-1">Всего: {total}</p>
      </div>
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && (setPage(0), load(search, 0))}
            placeholder="Поиск по имени..." className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-white text-sm placeholder-white/25 focus:outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }} />
        </div>
        <button onClick={() => { setPage(0); load(search, 0); }} className="px-5 py-2.5 rounded-2xl text-white text-sm" style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>Найти</button>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Пользователь", "Username", "Дата регист.", "Статус", "Действия"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-white/40 text-xs font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={5} className="py-12 text-center"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              : users.map(user => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                        {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-xs font-bold">{user.full_name?.[0] || "?"}</span>}
                      </div>
                      <span className="text-white text-sm">{user.full_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-sm">@{user.username || "—"}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">{new Date(user.created_at).toLocaleDateString("ru-RU")}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-lg text-xs" style={{ background: user.is_banned ? "rgba(255,60,60,0.15)" : "rgba(107,203,119,0.15)", color: user.is_banned ? "#FF6B6B" : "#6BCB77" }}>
                      {user.is_banned ? "Забанен" : "Активен"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openUser(user)} className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-white/10 transition">
                        <Eye className="w-3.5 h-3.5 text-white/50" />
                      </button>
                      {user.is_banned
                        ? <button onClick={() => handleUnban(user)} className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-green-500/20 transition">
                            <Ban className="w-3.5 h-3.5 text-green-400" />
                          </button>
                        : <button onClick={() => { setSelectedUser(user); setShowBanModal(true); }} className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition">
                            <Ban className="w-3.5 h-3.5 text-red-400" />
                          </button>
                      }
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

      {selectedUser && !showBanModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="w-full max-w-lg rounded-3xl overflow-hidden flex flex-col" style={{ background: "rgba(12,12,22,0.99)", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "85vh" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="text-white font-bold">Профиль пользователя</h2>
              <button onClick={() => setSelectedUser(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><X className="w-4 h-4 text-white" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                  {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-xl font-bold">{selectedUser.full_name?.[0] || "?"}</span>}
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{selectedUser.full_name || "Без имени"}</p>
                  <p className="text-white/40 text-sm">@{selectedUser.username || "—"}</p>
                  <p className="text-white/25 text-xs mt-0.5">ID: {selectedUser.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: "Постов", value: userPosts.length },
                  { label: "Каналов", value: userChannels.length },
                  { label: "Страна", value: selectedUser.country || "—" },
                  { label: "Телефон", value: selectedUser.phone || "—" },
                  { label: "Email", value: selectedUser.email || "—" },
                  { label: "Город", value: selectedUser.city || selectedUser.location || "—" },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-white/40 text-xs mb-0.5">{item.label}</p>
                    <p className="text-white text-sm font-medium truncate">{String(item.value)}</p>
                  </div>
                ))}
              </div>
              {userPosts.length > 0 && (
                <div className="mb-4">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Последние посты</p>
                  <div className="space-y-2">
                    {userPosts.slice(0, 5).map((post: any) => (
                      <div key={post.id} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <p className="text-white/70 text-xs truncate">{post.content || "(медиа пост)"}</p>
                        <p className="text-white/25 text-xs mt-1">{new Date(post.created_at).toLocaleDateString("ru-RU")} · {post.views || 0} просм.</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <a href={`/profile/${selectedUser.id}`} target="_blank"
                  className="flex-1 py-2.5 rounded-2xl text-white text-sm flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                  <User className="w-4 h-4" /> Открыть профиль
                </a>
                {selectedUser.is_banned
                  ? <button onClick={() => handleUnban(selectedUser)}
                      className="flex-1 py-2.5 rounded-2xl text-sm flex items-center justify-center gap-2"
                      style={{ background: "rgba(107,203,119,0.15)", color: "#6BCB77" }}>
                      <Ban className="w-4 h-4" /> Разбанить
                    </button>
                  : <button onClick={() => setShowBanModal(true)}
                      className="flex-1 py-2.5 rounded-2xl text-sm flex items-center justify-center gap-2"
                      style={{ background: "rgba(255,60,60,0.15)", color: "#FF6B6B" }}>
                      <Ban className="w-4 h-4" /> Забанить
                    </button>
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: "rgba(12,12,22,0.99)", border: "1px solid rgba(255,60,60,0.2)" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="text-white font-bold flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-400" /> Забанить пользователя
              </h2>
              <button onClick={() => { setShowBanModal(false); setBanConfirm(false); setBanDuration(""); setBanReason(""); }}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            {!banConfirm ? (
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Срок блокировки</p>
                  <div className="grid grid-cols-3 gap-2">
                    {BAN_DURATIONS.map(d => (
                      <button key={d.value} onClick={() => setBanDuration(d.value)}
                        className="py-2 rounded-xl text-sm transition"
                        style={{
                          background: banDuration === d.value ? "linear-gradient(135deg, #3D5AFE, #7B5CFF)" : "rgba(255,255,255,0.06)",
                          color: banDuration === d.value ? "white" : "rgba(255,255,255,0.5)",
                          border: banDuration === d.value ? "none" : "1px solid rgba(255,255,255,0.08)"
                        }}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Причина</p>
                  <div className="space-y-1">
                    {BAN_REASONS.map(r => (
                      <button key={r} onClick={() => setBanReason(r)}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition"
                        style={{
                          background: banReason === r ? "rgba(61,90,254,0.2)" : "rgba(255,255,255,0.04)",
                          color: banReason === r ? "white" : "rgba(255,255,255,0.5)",
                          border: banReason === r ? "1px solid rgba(61,90,254,0.4)" : "1px solid transparent"
                        }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setBanConfirm(true)} disabled={!banDuration || !banReason}
                  className="w-full py-3 rounded-2xl text-white text-sm disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #FF4444, #FF6B6B)" }}>
                  Продолжить
                </button>
              </div>
            ) : (
              <div className="p-5">
                <div className="text-center mb-5">
                  <span className="text-4xl">⚠️</span>
                  <p className="text-white font-bold mt-3 text-lg">Вы уверены?</p>
                  <p className="text-white/50 text-sm mt-2">Вы хотите забанить <span className="text-white font-medium">{selectedUser.full_name}</span></p>
                  <div className="mt-3 p-4 rounded-2xl text-left space-y-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-white/50 text-sm">Срок: <span className="text-white font-medium">{getDurLabel()}</span></p>
                    <p className="text-white/50 text-sm">Причина: <span className="text-white font-medium">{banReason}</span></p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setBanConfirm(false)}
                    className="flex-1 py-2.5 rounded-2xl text-white/60 text-sm"
                    style={{ background: "rgba(255,255,255,0.06)" }}>
                    Нет
                  </button>
                  <button onClick={handleBan} disabled={banning}
                    className="flex-1 py-2.5 rounded-2xl text-white text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #FF4444, #FF6B6B)" }}>
                    {banning && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    Да, забанить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}