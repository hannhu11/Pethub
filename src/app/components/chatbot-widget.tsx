import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, MessageCircle, SendHorizontal, X } from 'lucide-react';
import { useAuthSession } from '../auth-session';
import { extractApiError } from '../lib/api-client';
import { chatWithAi, type AiChatHistoryItem } from '../lib/pethub-api';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const MAX_HISTORY_MESSAGES = 12;

function createMessage(role: 'user' | 'assistant', content: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    role,
    content,
  };
}

function buildWelcomeMessage(): ChatMessage {
  return createMessage(
    'assistant',
    'Xin chao! Toi la tro ly AI cua PetHub. Ban can tu van dich vu, lich hen, hay thong tin thu cung nao?',
  );
}

export function ChatbotWidget() {
  const { session } = useAuthSession();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const userId = session.user?.userId ?? '';
  const storageKey = useMemo(() => (userId ? `pethub-ai-chat:${userId}` : ''), [userId]);

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') {
      setMessages([]);
      return;
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setMessages([buildWelcomeMessage()]);
        return;
      }

      const parsed = JSON.parse(raw) as ChatMessage[];
      const normalized = Array.isArray(parsed)
        ? parsed
            .filter(
              (item) =>
                item &&
                (item.role === 'user' || item.role === 'assistant') &&
                typeof item.content === 'string' &&
                item.content.trim().length > 0,
            )
            .slice(-80)
        : [];

      setMessages(normalized.length > 0 ? normalized : [buildWelcomeMessage()]);
    } catch {
      setMessages([buildWelcomeMessage()]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined' || messages.length === 0) {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(messages.slice(-120)));
  }, [messages, storageKey]);

  useEffect(() => {
    if (!open) {
      return;
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, sending]);

  const canUseWidget = session.isAuthenticated && session.user && (session.role === 'customer' || session.role === 'manager');

  if (!canUseWidget) {
    return null;
  }

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || sending) {
      return;
    }

    const userMessage = createMessage('user', message);
    const history: AiChatHistoryItem[] = messages
      .filter((item) => item.role === 'user' || item.role === 'assistant')
      .slice(-MAX_HISTORY_MESSAGES)
      .map((item) => ({
        role: item.role,
        content: item.content,
      }));

    setMessages((previous) => [...previous, userMessage]);
    setInput('');
    setSending(true);

    try {
      const response = await chatWithAi({
        message,
        history,
      });
      const assistantText =
        response.text?.trim() || 'Toi chua nhan duoc noi dung phu hop. Ban vui long thu lai.';
      setMessages((previous) => [...previous, createMessage('assistant', assistantText)]);
    } catch (error) {
      const reason = extractApiError(error);
      const fallback =
        reason.toLowerCase().includes('ai_chat_enabled')
          ? 'Tro ly AI dang tam tat. Vui long lien he quan tri vien.'
          : 'He thong AI tam thoi gian doan. Ban vui long thu lai sau.';
      setMessages((previous) => [...previous, createMessage('assistant', fallback)]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className='fixed right-4 bottom-4 z-[70] print:hidden'>
        <button
          type='button'
          onClick={() => setOpen((value) => !value)}
          className='w-14 h-14 rounded-full border border-[#2d2a26] bg-[#6b8f5e] text-white shadow-[0_16px_30px_rgba(45,42,38,0.2)] hover:-translate-y-0.5 transition-all flex items-center justify-center'
          aria-label={open ? 'Dong chatbot' : 'Mo chatbot'}
        >
          {open ? <X className='w-6 h-6' /> : <MessageCircle className='w-6 h-6' />}
        </button>
      </div>

      {open && (
        <section className='fixed z-[69] right-2 bottom-20 w-[min(380px,calc(100vw-1rem))] h-[min(580px,75vh)] print:hidden'>
          <div className='h-full rounded-3xl border border-[#2d2a26]/30 bg-white/85 backdrop-blur-md shadow-[0_18px_48px_rgba(45,42,38,0.2)] flex flex-col overflow-hidden'>
            <header className='px-4 py-3 border-b border-[#2d2a26]/10 bg-gradient-to-r from-[#6b8f5e] to-[#8fad80] text-white flex items-center gap-2'>
              <div className='w-8 h-8 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center'>
                <Bot className='w-4 h-4' />
              </div>
              <div>
                <p className='text-sm' style={{ fontWeight: 700 }}>
                  PetHub AI Assistant
                </p>
                <p className='text-[11px] text-white/85'>Tra loi ngan gon, dung trong tam</p>
              </div>
            </header>

            <div ref={scrollRef} className='flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-[#faf9f6]/75'>
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm border ${
                      item.role === 'user'
                        ? 'bg-[#6b8f5e] text-white border-[#6b8f5e]'
                        : 'bg-white text-[#2d2a26] border-[#2d2a26]/15'
                    }`}
                  >
                    {item.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className='flex justify-start'>
                  <div className='rounded-2xl px-3 py-2 text-sm border border-[#2d2a26]/15 bg-white text-[#7a756e]'>
                    Dang tra loi...
                  </div>
                </div>
              )}
            </div>

            <form
              className='border-t border-[#2d2a26]/10 p-3 bg-white'
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage();
              }}
            >
              <div className='flex items-end gap-2'>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder='Nhap cau hoi ve PetHub...'
                  rows={2}
                  className='flex-1 resize-none rounded-2xl border border-[#2d2a26]/20 bg-[#faf9f6] px-3 py-2 text-sm text-[#2d2a26] focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]/40'
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                />
                <button
                  type='submit'
                  disabled={sending || input.trim().length === 0}
                  className='h-10 w-10 rounded-full border border-[#2d2a26] bg-[#6b8f5e] text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
                  aria-label='Gui tin nhan'
                >
                  <SendHorizontal className='w-4 h-4' />
                </button>
              </div>
            </form>
          </div>
        </section>
      )}
    </>
  );
}

