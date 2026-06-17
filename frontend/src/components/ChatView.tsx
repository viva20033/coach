import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { Message } from '../types';

interface Props {
  messages: Message[];
  onSend: (content: string) => Promise<void>;
  onFinish: () => void;
  loading?: boolean;
  sending?: boolean;
  showHint?: boolean;
  error?: string;
}

export default function ChatView({
  messages,
  onSend,
  onFinish,
  loading,
  sending,
  showHint = true,
  error,
}: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    await onSend(text);
  };

  const managerCount = messages.filter((m) => m.role === 'user').length;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {showHint && (
          <div className="card bg-primary-light/40 border border-primary/10 text-sm text-slate-700 leading-relaxed">
            Отвечайте как менеджер ИЗОСТУДИИ. Минимум 2 сообщения для оценки. Ваша задача — сохранить
            контакт, уточнить ситуацию, предложить следующий шаг и не обещать невозможного.
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-white shadow-soft text-slate-700 rounded-bl-md'
              }`}
            >
              {msg.role === 'assistant' && (
                <p className="text-[10px] font-medium text-slate-400 mb-1">Клиент</p>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-white shadow-soft rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-100 bg-white px-4 py-3 safe-bottom">
        {error && (
          <div className="mb-2 text-sm text-danger bg-red-50 rounded-button px-3 py-2">
            {error}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ваш ответ..."
            rows={1}
            disabled={loading || sending}
            className="input-field flex-1 resize-none min-h-[44px] max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || loading}
            className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={onFinish}
          disabled={loading || sending || managerCount < 1}
          className="w-full mt-2 text-sm text-slate-500 py-2 disabled:opacity-40"
        >
          Завершить {managerCount < 2 ? `(ещё ${2 - managerCount} сообщ.)` : ''}
        </button>
      </div>
    </div>
  );
}
