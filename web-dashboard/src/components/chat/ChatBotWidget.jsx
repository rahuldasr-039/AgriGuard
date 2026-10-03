"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Send, Bot, User, RefreshCw, ExternalLink } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function ChatBotWidget() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initial greeting in active language
    setMessages([
      {
        id: "1",
        sender: "bot",
        text: `👋 ${t("chatWelcome")}`,
        time: "Just now"
      }
    ]);
  }, [language, t]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") || "FARMER" : "FARMER";
      const res = await fetch("http://localhost:5000/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: query,
          role: userRole,
          language: language,
          history: messages.slice(-6).map(m => ({ 
            role: m.sender === "user" ? "user" : "assistant", 
            content: m.text 
          }))
        })
      });

      const data = await res.json();
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: data.reply || "Sorry, I could not process your question. Please try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: `⚠️ ${t("aiAssistant")}: Error connecting to backend on port 5000.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    t("sampleQuestion1"),
    t("sampleQuestion2"),
    t("sampleQuestion3"),
    t("sampleQuestion4"),
    t("sampleQuestion5")
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Emoji Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-white hover:bg-emerald-50 text-slate-800 border-2 border-emerald-500 w-13 h-13 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
          title={t("aiAssistant")}
          aria-label="AI Assistant"
        >
          <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform select-none">🤖</span>
          <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse"></span>
        </button>
      )}

      {/* Chat Window: Clean White Background + Soft Light-Green Accents */}
      {isOpen && (
        <div className="bg-white border border-emerald-600/30 rounded-2xl w-[92vw] sm:w-[420px] h-[580px] shadow-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-4 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-xl shadow-xs">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  {t("aiAssistant")}
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </h3>
                <p className="text-[11px] text-emerald-700 font-medium">Groq & Domain Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/ai-assistant");
                }}
                className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-100/60 transition-colors"
                title={t("aiCommandCenter")}
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMessages([{ id: "1", sender: "bot", text: `👋 ${t("chatWelcome")}`, time: "Just now" }])}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-emerald-100/60 transition-colors"
                title={t("common.clear")}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-emerald-100/60 transition-colors"
                title={t("common.close")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="bg-slate-50/80 p-2 border-b border-slate-200/80 flex gap-1.5 overflow-x-auto no-scrollbar">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-xs whitespace-nowrap bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 transition-all flex-shrink-0 shadow-xs"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm bg-slate-50/40">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "bot" && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5 text-sm">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl ${
                    m.sender === "user"
                      ? "bg-emerald-600 text-white rounded-tr-xs shadow-xs"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-xs leading-relaxed"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-xs sm:text-sm">{m.text}</div>
                  <span className={`block text-[10px] mt-1.5 ${m.sender === "user" ? "text-emerald-100 text-right" : "text-slate-400"}`}>
                    {m.time}
                  </span>
                </div>
                {m.sender === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center text-sm">
                  🤖
                </div>
                <div className="bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-xs ml-1 font-medium text-emerald-800">{t("common.loading", "AgriGuard is thinking...")}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("askAiPlaceholder")}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition-all flex items-center justify-center shadow-xs"
              title={t("send")}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
