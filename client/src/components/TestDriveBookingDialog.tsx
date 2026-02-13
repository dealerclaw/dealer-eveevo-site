import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarPlus } from "lucide-react";
import TestDriveCalendar from "@/components/TestDriveCalendar";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface TestDriveBookingDialogProps {
  carId: number;
  dealerId: number;
  carName: string;
}

export default function TestDriveBookingDialog({ carId, dealerId, carName }: TestDriveBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'calendar' | 'details'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    notes: "",
  });

  const handleSlotSelect = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setStep('details');
  };

  const createBooking = trpc.testDrive.create.useMutation({
    onSuccess: () => {
      toast.success("Test drive booking requested successfully!");
      setOpen(false);
      setStep('calendar');
      setSelectedDate(null);
      setSelectedTime("");
      setFormData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create booking");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !formData.customerName || !formData.customerEmail || !formData.customerPhone) {
      toast.error("Please fill in all required fields");
      return;
    }

    createBooking.mutate({
      carId,
      dealerId,
      preferredDate: format(selectedDate, "yyyy-MM-dd"),
      preferredTime: selectedTime,
      ...formData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" size="lg">
          <CalendarPlus className="w-4 h-4 mr-2" />
          Book Test Drive
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Book a Test Drive</DialogTitle>
            <DialogDescription>
              Request a test drive for {carName}. The dealer will confirm your appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {step === 'calendar' ? (
              <TestDriveCalendar onSelectSlot={handleSlotSelect} dealerId={dealerId} />
            ) : (
              <div className="space-y-4">
                {/* Show selected date/time */}
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-1">Selected Appointment:</p>
                  <p className="text-lg font-semibold">
                    {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")} at {selectedTime}
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setStep('calendar')}
                    className="px-0 h-auto"
                  >
                    Change date/time
                  </Button>
                </div>

                {/* Customer details form */}
                <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="customerName">Your Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customerEmail">Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customerPhone">Phone *</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="+44 7700 900000"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any specific requirements or questions..."
                rows={3}
              />
            </div>
                </div>
              </div>
            )}
          </div>
          {step === 'details' && (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createBooking.isPending}>
                {createBooking.isPending ? "Submitting..." : "Request Test Drive"}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
