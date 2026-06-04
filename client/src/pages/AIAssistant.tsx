import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS_EN = [
  "Show me a summary of today's attendance",
  "Which employees have expiring contracts?",
  "What is the financial performance this month?",
  "List items with low stock",
  "Show pending tasks",
];

const QUICK_PROMPTS_AR = [
  "أعطني ملخص حضور اليوم",
  "أي الموظفين لديهم عقود منتهية الصلاحية؟",
  "ما هو الأداء المالي هذا الشهر؟",
  "أعرض العناصر ذات المخزون المنخفض",
  "أعرض المهام المعلقة",
];

export default function AIAssistant() {
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    { role:"assistant", content: lang==="ar" ? "مرحباً! أنا مساعدك الذكي لإدارة العيادة. يمكنني مساعدتك في تحليل البيانات، الإجابة على الأسئلة حول الموظفين، الحضور، المالية، والمخزون. كيف يمكنني مساعدتك اليوم؟" : "Hello! I'm your AI assistant for clinic management. I can help you analyze data, answer questions about employees, attendance, finances, and inventory. How can I help you today?", timestamp: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      const content = typeof data.message === 'string' ? data.message : String(data.message);
      setMessages(prev => [...prev, { role:"assistant", content, timestamp:new Date() }]);
      setIsLoading(false);
    },
    onError: (e) => {
      setMessages(prev => [...prev, { role:"assistant", content:`Error: ${e.message}`, timestamp:new Date() }]);
      setIsLoading(false);
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const sendMessage = (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    setInput("");
    setMessages(prev => [...prev, { role:"user", content:msg, timestamp:new Date() }]);
    setIsLoading(true);
    chatMutation.mutate({ message:msg, language:lang });
  };

  const quickPrompts = lang==="ar" ? QUICK_PROMPTS_AR : QUICK_PROMPTS_EN;

  return (
    <div className="p-4 lg:p-6 h-full flex flex-col">
      <PageHeader title={t("ai.title")} subtitle={t("ai.subtitle")} />

      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" style={{maxHeight:"calc(100vh - 200px)"}}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex gap-3", msg.role==="user"&&"flex-row-reverse")}>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", msg.role==="assistant"?"bg-blue-100":"bg-slate-100")}>
                {msg.role==="assistant" ? <Bot size={16} className="text-blue-600"/> : <User size={16} className="text-slate-600"/>}
              </div>
              <div className={cn("max-w-[75%] rounded-2xl px-4 py-3 text-sm", msg.role==="assistant"?"bg-slate-50 text-slate-800 rounded-tl-sm":"bg-blue-600 text-white rounded-tr-sm")}>
                {msg.role==="assistant" ? (
                  <div className="prose prose-sm max-w-none">
                    <Streamdown>{msg.content}</Streamdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
                <p className={cn("text-xs mt-1 opacity-60", msg.role==="user"&&"text-right")}>{msg.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"><Bot size={16} className="text-blue-600"/></div>
              <div className="bg-slate-50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-blue-600"/>
                <span className="text-sm text-slate-500">{t("ai.thinking")}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3">
            <p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><Sparkles size={12}/>{t("ai.suggestions")}</p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt,i)=>(
                <button key={i} onClick={()=>sendMessage(prompt)} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors border border-blue-100">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-slate-100 p-3 flex gap-2">
          <Input
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()}
            placeholder={t("ai.placeholder")}
            className="flex-1 h-9 text-sm"
            disabled={isLoading}
          />
          <Button size="sm" onClick={()=>sendMessage()} disabled={!input.trim()||isLoading} className="h-9 w-9 p-0">
            <Send size={15}/>
          </Button>
        </div>
      </div>
    </div>
  );
}
