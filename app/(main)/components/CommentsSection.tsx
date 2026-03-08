"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ThumbsUp, ThumbsDown, CornerDownRight, Mic, MicOff, Send, X, Play, Pause, Flag, MoreHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabase";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  return `${days} дн. назад`;
}

// ─── AudioPlayer ────────────────────────────────────────────────────────────
function AudioPlayer({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl mt-1.5 max-w-[260px]"
      style={{ background: "rgba(61,90,254,0.12)", border: "1px solid rgba(61,90,254,0.2)" }}>
      <audio ref={audioRef} src={url}
        onTimeUpdate={() => { if (audioRef.current) { setCurrent(audioRef.current.currentTime); setProgress(audioRef.current.currentTime / (audioRef.current.duration || 1) * 100); } }}
        onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrent(0); }} />
      <button onClick={toggle}
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition"
        style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
        {playing
          ? <Pause className="w-3.5 h-3.5 text-white" />
          : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className="relative h-1.5 rounded-full bg-white/10 cursor-pointer"
          onClick={e => {
            if (!audioRef.current) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = pct * audioRef.current.duration;
          }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow"
            style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }} />
        </div>
        <div className="flex justify-between">
          <span className="text-white/40 text-[10px]">{fmt(current)}</span>
          <span className="text-white/40 text-[10px]">{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── VoiceRecorder ───────────────────────────────────────────────────────────
function VoiceRecorder({ onDone, onCancel }: { onDone: (blob: Blob) => void; onCancel: () => void }) {
  const [seconds, setSeconds] = useState(0);
  const [bars, setBars] = useState<number[]>(Array(20).fill(3));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    let stream: MediaStream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const mr = new MediaRecorder(stream);
        chunksRef.current = [];
        mr.ondataavailable = e => chunksRef.current.push(e.data);
        mr.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          onDone(blob);
          stream.getTracks().forEach(t => t.stop());
        };
        mr.start();
        mediaRecorderRef.current = mr;

        timerRef.current = setInterval(() => setSeconds(s => {
          if (s >= 119) { mr.stop(); return s; }
          return s + 1;
        }), 1000);

        const animate = () => {
          const data = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(data);
          setBars(Array.from({ length: 20 }, (_, i) => Math.max(3, (data[i] || 0) / 4)));
          animFrameRef.current = requestAnimationFrame(animate);
        };
        animate();
      } catch {
        alert("Нет доступа к микрофону");
        onCancel();
      }
    })();
    return () => {
      clearInterval(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const stop = () => { clearInterval(timerRef.current); mediaRecorderRef.current?.stop(); };
  const cancel = () => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(animFrameRef.current);
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
    onCancel();
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{ background: "rgba(255,40,40,0.08)", border: "1px solid rgba(255,40,40,0.2)" }}>
      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
      <span className="text-red-400 text-sm font-mono shrink-0">{fmt(seconds)}</span>
      <div className="flex items-center gap-0.5 flex-1 h-6">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-full transition-all duration-75"
            style={{ height: `${Math.min(h, 24)}px`, background: "linear-gradient(to top, #ff4444, #ff8888)" }} />
        ))}
      </div>
      <button onClick={stop}
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
        <Send className="w-3.5 h-3.5 text-white" />
      </button>
      <button onClick={cancel}
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white/10">
        <X className="w-3.5 h-3.5 text-white/60" />
      </button>
    </div>
  );
}

