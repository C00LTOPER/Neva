"use client";
import { useEffect, useState } from "react";
import { Users, FileText, Tv, Eye, Heart, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, posts: 0, channels: 0, views: 0, likes: 0, comments: 0 });
  const [newUsers, setNewUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [u, p, ch, l, co] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("channels").select("*", { count: "exact", head: true }).is("deleted_at", null),
        supabase.from("likes").select("*", { count: "exact", head: true }),
        supabase.from("comments").select("*", { count: "exact", head: true }),
      ]);
      setStats({ users: u.count || 0, posts: p.count || 0, channels: ch.count || 0, views: 0, likes: l.count || 0, comments: co.count || 0 });
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(5);
      setNewUsers(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { label: "Пользователи", value: stats.users, icon: Users, color: "#7B5CFF", bg: "rgba(123,92,255,0.1)" },
    { label: "Посты", value: stats.posts, icon: FileText, color: "#00B4D8", bg: "rgba(0,180,216,0.1)" },
    { label: "Каналы", value: stats.channels, icon: Tv, color: "#06D6A0", bg: "rgba(6,214,160,0.1)" },
    { label: "Лайки", value: stats.likes, icon: Heart, color: "#FF6B6B", bg: "rgba(255,107,107,0.1)" },
    { label: "Комментарии", value: stats.comments, icon: MessageCircle, color: "#FFD93D", bg: "rgba(255,217,61,0.1)" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-full py-32">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold">Дашборд</h1>
        <p className="text-white/40 text-sm mt-1">Общая статистика NEVA</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {cards.map((card, i) => (
          <div key={i} className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-white text-2xl font-bold">{card.value.toLocaleString()}</p>
            <p className="text-white/40 text-sm mt-1">{card.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <h2 className="text-white font-semibold mb-4">Новые пользователи</h2>
        <div className="space-y-3">
          {newUsers.map(user => (
            <div key={user.id} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-sm font-bold">{user.full_name?.[0] || "?"}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.full_name || "Без имени"}</p>
                <p className="text-white/30 text-xs">@{user.username || "—"}</p>
              </div>
              <p className="text-white/25 text-xs shrink-0">{new Date(user.created_at).toLocaleDateString("ru-RU")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}