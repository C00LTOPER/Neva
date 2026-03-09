"use client";
import { useState } from "react";
import { X, Flag, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

const REASONS = {
  user: ["Спам", "Оскорбления и угрозы", "Мошенничество", "Выдаёт себя за другого", "Нежелательный контент", "Другое"],
  post: ["Спам", "Оскорбительный контент", "Насилие или жестокость", "Дезинформация", "Нарушение авторских прав", "Другое"],
  comment: ["Спам", "Оскорбления", "Угрозы", "Нежелательный контент", "Другое"],
  channel: ["Спам", "Мошеннический канал", "Оскорбительный контент", "Выдаёт себя за другого", "Другое"],
};

interface Props {
  type: "user" | "post" | "comment" | "channel";
  targetId: string;
  reportedUserId?: string;
  currentUserId: string;
  onClose: () => void;
}

export default function ReportModal({ type, targetId, reportedUserId, currentUserId, onClose }: Props) {
  const [step, setStep] = useState<"reason" | "done">("reason");
  const [selected, setSelected] = useState("");
  const [sending, setSending] = useState(false);

  const reasons = REASONS[type];

  const handleSend = async (reason: string) => {
    if (!currentUserId) return;
    setSending(true);
    setSelected(reason);
    await supabase.from("reports").insert({
      reporter_id: currentUserId,
      reported_user_id: reportedUserId || null,
      post_id: type === "post" ? targetId : null,
      comment_id: type === "comment" ? targetId : null,
      channel_id: type === "channel" ? targetId : null,
      type,
      reason,
      status: "pending",
    });
    setSending(false);
    setStep("done");
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-xl rounded-t-3xl overflow-hidden"
        style={{ background: "rgba(12,12,22,0.99)", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-4 mb-1" />
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,60,60,0.15)" }}>
              <Flag className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="text-white font-bold text-base">Пожаловаться</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {step === "reason" ? (
          <div className="px-4 py-3 pb-8">
            <p className="text-white/40 text-xs px-1 mb-3">Выберите причину жалобы</p>
            <div className="space-y-1">
              {reasons.map(reason => (
                <button key={reason} onClick={() => handleSend(reason)} disabled={sending}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left hover:bg-white/5 transition disabled:opacity-40"
                  style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-white/80 text-sm">{reason}</span>
                  <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-5 py-8 pb-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(107,203,119,0.1)" }}>
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Жалоба отправлена</h3>
            <p className="text-white/40 text-sm mb-1">Причина: <span className="text-white/70">{selected}</span></p>
            <p className="text-white/30 text-xs mt-2">Мы рассмотрим её в ближайшее время</p>
            <button onClick={onClose} className="mt-6 px-8 py-2.5 rounded-2xl text-white text-sm"
              style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  );
}