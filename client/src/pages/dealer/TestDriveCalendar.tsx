import DealerLayout from "@/components/DealerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Calendar, Clock, Mail, Phone, User, Car, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function TestDriveCalendar() {
  const { data: bookings, isLoading, refetch } = trpc.testDrive.getDealerBookings.useQuery();
  const updateStatus = trpc.testDrive.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Booking status updated");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "pending":
        return "secondary";
      case "cancelled":
        return "destructive";
      case "completed":
        return "outline";
      default:
        return "secondary";
    }
  };

  const groupBookingsByDate = (bookings: any[]) => {
    const grouped: Record<string, any[]> = {};
    bookings.forEach((booking) => {
      const date = new Date(booking.preferredDate).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(booking);
    });
    return grouped;
  };

  if (isLoading) {
    return (
      <DealerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DealerLayout>
    );
  }

  const groupedBookings = bookings && bookings.length > 0 ? groupBookingsByDate(bookings) : {};

  return (
    <DealerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Test Drive Calendar</h1>
          <p className="text-muted-foreground mt-2">
            Manage test drive bookings for your vehicles
          </p>
        </div>

        {!bookings || bookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Test Drive Bookings</h3>
              <p className="text-muted-foreground text-center">
                You don't have any test drive bookings yet. Customers can book test drives from your vehicle listings.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedBookings).map(([date, dateBookings]) => (
              <div key={date}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {date}
                </h2>
                <div className="space-y-4">
                  {dateBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                              {booking.car && `${booking.car.year} ${booking.car.make} ${booking.car.model}`}
                              <Badge variant={getStatusColor(booking.status)}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {booking.preferredTime}
                            </CardDescription>
                          </div>
                          {booking.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => updateStatus.mutate({ bookingId: booking.id, status: "confirmed" })}
                                disabled={updateStatus.isPending}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateStatus.mutate({ bookingId: booking.id, status: "cancelled" })}
                                disabled={updateStatus.isPending}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          )}
                          {booking.status === "confirmed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus.mutate({ bookingId: booking.id, status: "completed" })}
                              disabled={updateStatus.isPending}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Customer Information</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="w-4 h-4" />
                                {booking.customerName}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="w-4 h-4" />
                                <a href={`mailto:${booking.customerEmail}`} className="hover:underline">
                                  {booking.customerEmail}
                                </a>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-4 h-4" />
                                <a href={`tel:${booking.customerPhone}`} className="hover:underline">
                                  {booking.customerPhone}
                                </a>
                              </div>
                            </div>
                          </div>
                          {booking.car && (
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm">Vehicle Details</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Car className="w-4 h-4" />
                                  {booking.car.condition} • {booking.car.mileage?.toLocaleString()} miles
                                </div>
                                {booking.car.price && (
                                  <div className="text-muted-foreground">
                                    Price: £{parseFloat(booking.car.price.toString()).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        {booking.notes && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="font-semibold text-sm mb-1">Customer Notes</h4>
                            <p className="text-sm text-muted-foreground">{booking.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DealerLayout>
  );
}
