import { API_BASE_URL } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type BankAccountData = {
    bank_account_id: string;
    bank_name: string;
    account_name: string;
    account_number: string;
};

const API_URL = API_BASE_URL;

export default function BankAccount() {
    const navigate = useNavigate();

    const [bankName, setBankName] = useState('');
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const getToken = () => localStorage.getItem('token');

    useEffect(() => {
        const loadBankAccount = async () => {
            try {
                const token = getToken();

                if (!token) {
                    throw new Error('กรุณาเข้าสู่ระบบใหม่');
                }

                const response = await fetch(
                    `${API_URL}/api/bank-accounts/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const result: {
                    success: boolean;
                    data: BankAccountData | null;
                    error?: string;
                } = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'โหลดข้อมูลไม่สำเร็จ');
                }

                if (result.data) {
                    setBankName(result.data.bank_name);
                    setAccountName(result.data.account_name);
                    setAccountNumber(result.data.account_number);
                }
            } catch (error) {
                toast({
                    title: 'โหลดบัญชีธนาคารไม่สำเร็จ',
                    description:
                        error instanceof Error ? error.message : 'กรุณาลองใหม่',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        loadBankAccount();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const normalizedNumber = accountNumber.replace(/-/g, '').trim();

        if (!bankName.trim() || !accountName.trim()) {
            toast({
                title: 'ข้อมูลไม่ครบ',
                description: 'กรุณากรอกชื่อธนาคารและชื่อบัญชี',
                variant: 'destructive',
            });
            return;
        }

        if (!/^[0-9]{10,15}$/.test(normalizedNumber)) {
            toast({
                title: 'เลขบัญชีไม่ถูกต้อง',
                description: 'กรุณากรอกเลขบัญชี 10–15 หลัก',
                variant: 'destructive',
            });
            return;
        }

        setSaving(true);

        try {
            const token = getToken();

            if (!token) {
                throw new Error('กรุณาเข้าสู่ระบบใหม่');
            }

            const response = await fetch(
                `${API_URL}/api/bank-accounts/me`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        bank_name: bankName.trim(),
                        account_name: accountName.trim(),
                        account_number: normalizedNumber,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'บันทึกข้อมูลไม่สำเร็จ');
            }

            toast({
                title: 'บันทึกบัญชีธนาคารสำเร็จ',
                description: 'ข้อมูลบัญชีของคุณถูกบันทึกแล้ว',
            });
        } catch (error) {
            toast({
                title: 'บันทึกไม่สำเร็จ',
                description:
                    error instanceof Error ? error.message : 'กรุณาลองใหม่',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-lg p-4 pb-24">
            <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(-1)}
                className="mb-4"
            >
                ← ย้อนกลับ
            </Button>

            <h1 className="mb-2 text-xl font-bold">
                จัดการบัญชีธนาคาร
            </h1>

            <p className="mb-6 text-sm text-muted-foreground">
                บัญชีนี้ใช้สำหรับรับค่าเช่าที่ผู้เช่าโอนให้คุณโดยตรง
            </p>

            {loading ? (
                <p>กำลังโหลดข้อมูลบัญชีธนาคาร...</p>
            ) : (
                <form onSubmit={handleSave} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="bankName">ชื่อธนาคาร</Label>
                        <Input
                            id="bankName"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="เช่น ธนาคารกสิกรไทย"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="accountName">ชื่อเจ้าของบัญชี</Label>
                        <Input
                            id="accountName"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="ชื่อ-นามสกุล"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="accountNumber">เลขที่บัญชี</Label>
                        <Input
                            id="accountNumber"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="กรอกเลขบัญชีธนาคาร"
                            inputMode="numeric"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={saving}
                    >
                        {saving ? 'กำลังบันทึก...' : 'บันทึกบัญชีธนาคาร'}
                    </Button>
                </form>
            )}
        </div>
    );
}