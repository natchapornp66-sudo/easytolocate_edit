import React, { useEffect, useState } from 'react';
import { Agreement } from '../types';
import { fetchAgreementByRentalId, signAgreement } from '../services/api';

export const AgreementView: React.FC<{ rentalId: string; isLender: boolean }> = ({ rentalId, isLender }) => {
    const [agreement, setAgreement] = useState<Agreement | null>(null);

    useEffect(() => {
        fetchAgreementByRentalId(rentalId).then((res) => {
            if (res.success) setAgreement(res.data);
        });
    }, [rentalId]);

    const handleAccept = async () => {
        if (!agreement) return;
        const res = await signAgreement({
            rental_id: rentalId,
            contract_terms: agreement.contract_terms,
            borrower_accepted: isLender ? agreement.borrower_accepted : true,
            lender_accepted: isLender ? true : agreement.lender_accepted,
        });
        if (res.success) setAgreement(res.data);
    };

    if (!agreement) return <div>กำลังโหลดข้อมูลสัญญา...</div>;

    return (
        <div className="p-4 border rounded-lg max-w-lg">
            <h2 className="text-xl font-bold mb-2">สัญญาการเช่าสินค้า</h2>
            <p className="bg-gray-50 p-3 rounded mb-4 text-sm">{agreement.contract_terms}</p>

            <div className="space-y-2 mb-4">
                <p>ผู้เช่า: {agreement.borrower_accepted ? '✅ ยอมรับแล้ว' : '⏳ รอดำเนินการ'}</p>
                <p>ผู้ให้เช่า: {agreement.lender_accepted ? '✅ ยอมรับแล้ว' : '⏳ รอดำเนินการ'}</p>
            </div>

            <button
                onClick={handleAccept}
                className="bg-green-600 text-white px-4 py-2 rounded w-full hover:bg-green-700"
            >
                ยอมรับเงื่อนไขสัญญาเช่า
            </button>
        </div>
    );
};