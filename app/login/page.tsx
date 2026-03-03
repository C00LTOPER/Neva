"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";


import { supabase } from "@/lib/supabase";

const errorMessages: Record<string, string> = {
  "Invalid email": "Неверный формат email",
  "Invalid login credentials": "Неверный email или пароль",
  "Email not confirmed": "Email не подтверждён, проверьте почту",
  "Too many requests": "Слишком много попыток, подождите немного",
};

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
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

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "magiclink",
    });

    if (error) {
      setError("Неверный код. Попробуйте снова");
      setLoading(false);
      return;
    }

    router.push("/");
  };

  const handleResend = async () => {
    setError(null);
    setCanResend(false);
    setTimer(60);

    await supabase.auth.signInWithOtp({ email });

    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const preventCopy = (e: React.ClipboardEvent) => e.preventDefault();

  if (step === "otp") {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-[#0b0f2a] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.25),transparent_40%),radial-gradient(circle_at_75%_75%,rgba(139,92,246,0.3),transparent_45%)]" />
        <div className="relative w-[380px] p-8 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/10 shadow-2xl">
          <button onClick={() => setStep("form")} className="text-white/50 hover:text-white text-sm mb-6 flex items-center gap-2 transition">
            ← Назад
          </button>
          <h1 className="text-2xl font-semibold text-white text-center mb-2">Подтвердите вход</h1>
          <p className="text-white/50 text-sm text-center mb-8">
            Мы отправили код на <span className="text-blue-400">{email}</span>. Введите его ниже.
          </p>
          <div className="space-y-5">
            <input
              placeholder="Введите код"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={8}
              className="w-full h-12 px-4 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-xl tracking-widest"
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 6}
              className="w-full h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Проверяем..." : "Войти"}
            </button>
          </div>
          <div className="text-center mt-6">
            {canResend ? (
              <button onClick={handleResend} className="text-blue-400 hover:text-purple-400 text-sm transition">
                Отправить код ещё раз
              </button>
            ) : (
              <p className="text-white/40 text-sm">
                Отправить снова через {String(Math.floor(timer / 60)).padStart(2, "0")}:{String(timer % 60).padStart(2, "0")}
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#0b0f2a] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.25),transparent_40%),radial-gradient(circle_at_75%_75%,rgba(139,92,246,0.3),transparent_45%)]" />
      <div className="relative w-[380px] p-8 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/10 shadow-2xl">
        <h1 className="text-3xl font-semibold text-white text-center mb-8 tracking-wide">Вход</h1>
        <div className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full h-12 px-4 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onCopy={preventCopy}
            onCut={preventCopy}
            onPaste={preventCopy}
            autoComplete="current-password"
            className="w-full h-12 px-4 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium hover:opacity-90 transition"
          >
            {loading ? "Загрузка..." : "Войти"}
          </button>
        </div>
        <p className="text-white/60 text-sm text-center mt-6">
          Нет аккаунта?{" "}
          <a href="/register" className="text-blue-400 hover:text-purple-400 transition">Зарегистрироваться</a>
        </p>
      </div>
    </main>
  );
}