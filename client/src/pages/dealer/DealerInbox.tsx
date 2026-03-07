/**
 * DealerInbox
 * Shows a dealer's received enquiries (inbox) and sent enquiries (outbox).
 * Clicking an enquiry opens a threaded conversation view with a reply form.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  MessageSquare,
  Loader2,
  ArrowLeft,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  Car,
  Building2,
  PoundSterling,
  Inbox,
  SendHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DealerLayout from "@/components/DealerLayout";
import { useParams, useLocation } from "wouter";

// ---------------------------------------------------------------------------
// Status badge helper
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: string }) {
  if (status === "replied") {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Replied
      </Badge>
    );
  }
  if (status === "closed") {
    return (
      <Badge variant="secondary">
        <XCircle className="w-3 h-3 mr-1" />
        Closed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-500 text-amber-600">
      <Clock className="w-3 h-3 mr-1" />
      Pending
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Enquiry list item
// ---------------------------------------------------------------------------
interface EnquiryItem {
  id: number;
  carId: number;
  senderDealerId: number;
  receiverDealerId: number;
  message: string;
  offerPrice: string | null;
  status: string;
  isReadByReceiver: boolean;
  createdAt: Date;
  updatedAt: Date;
  carMake: string;
  carModel: string;
  carYear: number | null;
  carMainImage: string | null;
  senderName: string;
  senderLogoUrl: string | null;
  receiverName: string;
  receiverLogoUrl: string | null;
}

function EnquiryCard({
  enquiry,
  type,
  isSelected,
  onClick,
}: {
  enquiry: EnquiryItem;
  type: "inbox" | "sent";
  isSelected: boolean;
  onClick: () => void;
}) {
  const counterpartyName =
    type === "inbox" ? enquiry.senderName : enquiry.receiverName;
  const counterpartyLogo =
    type === "inbox" ? enquiry.senderLogoUrl : enquiry.receiverLogoUrl;
  const isUnread = type === "inbox" && !enquiry.isReadByReceiver;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b transition-colors hover:bg-accent/50 ${
        isSelected ? "bg-accent" : ""
      } ${isUnread ? "bg-primary/5" : ""}`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={counterpartyLogo ?? undefined} />
          <AvatarFallback className="text-xs font-bold">
            {counterpartyName?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm font-medium truncate ${isUnread ? "font-bold" : ""}`}>
              {counterpartyName}
            </p>
            <span className="text-xs text-muted-foreground shrink-0">
              {new Date(enquiry.updatedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>

          <p className="text-xs text-muted-foreground truncate">
            {enquiry.carYear} {enquiry.carMake} {enquiry.carModel}
          </p>

          <p className="text-xs text-muted-foreground truncate mt-1">
            {enquiry.message}
          </p>

          <div className="flex items-center gap-2 mt-1.5">
            <StatusBadge status={enquiry.status} />
            {isUnread && (
              <Badge variant="destructive" className="h-4 text-[10px] px-1">
                New
              </Badge>
            )}
            {enquiry.offerPrice && (
              <span className="text-xs text-green-600 font-medium">
                £{parseFloat(enquiry.offerPrice).toLocaleString()} offer
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Thread view
// ---------------------------------------------------------------------------
function ThreadView({
  enquiryId,
  currentDealerId,
  onBack,
}: {
  enquiryId: number;
  currentDealerId: number;
  onBack: () => void;
}) {
  const [replyText, setReplyText] = useState("");
  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.enquiries.getThread.useQuery(
    { enquiryId },
    { enabled: !!enquiryId }
  );

  const replyMutation = trpc.enquiries.reply.useMutation({
    onSuccess: () => {
      toast.success("Reply sent!");
      setReplyText("");
      utils.enquiries.getThread.invalidate({ enquiryId });
      utils.enquiries.list.invalidate();
      utils.enquiries.unreadCount.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send reply");
    },
  });

  const closeMutation = trpc.enquiries.close.useMutation({
    onSuccess: () => {
      toast.success("Enquiry marked as closed");
      utils.enquiries.getThread.invalidate({ enquiryId });
      utils.enquiries.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to close enquiry");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Could not load this conversation.</p>
        <Button variant="ghost" onClick={onBack} className="mt-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to inbox
        </Button>
      </div>
    );
  }

  const { enquiry, replies } = data;
  const isClosed = enquiry.status === "closed";

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <StatusBadge status={enquiry.status} />
        </div>

        {/* Car info */}
        <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
          {enquiry.carMainImage ? (
            <img
              src={enquiry.carMainImage}
              alt={`${enquiry.carMake} ${enquiry.carModel}`}
              className="w-16 h-12 object-cover rounded"
            />
          ) : (
            <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
              <Car className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-semibold text-sm">
              {enquiry.carYear} {enquiry.carMake} {enquiry.carModel}
            </p>
            {enquiry.carPrice && (
              <p className="text-xs text-muted-foreground">
                Asking: £{parseFloat(enquiry.carPrice.toString()).toLocaleString()}
              </p>
            )}
            {enquiry.offerPrice && (
              <p className="text-xs text-green-600 font-medium">
                Offer: £{parseFloat(enquiry.offerPrice.toString()).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <Building2 className="w-3 h-3" />
          <span>
            <span className="font-medium text-foreground">{enquiry.senderName}</span>
            {" → "}
            <span className="font-medium text-foreground">{enquiry.receiverName}</span>
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Original enquiry message */}
        <div
          className={`flex gap-3 ${
            enquiry.senderDealerId === currentDealerId ? "flex-row-reverse" : ""
          }`}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={enquiry.senderLogoUrl ?? undefined} />
            <AvatarFallback className="text-xs">
              {enquiry.senderName?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div
            className={`max-w-[75%] ${
              enquiry.senderDealerId === currentDealerId ? "items-end" : "items-start"
            } flex flex-col gap-1`}
          >
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                enquiry.senderDealerId === currentDealerId
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted rounded-tl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{enquiry.message}</p>
            </div>
            <span className="text-xs text-muted-foreground px-1">
              {enquiry.senderName} ·{" "}
              {new Date(enquiry.createdAt).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Replies */}
        {replies.map((reply) => (
          <div
            key={reply.id}
            className={`flex gap-3 ${
              reply.senderDealerId === currentDealerId ? "flex-row-reverse" : ""
            }`}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={reply.senderLogoUrl ?? undefined} />
              <AvatarFallback className="text-xs">
                {reply.senderName?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div
              className={`max-w-[75%] ${
                reply.senderDealerId === currentDealerId ? "items-end" : "items-start"
              } flex flex-col gap-1`}
            >
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  reply.senderDealerId === currentDealerId
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted rounded-tl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{reply.message}</p>
              </div>
              <span className="text-xs text-muted-foreground px-1">
                {reply.senderName} ·{" "}
                {new Date(reply.createdAt).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Reply form */}
      {!isClosed && (
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              className="resize-none flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  if (replyText.trim()) {
                    replyMutation.mutate({ enquiryId, message: replyText.trim() });
                  }
                }
              }}
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  if (!replyText.trim()) return;
                  replyMutation.mutate({ enquiryId, message: replyText.trim() });
                }}
                disabled={replyMutation.isPending || !replyText.trim()}
                size="icon"
                className="h-10 w-10"
              >
                {replyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground"
                title="Mark as closed"
                onClick={() => closeMutation.mutate({ enquiryId })}
                disabled={closeMutation.isPending}
              >
                {closeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Ctrl+Enter to send · Click ✕ to close enquiry
          </p>
        </div>
      )}

      {isClosed && (
        <div className="p-4 border-t bg-muted/50 text-center text-sm text-muted-foreground">
          This enquiry has been closed.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function DealerInbox() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<number | null>(
    params.id ? parseInt(params.id) : null
  );
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");

  const { data: authData } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();

  // We need the current dealer ID to determine message alignment
  // We'll use the auth user's dealer record via a separate query
  const { data: inboxData, isLoading: inboxLoading } = trpc.enquiries.list.useQuery({
    type: "inbox",
  });
  const { data: sentData, isLoading: sentLoading } = trpc.enquiries.list.useQuery({
    type: "sent",
  });

  const enquiries = activeTab === "inbox" ? inboxData?.enquiries : sentData?.enquiries;
  const isLoading = activeTab === "inbox" ? inboxLoading : sentLoading;

  // Determine current dealer ID from the first enquiry (receiver for inbox, sender for sent)
  const currentDealerId =
    activeTab === "inbox"
      ? inboxData?.enquiries?.[0]?.receiverDealerId
      : sentData?.enquiries?.[0]?.senderDealerId;

  const handleSelectEnquiry = (id: number) => {
    setSelectedEnquiryId(id);
    navigate(`/dealer/inbox/${id}`, { replace: true });
    utils.enquiries.unreadCount.invalidate();
  };

  const handleBack = () => {
    setSelectedEnquiryId(null);
    navigate("/dealer/inbox", { replace: true });
  };

  return (
    <DealerLayout>
      <div className="container max-w-6xl py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Enquiries Inbox
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage dealer-to-dealer enquiries about marketplace listings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
          {/* Left panel: enquiry list */}
          <div
            className={`lg:col-span-1 border rounded-lg overflow-hidden flex flex-col ${
              selectedEnquiryId ? "hidden lg:flex" : "flex"
            }`}
          >
            <Tabs
              value={activeTab}
              onValueChange={(v) => {
                setActiveTab(v as "inbox" | "sent");
                setSelectedEnquiryId(null);
              }}
              className="flex flex-col h-full"
            >
              <TabsList className="w-full rounded-none border-b h-10">
                <TabsTrigger value="inbox" className="flex-1 gap-1.5">
                  <Inbox className="w-4 h-4" />
                  Inbox
                  {(inboxData?.enquiries?.filter((e) => !e.isReadByReceiver).length ?? 0) > 0 && (
                    <Badge variant="destructive" className="h-4 text-[10px] px-1">
                      {inboxData?.enquiries?.filter((e) => !e.isReadByReceiver).length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex-1 gap-1.5">
                  <SendHorizontal className="w-4 h-4" />
                  Sent
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="flex-1 overflow-y-auto m-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : !enquiries?.length ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                    <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="font-medium text-sm">No enquiries yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeTab === "inbox"
                        ? "When other dealers contact you about your listings, they'll appear here."
                        : "Enquiries you send to other dealers will appear here."}
                    </p>
                  </div>
                ) : (
                  enquiries.map((enquiry) => (
                    <EnquiryCard
                      key={enquiry.id}
                      enquiry={enquiry as EnquiryItem}
                      type={activeTab}
                      isSelected={selectedEnquiryId === enquiry.id}
                      onClick={() => handleSelectEnquiry(enquiry.id)}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right panel: thread view */}
          <div
            className={`lg:col-span-2 border rounded-lg overflow-hidden flex flex-col ${
              selectedEnquiryId ? "flex" : "hidden lg:flex"
            }`}
          >
            {selectedEnquiryId ? (
              <ThreadView
                enquiryId={selectedEnquiryId}
                currentDealerId={currentDealerId ?? 0}
                onBack={handleBack}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mb-4 opacity-30" />
                <p className="font-medium">Select an enquiry to view the conversation</p>
                <p className="text-sm mt-1">
                  Click any enquiry on the left to open the thread.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DealerLayout>
  );
}
