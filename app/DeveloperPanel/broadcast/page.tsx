"use client";
import { useState } from "react";
import { Bell, Send, Users, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminBroadcast() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    await supabase.from("broadcasts").insert({ title: title.trim(), message: message.trim() });
    setSending(false); setSent(true);
    setTimeout(() => { setSent(false); setTitle(""); setMessage(""); }, 4000);
  };

  const templates = [
    { label: "Обновление", title: "Обновление NEVA", message: "Мы выпустили новое обновление с улучшениями и новыми функциями!" },
    { label: "Техработы", title: "Технические работы", message: "Сегодня с 02:00 до 04:00 планируются технические работы. Сервис может быть недоступен." },
    { label: "Акция", title: "🎉 Специальное событие", message: "Не пропусти! Специальное мероприятие в NEVA только сегодня." },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold">Рассылка</h1>
        <p className="text-white/40 text-sm mt-1">Отправить уведомление всем пользователям</p>
      </div>

      {sent && (
        <div className="mb-6 p-4 rounded-2xl flex items-center gap-3" style={{ background: "rgba(107,203,119,0.1)", border: "1px solid rgba(107,203,119,0.2)" }}>
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
          <p className="text-green-400 text-sm">Рассылка отправлена всем пользователям!</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        {templates.map((t, i) => (
          <button key={i} onClick={() => { setTitle(t.title); setMessage(t.message); }}
            className="p-4 rounded-2xl text-left hover:bg-white/5 transition"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-white text-sm font-medium mb-1">{t.label}</p>
            <p className="text-white/40 text-xs">{t.title}</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(61,90,254,0.15)" }}>
            <Bell className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Новое уведомление</p>
            <p className="text-white/30 text-xs flex items-center gap-1"><Users className="w-3 h-3" /> Все активные пользователи</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-white/40 text-xs uppercase tracking-wider mb-2 block">Заголовок</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Введите заголовок..."
              className="w-full px-4 py-3 rounded-2xl text-white text-sm placeholder-white/25 focus:outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />
          </div>
          <div>
            <label className="text-white/40 text-xs uppercase tracking-wider mb-2 block">Сообщение</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Текст уведомления..." rows={4}
              className="w-full px-4 py-3 rounded-2xl text-white text-sm placeholder-white/25 focus:outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />
          </div>
        </div>
        <div className="flex items-center justify-between mt-5">
          <p className="text-white/25 text-xs">Уведомление появится у всех пользователей мгновенно</p>
          <button onClick={handleSend} disabled={!title.trim() || !message.trim() || sending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-white text-sm disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
            {sending ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Отправка...</> : <><Send className="w-4 h-4" />Отправить</>}
          </button>
        </div>
      </div>
    </div>
  );
}