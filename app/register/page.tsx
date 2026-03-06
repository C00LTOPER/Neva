"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

const COUNTRIES = [
  { name: "Австралия", code: "AU", flag: "🇦🇺", dial: "+61", format: "XXX XXX XXX", digits: 9 },
  { name: "Австрия", code: "AT", flag: "🇦🇹", dial: "+43", format: "XXX XXXXXXX", digits: 10 },
  { name: "Азербайджан", code: "AZ", flag: "🇦🇿", dial: "+994", format: "XX XXX XX XX", digits: 9 },
  { name: "Албания", code: "AL", flag: "🇦🇱", dial: "+355", format: "XX XXX XXXX", digits: 9 },
  { name: "Алжир", code: "DZ", flag: "🇩🇿", dial: "+213", format: "XXX XXX XXXX", digits: 10 },
  { name: "Ангола", code: "AO", flag: "🇦🇴", dial: "+244", format: "XXX XXX XXX", digits: 9 },
  { name: "Аргентина", code: "AR", flag: "🇦🇷", dial: "+54", format: "XXX XXX XXXX", digits: 10 },
  { name: "Армения", code: "AM", flag: "🇦🇲", dial: "+374", format: "XX XXX XXX", digits: 8 },
  { name: "Афганистан", code: "AF", flag: "🇦🇫", dial: "+93", format: "XX XXX XXXX", digits: 9 },
  { name: "Бангладеш", code: "BD", flag: "🇧🇩", dial: "+880", format: "XXXX XXXXXX", digits: 10 },
  { name: "Беларусь", code: "BY", flag: "🇧🇾", dial: "+375", format: "XX XXX-XX-XX", digits: 9 },
  { name: "Бельгия", code: "BE", flag: "🇧🇪", dial: "+32", format: "XXX XX XX XX", digits: 9 },
  { name: "Болгария", code: "BG", flag: "🇧🇬", dial: "+359", format: "XXX XXX XXX", digits: 9 },
  { name: "Боливия", code: "BO", flag: "🇧🇴", dial: "+591", format: "XXXXXXXX", digits: 8 },
  { name: "Босния и Герцеговина", code: "BA", flag: "🇧🇦", dial: "+387", format: "XX XXX XXX", digits: 8 },
  { name: "Бразилия", code: "BR", flag: "🇧🇷", dial: "+55", format: "XX XXXXX-XXXX", digits: 11 },
  { name: "Великобритания", code: "GB", flag: "🇬🇧", dial: "+44", format: "XXXX XXXXXX", digits: 10 },
  { name: "Венгрия", code: "HU", flag: "🇭🇺", dial: "+36", format: "XX XXX XXXX", digits: 9 },
  { name: "Венесуэла", code: "VE", flag: "🇻🇪", dial: "+58", format: "XXX XXX XXXX", digits: 10 },
  { name: "Вьетнам", code: "VN", flag: "🇻🇳", dial: "+84", format: "XXX XXX XXXX", digits: 10 },
  { name: "Гана", code: "GH", flag: "🇬🇭", dial: "+233", format: "XX XXX XXXX", digits: 9 },
  { name: "Германия", code: "DE", flag: "🇩🇪", dial: "+49", format: "XXXX XXXXXXX", digits: 11 },
  { name: "Греция", code: "GR", flag: "🇬🇷", dial: "+30", format: "XXX XXX XXXX", digits: 10 },
  { name: "Грузия", code: "GE", flag: "🇬🇪", dial: "+995", format: "XXX XX XX XX", digits: 9 },
  { name: "Дания", code: "DK", flag: "🇩🇰", dial: "+45", format: "XX XX XX XX", digits: 8 },
  { name: "Египет", code: "EG", flag: "🇪🇬", dial: "+20", format: "XXX XXX XXXX", digits: 10 },
  { name: "Израиль", code: "IL", flag: "🇮🇱", dial: "+972", format: "XX XXX XXXX", digits: 9 },
  { name: "Индия", code: "IN", flag: "🇮🇳", dial: "+91", format: "XXXXX XXXXX", digits: 10 },
  { name: "Индонезия", code: "ID", flag: "🇮🇩", dial: "+62", format: "XXX XXXX XXXX", digits: 11 },
  { name: "Иордания", code: "JO", flag: "🇯🇴", dial: "+962", format: "X XXXX XXXX", digits: 9 },
  { name: "Ирак", code: "IQ", flag: "🇮🇶", dial: "+964", format: "XXX XXX XXXX", digits: 10 },
  { name: "Иран", code: "IR", flag: "🇮🇷", dial: "+98", format: "XXX XXX XXXX", digits: 10 },
  { name: "Ирландия", code: "IE", flag: "🇮🇪", dial: "+353", format: "XX XXX XXXX", digits: 9 },
  { name: "Исландия", code: "IS", flag: "🇮🇸", dial: "+354", format: "XXX XXXX", digits: 7 },
  { name: "Испания", code: "ES", flag: "🇪🇸", dial: "+34", format: "XXX XXX XXX", digits: 9 },
  { name: "Италия", code: "IT", flag: "🇮🇹", dial: "+39", format: "XXX XXX XXXX", digits: 10 },
  { name: "Йемен", code: "YE", flag: "🇾🇪", dial: "+967", format: "XXX XXX XXX", digits: 9 },
  { name: "Казахстан", code: "KZ", flag: "🇰🇿", dial: "+7", format: "XXX XXX-XX-XX", digits: 10 },
  { name: "Камбоджа", code: "KH", flag: "🇰🇭", dial: "+855", format: "XX XXX XXX", digits: 8 },
  { name: "Камерун", code: "CM", flag: "🇨🇲", dial: "+237", format: "XXXX XXXX", digits: 8 },
  { name: "Канада", code: "CA", flag: "🇨🇦", dial: "+1", format: "XXX XXX-XXXX", digits: 10 },
  { name: "Катар", code: "QA", flag: "🇶🇦", dial: "+974", format: "XXXX XXXX", digits: 8 },
  { name: "Кения", code: "KE", flag: "🇰🇪", dial: "+254", format: "XXX XXX XXX", digits: 9 },
  { name: "Кипр", code: "CY", flag: "🇨🇾", dial: "+357", format: "XX XXX XXX", digits: 8 },
  { name: "Китай", code: "CN", flag: "🇨🇳", dial: "+86", format: "XXX XXXX XXXX", digits: 11 },
  { name: "Колумбия", code: "CO", flag: "🇨🇴", dial: "+57", format: "XXX XXX XXXX", digits: 10 },
  { name: "Кувейт", code: "KW", flag: "🇰🇼", dial: "+965", format: "XXXX XXXX", digits: 8 },
  { name: "Кыргызстан", code: "KG", flag: "🇰🇬", dial: "+996", format: "XXX XXX XXX", digits: 9 },
  { name: "Латвия", code: "LV", flag: "🇱🇻", dial: "+371", format: "XX XXX XXX", digits: 8 },
  { name: "Ливан", code: "LB", flag: "🇱🇧", dial: "+961", format: "XX XXX XXX", digits: 8 },
  { name: "Литва", code: "LT", flag: "🇱🇹", dial: "+370", format: "XXX XXXXX", digits: 8 },
  { name: "Люксембург", code: "LU", flag: "🇱🇺", dial: "+352", format: "XXX XXX XXX", digits: 9 },
  { name: "Малайзия", code: "MY", flag: "🇲🇾", dial: "+60", format: "XX XXXX XXXX", digits: 10 },
  { name: "Марокко", code: "MA", flag: "🇲🇦", dial: "+212", format: "XXX XXX XXX", digits: 9 },
  { name: "Мексика", code: "MX", flag: "🇲🇽", dial: "+52", format: "XXX XXX XXXX", digits: 10 },
  { name: "Молдова", code: "MD", flag: "🇲🇩", dial: "+373", format: "XX XXX XXX", digits: 8 },
  { name: "Монголия", code: "MN", flag: "🇲🇳", dial: "+976", format: "XXXX XXXX", digits: 8 },
  { name: "Нигерия", code: "NG", flag: "🇳🇬", dial: "+234", format: "XXX XXX XXXX", digits: 10 },
  { name: "Нидерланды", code: "NL", flag: "🇳🇱", dial: "+31", format: "X XX XX XX XX", digits: 9 },
  { name: "Новая Зеландия", code: "NZ", flag: "🇳🇿", dial: "+64", format: "XX XXX XXXX", digits: 9 },
  { name: "Норвегия", code: "NO", flag: "🇳🇴", dial: "+47", format: "XXX XX XXX", digits: 8 },
  { name: "ОАЭ", code: "AE", flag: "🇦🇪", dial: "+971", format: "XX XXX XXXX", digits: 9 },
  { name: "Оман", code: "OM", flag: "🇴🇲", dial: "+968", format: "XXXX XXXX", digits: 8 },
  { name: "Пакистан", code: "PK", flag: "🇵🇰", dial: "+92", format: "XXX XXX XXXX", digits: 10 },
  { name: "Перу", code: "PE", flag: "🇵🇪", dial: "+51", format: "XXX XXX XXX", digits: 9 },
  { name: "Польша", code: "PL", flag: "🇵🇱", dial: "+48", format: "XXX XXX XXX", digits: 9 },
  { name: "Португалия", code: "PT", flag: "🇵🇹", dial: "+351", format: "XXX XXX XXX", digits: 9 },
  { name: "Румыния", code: "RO", flag: "🇷🇴", dial: "+40", format: "XXX XXX XXX", digits: 9 },
  { name: "Россия", code: "RU", flag: "🇷🇺", dial: "+7", format: "XXX XXX-XX-XX", digits: 10 },
  { name: "Саудовская Аравия", code: "SA", flag: "🇸🇦", dial: "+966", format: "XX XXX XXXX", digits: 9 },
  { name: "Сербия", code: "RS", flag: "🇷🇸", dial: "+381", format: "XX XXX XXXX", digits: 9 },
  { name: "Сингапур", code: "SG", flag: "🇸🇬", dial: "+65", format: "XXXX XXXX", digits: 8 },
  { name: "Словакия", code: "SK", flag: "🇸🇰", dial: "+421", format: "XXX XXX XXX", digits: 9 },
  { name: "Словения", code: "SI", flag: "🇸🇮", dial: "+386", format: "XX XXX XXX", digits: 8 },
  { name: "США", code: "US", flag: "🇺🇸", dial: "+1", format: "XXX XXX-XXXX", digits: 10 },
  { name: "Таджикистан", code: "TJ", flag: "🇹🇯", dial: "+992", format: "XX XXX XXXX", digits: 9 },
  { name: "Таиланд", code: "TH", flag: "🇹🇭", dial: "+66", format: "XX XXX XXXX", digits: 9 },
  { name: "Тунис", code: "TN", flag: "🇹🇳", dial: "+216", format: "XX XXX XXX", digits: 8 },
  { name: "Туркменистан", code: "TM", flag: "🇹🇲", dial: "+993", format: "XX XXXXXX", digits: 8 },
  { name: "Турция", code: "TR", flag: "🇹🇷", dial: "+90", format: "XXX XXX XX XX", digits: 10 },
  { name: "Украина", code: "UA", flag: "🇺🇦", dial: "+380", format: "XX XXX XX XX", digits: 9 },
  { name: "Уругвай", code: "UY", flag: "🇺🇾", dial: "+598", format: "X XXX XXXX", digits: 8 },
  { name: "Узбекистан", code: "UZ", flag: "🇺🇿", dial: "+998", format: "XX XXX XX XX", digits: 9 },
  { name: "Филиппины", code: "PH", flag: "🇵🇭", dial: "+63", format: "XXX XXX XXXX", digits: 10 },
  { name: "Финляндия", code: "FI", flag: "🇫🇮", dial: "+358", format: "XX XXX XXXX", digits: 9 },
  { name: "Франция", code: "FR", flag: "🇫🇷", dial: "+33", format: "X XX XX XX XX", digits: 9 },
  { name: "Хорватия", code: "HR", flag: "🇭🇷", dial: "+385", format: "XX XXX XXX", digits: 8 },
  { name: "Чехия", code: "CZ", flag: "🇨🇿", dial: "+420", format: "XXX XXX XXX", digits: 9 },
  { name: "Чили", code: "CL", flag: "🇨🇱", dial: "+56", format: "X XXXX XXXX", digits: 9 },
  { name: "Швейцария", code: "CH", flag: "🇨🇭", dial: "+41", format: "XX XXX XX XX", digits: 9 },
  { name: "Швеция", code: "SE", flag: "🇸🇪", dial: "+46", format: "XX XXX XX XX", digits: 9 },
  { name: "Шри-Ланка", code: "LK", flag: "🇱🇰", dial: "+94", format: "XX XXX XXXX", digits: 9 },
  { name: "Эстония", code: "EE", flag: "🇪🇪", dial: "+372", format: "XXXX XXXX", digits: 8 },
  { name: "Эфиопия", code: "ET", flag: "🇪🇹", dial: "+251", format: "XX XXX XXXX", digits: 9 },
  { name: "Южная Корея", code: "KR", flag: "🇰🇷", dial: "+82", format: "XX XXXX XXXX", digits: 10 },
  { name: "Южная Африка", code: "ZA", flag: "🇿🇦", dial: "+27", format: "XX XXX XXXX", digits: 9 },
  { name: "Япония", code: "JP", flag: "🇯🇵", dial: "+81", format: "XX XXXX XXXX", digits: 10 },
];

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

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c => c.code === "RU")!);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
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

  const checkUsername = async (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(clean);
    if (clean.length < 3) { setUsernameError("Минимум 3 символа"); return; }
    const { data } = await supabase.from("profiles").select("id").eq("username", clean).maybeSingle();
    if (data) setUsernameError("Этот username уже занят");
    else setUsernameError(null);
  };

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleRegister = async () => {
    setError(null);
    if (!fullName.trim()) { setError("Введите имя"); return; }
    if (!username.trim() || usernameError) { setError("Проверьте username"); return; }
    if (!validateEmail(email)) { setError("Введите корректный email"); return; }
    if (phone.replace(/\D/g, "").length < selectedCountry.digits) {
      setError(`Введите корректный номер (${selectedCountry.digits} цифр)`); return;
    }
    if (password.length < 6) { setError("Пароль минимум 6 символов"); return; }
    if (password !== passwordConfirm) { setError("Пароли не совпадают"); return; }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          username: username.trim(),
          phone: selectedCountry.dial + phone.replace(/\D/g, ""),
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) setError("Этот email уже зарегистрирован");
      else setError("Ошибка: " + signUpError.message);
      setLoading(false);
      return;
    }

    setStep("otp");
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: "signup" });
    if (error) { setError("Неверный код. Попробуйте снова"); setLoading(false); return; }
    if (data.session) {
      await supabase.from("profiles").upsert({
        id: data.session.user.id,
        full_name: fullName.trim(),
        username: username.trim(),
        phone: selectedCountry.dial + phone.replace(/\D/g, ""),
      });
      router.replace("/feed");
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setTimer(60);
    await supabase.auth.resend({ type: "signup", email });
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.dial.includes(countrySearch)
  );

  if (step === "otp") return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(61,90,254,0.2) 0%, rgba(123,92,255,0.15) 40%, #0a0a0f 70%)" }}>
      <div className="w-full max-w-sm px-6">
        <div className="rounded-3xl p-8"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
          <button onClick={() => setStep("form")} className="text-white/40 text-sm mb-6 flex items-center gap-2">
            ← Назад
          </button>
          <h1 className="text-2xl font-bold text-white text-center mb-2">Подтвердите email</h1>
          <p className="text-white/40 text-sm text-center mb-8">
            Код отправлен на <span className="text-blue-400">{email}</span>
          </p>
          <div className="space-y-4">
            <input placeholder="Введите код" value={otp} onChange={e => setOtp(e.target.value)}
              maxLength={10} style={{ ...inputStyle, textAlign: "center", fontSize: "24px", letterSpacing: "8px" }} />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6}
              className="w-full py-3.5 rounded-2xl text-white font-semibold disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
              {loading ? "Проверяем..." : "Подтвердить"}
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden py-8"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(61,90,254,0.2) 0%, rgba(123,92,255,0.15) 40%, #0a0a0f 70%)" }}>

      {showCountryPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setShowCountryPicker(false)}>
          <div className="w-full max-w-sm rounded-t-3xl pb-8"
            style={{ background: "rgba(15,15,25,0.98)", border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-4 mb-4" />
            <div className="px-4 mb-3">
              <input value={countrySearch} onChange={e => setCountrySearch(e.target.value)}
                placeholder="Поиск страны..." style={{ ...inputStyle, height: "44px" }} />
            </div>
            <div className="overflow-y-auto max-h-80">
              {filteredCountries.map(c => (
                <button key={c.code + c.dial} onClick={() => { setSelectedCountry(c); setPhone(""); setShowCountryPicker(false); setCountrySearch(""); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition text-left">
                  <span className="text-2xl">{c.flag}</span>
                  <span className="text-white text-sm flex-1">{c.name}</span>
                  <span className="text-white/40 text-sm">{c.dial}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm px-6">
        <div className="rounded-3xl p-8"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>

          <h1 className="text-3xl font-bold text-white text-center mb-2">Регистрация</h1>
          <p className="text-white/40 text-sm text-center mb-8">Создайте аккаунт в NEVA</p>

          <div className="space-y-3">

            <div>
              <p className="text-white/40 text-xs mb-1.5 uppercase tracking-wider">Имя</p>
              <input value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Ваше имя" style={inputStyle} />
            </div>

            <div>
              <p className="text-white/40 text-xs mb-1.5 uppercase tracking-wider">Username</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
                <input value={username} onChange={e => checkUsername(e.target.value)}
                  placeholder="username" style={{ ...inputStyle, paddingLeft: "28px" }} />
              </div>
              {usernameError && <p className="text-red-400 text-xs mt-1">{usernameError}</p>}
              {username.length >= 3 && !usernameError && <p className="text-green-400 text-xs mt-1">✓ Доступен</p>}
            </div>

            <div>
              <p className="text-white/40 text-xs mb-1.5 uppercase tracking-wider">Email</p>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@mail.com" style={inputStyle} />
              {email && !validateEmail(email) && <p className="text-red-400 text-xs mt-1">Введите корректный email</p>}
            </div>

            <div>
              <p className="text-white/40 text-xs mb-1.5 uppercase tracking-wider">Телефон</p>
              <div className="flex gap-2">
                <button onClick={() => setShowCountryPicker(true)}
                  className="flex items-center gap-1.5 px-3 rounded-2xl shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", height: "52px" }}>
                  <span className="text-xl">{selectedCountry.flag}</span>
                  <span className="text-white text-sm">{selectedCountry.dial}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                </button>
                <input value={phone}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, "");
                    if (digits.length <= selectedCountry.digits) setPhone(digits);
                  }}
                  placeholder={selectedCountry.format}
                  style={{ ...inputStyle, flex: 1 }} />
              </div>
              <p className="text-white/25 text-xs mt-1">Формат: {selectedCountry.dial} {selectedCountry.format}</p>
            </div>

            <div>
              <p className="text-white/40 text-xs mb-1.5 uppercase tracking-wider">Пароль</p>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов" style={{ ...inputStyle, paddingRight: "44px" }} />
                <button onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-white/40 text-xs mb-1.5 uppercase tracking-wider">Повторите пароль</p>
              <div className="relative">
                <input type={showPasswordConfirm ? "text" : "password"} value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  placeholder="Повторите пароль" style={{ ...inputStyle, paddingRight: "44px" }} />
                <button onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
                  {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordConfirm && password !== passwordConfirm && (
                <p className="text-red-400 text-xs mt-1">Пароли не совпадают</p>
              )}
              {passwordConfirm && password === passwordConfirm && password.length >= 6 && (
                <p className="text-green-400 text-xs mt-1">✓ Пароли совпадают</p>
              )}
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button onClick={handleRegister} disabled={loading}
              className="w-full py-3.5 rounded-2xl text-white font-semibold disabled:opacity-40 transition mt-2"
              style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
              {loading ? "Создаём аккаунт..." : "Зарегистрироваться"}
            </button>
          </div>

          <p className="text-white/40 text-sm text-center mt-6">
            Уже есть аккаунт?{" "}
            <a href="/login" className="text-blue-400">Войти</a>
          </p>
        </div>
      </div>
    </main>
  );
}