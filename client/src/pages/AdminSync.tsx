import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, Database, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminSync() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<{ cars: number; dealers: number } | null>(null);

  const syncAllMutation = trpc.sync.syncAll.useMutation();

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const result = await syncAllMutation.mutateAsync();
      
      if (result.success) {
        setLastSync({ cars: result.carCount || 0, dealers: result.dealerCount || 0 });
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to sync data from Firebase");
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Firebase Data Sync</h1>
            <p className="text-muted-foreground">
              Sync car and dealer data from Firebase to the local database
            </p>
          </div>

          <div className="grid gap-6">
            {/* Sync Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Sync Status
                </CardTitle>
                <CardDescription>
                  Pull the latest data from your Firebase database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {lastSync && (
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">
                        Last sync completed successfully
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Synced {lastSync.cars} cars and {lastSync.dealers} dealers
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-medium mb-1">About Firebase Sync</p>
                    <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                      <li>• Pulls all car listings from the <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">carAds</code> collection</li>
                      <li>• Syncs dealer information from Firestore</li>
                      <li>• Updates existing records and adds new ones</li>
                      <li>• Safe to run multiple times</li>
                    </ul>
                  </div>
                </div>

                <Button
                  onClick={handleSyncAll}
                  disabled={syncing}
                  size="lg"
                  className="w-full"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Syncing from Firebase...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync All Data from Firebase
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Instructions Card */}
            <Card>
              <CardHeader>
                <CardTitle>How to Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">1. Initial Setup:</strong> Click "Sync All Data" to populate your local database with all cars and dealers from Firebase.
                </p>
                <p>
                  <strong className="text-foreground">2. Regular Updates:</strong> Run the sync periodically to get the latest listings and updates from your Firebase database.
                </p>
                <p>
                  <strong className="text-foreground">3. Real-time Updates:</strong> For production, consider setting up Firebase listeners or scheduled jobs to keep data in sync automatically.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
