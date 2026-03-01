"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Send, Image, X } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      // Загружаем чат
      const { data: chat } = await supabase
        .from("chats")
        .select(`*, user1:user1_id(id, full_name, username, avatar_url), user2:user2_id(id, full_name, username, avatar_url)`)
        .eq("id", chatId)
        .single();

      if (chat) {
        const other = chat.user1?.id === user.id ? chat.user2 : chat.user1;
        setOtherUser(other);
      }

      // Загружаем сообщения
      const { data: msgs } = await supabase
        .from("messages")
        .select(`*, sender:sender_id(id, full_name, avatar_url)`)
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);
      setLoading(false);
    };
    load();

    // Realtime подписка
    const channel = supabase
      .channel(`chat_${chatId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chatId}`,
      }, async (payload) => {
        const { data: newMsg } = await supabase
          .from("messages")
          .select(`*, sender:sender_id(id, full_name, avatar_url)`)
          .eq("id", payload.new.id)
          .single();
        if (newMsg) setMessages(prev => [...prev, newMsg]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() && !imagePreview) return;
    if (!currentUser) return;

    const content = newMessage.trim();
    setNewMessage("");

    await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: currentUser.id,
      content,
      image_url: imagePreview,
    });

    setImagePreview(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setUploading(true);

    const path = `${currentUser.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("images").upload(path, file);
    if (error) { setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(path);
    setImagePreview(publicUrl);
    setUploading(false);
  };

  const timeFormat = (date: string) => {
    return new Date(date).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0f]">
      {/* Шапка */}
      <div className="flex items-center gap-3 px-4 pt-14 pb-4 border-b border-white/[0.06] bg-[#0a0a0f]/95 backdrop-blur-xl fixed top-0 left-0 right-0 z-10">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden shrink-0">
          {otherUser?.avatar_url ? (
            <img src={otherUser.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-bold text-sm">{otherUser?.full_name?.[0] || "?"}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{otherUser?.full_name || "Без имени"}</p>
          <p className="text-white/40 text-xs">@{otherUser?.username || "username"}</p>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-4 pt-32 pb-28">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-white/20">
            <p className="text-sm">Начните диалог!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isMe = msg.sender_id === currentUser?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    {msg.image_url && (
                      <img src={msg.image_url} alt="img" className="rounded-2xl max-w-full max-h-60 object-cover" />
                    )}
                    {msg.content && (
                      <div className={`px-4 py-2.5 rounded-3xl text-sm leading-relaxed ${
                        isMe
                          ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-br-sm"
                          : "bg-white/[0.07] text-white/90 rounded-bl-sm"
                      }`}>
                        {msg.content}
                      </div>
                    )}
                    <span className="text-white/20 text-xs px-1">{timeFormat(msg.created_at)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Поле ввода */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/[0.06]">
        {imagePreview && (
          <div className="relative w-20 h-20 mb-2">
            <img src={imagePreview} alt="preview" className="w-full h-full rounded-2xl object-cover" />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/80 flex items-center justify-center"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => imageRef.current?.click()}
            className="w-10 h-10 rounded-2xl bg-white/[0.07] flex items-center justify-center shrink-0 hover:bg-white/10 transition"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Image className="w-4 h-4 text-white/50" />
            )}
          </button>
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <div className="flex-1 flex items-center gap-2 px-4 h-11 rounded-2xl bg-white/[0.07] border border-white/[0.08]">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Сообщение..."
              className="flex-1 bg-transparent text-white text-sm placeholder-white/30 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() && !imagePreview}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 disabled:opacity-40 hover:opacity-90 transition"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}