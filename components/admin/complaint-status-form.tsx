'use client';

import type { ComplaintStatus } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { updateComplaintStatusAction } from '@/lib/actions/complaints';
import { cn } from '@/lib/utils';

const OPTIONS: { value: ComplaintStatus; label: string }[] = [
  { value: 'OPEN', label: 'Baru' },
  { value: 'IN_PROGRESS', label: 'Diproses' },
  { value: 'RESOLVED', label: 'Selesai' },
  { value: 'CLOSED', label: 'Tutup' },
];

export function ComplaintStatusForm({
  complaintId,
  current,
}: {
  complaintId: string;
  current: ComplaintStatus;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => (
        <form key={option.value} action={updateComplaintStatusAction}>
          <input type="hidden" name="complaintId" value={complaintId} />
          <input type="hidden" name="status" value={option.value} />
          <Button
            type="submit"
            size="sm"
            variant={current === option.value ? 'primary' : 'outline'}
            className={cn(current === option.value && 'pointer-events-none')}
          >
            {option.label}
          </Button>
        </form>
      ))}
    </div>
  );
}
