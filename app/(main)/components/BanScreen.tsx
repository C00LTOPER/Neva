"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Send } from "lucide-react";

export default function BanScreen({ userId }: { userId: string }) {
  const [ban, setBan] = useState<any>(null);
  const [appeal, setAppeal] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [alreadyAppealed, setAlreadyAppealed] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const check = async () => {
      const { data: banData } = await supabase.from("bans").select("*").eq("user_id", userId).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!banData) return;
      if (banData.duration !== "forever" && banData.banned_until) {
        if (new Date(banData.banned_until) < new Date()) {
          await supabase.from("bans").update({ is_active: false }).eq("id", banData.id);
          await supabase.from("profiles").update({ is_banned: false, ban_id: null }).eq("id", userId);
          return;
        }
      }
      setBan(banData);
      const { data: existingAppeal } = await supabase.from("ban_appeals").select("id").eq("ban_id", banData.id).eq("user_id", userId).maybeSingle();
      if (existingAppeal) setAlreadyAppealed(true);
    };
    check();
  }, [userId]);

  const sendAppeal = async () => {
    if (!appeal.trim() || !ban) return;
    setSending(true);
    await supabase.from("ban_appeals").insert({ user_id: userId, ban_id: ban.id, message: appeal.trim() });
    setSent(true); setSending(false); setAlreadyAppealed(true);
  };

  const formatDuration = (d: string) => {
    if (d === "forever") return "навсегда";
    if (d === "1h") return "1 час";
    if (d === "1d") return "1 день";
    if (d === "7d") return "7 дней";
    if (d === "30d") return "30 дней";
    return d;
  };

  const formatUntil = (date: string) => new Date(date).toLocaleString("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (!ban) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
      style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(255,40,40,0.15) 0%, rgba(7,7,15,0.98) 70%)", backdropFilter: "blur(20px)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(255,60,60,0.15)", border: "1px solid rgba(255,60,60,0.3)" }}>
            <span className="text-4xl">🔨</span>
          </div>
          <h1 className="text-white text-2xl font-bold mb-2">Вы заблокированы</h1>
          <p className="text-white/40 text-sm">Ваш аккаунт был заблокирован администратором</p>
        </div>

        <div className="rounded-3xl p-5 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,60,60,0.2)" }}>
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-white/40 text-sm">Причина:</span>
              <span className="text-white text-sm font-medium text-right max-w-[60%]">{ban.admin_reason || "Нарушение правил"}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-white/40 text-sm">Срок:</span>
              <span className="text-red-400 text-sm font-medium">{formatDuration(ban.duration)}</span>
            </div>
            {ban.duration !== "forever" && ban.banned_until && (
              <div className="flex justify-between items-start">
                <span className="text-white/40 text-sm">До:</span>
                <span className="text-white/70 text-sm text-right">{formatUntil(ban.banned_until)}</span>
              </div>
            )}
          </div>
        </div>

        {!alreadyAppealed ? (
          <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-white font-semibold text-sm mb-1">Считаете это ошибкой?</p>
            <p className="text-white/40 text-xs mb-3">Напишите обращение администратору</p>
            <textarea value={appeal} onChange={e => setAppeal(e.target.value)} rows={3}
              placeholder="Объясните ситуацию..."
              className="w-full px-4 py-3 rounded-2xl text-white text-sm placeholder-white/20 focus:outline-none resize-none mb-3"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }} />
            <button onClick={sendAppeal} disabled={!appeal.trim() || sending}
              className="w-full py-3 rounded-2xl text-white text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
              {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "Отправка..." : "Отправить обращение"}
            </button>
          </div>
        ) : (
          <div className="rounded-3xl p-5 text-center" style={{ background: "rgba(107,203,119,0.08)", border: "1px solid rgba(107,203,119,0.2)" }}>
            <p className="text-green-400 text-sm font-medium">✅ Обращение отправлено</p>
            <p className="text-white/30 text-xs mt-1">Администратор рассмотрит его в ближайшее время</p>
          </div>
        )}
      </div>
    </div>
  );
}