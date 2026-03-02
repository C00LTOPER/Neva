"use client";

import { useState, useEffect } from "react";

import { Settings, Grid, Heart, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

function BioText({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = bio.length > 100;
  return (
    <div className="mt-2">
      <p className="text-white/70 text-sm">
        {expanded || !isLong ? bio : bio.slice(0, 100) + "..."}
      </p>
      {isLong && (
        <button onClick={() => setExpanded(!expanded)} className="text-blue-400 text-sm mt-1">
          {expanded ? "Скрыть" : "Ещё"}
        </button>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
      setLoading(false);
    };
    getProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Просмотр фото
  if (previewUrl) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center" onClick={() => setPreviewUrl(null)}>
        <button className="absolute top-14 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
        <img src={previewUrl} alt="preview" className="max-w-full max-h-full object-contain" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Обложка */}
      <div
        className="relative h-48 bg-gradient-to-br from-blue-600 to-purple-700 cursor-pointer"
        onClick={() => profile?.cover_url && setPreviewUrl(profile.cover_url)}
      >
        {profile?.cover_url && (
          <img src={profile.cover_url} alt="cover" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="relative px-4 pb-4">
        <div className="flex items-end justify-between -mt-16 mb-4">
          {/* Аватар */}
          <div
            className="w-28 h-28 rounded-full border-4 border-[#0a0a0f] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl overflow-hidden cursor-pointer"
            onClick={() => profile?.avatar_url && setPreviewUrl(profile.avatar_url)}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-white font-bold">
                {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "?"}
              </span>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={() => router.push("/profile/edit")} className="px-4 py-2 rounded-2xl bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/20 transition">
              Редактировать
            </button>
            <button className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition">
              <Settings className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h1 className="text-xl font-bold text-white">{profile?.full_name || "Без имени"}</h1>
          <p className="text-white/50 text-sm">@{profile?.username || "username"}</p>
          {profile?.bio && <BioText bio={profile.bio} />}
        </div>

        <div className="flex gap-6 mb-6">
          <div className="text-center">
            <p className="text-white font-bold">0</p>
            <p className="text-white/50 text-xs">Постов</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold">0</p>
            <p className="text-white/50 text-xs">Подписчиков</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold">0</p>
            <p className="text-white/50 text-xs">Подписок</p>
          </div>
        </div>

        <div className="flex border-b border-white/10 mb-4">
          <button className="flex-1 flex items-center justify-center py-3 text-white border-b-2 border-white">
            <Grid className="w-5 h-5" />
          </button>
          <button className="flex-1 flex items-center justify-center py-3 text-white/40">
            <Heart className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <Grid className="w-12 h-12 mb-3" />
          <p className="text-sm">Нет постов</p>
        </div>
      </div>
    </div>
  );
}