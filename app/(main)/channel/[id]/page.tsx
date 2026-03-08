"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Share2, Flag, ChevronDown, Calendar, MapPin, Mail, Link2, MessageCircle, Repeat2, Eye, ThumbsUp, ThumbsDown, MoreHorizontal, X, Send, Mic, MicOff, Play, Pause, CornerDownRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days < 30) return `${days} дн. назад`;
  if (months < 12) return `${months} мес. назад`;
  return `${years} лет назад`;
}

function renderHashtags(text: string, router: any, expanded: boolean, isLong: boolean) {
  const displayText = expanded || !isLong ? text : text.slice(0, 120) + "...";
  const parts = displayText.split(/(#[а-яёa-z0-9_]+)/gi);
  return parts.map((part, i) =>
    /^#[а-яёa-z0-9_]+$/i.test(part) ? (
      <span key={i} style={{ color: "#3D8BFE" }} className="cursor-pointer"
        onClick={e => { e.stopPropagation(); router.push(`/hashtag/${encodeURIComponent(part.slice(1).toLowerCase())}`); }}>
        {part}
      </span>
    ) : <span key={i}>{part}</span>
  );
}

function AudioPlayer({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-2xl mt-1"
      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <audio ref={audioRef} src={url}
        onTimeUpdate={() => { if (audioRef.current) setProgress(audioRef.current.currentTime / (audioRef.current.duration || 1) * 100); }}
        onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
        onEnded={() => { setPlaying(false); setProgress(0); }} />
      <button onClick={toggle} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
        {playing ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-white ml-0.5" />}
      </button>
      <div className="flex-1 h-1 rounded-full bg-white/10 relative">
        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }} />
      </div>
      <span className="text-white/30 text-xs shrink-0">{Math.floor(duration)}с</span>
    </div>
  );
}

