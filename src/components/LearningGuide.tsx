import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { RichText } from './ui/RichText';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Sparkles, User, Bot } from 'lucide-react';
import { Language } from '../booking/types';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface LearningGuideProps {
  lang: Language;
}

export const LearningGuide: React.FC<LearningGuideProps> = ({ lang }) => {
  const isEn = lang === 'en';
  const [isOpen, setIsOpen] = useState(false);
  // QA-04: on a phone the floating button sat on top of the hero's trial button; it appears once the visitor scrolls.
  // Starts shown like the prerendered page, then hides before the first paint on a phone (keeps hydration matching).
  const [revealed, setRevealed] = useState(true);
  useLayoutEffect(() => {
    if (window.innerWidth < 640 && window.scrollY <= 240) setRevealed(false);
  }, []);
  useEffect(() => {
    if (revealed) return;
    const onScroll = () => { if (window.scrollY > 240) setRevealed(true); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [revealed]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: isEn
        ? "Assalamu alaikum! I am the Watazawwado guide. Tell me what you would like to learn, and I will help you find the right path."
        : "السلام عليكم! أنا مرشد وتزودوا. قولّي عايز تتعلم إيه، وأساعدك تلاقي الطريق المناسب ليك."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiMessages = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      })).concat({ role: 'user', parts: [{ text: userMessage.content }] });

      const res = await fetch('/api/learning-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((prev) => [...prev, { role: 'model', content: data.reply }]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: isEn
            ? "Sorry, I cannot answer right now. Please try again in a moment, or message us on WhatsApp."
            : "معلش، مقدرتش أرد دلوقتي. جرّب تاني بعد شوية، أو كلّمنا على واتساب."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && revealed && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            aria-label={isEn ? 'Open the learning guide' : 'افتح مرشد التعلم'}
            className="fixed bottom-6 end-6 z-50 h-14 min-w-14 px-4 rounded-full shadow-xl bg-gradient-to-r from-teal-600 via-primary to-accent text-white hover:opacity-95 transition-all cursor-pointer flex items-center justify-center group shadow-teal-500/20"
          >
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ms-2 transition-all duration-300 ease-in-out text-sm font-bold">
              {isEn ? 'Learning Guide' : 'مرشد التعلم'}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed bottom-6 end-4 sm:end-6 z-50 w-[calc(100vw-2rem)] sm:w-[360px] h-[520px] max-h-[calc(100dvh-5rem)] rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col origin-bottom-right rtl:origin-bottom-left"
            style={{ backgroundColor: 'var(--surface)', opacity: 1 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 glass-surface border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <h3 className="font-display font-medium text-foreground">
                  {isEn ? 'Learning guide' : 'مرشد التعلم'}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label={isEn ? 'Close' : 'إغلاق'}
                className="p-1.5 rounded-full glass-hover hover:bg-surface text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 glass-surface/50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' 
                      ? 'bg-foreground text-background' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[75%] text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-foreground text-background rounded-se-sm'
                      : 'glass-card text-foreground border border-border rounded-ss-sm shadow-sm'
                  }`}>
                    {msg.role === 'user' ? msg.content : <RichText text={msg.content} />}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 flex-row">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary text-accent-foreground">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl glass-card border-none rounded-ss-sm shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 glass-card border-t border-border">
              <div className="flex gap-2">
                <input
                  aria-label={isEn ? 'Your question' : 'سؤالك'}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isEn ? "Ask me anything…" : "اسألني أي حاجة…"}
                  className="flex-1 glass-surface border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-foreground placeholder-muted-foreground"
                />
                <button
                  aria-label={isEn ? 'Send message' : 'إرسال الرسالة'}
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
