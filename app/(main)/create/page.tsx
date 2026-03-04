"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Image, Video, X, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ALLOWED_IMAGE_FORMATS = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const ALLOWED_VIDEO_FORMATS = ["video/mp4", "video/mov", "video/quicktime", "video/mpeg"];
const MAX_VIDEO_SIZE = 500 * 1024 * 1024;

function parseHashtags(text: string): string[] {
  const matches = text.match(/#[а-яёa-z0-9_]+/gi);
  return matches ? [...new Set(matches.map(t => t.toLowerCase()))] : [];
}

function renderContent(text: string) {
  const parts = text.split(/(#[а-яёa-z0-9_]+)/gi);
  return parts.map((part, i) => {
    if (/^#[а-яёa-z0-9_]+$/i.test(part)) {
      return <span key={i} style={{ color: "#3D8BFE" }}>{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function CreatePage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
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
    if (!user) { setError("Вы не авторизованы"); setUploading(false); return; }

    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("images").upload(path, file);
    if (uploadError) { setError("Ошибка загрузки файла"); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(path);
    setMediaUrl(publicUrl);
    setMediaType(type);
    setUploading(false);
  };

  const handlePost = async () => {
    if (!content && !mediaUrl) { setError("Напишите что-нибудь или добавьте фото/видео"); return; }
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Вы не авторизованы"); setLoading(false); return; }

    const { data: post, error: postError } = await supabase.from("posts").insert({
      user_id: user.id,
      content,
      image_url: mediaUrl,
    }).select().single();

    if (postError) { setError("Ошибка публикации. Попробуйте снова"); setLoading(false); return; }

    // Сохраняем хештеги
    const tags = parseHashtags(content);
    if (tags.length > 0 && post) {
      // Добавляем в post_hashtags
      await supabase.from("post_hashtags").insert(
        tags.map(tag => ({ post_id: post.id, tag }))
      );

      // Обновляем счётчик в hashtags
      for (const tag of tags) {
        const { data: existing } = await supabase
          .from("hashtags")
          .select("id, posts_count")
          .eq("tag", tag)
          .maybeSingle();

        if (existing) {
          await supabase.from("hashtags").update({ posts_count: existing.posts_count + 1 }).eq("id", existing.id);
        } else {
          await supabase.from("hashtags").insert({ tag, posts_count: 1 });
        }
      }
    }

    router.push("/feed");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="flex justify-center">
        <div className="w-full max-w-xl">
          <div className="flex items-center justify-between px-4 pt-14 pb-4">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white font-semibold text-lg">Новый пост</h1>
            <button
              onClick={handlePost}
              disabled={loading || (!content && !mediaUrl)}
              className="px-4 py-2 rounded-2xl text-white text-sm font-medium disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
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

            {/* Превью текста с хештегами */}
            {content && showPreview ? (
              <div
                className="w-full px-4 py-3 rounded-2xl text-sm leading-relaxed mb-4 cursor-text min-h-[120px]"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.9)" }}
                onClick={() => setShowPreview(false)}>
                {renderContent(content)}
              </div>
            ) : (
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                onBlur={() => setShowPreview(true)}
                onFocus={() => setShowPreview(false)}
                placeholder="Что у вас нового? Используйте #хештег"
                rows={6}
                className="w-full px-4 py-3 rounded-2xl text-white text-sm placeholder-white/30 focus:outline-none resize-none mb-4"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            )}

            {mediaUrl && (
              <div className="relative mb-4">
                {mediaType === "image" ? (
                  <img src={mediaUrl} alt="media" className="w-full rounded-2xl object-cover max-h-64" />
                ) : (
                  <video src={mediaUrl} controls className="w-full rounded-2xl max-h-64" />
                )}
                <button
                  onClick={() => { setMediaUrl(null); setMediaType(null); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
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
              <button onClick={() => imageRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white/70 text-sm"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Image className="w-5 h-5" />
                Фото
              </button>
              <button onClick={() => videoRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white/70 text-sm"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Video className="w-5 h-5" />
                Видео
              </button>
            </div>

            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => handleMediaUpload(e, "image")} />
            <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => handleMediaUpload(e, "video")} />
          </div>
        </div>
      </div>
    </div>
  );
}