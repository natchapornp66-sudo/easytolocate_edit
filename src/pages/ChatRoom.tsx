import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ChatRoom = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ดึงข้อมูล Current User จาก localStorage หรือ API
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUserId(parsed.id || parsed.user_id);
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
      }
    }
  }, []);

  // เลื่อนจอลงล่างสุดอัตโนมัติเมื่อมีข้อความใหม่
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ดึงข้อมูลแชทและข้อความจาก API
  useEffect(() => {
    let isMounted = true;

    const fetchChatAndMessages = async () => {
      try {
        // 1. ดึงรายละเอียดห้องแชท
        const chatRes = await fetch(`/api/chats/${id}`);
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          if (isMounted) setChatInfo(chatData.data || chatData);
        }

        // 2. ดึงรายการข้อความในห้องแชท
        const msgRes = await fetch(`/api/chats/${id}/messages`);
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          const actualMessages = Array.isArray(msgData)
            ? msgData
            : Array.isArray(msgData?.data)
              ? msgData.data
              : [];
          if (isMounted) setMessages(actualMessages);
        }
      } catch (err) {
        console.error('Failed to load chat room data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (id) {
      fetchChatAndMessages();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  // ยิง API ส่งข้อความ
  const handleSend = async () => {
    if (!message.trim() || !id) return;

    const textToSend = message.trim();
    setMessage('');

    // Optimistic Update เพื่อความลื่นไหลใน UI
    const tempMsg = {
      id: `temp-${Date.now()}`,
      chat_id: id,
      sender_id: currentUserId,
      message: textToSend,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch(`/api/chats/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: textToSend }),
      });

      if (res.ok) {
        const savedMsg = await res.json();
        // แทนที่ Temp Message ด้วยข้อมูลจริงที่ส่งกลับจาก Server
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempMsg.id ? savedMsg.data || savedMsg : msg))
        );
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const otherUserName = chatInfo?.other_user_name || chatInfo?.user_name || 'ผู้ใช้';
  const itemTitle = chatInfo?.item_title || chatInfo?.item?.title || '';

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 pt-10">
        <button onClick={() => navigate('/chat')} className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
          {otherUserName.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{otherUserName}</p>
          {itemTitle && <p className="text-[10px] text-muted-foreground">{itemTitle}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            กำลังโหลดข้อความ...
          </div>
        ) : (
          messages.map((msg: any) => {
            const senderId = msg.sender_id || msg.user_id;
            const isMe = currentUserId ? String(senderId) === String(currentUserId) : false;
            const msgId = msg.message_id || msg.id;
            const timestamp = msg.created_at || msg.timestamp || new Date().toISOString();

            return (
              <div key={msgId} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${isMe
                      ? 'rounded-br-md bg-primary text-primary-foreground'
                      : 'rounded-bl-md bg-secondary text-secondary-foreground'
                    }`}
                >
                  <p className="break-words">{msg.message || msg.content}</p>
                  <p
                    className={`mt-0.5 text-[10px] ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'
                      }`}
                  >
                    {new Date(timestamp).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card px-4 py-3 safe-bottom">
        <div className="flex items-center gap-2">
          <button className="text-muted-foreground hover:text-foreground">
            <ImageIcon className="h-5 w-5" />
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