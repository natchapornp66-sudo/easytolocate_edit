import React, { useEffect, useState } from 'react';
import { ChatMessage } from '../types';
import { fetchChatHistory, sendChatMessage } from '../services/api';

interface ChatBoxProps {
    rentalId: string;
    currentUserId: string;
    receiverId: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ rentalId, currentUserId, receiverId }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState('');

    const loadMessages = async () => {
        const res = await fetchChatHistory(rentalId);
        if (res.success) setMessages(res.data);
    };

    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 3000); // Poll แชท ทุก 3 วิ
        return () => clearInterval(interval);
    }, [rentalId]);

    const handleSend = async () => {
        if (!text.trim()) return;
        const res = await sendChatMessage({
            sender_id: currentUserId,
            receiver_id: receiverId,
            rental_id: rentalId,
            message: text,
        });
        if (res.success) {
            setText('');
            loadMessages();
        }
    };

    return (
        <div className="border p-4 rounded-lg w-full max-w-md">
            <div className="h-64 overflow-y-auto mb-4 space-y-2">
                {messages.map((msg) => (
                    <div
                        key={msg.message_id}
                        className={`p-2 rounded max-w-xs ${msg.sender_id === currentUserId
                            ? 'bg-blue-500 text-white ml-auto'
                            : 'bg-gray-200 text-black'
                            }`}
                    >
                        <p className="text-xs font-bold">{msg.sender_name}</p>
                        <p>{msg.message}</p>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="พิมพ์ข้อความ..."
                    className="border flex-1 p-2 rounded"
                />
                <button onClick={handleSend} className="bg-blue-600 text-white px-4 py-2 rounded">
                    ส่ง
                </button>
            </div>
        </div>
    );
};