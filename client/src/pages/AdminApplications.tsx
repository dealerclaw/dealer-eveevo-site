import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, XCircle, Clock, Building2, User, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminApplications() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  const { data: applications, isLoading, refetch } = trpc.admin.getApplications.useQuery({
    status: activeTab,
  });

  const approveMutation = trpc.admin.approveApplication.useMutation({
    onSuccess: () => {
      toast.success('Application approved! Dealer account created.');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to approve application');
    },
  });

  const rejectMutation = trpc.admin.rejectApplication.useMutation({
    onSuccess: () => {
      toast.success('Application rejected');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reject application');
    },
  });

  const handleApprove = (applicationId: number) => {
    if (confirm('Are you sure you want to approve this application? This will create a dealer account.')) {
      approveMutation.mutate({ applicationId });
    }
  };

  const handleReject = (applicationId: number) => {
    if (confirm('Are you sure you want to reject this application?')) {
      rejectMutation.mutate({ applicationId });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dealer Applications</h1>
          <p className="text-muted-foreground">
            Review and manage dealer applications
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejected
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !applications || applications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No {activeTab} applications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="w-5 h-5" />
                          {application.businessName}
                        </CardTitle>
                        <CardDescription>
                          Applied on {new Date(application.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          application.status === 'approved'
                            ? 'default'
                            : application.status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {application.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Contact:</span>
                          <span>{application.contactName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Email:</span>
                          <span>{application.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Phone:</span>
                          <span>{application.phone}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="font-medium">Address:</span>
                            <p className="text-muted-foreground">{application.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-semibold mb-2">Business Description</h4>
                      <p className="text-sm text-muted-foreground">{application.description}</p>
                    </div>

                    {application.status === 'pending' && (
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprove(application.id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          className="flex-1"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve Application
                        </Button>
                        <Button
                          onClick={() => handleReject(application.id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject Application
                        </Button>
                      </div>
                    )}

                    {application.status === 'approved' && (
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Dealer account created and user role updated
                      </div>
                    )}

                    {application.status === 'rejected' && (
                      <div className="text-sm text-red-600 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Application rejected
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
}
