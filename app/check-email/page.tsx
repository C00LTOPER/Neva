export default function CheckEmailPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#0b0f2a] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.25),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.3),transparent_45%)]" />
      <div className="relative w-[380px] p-8 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/10 shadow-2xl text-center">
        <div className="text-5xl mb-6">📧</div>
        <h1 className="text-2xl font-semibold text-white mb-4">Проверьте почту!</h1>
        <p className="text-white/60 text-sm">Мы отправили письмо с подтверждением на ваш email. Перейдите по ссылке в письме чтобы войти в NEVA.</p>
        <a href="/login" className="block mt-6 text-blue-400 hover:text-purple-400 transition text-sm">Вернуться ко входу</a>
      </div>
    </main>
  );
}