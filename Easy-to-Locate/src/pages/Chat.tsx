import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { mockChats } from '@/data/mockData';
import BottomNav from '@/components/BottomNav';

const Chat = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-primary px-4 pb-6 pt-10">
        <h1 className="text-lg font-bold text-primary-foreground font-display">แชท</h1>
        <p className="mt-0.5 text-sm text-primary-foreground/70">สนทนากับผู้ให้ยืม/ผู้ยืม</p>
      </div>

      <div className="-mt-3 rounded-t-3xl bg-background px-4 pt-4">
        <div className="space-y-1">
          {mockChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => navigate(`/chat/${chat.id}`)}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                {chat.other_user_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{chat.other_user_name}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(chat.last_timestamp).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{chat.item_title}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="truncate text-xs text-muted-foreground">{chat.last_message}</p>
                  {chat.unread_count > 0 && (
                    <span className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {chat.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {mockChats.length === 0 && (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <MessageCircle className="mb-2 h-8 w-8" />
            <p className="text-sm">ยังไม่มีแชท</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Chat;
