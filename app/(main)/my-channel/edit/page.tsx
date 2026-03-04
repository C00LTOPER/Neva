"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Plus, X, Check, Trash2 } from "lucide-react";
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

const DELETE_WARNINGS = [
  "Вы уверены что хотите удалить канал?",
  "Все посты и подписчики будут потеряны. Продолжить?",
  "Это действие нельзя отменить. Вы на 100% уверены?",
  "Последнее предупреждение! Канал будет удалён навсегда. Точно?",
  "Канал и все посты будут удалены НЕМЕДЛЕННО и НАВСЕГДА!"
];

export default function EditChannelPage() {
  const router = useRouter();
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"avatar" | "cover">("avatar");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [deleteStep, setDeleteStep] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: ch } = await supabase.from("channels").select("*").eq("owner_id", user.id).is("deleted_at", null).maybeSingle();
      if (ch) {
        setChannel(ch);
        setName(ch.name || "");
        setUsername(ch.username || "");
        setDescription(ch.description || "");
        setLocation(ch.location || "");
        setEmail(ch.email || "");
        setLinks(ch.links || []);
        setAvatarUrl(ch.avatar_url || null);
        setCoverUrl(ch.cover_url || null);
      }
      setLoading(false);
    };
    load();
  }, []);

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setCropSrc(reader.result as string); setCropType(type); };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setUploading(true);
    const blob = await getCroppedImg(cropSrc, croppedAreaPixels);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const path = `channels/${user.id}/${cropType}_${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("images").upload(path, blob, { contentType: "image/jpeg" });
    if (error) { setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(path);
    if (cropType === "avatar") setAvatarUrl(publicUrl);
    else setCoverUrl(publicUrl);
    setCropSrc(null);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!channel) return;
    setSaving(true);
    await supabase.from("channels").update({
      name,
      username: username.toLowerCase().replace(/\s/g, ""),
      description,
      location,
      email,
      links,
      avatar_url: avatarUrl,
      cover_url: coverUrl,
    }).eq("id", channel.id);
    setSaving(false);
    router.push("/my-channel");
  };

  const handleDeleteStep = async () => {
    if (deleteStep < 4) {
      setDeleteStep(s => s + 1);
    } else {
      if (!channel) return;
      setDeleting(true);
      await supabase.from("posts").delete().eq("user_id", channel.owner_id);
      await supabase.from("channels").delete().eq("id", channel.id);
      setDeleting(false);
      router.push("/feed");
    }
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
        <p className="text-white font-semibold">{cropType === "avatar" ? "Аватар" : "Шапка"}</p>
        <button onClick={handleCropConfirm} disabled={uploading}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
          {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-5 h-5 text-white" />}
        </button>
      </div>
      <div className="flex-1 relative">
        <Cropper image={cropSrc} crop={crop} zoom={zoom}
          aspect={cropType === "avatar" ? 1 : 16 / 9}
          cropShape={cropType === "avatar" ? "round" : "rect"}
          showGrid={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
      </div>
      <div className="px-8 py-6">
        <input type="range" min={1} max={3} step={0.01} value={zoom}
          onChange={e => setZoom(Number(e.target.value))} className="w-full accent-purple-500" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-8">
      <div className="flex justify-center">
        <div className="w-full max-w-xl">

          <div className="flex items-center gap-3 px-4 pt-14 pb-4">
            <button onClick={() => router.back()} className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <h1 className="text-white font-bold text-lg flex-1">Редактировать канал</h1>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 rounded-2xl text-white text-sm font-semibold disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>

          {/* Шапка */}
          <div className="relative mx-4 mb-4">
            <div className="h-28 rounded-2xl overflow-hidden cursor-pointer"
              style={{ background: coverUrl ? undefined : "linear-gradient(135deg, rgba(61,90,254,0.3), rgba(123,92,255,0.3))", border: "1px solid rgba(255,255,255,0.08)" }}
              onClick={() => coverRef.current?.click()}>
              {coverUrl ? (
                <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <Camera className="w-6 h-6 text-white/30" />
                  <p className="text-white/30 text-xs">Добавить шапку</p>
                </div>
              )}
            </div>
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, "cover")} />

            <div className="absolute -bottom-8 left-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-[#0a0a0f] cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}
                  onClick={() => avatarRef.current?.click()}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white/60" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                  <Camera className="w-3 h-3 text-white" />
                </div>
              </div>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, "avatar")} />
            </div>
          </div>

          <div className="px-4 mt-12 space-y-4">
            <div>
              <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Название</p>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Название канала"
                className="w-full px-4 py-3 rounded-2xl text-white text-sm placeholder-white/30 focus:outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>

            <div>
              <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Псевдоним</p>
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-white/30 text-sm">@</span>
                <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  placeholder="mychannel"
                  className="flex-1 bg-transparent text-white text-sm placeholder-white/30 focus:outline-none" />
              </div>
            </div>

            <div>
              <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Описание</p>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Расскажите о вашем канале..." rows={3}
                className="w-full px-4 py-3 rounded-2xl text-white text-sm placeholder-white/30 focus:outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>

            <div>
              <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Ссылки</p>
              <div className="space-y-2">
                {links.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="text-white/60 text-sm flex-1 truncate">{link}</span>
                    <button onClick={() => setLinks(links.filter((_, idx) => idx !== i))}>
                      <X className="w-4 h-4 text-white/30" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input value={newLink} onChange={e => setNewLink(e.target.value)}
                    placeholder="https://..."
                    onKeyDown={e => { if (e.key === "Enter" && newLink.trim()) { setLinks([...links, newLink.trim()]); setNewLink(""); } }}
                    className="flex-1 px-4 py-3 rounded-2xl text-white text-sm placeholder-white/30 focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }} />
                  <button onClick={() => { if (newLink.trim()) { setLinks([...links, newLink.trim()]); setNewLink(""); } }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Plus className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Страна</p>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Например: Россия"
                className="w-full px-4 py-3 rounded-2xl text-white text-sm placeholder-white/30 focus:outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>

            <div>
              <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Email для связи</p>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" type="email"
                className="w-full px-4 py-3 rounded-2xl text-white text-sm placeholder-white/30 focus:outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>

            <div className="pt-8">
              <div className="h-px bg-white/[0.06] mb-6" />
              <button
                onClick={() => { setDeleteStep(0); setShowDeleteModal(true); }}
                className="w-full py-3 rounded-2xl text-red-400 text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: "rgba(255,50,50,0.08)", border: "1px solid rgba(255,50,50,0.15)" }}>
                <Trash2 className="w-4 h-4" />
                Удалить канал
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="w-full max-w-xl rounded-3xl p-6 mb-4"
            style={{ background: "rgba(15,15,25,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-white font-semibold text-center mb-2">Шаг {deleteStep + 1} из 5</p>
            <p className="text-white/70 text-sm text-center mb-6">{DELETE_WARNINGS[deleteStep]}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-2xl text-white/60 text-sm"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                Отмена
              </button>
              <button onClick={handleDeleteStep} disabled={deleting}
                className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold disabled:opacity-40"
                style={{ background: "rgba(255,50,50,0.3)", border: "1px solid rgba(255,50,50,0.4)" }}>
                {deleting ? "Удаление..." : deleteStep < 4 ? "Продолжить" : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}