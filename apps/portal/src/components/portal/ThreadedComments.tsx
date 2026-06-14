"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@xc/api";
import { MessageCircle, Send, User } from "lucide-react";
import type { AuthUser, ThreadsResponse, CommentsResponse } from "@xc/api/types";

interface ThreadedCommentsProps {
  engagementID: string;
  parentType: string;
  parentID: string;
}

interface Comment {
  ID: string;
  AuthorName: string;
  CreatedAt: string;
  Body: string;
}

interface Thread {
  ID: string;
  Title: string;
  CreatedAt: string;
  comments?: Comment[];
}

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem("user");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    return null;
  }
}

export default function ThreadedComments({ engagementID, parentType, parentID }: ThreadedCommentsProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [commentBodies, setCommentBodies] = useState<Record<string, string>>({});
  const [user] = useState<AuthUser | null>(() => readStoredUser());

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.listThreads(engagementID, parentType, parentID)) as ThreadsResponse;
      const t = (res.threads || []) as unknown as Thread[];
      // Load comments for each thread
      for (const thread of t) {
        const c = (await api.listComments(thread.ID)) as CommentsResponse;
        thread.comments = (c.comments || []) as unknown as Comment[];
      }
      setThreads(t);
    } catch {
      setThreads([]);
    }
    setLoading(false);
  }, [engagementID, parentType, parentID]);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      try {
        const res = (await api.listThreads(engagementID, parentType, parentID)) as ThreadsResponse;
        const t = (res.threads || []) as unknown as Thread[];
        for (const thread of t) {
          const c = (await api.listComments(thread.ID)) as CommentsResponse;
          thread.comments = (c.comments || []) as unknown as Comment[];
        }
        if (active) setThreads(t);
      } catch {
        if (active) setThreads([]);
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [engagementID, parentType, parentID]);

  async function handleCreateThread(e: React.FormEvent) {
    e.preventDefault();
    if (!newThreadTitle.trim() || !user) return;
    try {
      await api.createThread({
        engagement_id: engagementID,
        parent_type: parentType,
        parent_id: parentID,
        title: newThreadTitle,
      });
      setNewThreadTitle("");
      loadThreads();
    } catch {
      // ignore
    }
  }

  async function handlePostComment(threadID: string) {
    const body = commentBodies[threadID];
    if (!body?.trim() || !user) return;
    try {
      await api.createComment({
        thread_id: threadID,
        body,
        author_name: `${user.first_name} ${user.last_name}`,
      });
      setCommentBodies((prev) => ({ ...prev, [threadID]: "" }));
      loadThreads();
    } catch {
      // ignore
    }
  }

  if (loading) return <div className="text-white/40 text-sm py-4">Loading discussions...</div>;

  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-4 h-4 text-signal" />
        <h3 className="text-sm font-semibold">Discussions</h3>
        <span className="text-xs text-white/40">{threads.length} thread{threads.length !== 1 ? "s" : ""}</span>
      </div>

      <form onSubmit={handleCreateThread} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newThreadTitle}
          onChange={(e) => setNewThreadTitle(e.target.value)}
          placeholder="Start a new discussion..."
          className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-signal"
        />
        <button
          type="submit"
          disabled={!newThreadTitle.trim()}
          className="bg-signal text-white px-3 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      <div className="space-y-4">
        {threads.map((thread) => (
          <div key={thread.ID} className="border border-white/10 rounded-lg p-4">
            <h4 className="font-medium text-sm">{thread.Title}</h4>
            <p className="text-xs text-white/30 mt-1">
              {new Date(thread.CreatedAt).toLocaleString()}
            </p>

            <div className="mt-3 space-y-3">
              {thread.comments?.map((comment) => (
                <div key={comment.ID} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-white/50" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{comment.AuthorName}</span>
                      <span className="text-xs text-white/30">
                        {new Date(comment.CreatedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-white/70 mt-0.5">{comment.Body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={commentBodies[thread.ID] || ""}
                onChange={(e) => setCommentBodies((prev) => ({ ...prev, [thread.ID]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handlePostComment(thread.ID);
                  }
                }}
                placeholder="Reply..."
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-signal"
              />
              <button
                onClick={() => handlePostComment(thread.ID)}
                disabled={!commentBodies[thread.ID]?.trim()}
                className="text-signal hover:text-white transition-colors disabled:opacity-30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
