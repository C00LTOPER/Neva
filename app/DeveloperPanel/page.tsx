"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_CODE = "X9kP2mQvL8nR4tWjZ6yA3sDfHcUbE7oI1gNpKqMw5xVT0YlCe";

export default function AdminLogin() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      if (code === ADMIN_CODE) {
        localStorage.setItem("neva_admin_auth", ADMIN_CODE);
        router.push("/DeveloperPanel/dashboard");
      } else {
        setError(true);
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(61,90,254,0.12) 0%, rgba(7,7,15,1) 70%)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
            <span className="text-2xl">⚙️</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Developer Panel</h1>
          <p className="text-white/40 text-sm mt-1">Введите код доступа</p>
        </div>
        <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <input
            type="password"
            value={code}
            onChange={e => { setCode(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="Код доступа..."
            className="w-full px-4 py-3 rounded-2xl text-white text-sm placeholder-white/25 focus:outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${error ? "rgba(255,60,60,0.5)" : "rgba(255,255,255,0.09)"}` }}
          />
          {error && <p className="text-red-400 text-xs mt-2 text-center">Неверный код доступа</p>}
          <button onClick={handleSubmit} disabled={!code || loading}
            className="w-full mt-4 py-3 rounded-2xl text-white font-semibold text-sm disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
            {loading ? "Проверка..." : "Войти"}
          </button>
        </div>
      </div>
    </div>
  );
}
