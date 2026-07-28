import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { motion } from 'framer-motion';
import { User, Cpu } from 'lucide-react';
import type { Message } from '@/types';
import { formatTime } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  aiName: string;
  userName: string;
  speaking: boolean;
}

function MessageBubbleImpl({ message, aiName, userName, speaking }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const display = isUser ? (userName || 'Você') : aiName;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isUser
            ? 'bg-hud-primary/20 text-hud-primary-bright'
            : 'bg-hud-accent/20 text-hud-accent'
        }`}
      >
        {isUser ? <User size={16} /> : <Cpu size={16} />}
      </div>
      <div className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-hud-text">{display}</span>
          <span className="text-[10px] text-hud-text-dim">
            {formatTime(new Date(message.created_at))}
          </span>
        </div>
        <div
          className={`prose prose-invert prose-sm max-w-none rounded-2xl px-3.5 py-2.5 ${
            isUser
              ? 'bg-hud-primary/15 border border-hud-primary/25 text-hud-text rounded-tr-sm'
              : 'glass text-hud-text rounded-tl-sm'
          } ${speaking ? 'ring-1 ring-hud-accent/40' : ''}`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              p: ({ children }) => <p className="m-0 leading-relaxed">{children}</p>,
              code: ({ className, children, ...props }) => (
                <code className={`${className ?? ''} rounded bg-hud-bg/60 px-1 py-0.5 font-mono text-[0.85em]`} {...props}>
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="my-2 overflow-x-auto rounded-lg bg-hud-bg/80 p-3 text-xs scrollbar-thin">
                  {children}
                </pre>
              ),
              a: ({ children, href }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-hud-primary-bright underline">
                  {children}
                </a>
              ),
              ul: ({ children }) => <ul className="my-1 list-disc pl-4">{children}</ul>,
              ol: ({ children }) => <ol className="my-1 list-decimal pl-4">{children}</ol>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}

export const MessageBubble = memo(MessageBubbleImpl);
