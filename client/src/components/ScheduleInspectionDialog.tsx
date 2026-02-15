import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface ScheduleInspectionDialogProps {
  bidId: number;
  carName: string;
  sellerName?: string;
  sellerPhone?: string;
  currentSchedule?: string | null;
}

export default function ScheduleInspectionDialog({
  bidId,
  carName,
  sellerName,
  sellerPhone,
  currentSchedule,
}: ScheduleInspectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const utils = trpc.useUtils();

  const scheduleInspection = trpc.auction.scheduleInspection.useMutation({
    onSuccess: () => {
      toast.success('Inspection scheduled successfully');
      utils.auction.getMyBids.invalidate();
      setOpen(false);
      setDate('');
      setTime('');
      setNotes('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to schedule inspection');
    },
  });

  const handleSubmit = () => {
    if (!date || !time) {
      toast.error('Please select date and time');
      return;
    }

    const scheduledAt = new Date(`${date}T${time}`);
    
    if (scheduledAt < new Date()) {
      toast.error('Cannot schedule inspection in the past');
      return;
    }

    scheduleInspection.mutate({
      bidId,
      scheduledAt: scheduledAt.toISOString(),
      notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1">
          <Calendar className="h-4 w-4 mr-2" />
          {currentSchedule ? 'Reschedule Inspection' : 'Schedule Inspection'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Vehicle Inspection</DialogTitle>
          <DialogDescription>
            Arrange a time to inspect {carName}
            {sellerName && ` with ${sellerName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentSchedule && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
              <p className="font-medium">Current Schedule:</p>
              <p className="text-muted-foreground">
                {new Date(currentSchedule).toLocaleString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}

          {sellerPhone && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium">Seller Contact:</p>
              <p className="text-muted-foreground">{sellerPhone}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Contact seller to confirm availability before scheduling
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any special requirements or notes for the inspection..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={scheduleInspection.isPending}
            className="flex-1"
          >
            {scheduleInspection.isPending ? 'Scheduling...' : 'Confirm Schedule'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
