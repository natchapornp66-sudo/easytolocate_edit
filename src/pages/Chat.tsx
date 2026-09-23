import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

export const Chat = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadChats = async () => {
      try {
        const res = await fetch('/api/chats');
        const response = await res.json();

        if (isMounted) {
          const actualData = Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
              ? response.data
              : [];
          setChats(actualData);
        }
      } catch (err) {
        console.error('Failed to load chats:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadChats();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-primary px-4 pb-6 pt-10">
        <h1 className="text-lg font-bold text-primary-foreground font-display">แชท</h1>
        <p className="mt-0.5 text-sm text-primary-foreground/70">สนทนากับผู้ให้ยืม/ผู้ยืม</p>
      </div>

      <div className="-mt-3 rounded-t-3xl bg-background px-4 pt-4">
        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
            กำลังโหลดรายการแชท...
          </div>
        ) : (
          <div className="space-y-1">
            {chats.map((chat: any) => {
              const chatId = chat.chat_id || chat.id;
              const userName = chat.other_user_name || chat.user_name || 'ผู้ใช้งาน';
              const itemTitle = chat.item_title || chat.item?.title || '';
              const lastMessage = chat.last_message || 'เริ่มการสนทนา';
              const unreadCount = chat.unread_count || 0;
              const timestamp = chat.last_timestamp || chat.updated_at || chat.created_at;

              return (
                <button
                  key={chatId}
                  onClick={() => navigate(`/chat/${chatId}`)}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {userName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{userName}</p>
                      {timestamp && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(timestamp).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    {itemTitle && <p className="text-xs text-muted-foreground">{itemTitle}</p>}
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="truncate text-xs text-muted-foreground">{lastMessage}</p>
                      {unreadCount > 0 && (
                        <span className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {chats.length === 0 && (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <MessageCircle className="mb-2 h-8 w-8" />
                <p className="text-sm">ยังไม่มีแชท</p>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Chat;