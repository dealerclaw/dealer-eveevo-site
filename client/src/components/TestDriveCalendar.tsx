import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import { trpc } from "@/lib/trpc";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TestDriveCalendarProps {
  onSelectSlot: (date: Date, time: string) => void;
  dealerId: number;
}

export default function TestDriveCalendar({ onSelectSlot, dealerId }: TestDriveCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Fetch booked slots for the selected dealer and date
  const { data: bookedSlots } = trpc.testDrive.getBookedSlots.useQuery(
    {
      dealerId,
      date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
    },
    {
      enabled: !!selectedDate, // Only fetch when date is selected
    }
  );

  // Generate time slots from 9 AM to 5 PM (every hour)
  const generateTimeSlots = (date: Date | undefined): TimeSlot[] => {
    if (!date) return [];
    
    const slots: TimeSlot[] = [];
    const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17];
    
    hours.forEach(hour => {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      // Check if this time slot is already booked
      const isBooked = bookedSlots?.includes(time) || false;
      slots.push({ time, available: !isBooked });
    });
    
    return slots;
  };

  const timeSlots = generateTimeSlots(selectedDate);

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onSelectSlot(selectedDate, selectedTime);
    }
  };

  // Reset selected time when date changes
  useEffect(() => {
    setSelectedTime("");
  }, [selectedDate]);

  // Disable past dates
  const disabledDays = {
    before: startOfDay(new Date()),
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Date & Time</CardTitle>
          <CardDescription>
            Choose your preferred date and time slot for the test drive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={disabledDays}
              className="rounded-md border"
            />
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4" />
                <span>Available Times for {format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot.time}
                    variant={selectedTime === slot.time ? "default" : "outline"}
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                    className="w-full"
                  >
                    {slot.time}
                    {!slot.available && (
                      <span className="ml-1 text-xs opacity-60">(Booked)</span>
                    )}
                  </Button>
                ))}
              </div>

              {timeSlots.filter(s => s.available).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No available slots for this date. Please select another date.
                </p>
              )}
            </div>
          )}

          {/* Confirm Button */}
          {selectedDate && selectedTime && (
            <div className="pt-4 border-t">
              <div className="bg-muted p-4 rounded-lg mb-4">
                <p className="text-sm font-medium mb-1">Selected Appointment:</p>
                <p className="text-lg font-semibold">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")} at {selectedTime}
                </p>
              </div>
              <Button onClick={handleConfirm} className="w-full" size="lg">
                Confirm Test Drive Booking
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What to Expect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Test drives typically last 30-45 minutes</p>
          <p>• Please bring a valid driving license</p>
          <p>• The dealer will contact you to confirm your booking</p>
          <p>• You can reschedule or cancel up to 24 hours before</p>
        </CardContent>
      </Card>
    </div>
  );
}
