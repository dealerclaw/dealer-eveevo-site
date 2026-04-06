import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

export default function DealerClawAdmin() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: cars, isLoading, refetch } = trpc.admin.getDealerClawCars.useQuery(
    { limit: 200, offset: 0 },
    { enabled: user?.role === "admin" }
  );

  const setDealerClawId = trpc.admin.setDealerClawDealerId.useMutation({
    onSuccess: () => {
      toast.success("DealerClaw dealer ID updated");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  const filtered = (cars ?? []).filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      `${c.make} ${c.model}`.toLowerCase().includes(q) ||
      String(c.dealerClawCarId).includes(q) ||
      String(c.dealerClawDealerId ?? "").includes(q) ||
      (c.dealerName ?? "").toLowerCase().includes(q)
    );
  });

  const linked = filtered.filter((c) => c.dealerId !== null);
  const unlinked = filtered.filter((c) => c.dealerId === null);

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-purple-600">🐾</span> DealerClaw Sync Panel
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            All cars pushed via the DealerClaw sync API — {cars?.length ?? 0} total
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin">← Back to Admin</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-purple-600">{cars?.length ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Total DealerClaw Cars</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-green-600">{linked.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Linked to EVEEVO Dealer</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-amber-600">{unlinked.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Unlinked (no dealer match)</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by make, model, DealerClaw ID, or dealer name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>DealerClaw Inventory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No DealerClaw cars found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>DealerClaw Car ID</TableHead>
                    <TableHead>DealerClaw Dealer ID</TableHead>
                    <TableHead>EVEEVO Dealer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewed</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((car) => (
                    <DealerClawRow
                      key={car.id}
                      car={car}
                      onSetDealerClawId={(dealerId, dcId) =>
                        setDealerClawId.mutate({ dealerId, dealerClawDealerId: dcId })
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type CarRow = {
  id: number;
  make: string;
  model: string;
  year: number | null;
  price: number | string | null;
  isAvailable: boolean | null;
  mainImage: string | null;
  dealerClawCarId: number | null;
  dealerClawDealerId: number | null;
  dealerId: number | null;
  dealerName: string | null;
  dealerEmail: string | null;
  rebeccaReview: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

function DealerClawRow({
  car,
  onSetDealerClawId,
}: {
  car: CarRow;
  onSetDealerClawId: (dealerId: number, dcId: number) => void;
}) {
  const [editingDcId, setEditingDcId] = useState(false);
  const [dcIdInput, setDcIdInput] = useState(String(car.dealerClawDealerId ?? ""));

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          {car.mainImage && (
            <img
              src={car.mainImage}
              alt={`${car.make} ${car.model}`}
              className="w-10 h-8 object-cover rounded"
            />
          )}
          <div>
            <Link href={`/cars/${car.id}`} className="font-medium hover:underline text-sm">
              {car.year} {car.make} {car.model}
            </Link>
            <p className="text-xs text-muted-foreground">EVEEVO ID: {car.id}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <code className="text-xs bg-muted px-1 py-0.5 rounded">{car.dealerClawCarId}</code>
      </TableCell>
      <TableCell>
        {editingDcId ? (
          <div className="flex items-center gap-1">
            <Input
              value={dcIdInput}
              onChange={(e) => setDcIdInput(e.target.value)}
              className="w-20 h-7 text-xs"
            />
            <Button
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => {
                const n = parseInt(dcIdInput);
                if (!isNaN(n) && car.dealerId) {
                  onSetDealerClawId(car.dealerId, n);
                }
                setEditingDcId(false);
              }}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2"
              onClick={() => setEditingDcId(false)}
            >
              ✕
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {car.dealerClawDealerId ?? "—"}
            </code>
            {car.dealerId && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs px-1"
                onClick={() => setEditingDcId(true)}
              >
                ✏️
              </Button>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        {car.dealerId ? (
          <div>
            <Link
              href={`/admin/dealers/${car.dealerId}`}
              className="text-sm font-medium hover:underline"
            >
              {car.dealerName ?? `Dealer #${car.dealerId}`}
            </Link>
            {car.dealerEmail && (
              <p className="text-xs text-muted-foreground">{car.dealerEmail}</p>
            )}
          </div>
        ) : (
          <span className="text-xs text-amber-600 font-medium">Not linked</span>
        )}
      </TableCell>
      <TableCell>
        <Badge
          variant={car.isAvailable ? "default" : "secondary"}
          className={car.isAvailable ? "bg-green-100 text-green-800" : ""}
        >
          {car.isAvailable ? "Available" : "Unavailable"}
        </Badge>
      </TableCell>
      <TableCell>
        {car.rebeccaReview ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
            ⭐ Reviewed
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        {car.price ? `£${(Number(car.price) / 100).toLocaleString()}` : "—"}
      </TableCell>
      <TableCell>
        <Button size="sm" variant="outline" asChild>
          <Link href={`/cars/${car.id}`}>View</Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}
