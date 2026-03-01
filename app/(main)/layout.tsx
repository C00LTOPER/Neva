"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, Bell, Settings } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
    };
    load();
  }, []);

  const tabs = [
    { icon: Home, path: "/chats", label: "Чаты" },
    { icon: Search, path: "/search", label: "Поиск" },
    { icon: Bell, path: "/feed", label: "Лента" },
    { icon: Bell, path: "/subscriptions", label: "Подписки" },
    { icon: Settings, path: "/my-channel", label: "Мой канал" },
  ];

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Затемнение фона когда навигация открыта */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Левая навигация */}
      <div className={`fixed left-0 top-0 bottom-0 z-50 flex transition-all duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-[52px]"}`}>
        {/* Панель иконок */}
        <div className="w-16 flex flex-col items-center py-8 gap-2 bg-[#0d0d1a]/95 backdrop-blur-xl border-r border-white/[0.06]">
          {/* Лого вверху */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
            <span className="text-white font-bold text-sm">N</span>
          </div>

          {/* Кнопки */}
          <div className="flex flex-col items-center gap-1 flex-1">
            {tabs.map((tab) => {
              const isActive = pathname.startsWith(tab.path);
              return (
                <button
                  key={tab.path}
                  onClick={() => { router.push(tab.path); setOpen(false); }}
                  className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-br from-blue-500/20 to-purple-600/20 text-white"
                      : "text-white/30 hover:text-white/60 hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full -ml-[1px]" />
                  )}
                  <tab.icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                </button>
              );
            })}
          </div>

          {/* Настройки */}
          <button
            onClick={() => { router.push("/settings"); setOpen(false); }}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all mb-2 ${
              pathname.startsWith("/settings") ? "text-white" : "text-white/30 hover:text-white/60"
            }`}
          >
            <Settings className="w-5 h-5" strokeWidth={1.5} />
          </button>

          {/* Аватарка пользователя */}
          <button
            onClick={() => { router.push("/profile"); setOpen(false); }}
            className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10 hover:ring-purple-500/50 transition"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="me" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{profile?.full_name?.[0] || "?"}</span>
              </div>
            )}
          </button>
        </div>

        {/* Тонкая линия-триггер справа от навигации */}
        <div
          className="w-1 h-full bg-gradient-to-b from-transparent via-purple-500/30 to-transparent cursor-pointer hover:via-purple-500/60 transition-all"
          onClick={() => setOpen(!open)}
        />
      </div>

      {/* Линия когда навигация закрыта */}
      {!open && (
        <div
          className="fixed left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-purple-500/20 to-transparent cursor-pointer hover:via-purple-500/50 transition-all z-50"
          onClick={() => setOpen(true)}
        />
      )}

      {/* Контент */}
      <main
        className="flex-1 min-h-screen transition-all duration-300"
        onClick={() => open && setOpen(false)}
      >
        {children}
      </main>
    </div>
  );
}