// ─── CommentInput ────────────────────────────────────────────────────────────
function CommentInput({ currentUserId, currentUserProfile, postId, parentId, onSent, placeholder = "Написать комментарий...", compact = false }: {
  currentUserId: string; currentUserProfile: any; postId: string; parentId?: string;
  onSent: (comment: any) => void; placeholder?: string; compact?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if ((!text.trim() && !audioBlob) || !currentUserId) return;
    setSending(true);
    let audioUrl = null;
    if (audioBlob) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const path = `comments/${session.user.id}/${Date.now()}.webm`;
        await supabase.storage.from("images").upload(path, audioBlob, { contentType: "audio/webm" });
        const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(path);
        audioUrl = publicUrl;
      }
    }
    const { data } = await supabase.from("comments")
      .insert({ post_id: postId, user_id: currentUserId, content: text.trim() || null, parent_id: parentId || null, audio_url: audioUrl })
      .select("*, profiles(id, full_name, username, avatar_url)").single();
    if (data) onSent(data);
    setText(""); setAudioBlob(null); setFocused(false); setSending(false);
  };

  if (!currentUserId) return null;

  return (
    <div className={`flex gap-2.5 ${compact ? "" : "items-start"}`}>
      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-white/10 mt-0.5"
        style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
        {currentUserProfile?.avatar_url
          ? <img src={currentUserProfile.avatar_url} alt="you" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">{currentUserProfile?.full_name?.[0] || "?"}</span>
            </div>}
      </div>
      <div className="flex-1">
        {recording ? (
          <VoiceRecorder
            onDone={blob => { setAudioBlob(blob); setRecording(false); setFocused(true); }}
            onCancel={() => setRecording(false)} />
        ) : audioBlob ? (
          <div className="space-y-2">
            <AudioPlayer url={URL.createObjectURL(audioBlob)} />
            <div className="flex gap-2">
              <button onClick={() => setAudioBlob(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white/40 text-xs"
                style={{ background: "rgba(255,255,255,0.05)" }}>
                <X className="w-3 h-3" /> Удалить
              </button>
              <button onClick={handleSend} disabled={sending}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-xs disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                <Send className="w-3 h-3" /> {sending ? "..." : "Отправить"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="relative">
              {focused ? (
                <textarea value={text} onChange={e => setText(e.target.value)} autoFocus rows={3}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-2xl text-white text-sm placeholder-white/25 focus:outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(61,90,254,0.4)" }} />
              ) : (
                <div onClick={() => setFocused(true)}
                  className="w-full px-3 py-2.5 rounded-2xl text-white/25 text-sm cursor-text"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {placeholder}
                </div>
              )}
            </div>
            {focused && (
              <div className="flex items-center justify-between mt-2">
                <button onClick={() => setRecording(true)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Mic className="w-3.5 h-3.5 text-white/50" />
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { setFocused(false); setText(""); }}
                    className="px-4 py-1.5 rounded-xl text-white/40 text-sm"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    Отмена
                  </button>
                  <button onClick={handleSend} disabled={!text.trim() || sending}
                    className="px-4 py-1.5 rounded-xl text-white text-sm disabled:opacity-40 transition"
                    style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                    {sending ? "..." : "Отправить"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CommentItem ─────────────────────────────────────────────────────────────
function CommentItem({ comment, currentUserId, currentUserProfile, postId, depth = 0 }: {
  comment: any; currentUserId: string; currentUserProfile: any; postId: string; depth?: number;
}) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const [showReply, setShowReply] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<any[]>(comment.replies || []);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUserId) return;
    supabase.from("comment_likes").select("*").eq("comment_id", comment.id).eq("user_id", currentUserId).maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [comment.id, currentUserId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLike = async () => {
    if (!currentUserId) return;
    if (liked) {
      await supabase.from("comment_likes").delete().eq("comment_id", comment.id).eq("user_id", currentUserId);
      await supabase.from("comments").update({ likes_count: Math.max(0, likesCount - 1) }).eq("id", comment.id);
      setLiked(false); setLikesCount((c: number) => Math.max(0, c - 1));
    } else {
      await supabase.from("comment_likes").insert({ comment_id: comment.id, user_id: currentUserId });
      await supabase.from("comments").update({ likes_count: likesCount + 1 }).eq("id", comment.id);
      setLiked(true); setLikesCount((c: number) => c + 1);
    }
  };

  const handleReplyAdded = (newReply: any) => {
    setReplies(prev => [...prev, newReply]);
    setShowReplies(true);
    setShowReply(false);
  };

  return (
    <div className={`${depth > 0 ? "ml-10 mt-3" : ""}`}
      style={{ animation: "fadeIn 0.2s ease" }}>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-white/10 mt-0.5"
          style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
          {comment.profiles?.avatar_url
            ? <img src={comment.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">{comment.profiles?.full_name?.[0] || "?"}</span>
              </div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-white font-semibold text-xs truncate">{comment.profiles?.full_name || "Пользователь"}</span>
              <span className="text-white/25 text-xs shrink-0">{timeAgo(comment.created_at)}</span>
            </div>
            <div className="relative shrink-0" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition">
                <MoreHorizontal className="w-3.5 h-3.5 text-white/25" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-7 z-30 w-40 rounded-2xl overflow-hidden border border-white/10"
                  style={{ background: "rgba(18,18,32,0.98)", backdropFilter: "blur(20px)" }}>
                  <button onClick={() => { setShowMenu(false); alert("Жалоба отправлена"); }}
                    className="w-full px-4 py-3 text-left text-red-400 text-sm hover:bg-white/5 flex items-center gap-2 transition">
                    <Flag className="w-3.5 h-3.5 shrink-0" /> Пожаловаться
                  </button>
                </div>
              )}
            </div>
          </div>

          {comment.content && (
            <p className="text-white/80 text-sm mt-1 leading-relaxed break-words">{comment.content}</p>
          )}
          {comment.audio_url && <AudioPlayer url={comment.audio_url} />}

          <div className="flex items-center gap-3 mt-2">
            <button onClick={handleLike} className="flex items-center gap-1.5 transition group">
              <ThumbsUp className={`w-3.5 h-3.5 transition ${liked ? "text-blue-400" : "text-white/25 group-hover:text-white/50"}`} strokeWidth={1.5} />
              {likesCount > 0 && <span className={`text-xs ${liked ? "text-blue-400" : "text-white/25"}`}>{likesCount}</span>}
            </button>
            {depth === 0 && (
              <button onClick={() => setShowReply(!showReply)}
                className="flex items-center gap-1 text-white/25 hover:text-white/60 transition text-xs">
                <CornerDownRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                Ответить
              </button>
            )}
          </div>

          {showReply && depth === 0 && (
            <div className="mt-3" style={{ animation: "fadeIn 0.15s ease" }}>
              <CommentInput
                currentUserId={currentUserId}
                currentUserProfile={currentUserProfile}
                postId={postId}
                parentId={comment.id}
                onSent={handleReplyAdded}
                placeholder={`Ответить ${comment.profiles?.full_name || ""}...`}
                compact
              />
              <button onClick={() => setShowReply(false)} className="mt-1.5 text-white/25 text-xs hover:text-white/50 transition">Отмена</button>
            </div>
          )}

          {replies.length > 0 && depth === 0 && (
            <button onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1.5 mt-3 text-blue-400 text-xs hover:text-blue-300 transition">
              {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showReplies ? "Скрыть" : `Показать ответы (${replies.length})`}
            </button>
          )}
        </div>
      </div>

      {showReplies && replies.length > 0 && depth === 0 && (
        <div style={{ animation: "fadeIn 0.2s ease" }}>
          {replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} currentUserId={currentUserId}
              currentUserProfile={currentUserProfile} postId={postId} depth={1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CommentsSection (main export) ──────────────────────────────────────────
export default function CommentsSection({ postId, currentUserId, currentUserProfile }: {
  postId: string; currentUserId: string; currentUserProfile: any;
}) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"new" | "top">("new");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  const loadComments = useCallback(async (sortBy: "new" | "top", pageNum: number, reset = false) => {
    const orderCol = sortBy === "new" ? "created_at" : "likes_count";
    const from = pageNum * PAGE_SIZE;
    const { data } = await supabase.from("comments")
      .select("*, profiles(id, full_name, username, avatar_url)")
      .eq("post_id", postId).is("parent_id", null)
      .order(orderCol, { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    const withReplies = await Promise.all((data || []).map(async c => {
      const { data: reps } = await supabase.from("comments")
        .select("*, profiles(id, full_name, username, avatar_url)")
        .eq("parent_id", c.id).order("created_at", { ascending: true });
      return { ...c, replies: reps || [] };
    }));

    if (reset) setComments(withReplies);
    else setComments(prev => [...prev, ...withReplies]);
    setHasMore((data || []).length === PAGE_SIZE);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    setLoading(true);
    setPage(0);
    loadComments(sort, 0, true);
  }, [sort, postId]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadComments(sort, next);
  };

  const handleNewComment = (c: any) => {
    setComments(prev => [{ ...c, replies: [] }, ...prev]);
  };

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  return (
    <>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div className="mt-2 pb-8">
        {/* Заголовок + сортировка */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-white font-semibold text-sm">{totalCount > 0 ? `${totalCount} комментариев` : "Комментарии"}</span>
          <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)" }}>
            {(["new", "top"] as const).map(s => (
              <button key={s} onClick={() => setSort(s)}
                className="px-3 py-1 rounded-xl text-xs transition"
                style={{
                  background: sort === s ? "linear-gradient(135deg, #3D5AFE, #7B5CFF)" : "transparent",
                  color: sort === s ? "white" : "rgba(255,255,255,0.4)"
                }}>
                {s === "new" ? "Новые" : "Популярные"}
              </button>
            ))}
          </div>
        </div>

        {/* Поле ввода */}
        <div className="mb-5">
          <CommentInput
            currentUserId={currentUserId}
            currentUserProfile={currentUserProfile}
            postId={postId}
            onSent={handleNewComment}
          />
        </div>

        <div className="h-px bg-white/[0.05] mb-4" />

        {/* Список */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-white/20">
            <span className="text-3xl mb-2">💬</span>
            <p className="text-sm">Пока нет комментариев</p>
            <p className="text-xs mt-1">Будьте первым!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {comments.map(c => (
              <CommentItem key={c.id} comment={c} currentUserId={currentUserId}
                currentUserProfile={currentUserProfile} postId={postId} />
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <button onClick={handleLoadMore}
            className="w-full mt-5 py-2.5 rounded-2xl text-white/40 text-sm transition hover:text-white/70"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            Показать ещё
          </button>
        )}
      </div>
    </>
  );
}