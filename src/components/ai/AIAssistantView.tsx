import { useState } from "react";
import { ArrowLeft, Send, Sparkles, User } from "lucide-react";

interface AIAssistantViewProps {
  onBack: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  onBack,
}) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm Aither AI, your astronaut health companion. You can ask me about space medicine, ECG analysis, ultrasound findings, and astronaut health monitoring.",
    },
  ]);

  // SEND MESSAGE TO BACKEND
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();

    // Display user's message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);

    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Something went wrong.");
      }

      // Display AI response
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (error) {
  console.error("Aither AI error:", error);

  setMessages((prev) => [
    ...prev,
    {
      role: "assistant",
      content:
        error instanceof Error
          ? error.message
          : "An unknown error occurred.",
    },
  ]);
} finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-cyan-400"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-2 text-cyan-400">
          <Sparkles size={22} />
          <span className="font-semibold">Aither AI</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-cyan-500/10 mb-4">
            <Sparkles className="w-10 h-10 text-cyan-400" />
          </div>

          <h1 className="text-3xl font-bold">
            Meet Aither AI
          </h1>

          <p className="text-slate-400 mt-2">
            Your intelligent companion for astronaut health.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-[#101a32]/80 overflow-hidden">

          {/* CHAT MESSAGES */}
          <div className="h-[450px] overflow-y-auto p-6 space-y-5">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-9 h-9 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <Sparkles size={18} className="text-cyan-400" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-cyan-600/20 border border-cyan-500/30"
                      : "bg-slate-800/80 border border-slate-700"
                  }`}
                >
                  {message.content}
                </div>

                {message.role === "user" && (
                  <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <User size={18} />
                  </div>
                )}
              </div>
            ))}

            {/* LOADING INDICATOR */}
            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <Sparkles size={18} className="text-cyan-400" />
                </div>

                <div className="text-sm text-cyan-400 animate-pulse">
                  Aither AI is thinking...
                </div>
              </div>
            )}
          </div>

          {/* MESSAGE INPUT */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 border-t border-slate-700 flex gap-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Aither AI about astronaut health..."
              disabled={isLoading}
              className="flex-1 bg-[#0b1428] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 transition"
            >
              <Send size={20} />
            </button>
          </form>
        </div>

        <p className="text-xs text-slate-500 text-center mt-4">
          AI-generated information is for assistance only and is not a
          substitute for clinical evaluation.
        </p>
      </div>
    </div>
  );
};