"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, MessageCircle, BellOff, Bell, Phone, Video, MoreHorizontal, Image, Link, FileText, Mic } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<any>(null);
  const [muted, setMuted] = useState(false);
  const [showMuteMenu, setShowMuteMenu] = useState(false);
  const [muteUntil, setMuteUntil] = useState<string | null>(null);
  const muteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (muteRef.current && !muteRef.current.contains(e.target as Node)) setShowMuteMenu(false);
    };
    if (showMuteMenu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMuteMenu]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      setProfile(prof);

      const { data: ch } = await supabase
        .from("channels")
        .select("id, name, avatar_url, username")
        .eq("owner_id", userId)
        .is("deleted_at", null)
        .maybeSingle();
      setChannel(ch);

      setLoading(false);
    };
    load();
  }, [userId]);

  const handleMute = (duration: string) => {
    setMuted(true);
    setShowMuteMenu(false);
    if (duration === "forever") {
      setMuteUntil("forever");
    } else {
      const mins = parseInt(duration);
      const until = new Date(Date.now() + mins * 60000).toISOString();
      setMuteUntil(until);
    }
  };

  const handleUnmute = () => {
    setMuted(false);
    setMuteUntil(null);
  };

  const formatLastSeen = (date: string | null) => {
    if (!date) return "Не в сети";
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "В сети";
    if (mins < 60) return `Был(а) ${mins} мин. назад`;
    if (hours < 24) return `Был(а) ${hours} ч. назад`;
    return `Был(а) ${days} дн. назад`;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
      <p className="text-white/40">Пользователь не найден</p>
    </div>
  );

  const isMe = currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-8">
      <div className="flex justify-center">
        <div className="w-full max-w-xl">

          {/* Шапка */}
          <div className="flex items-center justify-between px-4 pt-14 pb-4">
            <button onClick={() => router.back()} className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <button className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center">
              <MoreHorizontal className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Аватарка и имя */}
          <div className="flex flex-col items-center px-4 pb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4"
              style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">{profile.full_name?.[0] || "?"}</span>
                </div>
              )}
            </div>

            <h1 className="text-white text-xl font-bold">{profile.full_name || "Без имени"}</h1>

            <p className="text-white/40 text-sm mt-1">
              {formatLastSeen(profile.last_seen)}
            </p>
          </div>

          {/* Кнопки действий */}
          {!isMe && (
            <div className="flex justify-center gap-4 px-4 mb-6">
              <button
                onClick={() => router.push(`/chats`)}
                className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                  <MessageCircle className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <span className="text-white/60 text-xs">Сообщение</span>
              </button>

              <div className="relative" ref={muteRef}>
                <button
                  onClick={() => muted ? handleUnmute() : setShowMuteMenu(!showMuteMenu)}
                  className="flex flex-col items-center gap-1.5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: muted ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {muted ? <BellOff className="w-6 h-6 text-white/60" strokeWidth={1.5} /> : <Bell className="w-6 h-6 text-white/60" strokeWidth={1.5} />}
                  </div>
                  <span className="text-white/60 text-xs">{muted ? "Включить" : "Выключить"}</span>
                </button>

                {showMuteMenu && (
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 w-48 rounded-2xl overflow-hidden"
                    style={{ background: "rgba(20,20,40,0.97)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
                    <p className="text-white/40 text-xs px-4 pt-3 pb-1 uppercase tracking-wider">Mute for</p>
                    {[
                      { label: "1 час", value: "60" },
                      { label: "8 часов", value: "480" },
                      { label: "1 день", value: "1440" },
                      { label: "1 неделя", value: "10080" },
                      { label: "Навсегда", value: "forever" },
                    ].map(opt => (
                      <button key={opt.value} onClick={() => handleMute(opt.value)}
                        className="w-full px-4 py-3 text-left text-white text-sm hover:bg-white/5 transition">
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Phone className="w-6 h-6 text-white/60" strokeWidth={1.5} />
                </div>
                <span className="text-white/60 text-xs">Позвонить</span>
              </button>

              <button className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Video className="w-6 h-6 text-white/60" strokeWidth={1.5} />
                </div>
                <span className="text-white/60 text-xs">Видео</span>
              </button>
            </div>
          )}

          {/* Инфо */}
          <div className="px-4 space-y-2 mb-6">
            {profile.phone && (
              <div className="p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Телефон</p>
                <p className="text-white text-sm">{profile.phone}</p>
              </div>
            )}
            {profile.username && (
              <div className="p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Username</p>
                <p className="text-white text-sm">@{profile.username}</p>
              </div>
            )}
            {profile.bio && (
              <div className="p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">О себе</p>
                <p className="text-white text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}
          </div>

          {/* Канал пользователя */}
          {channel && (
            <div className="px-4 mb-6">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Канал</p>
              <button onClick={() => router.push(`/channel/${channel.id}`)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl text-left"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0"
                  style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                  {channel.avatar_url ? (
                    <img src={channel.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white font-bold">{channel.name?.[0] || "К"}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{channel.name}</p>
                  <p className="text-white/40 text-xs">@{channel.username}</p>
                </div>
              </button>
            </div>
          )}

          {/* Media / Links / Files / Voice */}
          <div className="px-4">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Медиа</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Image, label: "Media" },
                { icon: Link, label: "Links" },
                { icon: FileText, label: "Files" },
                { icon: Mic, label: "Voice" },
              ].map(item => (
                <button key={item.label}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <item.icon className="w-5 h-5 text-white/40" strokeWidth={1.5} />
                  <span className="text-white/40 text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}