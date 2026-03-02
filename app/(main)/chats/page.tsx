"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";
import { Search, Plus } from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function ChatsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [chats, setChats] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUsers, setShowUsers] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      const { data: chatsData } = await supabase
        .from("chats")
        .select(`*, user1:user1_id(id, full_name, username, avatar_url), user2:user2_id(id, full_name, username, avatar_url)`)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      const chatsWithMessages = await Promise.all(
        (chatsData || []).map(async (chat) => {
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("*")
            .eq("chat_id", chat.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          return { ...chat, lastMessage: lastMsg };
        })
      );

      setChats(chatsWithMessages);
      setLoading(false);
    };
    load();
  }, []);

  const loadUsers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").neq("id", user.id);
    setUsers(data || []);
    setShowUsers(true);
  };

  const startChat = async (otherUserId: string) => {
    if (!currentUser) return;
    const { data: existing } = await supabase
      .from("chats")
      .select("*")
      .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${currentUser.id})`)
      .single();

    if (existing) { router.push(`/chats/${existing.id}`); return; }

    const { data: newChat } = await supabase
      .from("chats")
      .insert({ user1_id: currentUser.id, user2_id: otherUserId })
      .select()
      .single();

    if (newChat) router.push(`/chats/${newChat.id}`);
  };

  const getOtherUser = (chat: any) => {
    if (!currentUser) return null;
    return chat.user1?.id === currentUser.id ? chat.user2 : chat.user1;
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "только что";
    if (mins < 60) return `${mins} мин`;
    if (hours < 24) return `${hours} ч`;
    if (days < 7) return `${days} дн`;
    return new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const filteredChats = chats.filter(chat => {
    const other = getOtherUser(chat);
    return other?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
           other?.username?.toLowerCase().includes(search.toLowerCase());
  });

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Заголовок */}
      <div className="px-4 pt-14 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Сообщения</h1>
          <button
            onClick={loadUsers}
            className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center border border-white/10 hover:from-blue-500/30 hover:to-purple-600/30 transition"
          >
            <Plus className="w-4 h-4 text-white/70" />
          </button>
        </div>
        <div className="flex items-center gap-3 px-4 h-11 rounded-2xl bg-white/[0.06] border border-white/[0.08]">
          <Search className="w-4 h-4 text-white/30 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск контактов..."
            className="flex-1 bg-transparent text-white text-sm placeholder-white/30 focus:outline-none"
          />
        </div>
      </div>

      {/* Новый чат */}
      {showUsers && (
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Новый чат</p>
            <button onClick={() => setShowUsers(false)} className="text-white/30 text-xs">Закрыть</button>
          </div>
          <div className="space-y-1 mb-4">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => startChat(user.id)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/[0.04] transition text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-sm">{user.full_name?.[0] || "?"}</span>
                  )}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{user.full_name || "Без имени"}</p>
                  <p className="text-white/40 text-xs">@{user.username || "username"}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="h-px bg-white/[0.06] mb-4" />
        </div>
      )}

      {/* Истории */}
      <div className="px-4 mt-2">
        <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Истории</p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-14 h-14 rounded-full ring-2 ring-purple-500/50 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
              <span className="text-white font-bold">+</span>
            </div>
            <span className="text-white/40 text-xs">Моя</span>
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-white/[0.06] my-3" />

      {/* Чаты */}
      <div className="px-4 pb-8">
        <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">Чаты</p>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/20">
            <p className="text-sm">Нет чатов</p>
            <p className="text-xs mt-1">Нажмите + чтобы начать диалог</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredChats.map((chat) => {
              const other = getOtherUser(chat);
              if (!other) return null;
              return (
                <button
                  key={chat.id}
                  onClick={() => router.push(`/chats/${chat.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/[0.04] transition text-left"
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                      {other.avatar_url ? (
                        <img src={other.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold">{other.full_name?.[0] || "?"}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-white font-medium text-sm truncate">{other.full_name || "Без имени"}</p>
                      {chat.lastMessage && (
                        <p className="text-white/25 text-xs shrink-0 ml-2">{timeAgo(chat.lastMessage.created_at)}</p>
                      )}
                    </div>
                    <p className="text-white/40 text-xs truncate">
                      {chat.lastMessage ? chat.lastMessage.content : "Начните диалог"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}