"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, FileText, Tv, Flag, Bell, LogOut } from "lucide-react";

const ADMIN_CODE = "X9kP2mQvL8nR4tWjZ6yA3sDfHcUbE7oI1gNpKqMw5xVT0YlCe";

const navItems = [
  { href: "/DeveloperPanel/dashboard", icon: LayoutDashboard, label: "Дашборд", color: "#3D5AFE" },
  { href: "/DeveloperPanel/users", icon: Users, label: "Пользователи", color: "#7B5CFF" },
  { href: "/DeveloperPanel/posts", icon: FileText, label: "Посты", color: "#00B4D8" },
  { href: "/DeveloperPanel/channels", icon: Tv, label: "Каналы", color: "#06D6A0" },
  { href: "/DeveloperPanel/reports", icon: Flag, label: "Жалобы", color: "#FFD93D" },
  { href: "/DeveloperPanel/broadcast", icon: Bell, label: "Рассылка", color: "#FF6B6B" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("neva_admin_auth");
    if (auth !== ADMIN_CODE) { router.replace("/DeveloperPanel"); return; }
    setReady(true);
  }, []);

  const logout = () => {
    localStorage.removeItem("neva_admin_auth");
    router.replace("/DeveloperPanel");
  };

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#07070F" }}>
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "#07070F" }}>
      <div className="w-56 shrink-0 flex flex-col" style={{ background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-5 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
              <span className="text-sm">⚙️</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">Dev Panel</p>
              <p className="text-white/30 text-xs">NEVA Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label, color }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition"
                style={{ background: active ? "rgba(255,255,255,0.06)" : "transparent" }}>
                <Icon className="w-4 h-4 shrink-0" style={{ color: active ? color : "rgba(255,255,255,0.3)" }} />
                <span className="text-sm" style={{ color: active ? "white" : "rgba(255,255,255,0.4)" }}>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-5">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-red-400 hover:bg-red-400/10 transition">
            <LogOut className="w-4 h-4 shrink-0" /> Выйти
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
