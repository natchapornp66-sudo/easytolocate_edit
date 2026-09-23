import { TransactionStatus } from '@/types';

interface StatusBadgeProps {
  status: TransactionStatus;
}

const statusConfig: Record<TransactionStatus, { label: string; className: string }> = {
  pending: { label: 'รออนุมัติ', className: 'bg-warning/15 text-warning border-warning/30' },
  approved: { label: 'อนุมัติแล้ว', className: 'bg-accent/15 text-accent border-accent/30' },
  borrowing: { label: 'กำลังเช่า', className: 'bg-primary/15 text-primary border-primary/30' },
  completed: { label: 'เสร็จสิ้น', className: 'bg-success/15 text-success border-success/30' },
  damaged: { label: 'เสียหาย', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  rejected: { label: 'ปฏิเสธ', className: 'bg-muted text-muted-foreground border-border' },
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
