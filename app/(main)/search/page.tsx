"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Users, Radio, Hash } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [channels, setChannels] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [topHashtags, setTopHashtags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"all" | "channels" | "users">("all");

  useEffect(() => {
    loadTopHashtags();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setChannels([]);
      setUsers([]);
      return;
    }
    const timeout = setTimeout(() => search(), 400);
    return () => clearTimeout(timeout);
  }, [query]);

  const loadTopHashtags = async () => {
    const { data } = await supabase
      .from("hashtags")
      .select("*")
      .order("posts_count", { ascending: false })
      .limit(10);
    setTopHashtags(data || []);
  };

  const search = async () => {
    setLoading(true);
    const q = query.trim().toLowerCase().replace("@", "").replace("#", "");

    const { data: ch } = await supabase
      .from("channels")
      .select("id, name, username, avatar_url, description")
      .is("deleted_at", null)
      .or(`username.ilike.%${q}%,name.ilike.%${q}%`)
      .limit(20);

    const { data: us } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(20);

    setChannels(ch || []);
    setUsers(us || []);
    setLoading(false);
  };

  const formatCount = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + " млн";
    if (n >= 1000) return (n / 1000).toFixed(1) + " тыс.";
    return n.toString();
  };

  const showChannels = tab === "all" || tab === "channels";
  const showUsers = tab === "all" || tab === "users";

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-8">
      <div className="flex justify-center">
        <div className="w-full max-w-xl">

          <div className="px-4 pt-14 pb-4">
            <h1 className="text-2xl font-bold text-white mb-4">Поиск</h1>

            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Search className="w-4 h-4 text-white/30 shrink-0" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Каналы, люди, #хештеги..."
                autoFocus
                className="flex-1 bg-transparent text-white text-sm placeholder-white/30 focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")}>
                  <X className="w-4 h-4 text-white/30" />
                </button>
              )}
            </div>

            {query.trim() && (
              <div className="flex gap-2 mt-3">
                {[
                  { key: "all", label: "Все" },
                  { key: "channels", label: "Каналы" },
                  { key: "users", label: "Люди" },
                ].map(t => (
                  <button key={t.key} onClick={() => setTab(t.key as any)}
                    className="px-4 py-1.5 rounded-2xl text-sm font-medium transition"
                    style={{
                      background: tab === t.key ? "linear-gradient(135deg, #3D5AFE, #7B5CFF)" : "rgba(255,255,255,0.05)",
                      color: tab === t.key ? "white" : "rgba(255,255,255,0.4)"
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Результаты поиска */}
          {!loading && query.trim() && (
            <div className="px-4 space-y-6">
              {showChannels && channels.length > 0 && (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5" /> Каналы
                  </p>
                  <div className="space-y-2">
                    {channels.map(ch => (
                      <button key={ch.id} onClick={() => router.push(`/channel/${ch.id}`)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl transition text-left"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0"
                          style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                          {ch.avatar_url ? (
                            <img src={ch.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-white font-bold">{ch.name?.[0] || "К"}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{ch.name}</p>
                          <p className="text-white/40 text-xs">@{ch.username}</p>
                          {ch.description && (
                            <p className="text-white/30 text-xs mt-0.5 truncate">{ch.description}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showUsers && users.length > 0 && (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> Люди
                  </p>
                  <div className="space-y-2">
                    {users.map(u => (
                      <button key={u.id} onClick={() => router.push(`/profile/${u.id}`)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl transition text-left"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0"
                          style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-white font-bold">{u.full_name?.[0] || "?"}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{u.full_name || "Без имени"}</p>
                          {u.username && <p className="text-white/40 text-xs">@{u.username}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {channels.length === 0 && users.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-white/20">
                  <Search className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">Ничего не найдено</p>
                  <p className="text-xs mt-1">Попробуйте другой запрос</p>
                </div>
              )}
            </div>
          )}

          {/* Начальный экран с топ хештегами */}
          {!query.trim() && (
            <div className="px-4">
              {topHashtags.length > 0 ? (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" /> Популярные хештеги
                  </p>
                  <div className="space-y-2">
                    {topHashtags.map((ht, i) => (
                      <button key={ht.id}
                        onClick={() => router.push(`/hashtag/${encodeURIComponent(ht.tag.replace("#", ""))}`)}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl transition text-left"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: "linear-gradient(135deg, rgba(61,90,254,0.3), rgba(123,92,255,0.3))" }}>
                          <span className="text-white/60 text-sm font-bold">{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm" style={{ color: "#3D8BFE" }}>{ht.tag}</p>
                          <p className="text-white/30 text-xs mt-0.5">{formatCount(ht.posts_count)} постов</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-white/20">
                  <Search className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-base font-medium">Найдите каналы и людей</p>
                  <p className="text-sm mt-1 text-center">Введите имя или @псевдоним</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}