"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Author {
  fullName: string | null;
  avatarUrl: string | null;
  role: string | null;
}

interface MessageWithAuthor {
  id: string;
  project_id: string;
  channel_id?: string | null;
  author_id: string;
  content: string;
  created_at: string;
  author: Author;
}

interface TeamMember {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string | null;
}

interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface ChatRoomProps {
  projectId: string;
  projectTitle: string;
  activeChannel: Channel | null;
  channels: Channel[];
  initialMessages: MessageWithAuthor[];
  teamMembers: TeamMember[];
  currentUserProfile: { fullName: string | null; avatarUrl: string | null; role: string | null } | null;
}

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

interface TaskNotificationPayload {
  type: "notification";
  task_id: string;
  message: string;
}

function parseTaskNotification(content: string): TaskNotificationPayload | null {
  try {
    const parsed = JSON.parse(content) as TaskNotificationPayload;
    if (parsed?.type === "notification" && typeof parsed.task_id === "string" && typeof parsed.message === "string") {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function formatDateDivider(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "TODAY";
  if (d.toDateString() === yesterday.toDateString()) return "YESTERDAY";
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export default function ChatRoom({
  projectId,
  projectTitle,
  activeChannel,
  channels,
  initialMessages,
  teamMembers,
  currentUserProfile,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<MessageWithAuthor[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channelSlug = activeChannel?.slug ?? "general";
  const channelName = activeChannel?.name ?? "general";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!activeChannel) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`chat:project:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            project_id: string;
            channel_id: string | null;
            author_id: string;
            content: string;
            created_at: string;
          };
          if (!row) return;
          if (row.channel_id !== null && row.channel_id !== activeChannel.id) return;
          if (row.channel_id === null && activeChannel.slug !== "general") return;

          const member = teamMembers.find((m) => m.id === row.author_id);
          const author: Author = member
            ? { fullName: member.fullName, avatarUrl: member.avatarUrl, role: member.role }
            : { fullName: null, avatarUrl: null, role: null };

          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                project_id: row.project_id,
                channel_id: row.channel_id,
                author_id: row.author_id,
                content: row.content,
                created_at: row.created_at,
                author,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, activeChannel, teamMembers]);

  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || !currentUserId || isSending || !activeChannel) return;

    setIsSending(true);
    setInputValue("");
    const supabase = createClient();

    const { error } = await supabase.from("chat_messages").insert({
      project_id: projectId,
      channel_id: activeChannel.id,
      author_id: currentUserId,
      content,
    });

    setIsSending(false);
    if (error) {
      setInputValue(content);
      toast.error(`메시지 전송 실패: ${error.message || "권한을 확인해주세요."}`);
    }
  }, [inputValue, currentUserId, isSending, projectId, activeChannel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) => {
        try {
          const parsed = JSON.parse(m.content) as { type?: string; message?: string };
          if (parsed.type === "notification" && parsed.message)
            return parsed.message.toLowerCase().includes(searchQuery.toLowerCase());
          return m.content.toLowerCase().includes(searchQuery.toLowerCase());
        } catch {
          return m.content.toLowerCase().includes(searchQuery.toLowerCase());
        }
      })
    : messages;

  const onlineCount = Math.min(4, teamMembers.length);
  const offlineCount = Math.max(0, teamMembers.length - onlineCount);

  let lastDate = "";
  const messageElements = filteredMessages.map((m) => {
    const dateLabel = formatDateDivider(m.created_at);
    const showDateDivider = dateLabel !== lastDate;
    if (showDateDivider) lastDate = dateLabel;

    const notification = parseTaskNotification(m.content);

    if (notification) {
      return (
        <div key={m.id}>
          {showDateDivider && (
            <div className="my-6 flex justify-center">
              <span className="rounded-full bg-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600">
                {dateLabel}
              </span>
            </div>
          )}
          <div className="my-5 flex justify-center">
            <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#2563EB]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  새 업무 할당
                </span>
                <span className="text-xs text-gray-500">
                  System • {formatMessageTime(m.created_at)}
                </span>
              </div>
              <p className="mb-3 text-sm text-gray-700">
                {notification.message}
              </p>
              <div className="flex justify-end">
                <Link
                  href={`/projects/${projectId}/workspace/tasks`}
                  className="text-sm font-medium text-[#2563EB] hover:underline"
                >
                  업무 보기 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const isMe = m.author_id === currentUserId;

    return (
      <div key={m.id}>
        {showDateDivider && (
          <div className="my-6 flex justify-center">
            <span className="rounded-full bg-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600">
              {dateLabel}
            </span>
          </div>
        )}
        <div className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""} mb-5`}>
          {!isMe && (
            <div className="h-9 w-9 shrink-0">
              {m.author.avatarUrl ? (
                <img
                  src={m.author.avatarUrl}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-300 text-sm font-medium text-gray-600">
                  {(m.author.fullName?.[0] ?? "?").toUpperCase()}
                </div>
              )}
            </div>
          )}
          <div className={`flex min-w-0 max-w-[70%] flex-col ${isMe ? "items-end" : ""}`}>
            <div className={`mb-1.5 flex items-center gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              <span className="text-xs font-medium uppercase text-gray-500">
                {isMe ? "YOU" : (m.author.fullName ?? "Unknown").toUpperCase()} • {formatMessageTime(m.created_at)}
              </span>
            </div>
            <div
              className={`rounded-2xl px-4 py-2.5 ${
                isMe
                  ? "bg-[#2563EB] text-white"
                  : "bg-gray-200 text-gray-900"
              }`}
            >
              <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>
            </div>
          </div>
        </div>
      </div>
    );
  });

  if (!activeChannel && channels.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-gray-500">
        <p>채널을 불러올 수 없습니다.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
        >
          새로고침
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
        <header className="flex shrink-0 flex-col gap-3 border-b border-gray-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              # {channelSlug}
            </h1>
            <p className="text-sm text-gray-500">
              {activeChannel?.description ?? "Project chat"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {teamMembers.slice(0, 4).map((m) =>
                m.avatarUrl ? (
                  <img
                    key={m.id}
                    src={m.avatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full border-2 border-white object-cover"
                  />
                ) : (
                  <div
                    key={m.id}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-300 text-xs font-medium text-gray-600"
                  >
                    {(m.fullName?.[0] ?? "?").toUpperCase()}
                  </div>
                )
              )}
            </div>
            <div className="relative">
              <input
                type="search"
                placeholder="Search in chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-[12rem] rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-48"
              />
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button type="button" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="옵션">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#FAFAFA] px-4 py-4 sm:px-6"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {filteredMessages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-medium text-gray-700">
                팀원들과 첫 인사를 나눠보세요! 👋
              </p>
            </div>
          ) : (
            <>
              {messageElements}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-white p-4">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <button type="button" className="rounded-lg p-2 text-gray-500 hover:bg-gray-50" aria-label="Add">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              className="min-h-[40px] flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
            />
            <button type="button" className="rounded-lg p-2 text-gray-500 hover:bg-gray-50" aria-label="Emoji">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
              className="flex items-center justify-center rounded-lg bg-[#2563EB] p-2.5 text-white hover:bg-[#1d4ed8] disabled:opacity-50"
              aria-label="Send"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <aside className="hidden w-64 shrink-0 border-l border-gray-200 bg-[#FAFAFA] md:block">
        <div className="p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            Active Members
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
              {teamMembers.length}
            </span>
          </h2>

          <div className="mt-4 space-y-1">
            <p className="px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Online — {onlineCount}
            </p>
            {teamMembers.slice(0, onlineCount).map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/60">
                <div className="relative">
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-gray-600">
                      {(m.fullName?.[0] ?? "?").toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#FAFAFA] bg-green-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{m.fullName ?? "Unknown"}</p>
                  <p className="text-xs uppercase text-gray-500">{m.role ?? "Member"}</p>
                </div>
              </div>
            ))}
          </div>

          {offlineCount > 0 && (
            <div className="mt-4 space-y-1">
              <p className="px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Offline — {offlineCount}
              </p>
              {teamMembers.slice(onlineCount).map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-2 opacity-60">
                  <div className="relative">
                    {m.avatarUrl ? (
                      <img src={m.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover grayscale" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-gray-600">
                        {(m.fullName?.[0] ?? "?").toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-700">{m.fullName ?? "Unknown"}</p>
                    <p className="text-xs text-gray-500">Offline</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-xl border-2 border-dashed border-[#2563EB]/30 bg-[#2563EB]/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
              Project Tip
            </p>
            <p className="mt-2 text-sm text-gray-700">
              Use <code className="rounded bg-gray-200 px-1 py-0.5 font-mono text-xs">/tasks</code> to quickly view and manage project tasks from the chat.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
