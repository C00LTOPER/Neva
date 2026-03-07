"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Repeat2, Eye, MoreHorizontal, X, ThumbsUp, ThumbsDown, Share2, Flag, Send } from "lucide-react";
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

export function renderHashtags(text: string, router: any, expanded: boolean, isLong: boolean) {
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

function CommentsSheet({ postId, currentUserId, onClose }: { postId: string; currentUserId: string; onClose: () => void }) {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("comments")
        .select("*, profiles(id, full_name, username, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      setComments(data || []);
      setLoading(false);
    };
    load();
  }, [postId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSend = async () => {
    if (!text.trim() || !currentUserId) return;
    setSending(true);
    const { data } = await supabase
      .from("comments")
      .insert({ post_id: postId, user_id: currentUserId, content: text.trim() })
      .select("*, profiles(id, full_name, username, avatar_url)")
      .single();
    if (data) setComments(prev => [...prev, data]);
    setText("");
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-xl rounded-t-3xl flex flex-col"
        style={{ background: "rgba(12,12,22,0.99)", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "80vh" }}
        onClick={e => e.stopPropagation()}>

        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-4 mb-2 shrink-0" />
        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <h2 className="text-white font-bold text-base">Комментарии</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="h-px bg-white/[0.06] shrink-0" />

        {/* Список комментариев */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
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
              <div key={comment.id} className="flex gap-3">
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
                  <div className="flex items-baseline gap-2">
                    <span className="text-white font-semibold text-xs">{comment.profiles?.full_name || "Пользователь"}</span>
                    <span className="text-white/25 text-xs">{timeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-white/80 text-sm mt-0.5 leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Поле ввода */}
        <div className="px-4 py-3 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {currentUserId ? (
            <div className="flex gap-2 items-center">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Написать комментарий..."
                className="flex-1 px-4 py-2.5 rounded-2xl text-white text-sm placeholder-white/30 focus:outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
              <button onClick={handleSend} disabled={!text.trim() || sending}
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-40 transition"
                style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-2">Войдите чтобы комментировать</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, currentUserId }: { post: any; currentUserId: string }) {
  const router = useRouter();
  const [views, setViews] = useState(post.views || 0);
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
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
      const { count: cc } = await supabase.from("comments").select("*", { count: "exact" }).eq("post_id", post.id);
      setLikesCount(lc || 0);
      setCommentsCount(cc || 0);
      if (currentUserId) {
        const { data: ld } = await supabase.from("likes").select("*").eq("post_id", post.id).eq("user_id", currentUserId).eq("type", "like").maybeSingle();
        const { data: dd } = await supabase.from("likes").select("*").eq("post_id", post.id).eq("user_id", currentUserId).eq("type", "dislike").maybeSingle();
        setLiked(!!ld);
        setDisliked(!!dd);
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
        setDisliked(false);
      }
      await supabase.from("likes").insert({ post_id: post.id, user_id: currentUserId, type: "like" });
      setLiked(true); setLikesCount(c => c + 1);
    }
  };

  const handleDislike = async () => {
    if (!currentUserId) return;
    if (disliked) {
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", currentUserId).eq("type", "dislike");
      setDisliked(false);
    } else {
      if (liked) {
        await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", currentUserId).eq("type", "like");
        setLiked(false); setLikesCount(c => c - 1);
      }
      await supabase.from("likes").insert({ post_id: post.id, user_id: currentUserId, type: "dislike" });
      setDisliked(true);
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
        <CommentsSheet
          postId={post.id}
          currentUserId={currentUserId}
          onClose={() => { setShowComments(false); supabase.from("comments").select("*", { count: "exact" }).eq("post_id", post.id).then(({ count }) => setCommentsCount(count || 0)); }}
        />
      )}

      <div className="flex justify-center px-4">
        <div className="w-full max-w-xl rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 10px 40px -5px rgba(123, 92, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)"
          }}>

          <div className="flex items-center gap-3 p-4 pb-2">
            <button onClick={() => post.channels?.id && router.push(`/channel/${post.channels.id}`)}>
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10 shrink-0"
                style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                {post.channels?.avatar_url ? (
                  <img src={post.channels.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : post.profiles?.avatar_url ? (
                  <img src={post.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {post.channels?.name?.[0] || post.profiles?.full_name?.[0] || "?"}
                    </span>
                  </div>
                )}
              </div>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {post.channels?.name || post.profiles?.full_name || "Без имени"}
              </p>
              <p className="text-white/40 text-xs mt-0.5">{timeAgo(post.created_at)}</p>
            </div>
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition">
                <MoreHorizontal className="w-5 h-5 text-white/50" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-10 z-20 w-40 rounded-2xl overflow-hidden border border-white/10"
                  style={{ background: "rgba(20, 20, 40, 0.95)", backdropFilter: "blur(20px)" }}>
                  <button
                    onClick={() => { setShowMenu(false); alert("Жалоба отправлена"); }}
                    className="w-full px-4 py-3 text-left text-red-400 text-sm hover:bg-white/5 transition flex items-center gap-2">
                    <Flag className="w-4 h-4 text-red-400 shrink-0" strokeWidth={1.5} />
                    <span>Пожаловаться</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {post.content && (
            <div className="px-4 py-2">
              <p className="text-white/90 text-sm leading-relaxed">
                {renderHashtags(post.content, router, expanded, isLong)}
              </p>
              {isLong && (
                <button onClick={() => setExpanded(!expanded)} className="text-blue-400 text-xs mt-1 hover:text-blue-300 transition">
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

          <div className="px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button onClick={handleLike}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-200"
                style={{ background: liked ? activeBtnStyle : btnStyle, border: "1px solid rgba(255,255,255,0.08)" }}>
                <ThumbsUp className="w-4 h-4 text-white" strokeWidth={1.5} />
                <span className="text-white text-xs font-medium">{formatCount(likesCount)}</span>
              </button>
              <button onClick={handleDislike}
                className="flex items-center justify-center px-3 py-2 rounded-2xl transition-all duration-200"
                style={{ background: disliked ? activeBtnStyle : btnStyle, border: "1px solid rgba(255,255,255,0.08)" }}>
                <ThumbsDown className="w-4 h-4 text-white" strokeWidth={1.5} />
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
              <button className="flex items-center justify-center px-3 py-2 rounded-2xl transition"
                style={{ background: btnStyle, border: "1px solid rgba(255,255,255,0.08)" }}>
                <Repeat2 className="w-4 h-4 text-white/70" strokeWidth={1.5} />
              </button>
              <button
                className="flex items-center justify-center px-3 py-2 rounded-2xl transition"
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

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data } = await supabase
        .from("posts")
        .select(`*, profiles(id, full_name, username, avatar_url)`)
        .order("created_at", { ascending: false });

      const { data: activeChannels } = await supabase
        .from("channels")
        .select("id, name, avatar_url, owner_id")
        .is("deleted_at", null);

      const channelMap: Record<string, any> = {};
      (activeChannels || []).forEach((c: any) => { channelMap[c.owner_id] = c; });

      const postsWithChannels = (data || []).map((p: any) => ({
        ...p,
        channels: channelMap[p.user_id] || null
      }));

      setPosts(postsWithChannels);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: "radial-gradient(ellipse at 50% 30%, rgba(61, 90, 254, 0.15) 0%, rgba(123, 92, 255, 0.1) 40%, #0a0a0f 70%)"
    }}>
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-bold text-white">Лента</h1>
      </div>
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-white/20">
          <p className="text-lg font-medium">Пока нет постов</p>
          <p className="text-sm mt-1">Будьте первым!</p>
        </div>
      ) : (
        <div className="space-y-4 pb-8">
          {posts.map(post => (
            <PostCard key={post.id} post={post} currentUserId={currentUser?.id} />
          ))}
        </div>
      )}
    </div>
  );
}