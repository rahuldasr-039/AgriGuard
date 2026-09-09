"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, X, Send, Bot, User, Sparkles, RefreshCw, ExternalLink } from "lucide-react";

export default function ChatBotWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "bot",
      text: "👋 Hi! I am your **AgriGuard AI Assistant**. Ask me anything about MRL limits, withdrawal times, antibiotic usage, livestock health, or any general inquiry!",
      time: "Just now"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

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
      const apiKey = localStorage.getItem("agriguard_gemini_api_key") || undefined;
      const res = await fetch("http://localhost:5000/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, apiKey })
      });

      const data = await res.json();
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: data.reply || "Sorry, I couldn't process your request. Please try again.",
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
          text: "⚠️ Connection error: Could not reach the AI service backend. Ensure the backend server is running on port 5000.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "What is the MRL for Oxytetracycline?",
    "Explain withdrawal period rules",
    "How does blockchain prevent residue fraud?",
    "Calculate penicillin dosage for 500kg cow"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white p-4 rounded-full shadow-2xl shadow-emerald-500/30 flex items-center gap-2 transform hover:scale-105 transition-all group"
        >
          <Bot className="w-6 h-6 animate-pulse" />
          <span className="font-semibold text-sm pr-1 hidden sm:inline">Ask AgriGuard AI</span>
          <Sparkles className="w-4 h-4 text-amber-300" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-[90vw] sm:w-[420px] h-[580px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                  AgriGuard AI Assistant
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                </h3>
                <p className="text-xs text-slate-400">Hybrid Gen AI • Powered by Gemini</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/ai-assistant");
                }}
                className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Open Full AI Command Center"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMessages([{ id: "1", sender: "bot", text: "Chat cleared. What else can I help you with?", time: "Just now" }])}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Clear Chat"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="bg-slate-950/60 p-2 border-b border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-xs whitespace-nowrap bg-slate-800/80 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700 transition-all flex-shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm bg-slate-900/90">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "bot" && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] p-3.5 rounded-2xl ${
                    m.sender === "user"
                      ? "bg-emerald-600 text-white rounded-tr-none shadow-md"
                      : "bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none leading-relaxed"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  <span className={`block text-[10px] mt-1.5 ${m.sender === "user" ? "text-emerald-200 text-right" : "text-slate-500"}`}>
                    {m.time}
                  </span>
                </div>
                {m.sender === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-800/90 text-slate-400 border border-slate-700/60 px-4 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-xs ml-1">Thinking...</span>
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
            className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about MRL, AMU, or any question..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white p-2.5 rounded-xl transition-all flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
