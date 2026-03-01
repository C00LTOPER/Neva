"use client";

import { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { ArrowLeft, Image, Video, X, AlertCircle } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ALLOWED_IMAGE_FORMATS = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const ALLOWED_VIDEO_FORMATS = ["video/mp4", "video/mov", "video/quicktime", "video/mpeg"];
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

export default function CreatePage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (type === "image" && !ALLOWED_IMAGE_FORMATS.includes(file.type)) {
      setError("Неверный формат! Поддерживаются: JPG, PNG, WEBP, HEIC");
      return;
    }

    if (type === "video" && !ALLOWED_VIDEO_FORMATS.includes(file.type)) {
      setError("Неверный формат видео! Поддерживаются: MP4, MOV");
      return;
    }

    if (type === "video" && file.size > MAX_VIDEO_SIZE) {
      setError("Видео слишком большое! Максимальный размер: 500 МБ");
      return;
    }

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Вы не авторизованы");
      setUploading(false);
      return;
    }

    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("images").upload(path, file);

    if (uploadError) {
      setError("Ошибка загрузки файла. Попробуйте снова");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(path);
    setMediaUrl(publicUrl);
    setMediaType(type);
    setUploading(false);
  };

  const handlePost = async () => {
    if (!content && !mediaUrl) {
      setError("Напишите что-нибудь или добавьте фото/видео");
      return;
    }
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Вы не авторизованы");
      setLoading(false);
      return;
    }

    const { error: postError } = await supabase.from("posts").insert({
      user_id: user.id,
      content,
      image_url: mediaUrl,
    });

    if (postError) {
      setError("Ошибка публикации. Попробуйте снова");
      setLoading(false);
      return;
    }

    router.push("/feed");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="flex items-center justify-between px-4 pt-14 pb-4">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white font-semibold text-lg">Новый пост</h1>
        <button
          onClick={handlePost}
          disabled={loading || (!content && !mediaUrl)}
          className="px-4 py-2 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Публикуем..." : "Опубликовать"}
        </button>
      </div>

      <div className="px-4">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-500/20 border border-red-500/30 mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Что у вас нового?"
          rows={6}
          className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none mb-4"
        />

        {mediaUrl && (
          <div className="relative mb-4">
            {mediaType === "image" ? (
              <img src={mediaUrl} alt="media" className="w-full rounded-2xl object-cover max-h-64" />
            ) : (
              <video src={mediaUrl} controls className="w-full rounded-2xl max-h-64" />
            )}
            <button
              onClick={() => { setMediaUrl(null); setMediaType(null); }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {uploading && (
          <div className="flex items-center gap-2 text-white/50 text-sm mb-4">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            Загружаем файл...
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => imageRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/10 text-white/70 text-sm"
          >
            <Image className="w-5 h-5" />
            Фото
          </button>
          <button
            onClick={() => videoRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/10 text-white/70 text-sm"
          >
            <Video className="w-5 h-5" />
            Видео
          </button>
        </div>

        <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaUpload(e, "image")} />
        <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleMediaUpload(e, "video")} />
      </div>
    </div>
  );
}