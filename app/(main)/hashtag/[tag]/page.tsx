"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, MessageCircle, Repeat2, Eye, MoreHorizontal, X, ThumbsUp, ThumbsDown, Share2, Flag } from "lucide-react";
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

function renderContent(text: string, router: any) {
  const parts = text.split(/(#[а-яёa-z0-9_]+)/gi);
  return parts.map((part, i) => {
    if (/^#[а-яёa-z0-9_]+$/i.test(part)) {
      return (
        <span key={i} style={{ color: "#3D8BFE" }} className="cursor-pointer"
          onClick={e => { e.stopPropagation(); router.push(`/hashtag/${encodeURIComponent(part.slice(1).toLowerCase())}`); }}>
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function PostCard({ post, currentUserId, channelMap }: { post: any; currentUserId: string; channelMap: Record<string, any> }) {
  const router = useRouter();
  const channel = channelMap[post.user_id] || null;
  const [views, setViews] = useState(post.views || 0);
  const [expanded, setExpanded] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
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
      setLikesCount(lc || 0);
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

      <div className="flex justify-center">
        <div className="w-full max-w-xl rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 10px 40px -5px rgba(123, 92, 255, 0.3)"
          }}>

          <div className="flex items-center gap-3 p-4 pb-2">
            <button onClick={() => channel && router.push(`/channel/${channel.id}`)}>
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10 shrink-0"
                style={{ background: "linear-gradient(135deg, #3D5AFE, #7B5CFF)" }}>
                {channel?.avatar_url ? (
                  <img src={channel.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{channel?.name?.[0] || "?"}</span>
                  </div>
                )}
              </div>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{channel?.name || "Без имени"}</p>
              <p className="text-white/40 text-xs mt-0.5">{timeAgo(post.created_at)}</p>
            </div>
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition">
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
                {expanded || !isLong
                  ? renderContent(post.content, router)
                  : renderContent(post.content.slice(0, 120) + "...", router)}
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

          <div className="px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button onClick={handleLike}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all"
                style={{ background: liked ? activeBtnStyle : btnStyle, border: "1px solid rgba(255,255,255,0.08)" }}>
                <ThumbsUp className="w-4 h-4 text-white" strokeWidth={1.5} />
                <span className="text-white text-xs font-medium">{formatCount(likesCount)}</span>
              </button>
              <button onClick={handleDislike}
                className="flex items-center justify-center px-3 py-2 rounded-2xl transition-all"
                style={{ background: disliked ? activeBtnStyle : btnStyle, border: "1px solid rgba(255,255,255,0.08)" }}>
                <ThumbsDown className="w-4 h-4 text-white" strokeWidth={1.5} />
              </button>
              <div className="flex items-center gap-1 px-2">
                <Eye className="w-3.5 h-3.5 text-white/25" strokeWidth={1.5} />
                <span className="text-xs text-white/25">{formatCount(views)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-2xl"
                style={{ background: btnStyle, border: "1px solid rgba(255,255,255,0.08)" }}>
                <MessageCircle className="w-4 h-4 text-white/70" strokeWidth={1.5} />
                <span className="text-xs text-white/70">0</span>
              </button>
              <button className="flex items-center justify-center px-3 py-2 rounded-2xl"
                style={{ background: btnStyle, border: "1px solid rgba(255,255,255,0.08)" }}>
                <Repeat2 className="w-4 h-4 text-white/70" strokeWidth={1.5} />
              </button>
              <button className="flex items-center justify-center px-3 py-2 rounded-2xl"
                style={{ background: btnStyle, border: "1px solid rgba(255,255,255,0.08)" }}
                onClick={() => {
                  const url = `${window.location.origin}/post/${post.id}`;
                  try { navigator.clipboard.writeText(url); alert("Ссылка скопирована!"); } catch { alert(url); }
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

export default function HashtagPage() {
  const router = useRouter();
  const params = useParams();
  const tag = "#" + decodeURIComponent(params.tag as string).toLowerCase();
  const [posts, setPosts] = useState<any[]>([]);
  const [channelMap, setChannelMap] = useState<Record<string, any>>({});
  const [postsCount, setPostsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: postHashtags } = await supabase
        .from("post_hashtags")
        .select("post_id")
        .eq("tag", tag);

      const postIds = (postHashtags || []).map((ph: any) => ph.post_id);
      setPostsCount(postIds.length);

      if (postIds.length > 0) {
        const { data: postsData } = await supabase
          .from("posts")
          .select("*")
          .in("id", postIds)
          .order("created_at", { ascending: false });

        setPosts(postsData || []);

        const { data: channels } = await supabase
          .from("channels")
          .select("id, name, avatar_url, owner_id")
          .is("deleted_at", null);

        const map: Record<string, any> = {};
        (channels || []).forEach((c: any) => { map[c.owner_id] = c; });
        setChannelMap(map);
      }

      setLoading(false);
    };
    load();
  }, [tag]);

  const formatCount = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + " млн";
    if (n >= 1000) return (n / 1000).toFixed(1) + " тыс.";
    return n.toString();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-8">
      <div className="flex justify-center">
        <div className="w-full max-w-xl">

          <div className="px-4 pt-14 pb-4">
            <button onClick={() => router.back()} className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <h1 className="text-2xl font-bold" style={{ color: "#3D8BFE" }}>{tag}</h1>
            <p className="text-white/40 text-sm mt-1">{formatCount(postsCount)} постов</p>
          </div>

          <div className="h-px bg-white/[0.06] mx-4 mb-4" />

          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-white/20">
              <p className="text-sm">Нет постов с этим хештегом</p>
            </div>
          ) : (
            <div className="px-4 space-y-4">
              {posts.map(post => (
                <PostCard key={post.id} post={post} currentUserId={currentUser?.id} channelMap={channelMap} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}