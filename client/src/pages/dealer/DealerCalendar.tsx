import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, User, Car, Phone, Mail, CheckCircle, XCircle } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";

export default function DealerCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const utils = trpc.useUtils();

  // Fetch all test drive bookings for the dealer
  const { data: bookings, isLoading } = trpc.testDrive.getDealerBookings.useQuery();

  // Update booking status mutation
  const updateStatus = trpc.testDrive.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Booking status updated");
      utils.testDrive.getDealerBookings.invalidate();
    },
    onError: () => {
      toast.error("Failed to update booking");
    },
  });

  // Filter bookings for selected date
  const selectedDateBookings = bookings?.filter((booking) =>
    selectedDate && isSameDay(new Date(booking.preferredDate), selectedDate)
  ) || [];

  // Get dates with bookings for calendar highlighting
  const datesWithBookings = bookings?.map((b) => new Date(b.preferredDate)) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test Drive Calendar</h1>
        <p className="text-muted-foreground">
          Manage your test drive appointments and availability
        </p>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Select Date
            </CardTitle>
            <CardDescription>
              {bookings?.length || 0} total bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                booked: datesWithBookings,
              }}
              modifiersStyles={{
                booked: {
                  fontWeight: "bold",
                  textDecoration: "underline",
                },
              }}
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <p>• Underlined dates have bookings</p>
              <p>• Click a date to view appointments</p>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? `Appointments for ${format(selectedDate, "EEEE, MMMM d, yyyy")}`
                : "Select a date"}
            </CardTitle>
            <CardDescription>
              {selectedDateBookings.length} appointment{selectedDateBookings.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading bookings...</p>
            ) : selectedDateBookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No appointments for this date
              </p>
            ) : (
              <div className="space-y-4">
                {selectedDateBookings.map((booking) => (
                  <Card key={booking.id} className="border-2">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Header with time and status */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <span className="text-lg font-semibold">{booking.preferredTime}</span>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>

                        {/* Vehicle */}
                        <div className="flex items-start gap-2">
                          <Car className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">{booking.car?.make} {booking.car?.model}</p>
                            {booking.car?.year && (
                              <p className="text-sm text-muted-foreground">
                                {booking.car.year}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Customer */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{booking.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <a href={`tel:${booking.customerPhone}`} className="hover:underline">
                              {booking.customerPhone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <a href={`mailto:${booking.customerEmail}`} className="hover:underline">
                              {booking.customerEmail}
                            </a>
                          </div>
                        </div>

                        {/* Notes */}
                        {booking.notes && (
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-medium mb-1">Notes:</p>
                            <p className="text-sm text-muted-foreground">{booking.notes}</p>
                          </div>
                        )}

                        {/* Actions */}
                        {booking.status === "pending" && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                updateStatus.mutate({ bookingId: booking.id, status: "confirmed" })
                              }
                              disabled={updateStatus.isPending}
                              className="flex-1"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                updateStatus.mutate({ bookingId: booking.id, status: "cancelled" })
                              }
                              disabled={updateStatus.isPending}
                              className="flex-1"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
