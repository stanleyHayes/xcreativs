"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, User, Bot, ExternalLink, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  related_pages?: string[];
  created_at?: string;
}

interface SessionResponse {
  session_id?: string;
  welcome?: string;
}

interface MessageResponse {
  answer?: string;
  related_pages?: string[];
}

function createVisitorId(): string {
  let vid = localStorage.getItem("xc_visitor_id");
  if (!vid) {
    vid = "v-" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("xc_visitor_id", vid);
  }
  return vid;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [visitorId] = useState(createVisitorId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startSession = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/concierge/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitor_id: visitorId, source: "public" }),
      });
      const data = (await res.json()) as SessionResponse;
      if (data.session_id) {
        setSessionId(data.session_id);
        setMessages([{ id: "welcome", role: "assistant", content: data.welcome ?? "" }]);
      }
    } catch {
      setMessages([{ id: "welcome", role: "assistant", content: "Hello, I'm XC Assistant. How can I help you today?" }]);
    }
  };

  const toggleOpen = () => {
    if (!isOpen && messages.length === 0) {
      startSession();
    }
    setIsOpen(!isOpen);
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/concierge/sessions/${sessionId}/messages`,
        { method: "POST", headers, body: JSON.stringify({ content: userMsg.content }) }
      );
      const data = (await res.json()) as MessageResponse;
      const assistantMsg: Message = {
        id: Date.now().toString() + "-a",
        role: "assistant",
        content: data.answer || "I'm not sure about that. Let me connect you with our team.",
        related_pages: data.related_pages,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "-a", role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggleOpen}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isOpen ? "bg-white/10 rotate-90 scale-0" : "bg-signal hover:bg-signal/90 scale-100"
        }`}
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-4rem)] bg-gravity border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-signal/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-signal" />
              </div>
              <div>
                <p className="text-sm font-semibold">XC Assistant</p>
                <p className="text-[10px] text-white/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Online
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 text-white/50 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-white/10" : "bg-signal/20"}`}>
                  {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-signal" />}
                </div>
                <div className={`max-w-[80%] ${msg.role === "user" ? "text-right" : ""}`}>
                  <div
                    className={`inline-block px-3 py-2 rounded-lg text-sm ${
                      msg.role === "user" ? "bg-signal text-white" : "bg-white/5 text-white/90"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.related_pages && msg.related_pages.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {msg.related_pages.map((page) => (
                        <a
                          key={page}
                          href={page}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-signal/10 text-signal hover:bg-signal/20 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {page}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-signal/20 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-signal" />
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about services, products, careers..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-signal placeholder:text-white/30"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-signal rounded-lg hover:bg-signal/90 disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
