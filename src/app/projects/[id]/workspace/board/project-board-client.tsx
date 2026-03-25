"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/relative-time";

type PostRow = {
  id: string;
  title: string;
  content: string;
  category: string;
  author_id: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type CommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
};

type ParticipantProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

const CATEGORIES = [
  { value: "notice", label: "공지" },
  { value: "question", label: "질문" },
  { value: "general", label: "자유" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];
type CategoryFilter = "all" | CategoryValue;

const CATEGORY_META: Record<CategoryValue, { label: string; className: string }> = {
  notice: {
    label: "Notice",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
  question: {
    label: "Question",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  general: {
    label: "General",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

export default function ProjectBoardClient({
  projectId,
  projectTitle,
  currentUserId,
  isLeader,
}: {
  projectId: string;
  projectTitle: string;
  currentUserId: string;
  isLeader: boolean;
}) {
  const searchParams = useSearchParams();
  const initialPostId = searchParams?.get("post");
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CategoryValue>("general");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [commentInput, setCommentInput] = useState("");
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [participantsById, setParticipantsById] = useState<Record<string, ParticipantProfile>>({});
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionTokenStart, setMentionTokenStart] = useState<number | null>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedPost = useMemo(
    () => posts.find((p) => p.id === selectedId) ?? null,
    [posts, selectedId]
  );
  const canDeletePost = useCallback(
    (post: PostRow) => isLeader || post.author_id === currentUserId,
    [currentUserId, isLeader]
  );
  const mentionCandidates = useMemo(() => {
    const normalizedQuery = mentionQuery.replace(/\s+/g, "").toLowerCase();
    const allParticipants = Object.values(participantsById).filter(
      (participant) => participant.id !== currentUserId
    );
    if (!normalizedQuery) return allParticipants.slice(0, 8);
    return allParticipants
      .filter((participant) => {
        const name = (participant.full_name ?? "").replace(/\s+/g, "").toLowerCase();
        return name.includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [currentUserId, mentionQuery, participantsById]);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    let query = (supabase as any)
      .from("project_posts")
      .select("id, title, content, category, author_id, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (selectedCategory !== "all") {
      query = query.eq("category", selectedCategory);
    }

    const { data, error } = await query;

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    const rows = (data ?? []) as PostRow[];
    setPosts(rows);
    if (!selectedId && rows.length > 0) {
      if (initialPostId && rows.some((row) => row.id === initialPostId)) {
        setSelectedId(initialPostId);
      } else {
        setSelectedId(rows[0].id);
      }
    }

    const authorIds = [...new Set(rows.map((p) => p.author_id))];
    if (authorIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", authorIds);

      const mapped = ((profileRows ?? []) as ProfileRow[]).reduce<Record<string, ProfileRow>>(
        (acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        },
        {}
      );
      setProfiles(mapped);
    } else {
      setProfiles({});
    }

    if (rows.length > 0) {
      const postIds = rows.map((p) => p.id);
      const { data: commentRows } = await supabase
        .from("post_comments")
        .select("post_id")
        .in("post_id", postIds);

      const counts = ((commentRows ?? []) as Array<{ post_id: string }>).reduce<
        Record<string, number>
      >((acc, row) => {
        acc[row.post_id] = (acc[row.post_id] ?? 0) + 1;
        return acc;
      }, {});
      setCommentCounts(counts);
    } else {
      setCommentCounts({});
    }
    setIsLoading(false);
  }, [initialPostId, projectId, selectedCategory, selectedId]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchPosts();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchPosts]);

  useEffect(() => {
    async function fetchParticipants() {
      const supabase = createClient();
      const [{ data: project }, { data: acceptedApps }] = await Promise.all([
        supabase
          .from("projects")
          .select("team_leader_id")
          .eq("id", projectId)
          .single(),
        supabase
          .from("applications")
          .select("applicant_id")
          .eq("project_id", projectId)
          .eq("status", "accepted"),
      ]);

      const ids = new Set<string>();
      const projectTyped = project as { team_leader_id: string | null } | null;
      if (projectTyped?.team_leader_id) ids.add(projectTyped.team_leader_id);
      ((acceptedApps ?? []) as Array<{ applicant_id: string }>).forEach((app) =>
        ids.add(app.applicant_id)
      );

      if (ids.size === 0) {
        setParticipantsById({});
        return;
      }

      const { data: profilesRows } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", Array.from(ids));

      const mapped = ((profilesRows ?? []) as ParticipantProfile[]).reduce<
        Record<string, ParticipantProfile>
      >((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {});
      setParticipantsById(mapped);
    }

    void fetchParticipants();
  }, [projectId]);

  const submitPost = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("제목과 내용을 입력해주세요.");
      return;
    }
    setIsSubmitting(true);
    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .from("project_posts")
      .insert({
        project_id: projectId,
        title: title.trim(),
        content: content.trim(),
        category,
        author_id: currentUserId,
      })
      .select("id")
      .single();

    if (error) {
      toast.error(error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success("게시글이 등록되었습니다.");
    setTitle("");
    setContent("");
    setCategory("general");
    setSelectedId((data as { id: string } | null)?.id ?? null);
    setIsSubmitting(false);
    void fetchPosts();
  };

  const deletePost = async (post: PostRow) => {
    if (!canDeletePost(post)) {
      toast.error("본인이 작성한 글만 삭제할 수 있습니다.");
      return;
    }
    const ok = window.confirm(
      "본인이 작성한 글만 삭제할 수 있습니다. 정말 삭제하시겠습니까?"
    );
    if (!ok) return;

    const supabase = createClient();
    const { error } = await (supabase as any)
      .from("project_posts")
      .delete()
      .eq("id", post.id)
      .eq("project_id", projectId);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("게시글이 삭제되었습니다.");
    if (selectedId === post.id) {
      setSelectedId(null);
    }
    void fetchPosts();
  };

  const fetchComments = useCallback(async () => {
    if (!selectedId) {
      setComments([]);
      return;
    }
    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .from("post_comments")
      .select("id, post_id, author_id, content, parent_id, created_at")
      .eq("post_id", selectedId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error(error.message);
      return;
    }

    const rows = (data ?? []) as CommentRow[];
    setComments(rows);

    const uniqAuthorIds = [...new Set(rows.map((c) => c.author_id))];
    if (uniqAuthorIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", uniqAuthorIds);
      if (profileRows && profileRows.length > 0) {
        const mapped = (profileRows as ProfileRow[]).reduce<Record<string, ProfileRow>>(
          (acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          },
          {}
        );
        setProfiles((prev) => ({ ...prev, ...mapped }));
      }
    }
  }, [selectedId]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchComments();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchComments]);

  useEffect(() => {
    if (!selectedId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`post-comments-${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "post_comments",
          filter: `post_id=eq.${selectedId}`,
        },
        (payload) => {
          const newComment = payload.new as CommentRow;
          setComments((prev) => {
            if (prev.some((c) => c.id === newComment.id)) return prev;
            return [...prev, newComment];
          });
          setCommentCounts((prev) => ({
            ...prev,
            [selectedId]: (prev[selectedId] ?? 0) + 1,
          }));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "post_comments",
          filter: `post_id=eq.${selectedId}`,
        },
        (payload) => {
          const oldComment = payload.old as { id?: string; post_id?: string };
          if (!oldComment.id) return;
          setComments((prev) => prev.filter((c) => c.id !== oldComment.id));
          setCommentCounts((prev) => ({
            ...prev,
            [selectedId]: Math.max((prev[selectedId] ?? 1) - 1, 0),
          }));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedId]);

  const submitComment = async () => {
    if (!selectedId || !commentInput.trim()) return;
    setIsCommentSubmitting(true);
    const supabase = createClient();
    const { error } = await (supabase as any).from("post_comments").insert({
      post_id: selectedId,
      author_id: currentUserId,
      content: commentInput.trim(),
      parent_id: replyParentId,
    });

    if (error) {
      toast.error(error.message);
      setIsCommentSubmitting(false);
      return;
    }

    setCommentInput("");
    setReplyParentId(null);
    setIsCommentSubmitting(false);

    const currentPost = posts.find((post) => post.id === selectedId) ?? null;
    if (!currentPost) return;

    const baseReceivers = new Set<string>();
    if (currentPost.author_id !== currentUserId) {
      baseReceivers.add(currentPost.author_id);
    }
    comments.forEach((comment) => {
      if (comment.author_id !== currentUserId) {
        baseReceivers.add(comment.author_id);
      }
    });

    const extractMentionTargets = (text: string) => {
      const matches = text.match(/@([^\s@]+)/g) ?? [];
      const handles = matches.map((m) => m.slice(1).trim().toLowerCase()).filter(Boolean);
      const foundIds = new Set<string>();
      Object.values(participantsById).forEach((participant) => {
        const fullName = (participant.full_name ?? "").trim();
        if (!fullName) return;
        const normalized = fullName.replace(/\s+/g, "").toLowerCase();
        if (handles.includes(normalized) && participant.id !== currentUserId) {
          foundIds.add(participant.id);
        }
      });
      return foundIds;
    };

    const mentionTargets = extractMentionTargets(commentInput.trim());
    const postLink = `/projects/${projectId}/workspace/board?post=${selectedId}`;

    const notificationsToInsert: Array<{
      user_id: string;
      title: string;
      message: string;
      link: string;
    }> = [];

    baseReceivers.forEach((userId) => {
      const isPostAuthor = userId === currentPost.author_id;
      notificationsToInsert.push({
        user_id: userId,
        title: "새 댓글 알림",
        message: isPostAuthor
          ? "내 글에 새로운 댓글이 달렸습니다."
          : "참여 중인 글에 새로운 댓글이 달렸습니다.",
        link: postLink,
      });
    });

    mentionTargets.forEach((userId) => {
      notificationsToInsert.push({
        user_id: userId,
        title: "멘션 알림",
        message: "댓글에서 회원님이 멘션되었습니다.",
        link: postLink,
      });
    });

    const deduped = notificationsToInsert.reduce<Record<string, typeof notificationsToInsert[0]>>(
      (acc, row) => {
        acc[row.user_id] = row;
        return acc;
      },
      {}
    );

    const finalRows = Object.values(deduped);
    if (finalRows.length > 0) {
      await (supabase as any).from("notifications").insert(finalRows);
    }
  };

  const updateMentionState = (value: string, caret: number) => {
    const textBeforeCaret = value.slice(0, caret);
    const tokenMatch = textBeforeCaret.match(/(^|\s)@([^\s@]*)$/);
    if (!tokenMatch) {
      setShowMentionDropdown(false);
      setMentionQuery("");
      setMentionTokenStart(null);
      return;
    }

    const query = tokenMatch[2] ?? "";
    const tokenStart = caret - query.length - 1;
    setMentionQuery(query);
    setMentionTokenStart(tokenStart);
    setShowMentionDropdown(true);
  };

  const handleCommentInputChange = (value: string) => {
    setCommentInput(value);
    const textarea = commentTextareaRef.current;
    const caret = textarea?.selectionStart ?? value.length;
    updateMentionState(value, caret);
  };

  const applyMention = (participant: ParticipantProfile) => {
    if (!commentTextareaRef.current || mentionTokenStart === null) return;
    const textarea = commentTextareaRef.current;
    const caret = textarea.selectionStart ?? commentInput.length;
    const before = commentInput.slice(0, mentionTokenStart);
    const after = commentInput.slice(caret);
    const displayName = (participant.full_name ?? "").replace(/\s+/g, "");
    const nextValue = `${before}@${displayName} ${after}`;
    setCommentInput(nextValue);
    setShowMentionDropdown(false);
    setMentionQuery("");
    setMentionTokenStart(null);

    const nextCaret = before.length + displayName.length + 2;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCaret, nextCaret);
    }, 0);
  };

  const deleteComment = async (comment: CommentRow) => {
    if (comment.author_id !== currentUserId) {
      toast.error("본인이 작성한 댓글만 삭제할 수 있습니다.");
      return;
    }
    const ok = window.confirm("댓글을 삭제하시겠습니까?");
    if (!ok) return;

    const supabase = createClient();
    const { error } = await (supabase as any).from("post_comments").delete().eq("id", comment.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("댓글이 삭제되었습니다.");
  };

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-[340px,1fr] md:p-6">
      <section className="min-h-0 rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <h1 className="text-lg font-semibold text-slate-900">팀 게시판</h1>
          <p className="mt-1 text-xs text-slate-500">{projectTitle}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { value: "all" as const, label: "전체" },
              { value: "notice" as const, label: "공지" },
              { value: "question" as const, label: "질문" },
              { value: "general" as const, label: "자유" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setSelectedCategory(item.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  selectedCategory === item.value
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-2 md:max-h-[calc(100vh-260px)]">
          {isLoading ? (
            <div className="space-y-2 p-2">
              <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : posts.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">아직 게시글이 없습니다.</div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className={`mb-2 rounded-xl border p-3 ${
                  selectedId === post.id
                    ? "border-blue-200 bg-blue-50/60"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(post.id)}
                  className="w-full text-left"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        CATEGORY_META[(post.category as CategoryValue) || "general"]?.className ??
                        CATEGORY_META.general.className
                      }`}
                    >
                      {CATEGORY_META[(post.category as CategoryValue) || "general"]?.label ??
                        CATEGORY_META.general.label}
                    </span>
                    <span className="ml-auto text-[11px] text-slate-500">
                      {formatRelativeTime(post.created_at)}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-sm font-semibold text-slate-900">{post.title}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                    <span>💬</span>
                    <span>{commentCounts[post.id] ?? 0}</span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                    {post.content.replace(/\n/g, " ")}
                  </p>
                </button>
                {canDeletePost(post) ? (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => void deletePost(post)}
                      className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="grid min-h-0 grid-rows-[1fr,auto] gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          {!selectedPost ? (
            <div className="text-sm text-slate-500">왼쪽 목록에서 게시글을 선택해주세요.</div>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                    CATEGORY_META[
                      (selectedPost.category as CategoryValue) || "general"
                    ]?.className ?? CATEGORY_META.general.className
                  }`}
                >
                  {CATEGORY_META[
                    (selectedPost.category as CategoryValue) || "general"
                  ]?.label ?? CATEGORY_META.general.label}
                </span>
                <span className="text-xs text-slate-500">
                  {formatRelativeTime(selectedPost.created_at)}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">{selectedPost.title}</h2>
              <p className="mt-2 text-xs text-slate-500">
                작성자: {profiles[selectedPost.author_id]?.full_name ?? "알 수 없음"}
              </p>
              {canDeletePost(selectedPost) ? (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => void deletePost(selectedPost)}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              ) : null}
              <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {selectedPost.content}
              </div>
              <div className="mt-6 border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  댓글 {commentCounts[selectedPost.id] ?? comments.length}
                </h3>
                <div className="mt-3 space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-xs text-slate-500">아직 댓글이 없습니다.</p>
                  ) : (
                    comments.map((comment) => {
                      const author = profiles[comment.author_id];
                      const isReply = !!comment.parent_id;
                      return (
                        <div
                          key={comment.id}
                          className={`rounded-lg border border-slate-200 p-3 ${isReply ? "ml-6" : ""}`}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            {author?.avatar_url ? (
                              <img
                                src={author.avatar_url}
                                alt=""
                                className="h-7 w-7 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                                {(author?.full_name?.[0] ?? "?").toUpperCase()}
                              </div>
                            )}
                            <p className="text-xs font-medium text-slate-800">
                              {author?.full_name ?? "알 수 없음"}
                            </p>
                            <span className="text-[11px] text-slate-500">
                              {formatRelativeTime(comment.created_at)}
                            </span>
                            <div className="ml-auto flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setReplyParentId(comment.id)}
                                className="text-[11px] text-blue-600 hover:underline"
                              >
                                답글 달기
                              </button>
                              {comment.author_id === currentUserId ? (
                                <button
                                  type="button"
                                  onClick={() => void deleteComment(comment)}
                                  className="text-[11px] text-red-600 hover:underline"
                                >
                                  삭제
                                </button>
                              ) : null}
                            </div>
                          </div>
                          <p className="whitespace-pre-wrap text-sm text-slate-700">
                            {comment.content}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 p-3">
                  {replyParentId ? (
                    <div className="mb-2 flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-xs text-slate-600">
                      <span>답글 작성 중</span>
                      <button
                        type="button"
                        onClick={() => setReplyParentId(null)}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        취소
                      </button>
                    </div>
                  ) : null}
                  <textarea
                    ref={commentTextareaRef}
                    value={commentInput}
                    onChange={(e) => handleCommentInputChange(e.target.value)}
                    onClick={(e) =>
                      updateMentionState(
                        commentInput,
                        (e.currentTarget as HTMLTextAreaElement).selectionStart ??
                          commentInput.length
                      )
                    }
                    onKeyUp={(e) =>
                      updateMentionState(
                        commentInput,
                        (e.currentTarget as HTMLTextAreaElement).selectionStart ??
                          commentInput.length
                      )
                    }
                    onBlur={() => {
                      setTimeout(() => {
                        setShowMentionDropdown(false);
                      }, 120);
                    }}
                    rows={3}
                    placeholder="댓글을 입력하세요."
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  {showMentionDropdown && mentionCandidates.length > 0 ? (
                    <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-sm">
                      {mentionCandidates.map((participant) => (
                        <button
                          key={participant.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyMention(participant)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                        >
                          {participant.avatar_url ? (
                            <img
                              src={participant.avatar_url}
                              alt=""
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-medium text-slate-600">
                              {(participant.full_name?.[0] ?? "?").toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs font-medium text-slate-800">
                            @{(participant.full_name ?? "").replace(/\s+/g, "")}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => void submitComment()}
                      disabled={isCommentSubmitting}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {isCommentSubmitting ? "등록 중..." : "댓글 등록"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">새 글 작성</h3>
            <Link
              href={`/projects/${projectId}`}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              프로젝트 메인으로
            </Link>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryValue)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {CATEGORIES.filter((item) => isLeader || item.value !== "notice").map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {!isLeader ? (
              <p className="text-xs text-slate-500">
                공지(notice) 카테고리는 프로젝트 리더만 작성할 수 있습니다.
              </p>
            ) : null}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="내용을 입력하세요."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={submitPost}
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? "등록 중..." : "게시글 등록"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
