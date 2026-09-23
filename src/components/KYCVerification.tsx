import React, { useEffect, useState } from 'react';
import { UserVerification } from '../types';
import { fetchUserVerification, submitVerification } from '../services/api';

export const KYCVerification: React.FC<{ userId: string }> = ({ userId }) => {
    const [kyc, setKyc] = useState<UserVerification | null>(null);
    const [idCard, setIdCard] = useState('');

    useEffect(() => {
        fetchUserVerification(userId).then((res) => {
            if (res.success) setKyc(res.data);
        });
    }, [userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await submitVerification({
            user_id: userId,
            id_card_number: idCard,
            id_card_image_url: 'https://example.com/cards/id.jpg',
            selfie_image_url: 'https://example.com/selfies/selfie.jpg',
        });
        if (res.success) setKyc(res.data);
    };

    return (
        <div className="p-4 border rounded max-w-md">
            <h2 className="text-lg font-bold mb-2">ยืนยันตัวตน (KYC)</h2>
            {kyc ? (
                <p>สถานะปัจจุบัน: <strong className="uppercase">{kyc.status}</strong></p>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                        type="text"
                        placeholder="เลขบัตรประชาชน 13 หลัก"
                        value={idCard}
                        onChange={(e) => setIdCard(e.target.value)}
                        className="border p-2 w-full rounded"
                        required
                    />
                    <button type="submit" className="bg-blue-600 text-white p-2 rounded w-full">
                        ส่งข้อมูลยืนยันตัวตน
                    </button>
                </form>
            )}
        </div>
    );
};