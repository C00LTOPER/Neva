"use client";

import { useState, useEffect } from "react";
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
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (step === "otp") {
      setTimer(60);
      setCanResend(false);
      const interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) { clearInterval(interval); setCanResend(true); return 0; }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(errorMessages[error.message] || "Произошла ошибка, попробуйте снова");
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    const { error: otpError } = await supabase.auth.signInWithOtp({ email });
    if (otpError) {
      setError("Не удалось отправить код, попробуйте снова");
      setLoading(false);
      return;
    }

    setStep("otp");
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "magiclink" });
    if (error) { setError("Неверный код. Попробуйте снова"); setLoading(false); return; }
    router.push("/feed");
  };

  const handleResend = async () => {
    setError(null);
    setCanResend(false);
    setTimer(60);
    await supabase.auth.signInWithOtp({ email });
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  if (step === "otp") return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(61,90,254,0.2) 0%, rgba(123,92,255,0.15) 40%, #0a0a0f 70%)" }}>
      <div className="w-full max-w-sm px-6">
        <div className="rounded-3xl p-8"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
          <button onClick={() => setStep("form")} className="text-white/40 text-sm mb-6 flex items-center gap-2">
            ← Назад
          </button>
          <h1 className="text-2xl font-bold text-white text-center mb-2">Подтвердите вход</h1>
          <p className="text-white/40 text-sm text-center mb-8">
            Код отправлен на <span className="text-blue-400">{email}</span>
          </p>
          <div className="space-y-4">
            <input placeholder="Введите код" value={otp} onChange={e => setOtp(e.target.value)}
              maxLength={8} style={{ ...inputStyle, textAlign: "center", fontSize: "24px", letterSpacing: "8px" }} />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6}
              className="w-full py-3.5 rounded-2xl text-white font-semibold disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
              {loading ? "Проверяем..." : "Войти"}
            </button>
          </div>
          <div className="text-center mt-6">
            {canResend ? (
              <button onClick={handleResend} className="text-blue-400 text-sm">Отправить ещё раз</button>
            ) : (
              <p className="text-white/30 text-sm">
                Повторная отправка через {String(Math.floor(timer / 60)).padStart(2, "0")}:{String(timer % 60).padStart(2, "0")}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(61,90,254,0.2) 0%, rgba(123,92,255,0.15) 40%, #0a0a0f 70%)" }}>
      <div className="w-full max-w-sm px-6">
        <div className="rounded-3xl p-8"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>

          {/* Логотип */}
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
            {/* Email */}
            <div>
              <p className="text-white/40 text-xs mb-1.5 uppercase tracking-wider">Email</p>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@mail.com" autoComplete="email" style={inputStyle} />
            </div>

            {/* Пароль */}
            <div>
              <p className="text-white/40 text-xs mb-1.5 uppercase tracking-wider">Пароль</p>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Введите пароль" autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: "44px" }} />
                <button onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button onClick={handleLogin} disabled={loading}
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