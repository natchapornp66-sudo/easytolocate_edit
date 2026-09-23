import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Image } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { mockMessages, mockChats, currentUser } from '@/data/mockData';

const ChatRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(mockMessages);

  const chat = mockChats.find((c) => c.id === id);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages([
      ...messages,
      {
        id: `msg-${Date.now()}`,
        transaction_id: 'txn-1',
        sender_id: currentUser.id,
        sender_name: currentUser.full_name,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      },
    ]);
    setMessage('');
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 pt-10">
        <button onClick={() => navigate('/chat')} className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
          {chat?.other_user_name.charAt(0) || '?'}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{chat?.other_user_name || 'ผู้ใช้'}</p>
          <p className="text-[10px] text-muted-foreground">{chat?.item_title}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                  isMe
                    ? 'rounded-br-md bg-primary text-primary-foreground'
                    : 'rounded-bl-md bg-secondary text-secondary-foreground'
                }`}
              >
                <p>{msg.message}</p>
                <p className={`mt-0.5 text-[10px] ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card px-4 py-3 safe-bottom">
        <div className="flex items-center gap-2">
          <button className="text-muted-foreground hover:text-foreground">
            <Image className="h-5 w-5" />
          </button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 rounded-full"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
