"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, Newspaper, Bookmark, Radio, Search, Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      setProfile(data);
      setChecked(true);
    };
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!checked) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const tabs = [
    { icon: Home, path: "/chats" },
    { icon: Newspaper, path: "/feed" },
    { icon: Bookmark, path: "/subscriptions" },
    { icon: Radio, path: "/my-channel" },
    { icon: Search, path: "/search" },
  ];

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] overflow-hidden">
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      <div className={`fixed left-0 top-0 bottom-0 z-50 flex transition-all duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-[52px]"}`}>
        <div className="w-16 flex flex-col items-center py-8 bg-[#0d0d1a]/95 backdrop-blur-xl border-r border-white/[0.06]">
          <button
            onClick={() => { router.push("/profile"); setOpen(false); }}
            className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10 hover:ring-purple-500/50 transition-all mb-6"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="me" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{profile?.full_name?.[0] || "?"}</span>
              </div>
            )}
          </button>

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

          <button
            onClick={() => { router.push("/settings"); setOpen(false); }}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              pathname.startsWith("/settings")
                ? "bg-gradient-to-br from-blue-500/20 to-purple-600/20 text-white"
                : "text-white/30 hover:text-white/60 hover:bg-white/5"
            }`}
          >
            <Settings className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div
          className="w-1 h-full bg-gradient-to-b from-transparent via-purple-500/30 to-transparent cursor-pointer hover:via-purple-500/60 transition-all"
          onClick={() => setOpen(!open)}
        />
      </div>

      <main className="flex-1 min-h-screen ml-1" onClick={() => open && setOpen(false)}>
        {children}
      </main>
    </div>
  );
}