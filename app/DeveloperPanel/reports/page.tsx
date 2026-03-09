"use client";
import { useEffect, useState } from "react";
import { Flag, Check, X, RefreshCw, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminReports() {
  const [tab, setTab] = useState<"reports"|"appeals">("reports");
  const [reports, setReports] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all"|"pending"|"resolved">("all");

  useEffect(() => { tab === "reports" ? loadReports() : loadAppeals(); }, [tab]);

  const loadReports = async () => {
    setLoading(true);
    const { data } = await supabase.from("reports")
      .select("*, reporter:profiles!reports_reporter_id_fkey(full_name, avatar_url), reported:profiles!reports_reported_user_id_fkey(full_name, avatar_url)")
      .order("created_at", { ascending: false });
    setReports(data || []); setLoading(false);
  };

  const loadAppeals = async () => {
    setLoading(true);
    const { data } = await supabase.from("ban_appeals")
      .select("*, profiles(full_name, avatar_url), bans(admin_reason, duration)")
      .order("created_at", { ascending: false });
    setAppeals(data || []); setLoading(false);
  };

  const resolveReport = async (id: string) => {
    await supabase.from("reports").update({ status: "resolved" }).eq("id", id);
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: "resolved" } : r));
  };

  const dismissReport = async (id: string) => {
    await supabase.from("reports").update({ status: "dismissed" }).eq("id", id);
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: "dismissed" } : r));
  };

  const resolveAppeal = async (id: string, userId: string) => {
    await supabase.from("ban_appeals").update({ status: "resolved" }).eq("id", id);
    await supabase.from("bans").update({ is_active: false }).eq("user_id", userId).eq("is_active", true);
    await supabase.from("profiles").update({ is_banned: false, ban_id: null }).eq("id", userId);
    setAppeals(prev => prev.map(a => a.id === id ? { ...a, status: "resolved" } : a));
  };

  const dismissAppeal = async (id: string) => {
    await supabase.from("ban_appeals").update({ status: "dismissed" }).eq("id", id);
    setAppeals(prev => prev.map(a => a.id === id ? { ...a, status: "dismissed" } : a));
  };

  const filtered = reports.filter(r => filter === "all" ? true : r.status === filter);

  const statusColor = (s: string) => {
    if (s === "resolved") return { bg: "rgba(107,203,119,0.15)", color: "#6BCB77", label: "Решено" };
    if (s === "dismissed") return { bg: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.3)", label: "Отклонено" };
    return { bg: "rgba(255,180,0,0.15)", color: "#FFD93D", label: "Ожидает" };
  };

  const typeLabel = (t: string) => ({ user: "👤 Пользователь", post: "📝 Пост", comment: "💬 Комментарий", channel: "📺 Канал" }[t] || t);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Жалобы и обращения</h1>
          <p className="text-white/40 text-sm mt-1">Жалоб: {reports.length} · Обращений: {appeals.length}</p>
        </div>
        <button onClick={() => tab === "reports" ? loadReports() : loadAppeals()}
          className="w-9 h-9 rounded-2xl flex items-center justify-center hover:bg-white/10 transition"
          style={{ background: "rgba(255,255,255,0.06)" }}>
          <RefreshCw className="w-4 h-4 text-white/50" />
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("reports")} className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm transition"
          style={{ background: tab === "reports" ? "linear-gradient(135deg, #3D5AFE, #7B5CFF)" : "rgba(255,255,255,0.05)", color: tab === "reports" ? "white" : "rgba(255,255,255,0.4)" }}>
          <Flag className="w-4 h-4" /> Жалобы
          {reports.filter(r => !r.status || r.status === "pending").length > 0 &&
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{reports.filter(r => !r.status || r.status === "pending").length}</span>}
        </button>
        <button onClick={() => setTab("appeals")} className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm transition"
          style={{ background: tab === "appeals" ? "linear-gradient(135deg, #3D5AFE, #7B5CFF)" : "rgba(255,255,255,0.05)", color: tab === "appeals" ? "white" : "rgba(255,255,255,0.4)" }}>
          <MessageSquare className="w-4 h-4" /> Обращения
          {appeals.filter(a => a.status === "pending").length > 0 &&
            <span className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">{appeals.filter(a => a.status === "pending").length}</span>}
        </button>
      </div>

      {tab === "reports" && (
        <>
          <div className="flex gap-2 mb-4">
            {(["all","pending","resolved"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-xl text-xs transition"
                style={{ background: filter === f ? "rgba(61,90,254,0.3)" : "rgba(255,255,255,0.05)", color: filter === f ? "white" : "rgba(255,255,255,0.4)" }}>
                {f === "all" ? "Все" : f === "pending" ? "Ожидают" : "Решённые"}
              </button>
            ))}
          </div>
          {loading
            ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
            : filtered.length === 0
              ? <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Flag className="w-10 h-10 text-white/20 mb-3" />
                  <p className="text-white/40 text-sm">Жалоб нет</p>
                </div>
              : <div className="space-y-3">
                  {filtered.map(report => {
                    const st = statusColor(report.status || "pending");
                    return (
                      <div key={report.id} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>{typeLabel(report.type)}</span>
                              <span className="text-white/40 text-xs">От: <span className="text-white/70">{report.reporter?.full_name || "—"}</span></span>
                              {report.reported && <span className="text-white/40 text-xs">На: <span className="text-white/70">{report.reported?.full_name}</span></span>}
                            </div>
                            <p className="text-white text-sm font-medium">{report.reason}</p>
                            <p className="text-white/25 text-xs mt-1">{new Date(report.created_at).toLocaleString("ru-RU")}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-1 rounded-lg text-xs" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                            {(!report.status || report.status === "pending") && (
                              <>
                                <button onClick={() => resolveReport(report.id)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-green-500/20 transition"><Check className="w-4 h-4 text-green-400" /></button>
                                <button onClick={() => dismissReport(report.id)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition"><X className="w-4 h-4 text-white/40" /></button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
          }
        </>
      )}

      {tab === "appeals" && (
        <>
          {loading
            ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
            : appeals.length === 0
              ? <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <MessageSquare className="w-10 h-10 text-white/20 mb-3" />
                  <p className="text-white/40 text-sm">Обращений нет</p>
                </div>
              : <div className="space-y-3">
                  {appeals.map(appeal => {
                    const st = statusColor(appeal.status || "pending");
                    return (
                      <div key={appeal.id} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                              {appeal.profiles?.avatar_url ? <img src={appeal.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-xs font-bold">{appeal.profiles?.full_name?.[0] || "?"}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium">{appeal.profiles?.full_name || "—"}</p>
                              <p className="text-white/40 text-xs mb-2">Причина бана: {appeal.bans?.admin_reason || "—"} · {appeal.bans?.duration}</p>
                              <p className="text-white/70 text-sm leading-relaxed">{appeal.message}</p>
                              <p className="text-white/25 text-xs mt-2">{new Date(appeal.created_at).toLocaleString("ru-RU")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-1 rounded-lg text-xs" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                            {appeal.status === "pending" && (
                              <>
                                <button onClick={() => resolveAppeal(appeal.id, appeal.user_id)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-green-500/20 transition" title="Разбанить"><Check className="w-4 h-4 text-green-400" /></button>
                                <button onClick={() => dismissAppeal(appeal.id)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition" title="Отклонить"><X className="w-4 h-4 text-white/40" /></button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
          }
        </>
      )}
    </div>
  );
}