import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Image as ImageIcon, Landmark, Copy, } from 'lucide-react';
import { Input } from '@/components/ui/input';

import { apiGet, apiPost } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';

type BankAccount = {
  bank_name: string;
  account_name: string;
  account_number: string;
};
const ChatRoom = () => {
  const [bankAccount, setBankAccount] =
    useState<BankAccount | null>(null);

  const [showBankAccount, setShowBankAccount] =
    useState(false);

  const [bankLoading, setBankLoading] =
    useState(false);

  const [bankError, setBankError] =
    useState('');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInfo, setChatInfo] = useState<any>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // ==============================
  // ดึง User ที่ Login จริง
  // ==============================
  useEffect(() => {
    const session = getAuthSession();

    if (session.userId) {
      setCurrentUserId(String(session.userId));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // ==============================
  // เลื่อนลงข้อความล่าสุด
  // ==============================
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ==============================
  // โหลดข้อมูลห้อง + ข้อความ
  // ==============================
  useEffect(() => {
    let isMounted = true;

    const fetchChatAndMessages = async () => {
      if (!id || !currentUserId) {
        return;
      }

      try {
        setIsLoading(true);

        // ------------------------------
        // 1. ข้อมูลคู่สนทนา
        // ------------------------------
        const chatData = await apiGet<any>(
          `/api/chats/${id}`
        );

        if (isMounted) {
          setChatInfo(chatData.data || chatData);
        }

        // ------------------------------
        // 2. ข้อความในห้อง
        // ------------------------------
        const msgData = await apiGet<any>(
          `/api/chats/${id}/messages?userId=${currentUserId}`
        );

        const actualMessages = Array.isArray(msgData)
          ? msgData
          : Array.isArray(msgData?.data)
            ? msgData.data
            : [];

        if (isMounted) {
          setMessages(actualMessages);
        }

      } catch (err) {
        console.error(
          'Failed to load chat room data:',
          err
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchChatAndMessages();

    return () => {
      isMounted = false;
    };
  }, [id, currentUserId]);

  // ==============================
  // ส่งข้อความ
  // ==============================
  const handleSend = async () => {
    if (
      !message.trim() ||
      !id ||
      !currentUserId
    ) {
      return;
    }

    const textToSend = message.trim();

    setMessage('');

    // ข้อความชั่วคราว
    const tempId = `temp-${Date.now()}`;

    const tempMsg = {
      id: tempId,
      message_id: tempId,
      chat_id: id,
      sender_id: currentUserId,
      receiver_id: id,
      message: textToSend,
      created_at: new Date().toISOString(),
    };

    // แสดงทันทีบนหน้าจอ
    setMessages((prev) => [
      ...prev,
      tempMsg,
    ]);

    try {
      const response = await apiPost<any>(
        `/api/chats/${id}/messages`,
        {
          sender_id: currentUserId,
          message: textToSend,
        }
      );

      const savedMessage =
        response.data || response;

      // เปลี่ยนข้อความชั่วคราว
      // เป็นข้อมูลจริงจาก DB
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === tempId ||
            msg.id === tempId
            ? savedMessage
            : msg
        )
      );

    } catch (err) {
      console.error(
        'Failed to send message:',
        err
      );

      // ถ้าส่งไม่สำเร็จ ลบข้อความชั่วคราว
      setMessages((prev) =>
        prev.filter(
          (msg) =>
            msg.message_id !== tempId &&
            msg.id !== tempId
        )
      );
    }
  };

  // ==============================
  // ข้อมูลคู่สนทนา
  // ==============================
  const otherUserName =
    chatInfo?.other_user_name ||
    chatInfo?.user_name ||
    'ผู้ใช้';

  const itemTitle =
    chatInfo?.item_title ||
    chatInfo?.item?.title ||
    '';

  const handleShowBankAccount = async () => {
    if (!id) return;

    if (showBankAccount) {
      setShowBankAccount(false);
      return;
    }

    setShowBankAccount(true);

    if (bankAccount) return;

    setBankLoading(true);
    setBankError('');

    try {
      const response = await apiGet<{
        success: boolean;
        data: BankAccount | null;
        error?: string;
      }>(`/api/chats/${id}/bank-account`);

      if (!response.success) {
        throw new Error(
          response.error || 'โหลดบัญชีธนาคารไม่สำเร็จ'
        );
      }

      setBankAccount(response.data);
    } catch (error) {
      setBankError(
        error instanceof Error
          ? error.message
          : 'ไม่สามารถโหลดบัญชีธนาคารได้'
      );
    } finally {
      setBankLoading(false);
    }
  };

  const handleCopyAccountNumber = async () => {
    if (!bankAccount) return;

    try {
      await navigator.clipboard.writeText(
        bankAccount.account_number
      );

      alert('คัดลอกเลขบัญชีแล้ว');
    } catch {
      alert('ไม่สามารถคัดลอกเลขบัญชีได้');
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 pt-10">

        <button
          onClick={() => navigate('/chat')}
          className="text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
          {otherUserName.charAt(0)}
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">
            {otherUserName}
          </p>

          {itemTitle && (
            <p className="text-[10px] text-muted-foreground">
              {itemTitle}
            </p>
          )}
        </div>

      </div>

      {/* Bank Account Section */}
      <div className="border-b border-border bg-card px-4 py-3">

        <button
          type="button"
          onClick={handleShowBankAccount}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
        >
          <Landmark className="h-4 w-4" />
          {showBankAccount
            ? 'ซ่อนบัญชีธนาคาร'
            : 'ดูบัญชีธนาคารผู้ให้เช่า'}
        </button>

        {showBankAccount && (
          <div className="mt-3 rounded-xl border border-border bg-muted/30 p-4">

            {bankLoading ? (
              <p className="text-sm text-muted-foreground">
                กำลังโหลดบัญชีธนาคาร...
              </p>
            ) : bankError ? (
              <p className="text-sm text-destructive">
                {bankError}
              </p>
            ) : bankAccount ? (
              <div className="space-y-2">

                <p className="text-sm font-semibold">
                  ข้อมูลบัญชีธนาคารของคู่สนทนา
                </p>

                <p className="text-sm">
                  ธนาคาร: {bankAccount.bank_name}
                </p>

                <p className="text-sm">
                  ชื่อบัญชี: {bankAccount.account_name}
                </p>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm">
                    เลขบัญชี: {bankAccount.account_number}
                  </p>

                  <button
                    type="button"
                    onClick={handleCopyAccountNumber}
                    className="rounded-lg border border-border p-2 hover:bg-muted"
                    title="คัดลอกเลขบัญชี"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground">
                  กรุณาตรวจสอบชื่อบัญชีก่อนโอนเงิน
                  และเก็บสลิปไว้เป็นหลักฐาน
                </p>

              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                ผู้ให้เช่ายังไม่ได้เพิ่มบัญชีธนาคาร
              </p>
            )}

          </div>
        )}

      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            กำลังโหลดข้อความ...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            ยังไม่มีข้อความ เริ่มการสนทนาได้เลย
          </div>
        ) : (
          messages.map((msg: any) => {
            const senderId =
              msg.sender_id ||
              msg.user_id;

            // เช็กว่าข้อความนี้เป็นของเราหรือไม่
            const isMe =
              currentUserId
                ? String(senderId) ===
                String(currentUserId)
                : false;

            const msgId =
              msg.message_id ||
              msg.id;

            const timestamp =
              msg.created_at ||
              msg.timestamp ||
              new Date().toISOString();

            return (
              <div
                key={msgId}
                className={`flex ${isMe
                  ? 'justify-end'
                  : 'justify-start'
                  }`}
              >

                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${isMe
                    ? 'rounded-br-md bg-primary text-primary-foreground'
                    : 'rounded-bl-md bg-secondary text-secondary-foreground'
                    }`}
                >

                  <p className="break-words">
                    {msg.message || msg.content}
                  </p>

                  <p
                    className={`mt-0.5 text-[10px] ${isMe
                      ? 'text-primary-foreground/60'
                      : 'text-muted-foreground'
                      }`}
                  >
                    {new Date(timestamp).toLocaleTimeString(
                      'th-TH',
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
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

          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
          >
            <ImageIcon className="h-5 w-5" />
          </button>

          <Input
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSend();
              }
            }}
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 rounded-full"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={
              !message.trim() ||
              !currentUserId
            }
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