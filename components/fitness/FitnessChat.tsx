'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Markdown formatter for chat messages
function formatMarkdownForChat(text: string): JSX.Element {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  
  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      elements.push(<br key={`br-${lineIndex}`} />);
      return;
    }

    // Headings (### or ##)
    const headingMatch = trimmedLine.match(/^(##+)\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const HeadingTag = `h${Math.min(level + 1, 6)}` as keyof JSX.IntrinsicElements;
      elements.push(
        <HeadingTag key={`h-${lineIndex}`} className={`font-bold text-gray-900 dark:text-gray-100 mb-2 mt-3 ${level === 1 ? 'text-lg' : level === 2 ? 'text-base' : 'text-sm'}`}>
          {formatInlineMarkdown(content)}
        </HeadingTag>
      );
      return;
    }

    // Numbered lists (1. ...)
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      const [, number, content] = numberedMatch;
      elements.push(
        <div key={`num-${lineIndex}`} className="flex items-start gap-2 ml-4 mb-1">
          <span className="flex-shrink-0 font-semibold text-gray-600 dark:text-gray-400">{number}.</span>
          <span className="flex-1">{formatInlineMarkdown(content)}</span>
        </div>
      );
      return;
    }

    // Bullet points (- or •)
    const bulletMatch = trimmedLine.match(/^[-•*]\s+(.+)$/);
    if (bulletMatch) {
      elements.push(
        <div key={`bullet-${lineIndex}`} className="flex items-start gap-2 ml-4 mb-1">
          <span className="flex-shrink-0 text-gray-600 dark:text-gray-400">•</span>
          <span className="flex-1">{formatInlineMarkdown(bulletMatch[1])}</span>
        </div>
      );
      return;
    }

    // Regular paragraph with inline formatting
    elements.push(
      <p key={`p-${lineIndex}`} className="text-gray-900 dark:text-gray-100 leading-relaxed mb-1">
        {formatInlineMarkdown(trimmedLine)}
      </p>
    );
  });

  return <div className="space-y-1">{elements}</div>;
}

// Helper to format inline markdown (bold, italic, etc.)
function formatInlineMarkdown(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  let remaining = text;
  let keyCounter = 0;

  // Process bold text (**text**)
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <strong key={`bold-${keyCounter++}`} className="font-semibold">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export default function FitnessChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  useEffect(() => {
    // Focus input when component mounts
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setStreamingContent('');
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversation: messages,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              // Stream complete, save the message
              if (accumulatedContent) {
                setMessages((prev) => [...prev, { role: 'assistant', content: accumulatedContent }]);
              }
              setStreamingContent('');
              setLoading(false);
              return;
            }

            if (!data) continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.content) {
                accumulatedContent += parsed.content;
                setStreamingContent(accumulatedContent);
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }

      // Handle any remaining content in buffer
      if (buffer.trim()) {
        const data = buffer.trim().replace(/^data: /, '');
        if (data && data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              accumulatedContent += parsed.content;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }

      // Finalize the message
      if (accumulatedContent) {
        setMessages((prev) => [...prev, { role: 'assistant', content: accumulatedContent }]);
      }
      setStreamingContent('');
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was aborted, ignore
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please ensure your OpenAI API key is configured correctly.',
        },
      ]);
      setStreamingContent('');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [input, loading, messages]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col" style={{ height: 'calc(100vh - 14rem)', maxHeight: '700px', minHeight: '500px' }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Fitness Chat</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ask questions about your fitness data
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-sm font-medium mb-2">Ask me anything about your fitness data!</p>
            <p className="text-xs opacity-75">Examples: "Why did I gain weight?" or "What's my average protein intake?"</p>
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="text-sm leading-relaxed">
                  {formatMarkdownForChat(message.content)}
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}
        {loading && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm leading-relaxed">
                {formatMarkdownForChat(streamingContent)}
              </div>
            </div>
          </div>
        )}
        {loading && !streamingContent && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <Loader2 className="w-5 h-5 animate-spin text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
