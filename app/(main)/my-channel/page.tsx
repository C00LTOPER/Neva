"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit3, Camera, Check, X, Share2, ChevronDown, Calendar, MapPin, Mail, Link2, MessageCircle, Repeat2, Eye, ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Cropper from "react-easy-crop";

function getCroppedImg(imageSrc: string, croppedAreaPixels: any): Promise<Blob> {
  return new Promise((resolve) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9);
    };
  });
}

function renderHashtags(text: string, router: any, expanded: boolean, isLong: boolean) {
  const displayText = expanded || !isLong ? text : text.slice(0, 120) + "...";
  const parts = displayText.split(/(#[а-яёa-z0-9_]+)/gi);
  return parts.map((part, i) =>
    /^#[а-яёa-z0-9_]+$/i.test(part) ? (
      <span key={i} style={{ color: "#3D8BFE" }} className="cursor-pointer"
        onClick={e => { e.stopPropagation(); router.push(`/hashtag/${encodeURIComponent(part.slice(1).toLowerCase())}`); }}>
        {part}
      </span>
    ) : <span key={i}>{part}</span>
  );
}

function ChannelPostCard({ post, currentUserId, isOwner, onDelete, onEdit }: {
  post: any; currentUserId: string; isOwner: boolean;
  onDelete: (id: string) => void; onEdit: (post: any) => void;
}) {
  const router = useRouter();
  const [views, setViews] = useState(post.views || 0);
  const [expanded, setExpanded] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const isLong = post.content?.length > 120;

  useEffect(() => {
    const load = async () => {
      const { count: lc } = await supabase.from("likes").select("*", { count: "exact" }).eq("post_id", post.id).eq("type", "like");
      const { count: dc } = await supabase.from("likes").select("*", { count: "exact" }).eq("post_id", post.id).eq("type", "dislike");
      setLikesCount(lc || 0);
      setDislikesCount(dc || 0);
      if (currentUserId) {
        const { data: ld } = await supabase.from("likes").select("*").eq("post_id", post.id).eq("user_id", currentUserId).eq("type", "like").maybeSingle();
        const { data: dd } = await supabase.from("likes").select("*").eq("post_id", post.id).eq("user_id", currentUserId).eq("type", "dislike").maybeSingle();
        setLiked(!!ld);
        setDisliked(!!dd);
      }
    };
    load();
    const viewKey = `viewed_${post.id}`;
    if (!localStorage.getItem(viewKey)) {
      supabase.from("posts").update({ views: (post.views || 0) + 1 }).eq("id", post.id);
      localStorage.setItem(viewKey, "1");
      setViews((post.views || 0) + 1);
    }
  }, [post.id, currentUserId]);

  const handleLike = async () => {
    if (!currentUserId) return;
    if (liked) {
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", currentUserId).eq("type", "like");
      setLiked(false); setLikesCount(c => c - 1);
    } else {
      if (disliked) {
        await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", currentUserId).eq("type", "dislike");
        setDisliked(false); setDislikesCount(c => c - 1);
      }
      await supabase.from("likes").insert({ post_id: post.id, user_id: currentUserId, type: "like" });
      setLiked(true); setLikesCount(c => c + 1);
    }
  };

  const handleDislike = async () => {
    if (!currentUserId) return;
    if (disliked) {
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", currentUserId).eq("type", "dislike");
      setDisliked(false); setDislikesCount(c => c - 1);
    } else {
      if (liked) {
        await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", currentUserId).eq("type", "like");
        setLiked(false); setLikesCount(c => c - 1);
      }
      await supabase.from("likes").insert({ post_id: post.id, user_id: currentUserId, type: "dislike" });
      setDisliked(true); setDislikesCount(c => c + 1);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Удалить пост?")) return;
    await supabase.from("posts").delete().eq("id", post.id);
    onDelete(post.id);
    setShowMenu(false);
  };

  const formatCount = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + " млн";
    if (n >= 1000) return (n / 1000).toFixed(1) + " тыс.";
    return n.toString();
  };

  const btnStyle = "rgba(255,255,255,0.07)";
  const activeBtnStyle = "linear-gradient(135deg, #3D5AFE, #7B5CFF)";

  return (
    <>
      {mediaPreview && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" onClick={() => setMediaPreview(null)}>
          <button className="absolute top-14 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
          {mediaPreview.match(/\.(mp4|mov|mpeg|webm)$/i) ? (
            <video src={mediaPreview} controls autoPlay className="max-w-full max-h-full" onClick={e => e.stopPropagation()} />
          ) : (
            <img src={mediaPreview} alt="media" className="max-w-full max-h-full object-contain" />
          )}
        </div>
      )}

      <div className="rounded-3xl overflow-hidden relative"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 10px 40px -5px rgba(123, 92, 255, 0.3)"
        }}>

        {/* Три точки */}
        <div className="absolute top-3 right-3 z-10">
          <button onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <span className="text-white/60 text-lg leading-none">···</span>
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-10 rounded-2xl overflow-hidden z-20 w-44"
                style={{ background: "rgba(20,20,35,0.98)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                <button onClick={() => { onEdit(post); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white/80 text-sm hover:bg-white/5 transition">
                  <Edit3 className="w-4 h-4" />
                  Редактировать
                </button>
                <div className="h-px bg-white/[0.06]" />
                <button onClick={handleDelete}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 text-sm hover:bg-white/5 transition">
                  <X className="w-4 h-4" />
                  Удалить пост
                </button>
              </div>
            </>
          )}
        </div>

        {post.content && (
          <div className="px-4 pt-4 pb-2 pr-12">
            <p className="text-white/90 text-sm leading-relaxed">
              {renderHashtags(post.content, router, expanded, isLong)}
            </p>
            {isLong && (
              <button onClick={() => setExpanded(!expanded)} className="text-blue-400 text-xs mt-1">
                {expanded ? "Скрыть" : "Читать далее"}
              </button>
            )}
          </div>
        )}

        {post.image_url && (
          <div className="px-4 pb-2 cursor-pointer" onClick={() => setMediaPreview(post.image_url)}>
            {post.image_url.match(/\.(mp4|mov|mpeg|webm)$/i) ? (
              <div className="relative rounded-2xl overflow-hidden">
                <video src={post.image_url} className="w-full object-contain" style={{ maxHeight: "300px" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                    <span className="text-white text-xl ml-1">▶</span>
                  </div>
                </div>
              </div>
            ) : (
              <img src={post.image_url} alt="post" className="w-full rounded-2xl object-contain" style={{ maxHeight: "300px" }} />
            )}
          </div>
        )}

        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={handleLike}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all"
              style={{ background: liked ? activeBtnStyle : btnStyle, border: "1px solid rgba(255,255,255,0.08)" }}>
              <ThumbsUp className="w-4 h-4 text-white" strokeWidth={1.5} />
              <span className="text-white text-xs font-medium">{formatCount(likesCount)}</span>
            </button>
            <button onClick={handleDislike}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all"
              style={{ background: disliked ? activeBtnStyle : btnStyle, border: "1px solid rgba(255,255,255,0.08)" }}>
              <ThumbsDown className="w-4 h-4 text-white" strokeWidth={1.5} />
              {isOwner && <span className="text-white text-xs font-medium">{formatCount(dislikesCount)}</span>}
            </button>
            <div className="flex items-center gap-1 px-2">
              <Eye className="w-3.5 h-3.5 text-white/25" strokeWidth={1.5} />
              <span className="text-xs text-white/25">{formatCount(views)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-2xl"
              style={{ background: btnStyle, border: "1px solid rgba(255,255,255,0.08)" }}>
              <MessageCircle className="w-4 h-4 text-white/70" strokeWidth={1.5} />
              <span className="text-xs text-white/70">0</span>
            </button>
            <button className="flex items-center justify-center px-3 py-2 rounded-2xl"
              style={{ background: btnStyle, border: "1px solid rgba(255,255,255,0.08)" }}>
              <Repeat2 className="w-4 h-4 text-white/70" strokeWidth={1.5} />
            </button>
            <button className="flex items-center justify-center px-3 py-2 rounded-2xl"
              style={{ background: btnStyle, border: "1px solid rgba(255,255,255,0.08)" }}
              onClick={() => {
                const url = `${window.location.origin}/post/${post.id}`;
                try { navigator.clipboard.writeText(url); } catch { alert(url); }
              }}>
              <Share2 className="w-4 h-4 text-white/70" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function MyChannelPage() {
  const router = useRouter();
  const [channel, setChannel] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [showAbout, setShowAbout] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editContent, setEditContent] = useState("");
  const avatarRef = useRef<HTMLInputElement>(null);

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);
      const { data: ch } = await supabase.from("channels").select("*").eq("owner_id", user.id).is("deleted_at", null).maybeSingle();
      if (ch) {
        setChannel(ch);
        const { data: channelPosts } = await supabase.from("posts").select("*").eq("user_id", ch.owner_id).order("created_at", { ascending: false });
        setPosts(channelPosts || []);
        const views = (channelPosts || []).reduce((acc: number, p: any) => acc + (p.views || 0), 0);
        setTotalViews(views);
        const { count: likesCount } = await supabase.from("likes").select("*", { count: "exact" }).in("post_id", (channelPosts || []).map((p: any) => p.id));
        setTotalLikes(likesCount || 0);
        const { count } = await supabase.from("channel_subscribers").select("*", { count: "exact" }).eq("channel_id", ch.id);
        setSubscribersCount(count || 0);
      }
      setLoading(false);
    };
    load();
  }, []);

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setUploading(true);
    const blob = await getCroppedImg(cropSrc, croppedAreaPixels);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const path = `channels/${user.id}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("images").upload(path, blob, { contentType: "image/jpeg" });
    if (error) { setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(path);
    setAvatarUrl(publicUrl);
    setCropSrc(null);
    setUploading(false);
  };

  const handleCreate = async () => {
    if (!name.trim() || !username.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: ch, error } = await supabase.from("channels").insert({
      owner_id: user.id,
      name: name.trim(),
      username: username.trim().toLowerCase().replace(/\s/g, ""),
      description: description.trim(),
      avatar_url: avatarUrl,
    }).select().single();
    if (error) { alert("Ошибка: " + error.message); setSaving(false); return; }
    if (ch) { setChannel(ch); setCreating(false); }
    setSaving(false);
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
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

  if (cropSrc) return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 pt-14 pb-4">
        <button onClick={() => setCropSrc(null)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
        <p className="text-white font-semibold">Обрезать фото</p>
        <button onClick={handleCropConfirm} disabled={uploading}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
          {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-5 h-5 text-white" />}
        </button>
      </div>
      <div className="flex-1 relative">
        <Cropper image={cropSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
          onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
      </div>
      <div className="px-8 py-6">
        <input type="range" min={1} max={3} step={0.01} value={zoom}
          onChange={e => setZoom(Number(e.target.value))} className="w-full accent-purple-500" />
      </div>
    </div>
  );

  if (!channel && !creating) return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6">
      <div className="w-20 h-20 rounded-3xl mb-6 flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, rgba(61,90,254,0.2), rgba(123,92,255,0.2))", border: "1px solid rgba(255,255,255,0.08)" }}>
        <Plus className="w-8 h-8 text-purple-400" />
      </div>
      <h1 className="text-white text-2xl font-bold mb-2">Создать канал</h1>
      <p className="text-white/40 text-sm text-center mb-8">У вас пока нет канала. Создайте его чтобы публиковать посты!</p>
      <button onClick={() => setCreating(true)} className="px-8 py-3 rounded-2xl text-white font-semibold"
        style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
        Создать канал
      </button>
    </div>
  );

  if (creating) return (
    <div className="min-h-screen bg-[#0a0a0f] px-6 pt-14 pb-8">
      <h1 className="text-white text-2xl font-bold mb-8">Новый канал</h1>
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden cursor-pointer ring-4 ring-white/10"
            style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}
            onClick={() => avatarRef.current?.click()}>
            {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> :
              <div className="w-full h-full flex items-center justify-center"><Camera className="w-8 h-8 text-white/60" /></div>}
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
            <Camera className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
        <p className="text-white/40 text-xs mt-3">Нажмите чтобы добавить аватар</p>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Название канала</p>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Например: Технологии будущего"
            className="w-full px-4 py-3 rounded-2xl text-white text-sm placeholder-white/30 focus:outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }} />
        </div>
        <div>
          <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Псевдоним</p>
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="text-white/30 text-sm">@</span>
            <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
              placeholder="mychannel" className="flex-1 bg-transparent text-white text-sm placeholder-white/30 focus:outline-none" />
          </div>
        </div>
        <div>
          <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Описание</p>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Расскажите о вашем канале..." rows={3}
            className="w-full px-4 py-3 rounded-2xl text-white text-sm placeholder-white/30 focus:outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }} />
        </div>
        <button onClick={handleCreate} disabled={!name.trim() || !username.trim() || saving}
          className="w-full py-3 rounded-2xl text-white font-semibold disabled:opacity-40 transition"
          style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
          {saving ? "Создание..." : "Создать канал"}
        </button>
        <button onClick={() => setCreating(false)} className="w-full py-3 rounded-2xl text-white/40 text-sm">Отмена</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="flex justify-center">
        <div className="w-full max-w-xl">

          {channel.cover_url && (
            <div className="mx-4 mt-14 rounded-2xl overflow-hidden" style={{ height: "120px" }}>
              <img src={channel.cover_url} alt="cover" className="w-full h-full object-cover" />
            </div>
          )}

          <div className={`px-4 ${channel.cover_url ? "mt-4" : "mt-14"}`}>
            <div className="flex items-center justify-between">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-[#0a0a0f]"
                style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                {channel.avatar_url ? <img src={channel.avatar_url} alt="avatar" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">{channel.name?.[0] || "К"}</span>
                  </div>}
              </div>
              <button onClick={() => router.push("/my-channel/edit")}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-sm"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Edit3 className="w-4 h-4" />
                Редактировать
              </button>
            </div>

            <h1 className="text-white text-xl font-bold mt-3">{channel.name}</h1>
            <p className="text-white/40 text-sm">@{channel.username}</p>
            <div className="flex items-center gap-3 mt-2 text-sm text-white/40">
              <span>{formatCount(subscribersCount)} подписчиков</span>
              <span>·</span>
              <span>{posts.length} постов</span>
            </div>

            {channel.description && (
              <p className="text-white/60 text-sm mt-3 leading-relaxed">{channel.description}</p>
            )}

            <button onClick={() => setShowAbout(true)} className="mt-3 text-blue-400 text-sm flex items-center gap-1">
              О канале... <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="h-px bg-white/[0.06] mx-4 my-4" />

          <div className="px-4 mb-4">
            <button onClick={() => router.push("/create")}
              className="w-full py-3 rounded-2xl text-white font-semibold flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
              <Plus className="w-4 h-4" />
              Новый пост
            </button>
          </div>

          <div className="px-4 pb-8">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/20">
                <p className="text-sm">Нет постов</p>
                <p className="text-xs mt-1">Создайте первый пост!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <ChannelPostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUser?.id}
                    isOwner={currentUser?.id === channel.owner_id}
                    onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                    onEdit={(post) => { setEditingPost(post); setEditContent(post.content || ""); }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модалка редактирования */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setEditingPost(null)}>
          <div className="w-full max-w-xl rounded-t-3xl pb-8 pt-6 px-6"
            style={{ background: "rgba(15,15,25,0.98)", border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-6" />
            <h2 className="text-white font-bold text-lg mb-4">Редактировать пост</h2>
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={5}
              className="w-full px-4 py-3 rounded-2xl text-white text-sm placeholder-white/30 focus:outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditingPost(null)}
                className="flex-1 py-3 rounded-2xl text-white/40 text-sm"
                style={{ background: "rgba(255,255,255,0.05)" }}>
                Отмена
              </button>
              <button onClick={async () => {
                await supabase.from("posts").update({ content: editContent }).eq("id", editingPost.id);
                setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, content: editContent } : p));
                setEditingPost(null);
              }} className="flex-1 py-3 rounded-2xl text-white font-semibold"
                style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* О канале */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setShowAbout(false)}>
          <div className="w-full max-w-xl rounded-t-3xl pb-8 pt-6 px-6"
            style={{ background: "rgba(15,15,25,0.98)", border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-6" />
            <h2 className="text-white font-bold text-lg mb-4">О канале</h2>
            {channel.description && (
              <div className="mb-4">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Описание</p>
                <p className="text-white/70 text-sm leading-relaxed">{channel.description}</p>
              </div>
            )}
            {(channel.links || []).length > 0 && (
              <div className="mb-4">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Ссылки</p>
                <div className="space-y-2">
                  {(channel.links || []).map((link: string, i: number) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-400 text-sm truncate">
                      <Link2 className="w-3.5 h-3.5 shrink-0" />
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-4">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Статистика</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Подписчиков", value: formatCount(subscribersCount) },
                  { label: "Постов", value: posts.length.toString() },
                  { label: "Просмотров", value: formatCount(totalViews) },
                  { label: "Лайков", value: formatCount(totalLikes) },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-2xl text-center"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    <p className="text-white font-bold text-base">{item.value}</p>
                    <p className="text-white/40 text-xs">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 text-sm text-white/40 mb-6">
              {channel.created_at && (
                <p className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  Создан {formatDate(channel.created_at)}
                </p>
              )}
              {channel.location && (
                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {channel.location}
                </p>
              )}
              {channel.email && (
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  Email скрыт
                </p>
              )}
            </div>
            <button
              className="w-full py-3 rounded-2xl text-white text-sm flex items-center justify-center gap-2"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
              onClick={() => {
                const url = `${window.location.origin}/channel/${channel.id}`;
                try { navigator.clipboard.writeText(url); alert("Ссылка скопирована!"); } catch { alert(url); }
              }}>
              <Share2 className="w-4 h-4 text-white/60" />
              Поделиться каналом
            </button>
          </div>
        </div>
      )}
    </div>
  );
}