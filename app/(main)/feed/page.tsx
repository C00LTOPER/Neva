"use client";

import { useState, useEffect, useRef } from "react";

import { useRouter } from "next/navigation";
import { MessageCircle, Repeat2, Eye, Settings, X } from "lucide-react";

import { supabase } from "@/lib/supabase";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days < 7) return `${days} дн. назад`;
  return new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function MediaViewer({ url, onClose }: { url: string; onClose: () => void }) {
  const isVideo = url.match(/\.(mp4|mov|mpeg|webm)$/i);
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" onClick={onClose}>
      <button className="absolute top-14 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center z-10">
        <X className="w-5 h-5 text-white" />
      </button>
      {isVideo ? (
        <video
          src={url}
          controls
          autoPlay
          className="max-w-full max-h-full"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img src={url} alt="media" className="max-w-full max-h-full object-contain" />
      )}
    </div>
  );
}

function LikeDislikeButton({ postId, currentUserId, isOwner }: { postId: string; currentUserId: string; isOwner: boolean }) {
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showDislikeCount, setShowDislikeCount] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [dislikeAnim, setDislikeAnim] = useState(false);
  const dislikeTimer = useRef<any>(null);

  useEffect(() => {
    const load = async () => {
      const { count: lc } = await supabase.from("likes").select("*", { count: "exact" }).eq("post_id", postId).eq("type", "like");
      const { count: dc } = await supabase.from("likes").select("*", { count: "exact" }).eq("post_id", postId).eq("type", "dislike");
      setLikesCount(lc || 0);
      setDislikesCount(dc || 0);
      if (currentUserId) {
        const { data: ld } = await supabase.from("likes").select("*").eq("post_id", postId).eq("user_id", currentUserId).eq("type", "like").single();
        const { data: dd } = await supabase.from("likes").select("*").eq("post_id", postId).eq("user_id", currentUserId).eq("type", "dislike").single();
        setLiked(!!ld);
        setDisliked(!!dd);
      }
    };
    load();
  }, [postId, currentUserId]);

  const handleLike = async () => {
    if (!currentUserId) return;
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    if (liked) {
      await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", currentUserId).eq("type", "like");
      setLiked(false);
      setLikesCount(c => c - 1);
    } else {
      if (disliked) {
        await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", currentUserId).eq("type", "dislike");
        setDisliked(false);
        setDislikesCount(c => c - 1);
      }
      await supabase.from("likes").insert({ post_id: postId, user_id: currentUserId, type: "like" });
      setLiked(true);
      setLikesCount(c => c + 1);
    }
  };

  const handleDislike = async () => {
    if (!currentUserId) return;
    setDislikeAnim(true);
    setTimeout(() => setDislikeAnim(false), 400);
    if (disliked) {
      await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", currentUserId).eq("type", "dislike");
      setDisliked(false);
      setDislikesCount(c => c - 1);
    } else {
      if (liked) {
        await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", currentUserId).eq("type", "like");
        setLiked(false);
        setLikesCount(c => c - 1);
      }
      await supabase.from("likes").insert({ post_id: postId, user_id: currentUserId, type: "dislike" });
      setDisliked(true);
      setDislikesCount(c => c + 1);
    }
  };

  return (
    <div className="flex items-center">
      <div className="flex items-center bg-white/[0.07] rounded-full overflow-hidden">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 transition-all duration-200 ${liked ? "bg-white/15" : "hover:bg-white/10"}`}
        >
          <span className={`transition-all duration-300 text-lg ${likeAnim ? "scale-125" : "scale-100"} inline-block`}>👍</span>
          <span className={`text-xs font-medium ${liked ? "text-white" : "text-white/50"}`}>{likesCount}</span>
        </button>
        <div className="w-px h-5 bg-white/10" />
        <div className="relative">
          <button
            onClick={handleDislike}
            onMouseDown={() => { if (isOwner) dislikeTimer.current = setTimeout(() => setShowDislikeCount(true), 600); }}
            onMouseUp={() => { clearTimeout(dislikeTimer.current); if (showDislikeCount) setTimeout(() => setShowDislikeCount(false), 2000); }}
            onTouchStart={() => { if (isOwner) dislikeTimer.current = setTimeout(() => setShowDislikeCount(true), 600); }}
            onTouchEnd={() => { clearTimeout(dislikeTimer.current); if (showDislikeCount) setTimeout(() => setShowDislikeCount(false), 2000); }}
            className={`flex items-center gap-2 px-4 py-2 transition-all duration-200 ${disliked ? "bg-white/15" : "hover:bg-white/10"}`}
          >
            <span className={`transition-all duration-300 text-lg ${dislikeAnim ? "scale-125" : "scale-100"} inline-block`}>👎</span>
          </button>
          {isOwner && showDislikeCount && (
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-3 py-1.5 rounded-xl whitespace-nowrap border border-white/10">
              {dislikesCount} дизлайков
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, currentUserId }: { post: any; currentUserId: string }) {
  const [views, setViews] = useState(post.views || 0);
  const [expanded, setExpanded] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const isOwner = post.user_id === currentUserId;
  const isLong = post.content?.length > 120;

  useEffect(() => {
    const viewKey = `viewed_${post.id}`;
    if (!localStorage.getItem(viewKey)) {
      supabase.from("posts").update({ views: (post.views || 0) + 1 }).eq("id", post.id);
      localStorage.setItem(viewKey, "1");
      setViews((post.views || 0) + 1);
    }
  }, [post.id]);

  return (
    <>
      {mediaPreview && <MediaViewer url={mediaPreview} onClose={() => setMediaPreview(null)} />}

      <div className="bg-white/[0.04] border border-white/[0.07] rounded-3xl overflow-hidden">
        {/* Автор */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden ring-2 ring-white/10">
            {post.profiles?.avatar_url ? (
              <img src={post.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-xs">{post.profiles?.full_name?.[0] || "?"}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{post.profiles?.full_name || "Без имени"}</p>
            <p className="text-white/35 text-xs">@{post.profiles?.username || "username"} · {timeAgo(post.created_at)}</p>
          </div>
        </div>

        {/* Текст */}
        {post.content && (
          <div className="px-4 pb-2">
            <p className="text-white/80 text-sm leading-relaxed">
              {expanded || !isLong ? post.content : post.content.slice(0, 120) + "..."}
            </p>
            {isLong && (
              <button onClick={() => setExpanded(!expanded)} className="text-blue-400/80 text-xs mt-1 hover:text-blue-400 transition">
                {expanded ? "Скрыть" : "Читать далее"}
              </button>
            )}
          </div>
        )}

        {/* Медиа */}
        {post.image_url && (
          <div className="px-4 pb-3 cursor-pointer" onClick={() => setMediaPreview(post.image_url)}>
            {post.image_url.match(/\.(mp4|mov|mpeg|webm)$/i) ? (
              <div className="relative">
                <video src={post.image_url} className="w-full rounded-2xl object-contain bg-white/5" style={{ maxHeight: "300px" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center">
                    <span className="text-white text-2xl ml-1">▶</span>
                  </div>
                </div>
              </div>
            ) : (
              <img src={post.image_url} alt="post" className="w-full rounded-2xl object-contain bg-white/5" style={{ maxHeight: "300px" }} />
            )}
          </div>
        )}

        {/* Действия */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-3">
            <LikeDislikeButton postId={post.id} currentUserId={currentUserId} isOwner={isOwner} />
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/[0.07] hover:bg-white/10 transition">
              <MessageCircle className="w-4 h-4 text-white/50" strokeWidth={1.5} />
              <span className="text-xs text-white/50">0</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/[0.07] hover:bg-white/10 transition">
              <Repeat2 className="w-4 h-4 text-white/50" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-white/20" strokeWidth={1.5} />
            <span className="text-xs text-white/20">{views}</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      const { data } = await supabase
        .from("posts")
        .select(`*, profiles(full_name, username, avatar_url)`)
        .order("created_at", { ascending: false });
      setPosts(data || []);
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
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="flex items-center justify-between px-4 pt-14 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-widest">NEVA</h1>
        <button
          onClick={() => router.push("/settings")}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center opacity-30 hover:opacity-60 transition"
        >
          <Settings className="w-4 h-4 text-white" />
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-white/20">
          <p className="text-lg font-medium">Пока нет постов</p>
          <p className="text-sm mt-1">Будьте первым!</p>
        </div>
      ) : (
        <div className="space-y-3 px-4 pb-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUser?.id} />
          ))}
        </div>
      )}
    </div>
  );
}