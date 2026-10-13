'use client';

import React, { useState } from 'react';
import { ShieldAlert, Send, Lock } from 'lucide-react';
import { filterContactDetails } from '@/lib/retentionUtils';
import type { ChatMessage } from '@/features/chat/api/port';

interface OrderChatBoxProps {
  orderId: string;
  orderNumber: string;
  currentUserId: string;
  currentUserRole: 'resident' | 'provider';
  initialMessages?: ChatMessage[];
  onSendMessage?: (text: string) => Promise<boolean>;
}

export default function OrderChatBox({
  orderNumber,
  currentUserRole,
  initialMessages = [],
  onSendMessage,
}: OrderChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [filterWarning, setFilterWarning] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (val.trim()) {
      const check = filterContactDetails(val);
      if (check.blocked) {
        setFilterWarning(check.reason || 'Personal contact details detected.');
      } else {
        setFilterWarning(null);
      }
    } else {
      setFilterWarning(null);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const check = filterContactDetails(inputText);
    if (check.blocked) {
      setFilterWarning(check.reason || 'Prohibited contact details');
      return;
    }

    if (onSendMessage) {
      const ok = await onSendMessage(inputText);
      if (!ok) return;
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      orderId: orderNumber,
      senderId: 'current-user',
      senderRole: currentUserRole,
      content: inputText,
      filtered: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setFilterWarning(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Uber-Style Security Banner */}
      <div className="bg-amber-950/60 border-b border-amber-800/40 p-3 px-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <span className="font-semibold text-amber-300">Safety & Guarantee Notice:</span> To ensure
          full payment protection and insurance coverage, never share personal phone numbers, email
          addresses, or pay offline. All messages are securely audited.
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[360px]">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            <Lock className="w-6 h-6 mx-auto mb-2 text-slate-600" />
            End-to-end masked messaging is active for Order #{orderNumber}.
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderRole === currentUserRole;
            const isSystem = m.senderRole === 'system';

            if (isSystem) {
              return (
                <div key={m.id} className="text-center my-2">
                  <span className="text-[11px] bg-slate-800/80 text-slate-400 px-3 py-1 rounded-full border border-slate-700/50">
                    {m.content}
                  </span>
                </div>
              );
            }

            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-teal-600 text-white rounded-br-none shadow-sm'
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60'
                  }`}
                >
                  <p>{m.content}</p>
                  <span
                    className={`block text-[10px] mt-1 ${isMe ? 'text-teal-200' : 'text-slate-400'}`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Filter Warning Banner */}
      {filterWarning && (
        <div className="bg-rose-950/80 border-t border-rose-800 text-rose-300 text-[11px] px-3 py-1.5 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>{filterWarning}</span>
        </div>
      )}

      {/* Message Input Form */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-slate-950/60 border-t border-slate-800 flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type a message (personal contact details blocked)..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || Boolean(filterWarning)}
          className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:hover:bg-teal-600 text-white px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
