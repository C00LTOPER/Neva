"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, X } from "lucide-react";
import Cropper from "react-easy-crop";

import { supabase } from "@/lib/supabase";

const ALLOWED_FORMATS = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const ALLOWED_FORMATS_TEXT = "JPG, PNG, WEBP, HEIC";

async function getCroppedImg(imageSrc: string, croppedAreaPixels: any): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => { image.onload = resolve; });
  const canvas = document.createElement("canvas");
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9));
}

export default function EditProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");
  const [formatError, setFormatError] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"avatar" | "cover">("avatar");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setFullName(data.full_name || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || "");
        setCoverUrl(data.cover_url || "");
      }
      setLoading(false);
    };
    getProfile();
  }, []);

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormatError(null);
    setSizeError(null);

    if (!ALLOWED_FORMATS.includes(file.type)) {
      setFormatError(`Неверный формат! Поддерживаются: ${ALLOWED_FORMATS_TEXT}`);
      return;
    }

    if (type === "cover") {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (img.width < 1500 || img.height < 500) {
          setSizeError(`Размер картинки слишком маленький! Должен быть минимум 1500 × 500 px`);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          setCropImage(reader.result as string);
          setCropType(type);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
        };
        reader.readAsDataURL(file);
      };
      img.src = url;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result as string);
      setCropType(type);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleCropSave = async () => {
    if (!cropImage || !croppedAreaPixels) return;
    const blob = await getCroppedImg(cropImage, croppedAreaPixels);
    const file = new File([blob], "image.jpg", { type: "image/jpeg" });
    const bucket = cropType === "avatar" ? "avatars" : "images";
    const path = `${userId}/${cropType}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) return;

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    const url = publicUrl + "?t=" + Date.now();

    if (cropType === "avatar") setAvatarUrl(url);
    else setCoverUrl(url);
    setCropImage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").upsert({
      id: user.id, full_name: fullName, username, bio, avatar_url: avatarUrl, cover_url: coverUrl,
    });
    router.push("/profile");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (cropImage) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex items-center justify-between px-4 pt-14 pb-4">
          <button onClick={() => setCropImage(null)} className="text-white/60 text-sm">Отмена</button>
          <h1 className="text-white font-semibold">
            {cropType === "avatar" ? "Фото профиля" : "Обложка"}
          </h1>
          <button onClick={handleCropSave} className="text-blue-400 font-semibold text-sm">Готово</button>
        </div>
        <div className="relative flex-1">
          <Cropper
            image={cropImage}
            crop={crop}
            zoom={zoom}
            aspect={cropType === "avatar" ? 1 : 3 / 1}
            cropShape={cropType === "avatar" ? "round" : "rect"}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="px-6 py-4">
          <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-blue-500" />
          <p className="text-white/40 text-xs text-center mt-1">Масштаб</p>
        </div>
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
      <div className="flex items-center justify-between px-4 pt-14 pb-4">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white font-semibold text-lg">Редактировать профиль</h1>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
          {saving ? "Сохраняем..." : "Сохранить"}
        </button>
      </div>

      {/* Обложка */}
      <div className="relative h-56 bg-gradient-to-br from-blue-600 to-purple-700">
        {coverUrl && (
          <img
            src={coverUrl}
            alt="cover"
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setPreviewUrl(coverUrl)}
          />
        )}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 gap-1 cursor-pointer"
          onClick={() => coverRef.current?.click()}
        >
          <Camera className="w-6 h-6 text-white/80" />
          <span className="text-white/80 text-sm">Изменить обложку</span>
          <span className="text-white/40 text-xs">Размер картинки должен быть: 1500 × 500 px</span>
        </div>
        <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "cover")} />
      </div>

      {/* Аватар */}
      <div className="px-4 -mt-12 mb-2">
        <div className="relative w-24 h-24">
          <div
            className="w-24 h-24 rounded-full border-4 border-[#0a0a0f] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden cursor-pointer"
            onClick={() => avatarUrl ? setPreviewUrl(avatarUrl) : avatarRef.current?.click()}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl text-white font-bold">{fullName?.[0] || "?"}</span>
            )}
          </div>
          <div
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center border-2 border-[#0a0a0f] cursor-pointer"
            onClick={() => avatarRef.current?.click()}
          >
            <Camera className="w-4 h-4 text-white" />
          </div>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "avatar")} />
        </div>
      </div>

      {/* Ошибки */}
      {(formatError || sizeError) && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-2xl bg-red-500/20 border border-red-500/30">
          <p className="text-red-400 text-sm">{formatError || sizeError}</p>
        </div>
      )}

      <div className="px-4 space-y-4">
        <div>
          <label className="text-white/50 text-sm mb-2 block">Имя</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ваше имя" className="w-full h-12 px-4 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <div>
          <label className="text-white/50 text-sm mb-2 block">Имя пользователя</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@username" className="w-full h-12 px-4 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <div>
          <label className="text-white/50 text-sm mb-2 block">О себе</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Расскажите о себе..." rows={4} className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
        </div>
      </div>
    </div>
  );
}