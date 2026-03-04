"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Radio } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SubscriptionsPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: subs } = await supabase
        .from("channel_subscribers")
        .select("channel_id")
        .eq("user_id", user.id);

      const channelIds = (subs || []).map((s: any) => s.channel_id);

      if (channelIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: channelsData } = await supabase
        .from("channels")
        .select("id, name, username, avatar_url, description")
        .in("id", channelIds)
        .is("deleted_at", null);

      // Для каждого канала получаем количество подписчиков
      const withCounts = await Promise.all(
        (channelsData || []).map(async (ch: any) => {
          const { count } = await supabase
            .from("channel_subscribers")
            .select("*", { count: "exact" })
            .eq("channel_id", ch.id);
          return { ...ch, subscribers_count: count || 0 };
        })
      );

      setChannels(withCounts);
      setLoading(false);
    };
    load();
  }, []);

  const formatCount = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + " млн";
    if (n >= 1000) return (n / 1000).toFixed(1) + " тыс.";
    return n.toString();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-8">
      <div className="flex justify-center">
        <div className="w-full max-w-xl">

          <div className="px-4 pt-14 pb-4">
            <button onClick={() => router.back()} className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Подписки</h1>
            {channels.length > 0 && (
              <p className="text-white/40 text-sm mt-1">{channels.length} канала</p>
            )}
          </div>

          {channels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <div className="w-20 h-20 rounded-3xl mb-6 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(61,90,254,0.2), rgba(123,92,255,0.2))", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Radio className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-white font-bold text-lg mb-2">Нет подписок</h2>
              <p className="text-white/40 text-sm mb-6">Подпишитесь на каналы чтобы следить за их постами</p>
              <button onClick={() => router.push("/search")}
                className="px-6 py-3 rounded-2xl text-white font-semibold text-sm"
                style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                Найти каналы
              </button>
            </div>
          ) : (
            <div className="px-4 space-y-3">
              {channels.map(ch => (
                <button key={ch.id} onClick={() => router.push(`/channel/${ch.id}`)}
                  className="w-full flex items-center gap-4 p-4 rounded-3xl text-left transition"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 4px 20px -5px rgba(123, 92, 255, 0.2)"
                  }}>
                  <div className="w-14 h-14 rounded-full overflow-hidden shrink-0"
                    style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                    {ch.avatar_url ? (
                      <img src={ch.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">{ch.name?.[0] || "К"}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{ch.name}</p>
                    <p className="text-white/40 text-sm">@{ch.username}</p>
                    {ch.description && (
                      <p className="text-white/30 text-xs mt-1 truncate">{ch.description}</p>
                    )}
                    <p className="text-white/25 text-xs mt-1">{formatCount(ch.subscribers_count)} подписчиков</p>
                  </div>
                </button>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}