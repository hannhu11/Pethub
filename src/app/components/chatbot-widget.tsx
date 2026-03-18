import { useEffect, useMemo, useRef, useState } from 'react';
import { SendHorizontal, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuthSession } from '../auth-session';
import { extractApiError } from '../lib/api-client';
import { chatWithAi, type AiChatHistoryItem } from '../lib/pethub-api';
import pethubAiLogo from '../../assets/images/ai/pethub_ai_3d_logo_final.png';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_CONTENT = 400;
const ASSISTANT_SLOGAN_BY_ROLE = {
  customer: 'Hiểu thú cưng của bạn, hỗ trợ đúng nhu cầu',
  manager: 'Nắm số liệu tức thời, điều hành chuẩn xác',
} as const;

function normalizeChatContent(content: string): string {
  return content
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function compactHistoryContent(content: string, max = MAX_HISTORY_CONTENT): string {
  const normalized = normalizeChatContent(content);
  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(max - 3, 1)).trimEnd()}...`;
}

function createMessage(role: 'user' | 'assistant', content: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    role,
    content,
  };
}

function buildWelcomeMessage(role: 'customer' | 'manager' | null): ChatMessage {
  if (role === 'manager') {
    return createMessage(
      'assistant',
      'Xin chào anh/chị quản lý! Mình là **PetHub AI Assistant**. Mình có thể hỗ trợ nhanh về **lịch hẹn**, **vận hành**, **sản phẩm/dịch vụ** và **tổng quan số liệu** theo dữ liệu hệ thống.',
    );
  }

  return createMessage(
    'assistant',
    'Xin chào! Mình là **PetHub AI Assistant**. Mình có thể hỗ trợ bạn về **dịch vụ**, **lịch hẹn** và thông tin **thú cưng** ngay trong hệ thống.',
  );
}

function AssistantAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass =
    size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-14 h-14' : 'w-9 h-9';
  return (
    <img
      src={pethubAiLogo}
      alt='PetHub AI'
      className={`${sizeClass} rounded-full object-cover border border-white/80 shadow-[0_8px_24px_rgba(17,24,39,0.22)]`}
    />
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
  const userRole = session.role === 'manager' ? 'manager' : 'customer';
  const slogan =
    session.role === 'manager'
      ? ASSISTANT_SLOGAN_BY_ROLE.manager
      : ASSISTANT_SLOGAN_BY_ROLE.customer;
  const storageKey = useMemo(() => (userId ? `pethub-ai-chat:${userId}` : ''), [userId]);

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') {
      setMessages([]);
      return;
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setMessages([buildWelcomeMessage(userRole)]);
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

      setMessages(normalized.length > 0 ? normalized : [buildWelcomeMessage(userRole)]);
    } catch {
      setMessages([buildWelcomeMessage(userRole)]);
    }
  }, [storageKey, userRole]);

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
    const message = normalizeChatContent(input);
    if (!message || sending) {
      return;
    }

    const userMessage = createMessage('user', message);
    const history: AiChatHistoryItem[] = messages
      .filter((item) => item.role === 'user' || item.role === 'assistant')
      .slice(-MAX_HISTORY_MESSAGES)
      .map((item) => ({
        role: item.role,
        content: compactHistoryContent(item.content),
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
        normalizeChatContent(response.text?.trim() || '') ||
        'Mình chưa nhận được nội dung phù hợp. Bạn vui lòng thử lại.';
      setMessages((previous) => [...previous, createMessage('assistant', assistantText)]);
    } catch (error) {
      const reason = extractApiError(error);
      const fallback =
        reason.toLowerCase().includes('ai_chat_enabled')
          ? 'Trợ lý AI đang tạm tắt. Vui lòng liên hệ quản trị viên.'
          : 'Hệ thống AI tạm thời gián đoạn. Bạn vui lòng thử lại sau.';
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
          className='relative w-16 h-16 rounded-full border border-[#2d2a26]/50 bg-white shadow-[0_20px_38px_rgba(15,23,42,0.28)] hover:-translate-y-0.5 transition-all flex items-center justify-center overflow-hidden'
          aria-label={open ? 'Đóng chatbot' : 'Mở chatbot'}
        >
          {!open ? (
            <AssistantAvatar size='lg' />
          ) : (
            <X className='w-6 h-6 text-[#2d2a26]' />
          )}
        </button>
      </div>

      {open && (
        <section className='fixed z-[69] right-2 bottom-20 w-[min(420px,calc(100vw-1rem))] h-[min(620px,78vh)] print:hidden'>
          <div className='h-full rounded-[28px] border border-[#2d2a26]/35 bg-[#f7f8f4]/95 backdrop-blur-lg shadow-[0_26px_62px_rgba(15,23,42,0.33)] flex flex-col overflow-hidden'>
            <header className='px-4 py-3 border-b border-[#2d2a26]/15 bg-[linear-gradient(125deg,#6b8f5e_0%,#6aa182_60%,#2f7f8a_100%)] text-white flex items-center gap-2'>
              <AssistantAvatar size='md' />
              <div className='min-w-0'>
                <p className='text-sm truncate' style={{ fontWeight: 700 }}>
                  PetHub AI Assistant
                </p>
                <p className='text-[11px] text-white/90 leading-tight'>{slogan}</p>
              </div>
            </header>

            <div
              ref={scrollRef}
              className='flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-[linear-gradient(180deg,#f6f7f3_0%,#eff2ec_100%)]'
            >
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2`}
                >
                  {item.role === 'assistant' ? <AssistantAvatar size='sm' /> : null}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-sm border shadow-sm ${
                      item.role === 'user'
                        ? 'bg-[linear-gradient(135deg,#6b8f5e_0%,#76a267_100%)] text-white border-[#6b8f5e] rounded-br-md shadow-[0_8px_20px_rgba(107,143,94,0.3)]'
                        : 'bg-[#fbfbfa] text-[#1f2937] border-[#2d2a26]/18 rounded-bl-md'
                    }`}
                  >
                    {item.role === 'assistant' ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => (
                            <p className='mb-2 last:mb-0 leading-relaxed break-words'>
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className='my-2 ml-4 list-disc break-words'>
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className='my-2 ml-4 list-decimal break-words'>
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className='mb-1 leading-relaxed break-words'>
                              {children}
                            </li>
                          ),
                          strong: ({ children }) => <strong className='font-semibold'>{children}</strong>,
                          code: ({ children }) => (
                            <code className='px-1 py-0.5 rounded bg-[#2d2a26]/10 text-[0.92em]'>
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {normalizeChatContent(item.content)}
                      </ReactMarkdown>
                    ) : (
                      <p className='leading-relaxed break-words whitespace-normal'>
                        {normalizeChatContent(item.content)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className='flex justify-start items-start gap-2'>
                  <AssistantAvatar size='sm' />
                  <div className='rounded-2xl rounded-bl-md px-3 py-2.5 text-sm border border-[#2d2a26]/18 bg-[#fbfbfa] text-[#374151] shadow-sm'>
                    <div className='flex items-center gap-2'>
                      <span>AI đang suy nghĩ...</span>
                      <span className='inline-flex items-center gap-1'>
                        <span className='h-1.5 w-1.5 rounded-full bg-[#6b8f5e] animate-bounce' />
                        <span
                          className='h-1.5 w-1.5 rounded-full bg-[#6b8f5e] animate-bounce'
                          style={{ animationDelay: '120ms' }}
                        />
                        <span
                          className='h-1.5 w-1.5 rounded-full bg-[#6b8f5e] animate-bounce'
                          style={{ animationDelay: '240ms' }}
                        />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form
              className='border-t border-[#2d2a26]/10 p-3 bg-[#f8f8f6]'
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage();
              }}
            >
              <div className='flex items-end gap-2'>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder='Nhập câu hỏi về PetHub...'
                  rows={2}
                  className='flex-1 resize-none rounded-2xl border border-[#2d2a26]/20 bg-[#fbfbfa] px-3 py-2 text-sm text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]/40'
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
                  className='h-10 w-10 rounded-full border border-[#2d2a26]/50 bg-[linear-gradient(135deg,#7fb779_0%,#6b8f5e_100%)] text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-[0_8px_18px_rgba(107,143,94,0.34)]'
                  aria-label='Gửi tin nhắn'
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
