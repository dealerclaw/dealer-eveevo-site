import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import DealerLayout from "@/components/DealerLayout";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MyInventory() {
  const [, navigate] = useLocation();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const { data: inventory, isLoading, refetch } = trpc.dealer.getMyInventory.useQuery();
  
  const deleteMutation = trpc.dealer.deleteVehicle.useMutation({
    onSuccess: () => {
      toast.success("Vehicle deleted successfully");
      refetch();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete vehicle");
    },
  });

  const updateMutation = trpc.dealer.updateVehicle.useMutation({
    onSuccess: () => {
      toast.success("Vehicle updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update vehicle");
    },
  });

  const handleToggleAvailability = (id: number, currentStatus: boolean) => {
    updateMutation.mutate({
      id,
      isAvailable: !currentStatus,
    });
  };

  if (isLoading) {
    return (
      <DealerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DealerLayout>
    );
  }

  return (
    <DealerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Inventory</h1>
            <p className="text-muted-foreground">Manage your vehicle listings</p>
          </div>
          <Link href="/dealer/add-vehicle">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Listings</CardTitle>
            <CardDescription>
              {inventory?.length || 0} total vehicles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {inventory && inventory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Mileage</TableHead>
                    <TableHead>Range</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((vehicle: any) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">
                        {vehicle.make} {vehicle.model}
                      </TableCell>
                      <TableCell>{vehicle.year || "N/A"}</TableCell>
                      <TableCell>
                        {vehicle.price
                          ? `£${parseFloat(vehicle.price).toLocaleString()}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {vehicle.mileage
                          ? `${vehicle.mileage.toLocaleString()} mi`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {vehicle.realRange ? `${vehicle.realRange} mi` : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={vehicle.isAvailable ? "default" : "secondary"}>
                          {vehicle.isAvailable ? "Available" : "Unavailable"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleAvailability(vehicle.id, vehicle.isAvailable)}
                            title={vehicle.isAvailable ? "Mark as unavailable" : "Mark as available"}
                          >
                            {vehicle.isAvailable ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Link href={`/dealer/edit-vehicle/${vehicle.id}`}>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(vehicle.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No vehicles in your inventory yet</p>
                <Link href="/dealer/add-vehicle">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Vehicle
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vehicle
              from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DealerLayout>
  );
}
