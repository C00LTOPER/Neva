"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

const errorMessages: Record<string, string> = {
  "Invalid email": "Неверный формат email",
  "Invalid login credentials": "Неверный email или пароль",
  "Email not confirmed": "Email не подтверждён, проверьте почту",
  "Too many requests": "Слишком много попыток, подождите немного",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "52px",
  padding: "0 16px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "white",
  fontSize: "14px",
  outline: "none",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(errorMessages[error.message] || "Произошла ошибка, попробуйте снова");
      setLoading(false);
      return;
    }
    router.replace("/feed");
    setLoading(false);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(61,90,254,0.2) 0%, rgba(123,92,255,0.15) 40%, #0a0a0f 70%)" }}>
      <div className="w-full max-w-sm px-6">
        <div className="rounded-3xl p-8"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>

          <div className="flex flex-col items-center mb-8">
            <div className="mb-4">
              <span className="text-5xl font-black tracking-widest"
                style={{ background: "linear-gradient(135deg, #7B8FFF, #3D5AFE, #7B5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                NEVA
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white text-center">Добро пожаловать</h1>
            <p className="text-white/40 text-sm mt-1 text-center">Войдите в свой аккаунт</p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-white/40 text-xs mb-1.5 uppercase tracking-wider">Email</p>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@mail.com" autoComplete="email" style={inputStyle}
                onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1.5 uppercase tracking-wider">Пароль</p>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Введите пароль" autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()} />
                <button onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button onClick={handleLogin} disabled={loading || !email || !password}
              className="w-full py-3.5 rounded-2xl text-white font-semibold disabled:opacity-40 transition mt-2"
              style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
              {loading ? "Входим..." : "Войти"}
            </button>
          </div>

          <p className="text-white/40 text-sm text-center mt-6">
            Нет аккаунта?{" "}
            <a href="/register" className="text-blue-400">Зарегистрироваться</a>
          </p>
        </div>
      </div>
    </main>
  );
}