function CommentItem({ comment, currentUserId, postId, depth = 0, onReplyAdded }: {
  comment: any; currentUserId: string; postId: string; depth?: number; onReplyAdded?: (reply: any, parentId: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!currentUserId) return;
    supabase.from("comment_likes").select("*").eq("comment_id", comment.id).eq("user_id", currentUserId).maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [comment.id, currentUserId]);

  const handleLike = async () => {
    if (!currentUserId) return;
    if (liked) {
      await supabase.from("comment_likes").delete().eq("comment_id", comment.id).eq("user_id", currentUserId);
      await supabase.from("comments").update({ likes_count: likesCount - 1 }).eq("id", comment.id);
      setLiked(false); setLikesCount((c: number) => c - 1);
    } else {
      await supabase.from("comment_likes").insert({ comment_id: comment.id, user_id: currentUserId });
      await supabase.from("comments").update({ likes_count: likesCount + 1 }).eq("id", comment.id);
      setLiked(true); setLikesCount((c: number) => c + 1);
    }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = e => chunksRef.current.push(e.data);
    mr.onstop = () => setAudioBlob(new Blob(chunksRef.current, { type: "audio/webm" }));
    mr.start();
    mediaRecorderRef.current = mr;
    setRecording(true);
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); };

  const handleSendReply = async () => {
    if ((!replyText.trim() && !audioBlob) || !currentUserId) return;
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
      .insert({ post_id: postId, user_id: currentUserId, content: replyText.trim(), parent_id: comment.id, audio_url: audioUrl })
      .select("*, profiles(id, full_name, username, avatar_url)").single();
    if (data && onReplyAdded) onReplyAdded(data, comment.id);
    setReplyText(""); setAudioBlob(null); setShowReply(false); setSending(false);
  };

  return (
    <div className={depth > 0 ? "ml-8 mt-3" : ""}>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-white/10"
          style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
          {comment.profiles?.avatar_url ? (
            <img src={comment.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">{comment.profiles?.full_name?.[0] || "?"}</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-white font-semibold text-xs">{comment.profiles?.full_name || "Пользователь"}</span>
              <span className="text-white/25 text-xs">{timeAgo(comment.created_at)}</span>
            </div>
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10">
                <MoreHorizontal className="w-3.5 h-3.5 text-white/30" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-7 z-30 w-40 rounded-2xl overflow-hidden border border-white/10"
                  style={{ background: "rgba(20,20,40,0.97)", backdropFilter: "blur(20px)" }}>
                  <button onClick={() => { setShowMenu(false); alert("Жалоба отправлена"); }}
                    className="w-full px-4 py-3 text-left text-red-400 text-sm hover:bg-white/5 flex items-center gap-2">
                    <Flag className="w-3.5 h-3.5 shrink-0" />
                    Пожаловаться
                  </button>
                </div>
              )}
            </div>
          </div>
          {comment.content && <p className="text-white/80 text-sm mt-0.5 leading-relaxed">{comment.content}</p>}
          {comment.audio_url && <AudioPlayer url={comment.audio_url} />}
          <div className="flex items-center gap-3 mt-1.5">
            <button onClick={handleLike} className="flex items-center gap-1 transition">
              <ThumbsUp className={`w-3.5 h-3.5 ${liked ? "text-blue-400" : "text-white/30"}`} strokeWidth={1.5} />
              {likesCount > 0 && <span className={`text-xs ${liked ? "text-blue-400" : "text-white/30"}`}>{likesCount}</span>}
            </button>
            {depth === 0 && (
              <button onClick={() => setShowReply(!showReply)} className="flex items-center gap-1 text-white/30 hover:text-white/60 transition">
                <CornerDownRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="text-xs">Ответить</span>
              </button>
            )}
          </div>
          {showReply && (
            <div className="mt-2">
              {audioBlob ? (
                <div className="flex items-center gap-2 mb-2">
                  <AudioPlayer url={URL.createObjectURL(audioBlob)} />
                  <button onClick={() => setAudioBlob(null)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <X className="w-3.5 h-3.5 text-white/60" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <input value={replyText} onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendReply()}
                    placeholder="Ответить..."
                    className="flex-1 px-3 py-2 rounded-2xl text-white text-xs placeholder-white/30 focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }} />
                  <button onClick={recording ? stopRecording : startRecording}
                    className="w-8 h-8 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: recording ? "rgba(255,60,60,0.3)" : "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {recording ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-white/50" />}
                  </button>
                </div>
              )}
              <div className="flex gap-2 mt-1.5">
                <button onClick={() => { setShowReply(false); setAudioBlob(null); setReplyText(""); }}
                  className="text-white/30 text-xs px-3 py-1.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                  Отмена
                </button>
                <button onClick={handleSendReply} disabled={(!replyText.trim() && !audioBlob) || sending}
                  className="flex items-center gap-1 text-white text-xs px-3 py-1.5 rounded-xl disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                  <Send className="w-3 h-3" />
                  {sending ? "..." : "Отправить"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {(comment.replies || []).map((reply: any) => (
        <CommentItem key={reply.id} comment={reply} currentUserId={currentUserId} postId={postId} depth={1} />
      ))}
    </div>
  );
}

function CommentsSheet({ postId, currentUserId, onClose, onCountChange }: {
  postId: string; currentUserId: string; onClose: () => void; onCountChange: (n: number) => void;
}) {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("comments")
        .select("*, profiles(id, full_name, username, avatar_url)")
        .eq("post_id", postId).is("parent_id", null)
        .order("created_at", { ascending: true });
      const topLevel = data || [];
      const withReplies = await Promise.all(topLevel.map(async (c: any) => {
        const { data: replies } = await supabase.from("comments")
          .select("*, profiles(id, full_name, username, avatar_url)")
          .eq("parent_id", c.id).order("created_at", { ascending: true });
        return { ...c, replies: replies || [] };
      }));
      setComments(withReplies);
      const total = withReplies.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
      onCountChange(total);
      setLoading(false);
    };
    load();
  }, [postId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [comments]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = e => chunksRef.current.push(e.data);
    mr.onstop = () => setAudioBlob(new Blob(chunksRef.current, { type: "audio/webm" }));
    mr.start();
    mediaRecorderRef.current = mr;
    setRecording(true);
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); };

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
      .insert({ post_id: postId, user_id: currentUserId, content: text.trim(), audio_url: audioUrl })
      .select("*, profiles(id, full_name, username, avatar_url)").single();
    if (data) {
      const newComment = { ...data, replies: [] };
      setComments(prev => {
        const updated = [...prev, newComment];
        const total = updated.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
        onCountChange(total);
        return updated;
      });
    }
    setText(""); setAudioBlob(null); setSending(false);
  };

  const handleReplyAdded = (reply: any, parentId: string) => {
    setComments(prev => {
      const updated = prev.map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), reply] } : c);
      const total = updated.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
      onCountChange(total);
      return updated;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-xl rounded-t-3xl flex flex-col"
        style={{ background: "rgba(12,12,22,0.99)", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "82vh" }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-4 mb-2 shrink-0" />
        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <h2 className="text-white font-bold text-base">Комментарии</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="h-px bg-white/[0.06] shrink-0" />
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/20">
              <MessageCircle className="w-10 h-10 mb-2" strokeWidth={1} />
              <p className="text-sm">Пока нет комментариев</p>
              <p className="text-xs mt-1">Будьте первым!</p>
            </div>
          ) : (
            comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} currentUserId={currentUserId}
                postId={postId} depth={0} onReplyAdded={handleReplyAdded} />
            ))
          )}
          <div ref={bottomRef} />
        </div>
        <div className="px-4 py-3 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {currentUserId ? (
            <>
              {audioBlob && (
                <div className="flex items-center gap-2 mb-2">
                  <AudioPlayer url={URL.createObjectURL(audioBlob)} />
                  <button onClick={() => setAudioBlob(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              )}
              <div className="flex gap-2 items-center">
                <input value={text} onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Написать комментарий..."
                  className="flex-1 px-4 py-2.5 rounded-2xl text-white text-sm placeholder-white/30 focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }} />
                <button onClick={recording ? stopRecording : startRecording}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: recording ? "rgba(255,60,60,0.3)" : "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {recording ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-white/50" />}
                </button>
                <button onClick={handleSend} disabled={(!text.trim() && !audioBlob) || sending}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </>
          ) : (
            <p className="text-white/30 text-sm text-center py-2">Войдите чтобы комментировать</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, currentUserId, isOwner }: { post: any; currentUserId: string; isOwner: boolean }) {
  const router = useRouter();
  const [views, setViews] = useState(post.views || 0);
  const [expanded, setExpanded] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isLong = post.content?.length > 120;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    if (showMenu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  useEffect(() => {
    const load = async () => {
      const { count: lc } = await supabase.from("likes").select("*", { count: "exact" }).eq("post_id", post.id).eq("type", "like");
      const { count: dc } = await supabase.from("likes").select("*", { count: "exact" }).eq("post_id", post.id).eq("type", "dislike");
      const { count: cc } = await supabase.from("comments").select("*", { count: "exact" }).eq("post_id", post.id);
      setLikesCount(lc || 0); setDislikesCount(dc || 0); setCommentsCount(cc || 0);
      if (currentUserId) {
        const { data: ld } = await supabase.from("likes").select("*").eq("post_id", post.id).eq("user_id", currentUserId).eq("type", "like").maybeSingle();
        const { data: dd } = await supabase.from("likes").select("*").eq("post_id", post.id).eq("user_id", currentUserId).eq("type", "dislike").maybeSingle();
        setLiked(!!ld); setDisliked(!!dd);
      }
    };
    load();
    const viewKey = `viewed_${post.id}`;
    if (!localStorage.getItem(viewKey)) {
      supabase.from("posts").update({ views: (post.views || 0) + 1 }).eq("id", post.id);
      localStorage.setItem(viewKey, "1");
      setViews((post.views || 0) + 1);
    }
  }, [post.id, currentUserId]);

  const handleLike = async () => {
    if (!currentUserId) return;
    if (liked) {
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", currentUserId).eq("type", "like");
      setLiked(false); setLikesCount(c => c - 1);
    } else {
      if (disliked) {
        await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", currentUserId).eq("type", "dislike");
        setDisliked(false); setDislikesCount(c => c - 1);
      }
      await supabase.from("likes").insert({ post_id: post.id, user_id: currentUserId, type: "like" });
      setLiked(true); setLikesCount(c => c + 1);
    }
  };

  const handleDislike = async () => {
    if (!currentUserId) return;
    if (disliked) {
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", currentUserId).eq("type", "dislike");
      setDisliked(false); setDislikesCount(c => c - 1);
    } else {
      if (liked) {
        await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", currentUserId).eq("type", "like");
        setLiked(false); setLikesCount(c => c - 1);
      }
      await supabase.from("likes").insert({ post_id: post.id, user_id: currentUserId, type: "dislike" });
      setDisliked(true); setDislikesCount(c => c + 1);
    }
  };

  const formatCount = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + " млн";
    if (n >= 1000) return (n / 1000).toFixed(1) + " тыс.";
    return n.toString();
  };

  const btnStyle = "rgba(255,255,255,0.07)";
  const activeBtnStyle = "linear-gradient(135deg, #3D5AFE, #7B5CFF)";

  return (
    <>
      {mediaPreview && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" onClick={() => setMediaPreview(null)}>
          <button className="absolute top-14 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
          {mediaPreview.match(/\.(mp4|mov|mpeg|webm)$/i) ? (
            <video src={mediaPreview} controls autoPlay className="max-w-full max-h-full" onClick={e => e.stopPropagation()} />
          ) : (
            <img src={mediaPreview} alt="media" className="max-w-full max-h-full object-contain" />
          )}
        </div>
      )}

      {showComments && (
        <CommentsSheet postId={post.id} currentUserId={currentUserId}
          onClose={() => setShowComments(false)}
          onCountChange={(n) => setCommentsCount(n)} />
      )}

      <div className="flex justify-center">
        <div className="w-full max-w-xl rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 10px 40px -5px rgba(123, 92, 255, 0.3)"
          }}>

          <div className="flex justify-end px-4 pt-3">
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition">
                <MoreHorizontal className="w-5 h-5 text-white/50" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-10 z-20 w-40 rounded-2xl overflow-hidden border border-white/10"
                  style={{ background: "rgba(20, 20, 40, 0.95)", backdropFilter: "blur(20px)" }}>
                  <button onClick={() => { setShowMenu(false); alert("Жалоба отправлена"); }}
                    className="w-full px-4 py-3 text-left text-red-400 text-sm hover:bg-white/5 transition flex items-center gap-2">
                    <Flag className="w-4 h-4 shrink-0" />
                    Пожаловаться
                  </button>
                </div>
              )}
            </div>
          </div>

          {post.content && (
            <div className="px-4 pb-2">
              <p className="text-white/90 text-sm leading-relaxed">
                {renderHashtags(post.content, router, expanded, isLong)}
              </p>
              {isLong && (
                <button onClick={() => setExpanded(!expanded)} className="text-blue-400 text-xs mt-1">
                  {expanded ? "Скрыть" : "Читать далее"}
                </button>
              )}
            </div>
          )}

          {post.image_url && (
            <div className="px-4 pb-2 cursor-pointer" onClick={() => setMediaPreview(post.image_url)}>
              {post.image_url.match(/\.(mp4|mov|mpeg|webm)$/i) ? (
                <div className="relative rounded-2xl overflow-hidden">
                  <video src={post.image_url} className="w-full object-contain" style={{ maxHeight: "300px" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                      <span className="text-white text-xl ml-1">▶</span>
                    </div>
                  </div>
                </div>
              ) : (
                <img src={post.image_url} alt="post" className="w-full rounded-2xl object-contain" style={{ maxHeight: "300px" }} />
              )}
            </div>
          )}

          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={handleLike}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all"
                style={{ background: liked ? activeBtnStyle : btnStyle, border: "1px solid rgba(255,255,255,0.08)" }}>
                <ThumbsUp className="w-4 h-4 text-white" strokeWidth={1.5} />
                <span className="text-white text-xs font-medium">{formatCount(likesCount)}</span>
              </button>
              <button onClick={handleDislike}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all"
                style={{ background: disliked ? activeBtnStyle : btnStyle, border: "1px solid rgba(255,255,255,0.08)" }}>
                <ThumbsDown className="w-4 h-4 text-white" strokeWidth={1.5} />
                {isOwner && <span className="text-white text-xs font-medium">{formatCount(dislikesCount)}</span>}
              </button>
              <div className="flex items-center gap-1 px-2">
                <Eye className="w-3.5 h-3.5 text-white/25" strokeWidth={1.5} />
                <span className="text-xs text-white/25">{formatCount(views)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowComments(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl transition"
                style={{ background: showComments ? activeBtnStyle : btnStyle, border: "1px solid rgba(255,255,255,0.08)" }}>
                <MessageCircle className="w-4 h-4 text-white/70" strokeWidth={1.5} />
                <span className="text-xs text-white/70">{formatCount(commentsCount)}</span>
              </button>
              <button className="flex items-center justify-center px-3 py-2 rounded-2xl"
                style={{ background: btnStyle, border: "1px solid rgba(255,255,255,0.08)" }}>
                <Repeat2 className="w-4 h-4 text-white/70" strokeWidth={1.5} />
              </button>
              <button className="flex items-center justify-center px-3 py-2 rounded-2xl"
                style={{ background: btnStyle, border: "1px solid rgba(255,255,255,0.08)" }}
                onClick={() => {
                  const url = `${window.location.origin}/post/${post.id}`;
                  try { navigator.clipboard.writeText(url); } catch { alert(url); }
                }}>
                <Share2 className="w-4 h-4 text-white/70" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ChannelPage() {
  const router = useRouter();
  const params = useParams();
  const channelId = params.id as string;

  const [channel, setChannel] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [showAbout, setShowAbout] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      const { data: ch } = await supabase.from("channels").select("*").eq("id", channelId).is("deleted_at", null).maybeSingle();
      if (!ch) { setLoading(false); return; }
      setChannel(ch);
      const { data: channelPosts } = await supabase.from("posts").select("*").eq("user_id", ch.owner_id).order("created_at", { ascending: false });
      setPosts(channelPosts || []);
      const views = (channelPosts || []).reduce((acc: number, p: any) => acc + (p.views || 0), 0);
      setTotalViews(views);
      const { count: likesCount } = await supabase.from("likes").select("*", { count: "exact" }).in("post_id", (channelPosts || []).map((p: any) => p.id));
      setTotalLikes(likesCount || 0);
      const { count } = await supabase.from("channel_subscribers").select("*", { count: "exact" }).eq("channel_id", channelId);
      setSubscribersCount(count || 0);
      if (user) {
        const { data: sub } = await supabase.from("channel_subscribers").select("*").eq("channel_id", channelId).eq("user_id", user.id).maybeSingle();
        setSubscribed(!!sub);
      }
      setLoading(false);
    };
    load();
  }, [channelId]);

  const handleSubscribe = async () => {
    if (!currentUser) return;
    setSubscribing(true);
    if (subscribed) {
      await supabase.from("channel_subscribers").delete().eq("channel_id", channelId).eq("user_id", currentUser.id);
      setSubscribed(false); setSubscribersCount(c => c - 1);
    } else {
      await supabase.from("channel_subscribers").insert({ channel_id: channelId, user_id: currentUser.id });
      setSubscribed(true); setSubscribersCount(c => c + 1);
    }
    setSubscribing(false);
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  const formatCount = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + " млн";
    if (n >= 1000) return (n / 1000).toFixed(1) + " тыс.";
    return n.toString();
  };

  const isOwner = currentUser?.id === channel?.owner_id;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!channel) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
      <p className="text-white/40">Канал не найден</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="flex justify-center">
        <div className="w-full max-w-xl">
          <div className="px-4 pt-14 pb-2">
            <button onClick={() => router.back()} className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
          </div>

          {channel.cover_url && (
            <div className="mx-4 rounded-2xl overflow-hidden" style={{ height: "120px" }}>
              <img src={channel.cover_url} alt="cover" className="w-full h-full object-cover" />
            </div>
          )}

          <div className={`px-4 ${channel.cover_url ? "mt-4" : "mt-2"}`}>
            <div className="flex items-center justify-between">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-[#0a0a0f]"
                style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                {channel.avatar_url ? <img src={channel.avatar_url} alt="avatar" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">{channel.name?.[0] || "К"}</span>
                  </div>}
              </div>
              {!isOwner && (
                <button onClick={handleSubscribe} disabled={subscribing}
                  className="px-6 py-2.5 rounded-2xl text-white text-sm font-semibold disabled:opacity-40 transition-all"
                  style={{ background: subscribed ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg, #3D5AFE, #7B5CFF)", border: subscribed ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                  {subscribing ? "..." : subscribed ? "Отписаться" : "Подписаться"}
                </button>
              )}
              {isOwner && (
                <button onClick={() => router.push("/my-channel")}
                  className="px-4 py-2 rounded-2xl text-white text-sm"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Мой канал
                </button>
              )}
            </div>
            <h1 className="text-white text-xl font-bold mt-3">{channel.name}</h1>
            <p className="text-white/40 text-sm">@{channel.username}</p>
            <div className="flex items-center gap-3 mt-2 text-sm text-white/40">
              <span>{formatCount(subscribersCount)} подписчиков</span>
              <span>·</span>
              <span>{posts.length} постов</span>
            </div>
            {channel.description && <p className="text-white/60 text-sm mt-3 leading-relaxed">{channel.description}</p>}
            <button onClick={() => setShowAbout(true)} className="mt-3 text-blue-400 text-sm flex items-center gap-1">
              О канале... <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="h-px bg-white/[0.06] mx-4 my-4" />

          <div className="px-4 pb-8">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/20">
                <p className="text-sm">Нет постов</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} currentUserId={currentUser?.id} isOwner={isOwner} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAbout && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setShowAbout(false)}>
          <div className="w-full max-w-xl rounded-t-3xl pb-8 pt-6 px-6"
            style={{ background: "rgba(15,15,25,0.98)", border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-6" />
            <h2 className="text-white font-bold text-lg mb-4">О канале</h2>
            {channel.description && (
              <div className="mb-4">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Описание</p>
                <p className="text-white/70 text-sm leading-relaxed">{channel.description}</p>
              </div>
            )}
            {(channel.links || []).length > 0 && (
              <div className="mb-4">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Ссылки</p>
                <div className="space-y-2">
                  {(channel.links || []).map((link: string, i: number) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-400 text-sm truncate">
                      <Link2 className="w-3.5 h-3.5 shrink-0" />{link}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-4">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Статистика</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Подписчиков", value: formatCount(subscribersCount) },
                  { label: "Постов", value: posts.length.toString() },
                  { label: "Просмотров", value: formatCount(totalViews) },
                  { label: "Лайков", value: formatCount(totalLikes) },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-2xl text-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <p className="text-white font-bold text-base">{item.value}</p>
                    <p className="text-white/40 text-xs">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 text-sm text-white/40 mb-6">
              {channel.created_at && <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 shrink-0" />Создан {formatDate(channel.created_at)}</p>}
              {channel.location && <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 shrink-0" />{channel.location}</p>}
              {channel.email && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 shrink-0" />Email скрыт</p>}
            </div>
            <div className="space-y-2">
              <button className="w-full py-3 rounded-2xl text-white text-sm flex items-center justify-center gap-2"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
                onClick={() => { const url = `${window.location.origin}/channel/${channel.id}`; try { navigator.clipboard.writeText(url); alert("Ссылка скопирована!"); } catch { alert(url); } }}>
                <Share2 className="w-4 h-4 text-white/60" />Поделиться каналом
              </button>
              <button className="w-full py-3 rounded-2xl text-red-400 text-sm flex items-center justify-center gap-2"
                style={{ background: "rgba(255,50,50,0.06)", border: "1px solid rgba(255,50,50,0.12)" }}
                onClick={() => { setShowAbout(false); alert("Жалоба отправлена"); }}>
                <Flag className="w-4 h-4" />Пожаловаться на канал
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}