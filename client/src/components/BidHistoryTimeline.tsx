import { useEffect, useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface BidHistoryTimelineProps {
  carId: number;
}

export function BidHistoryTimeline({ carId }: BidHistoryTimelineProps) {
  const { data: bids, refetch } = trpc.auction.getBidHistory.useQuery({ carId });
  const [previousBidCount, setPreviousBidCount] = useState(0);
  const [flashBorder, setFlashBorder] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio notification
  useEffect(() => {  
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    const playSound = () => {
      const newOscillator = audioContext.createOscillator();
      const newGainNode = audioContext.createGain();
      
      newOscillator.connect(newGainNode);
      newGainNode.connect(audioContext.destination);
      
      newOscillator.frequency.value = 800;
      newOscillator.type = 'sine';
      
      newGainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      newGainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      newOscillator.start(audioContext.currentTime);
      newOscillator.stop(audioContext.currentTime + 0.3);
    };
    
    audioRef.current = { play: playSound } as any;
  }, []);

  // Poll for new bids every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Check if new bids arrived and trigger alerts
  useEffect(() => {
    if (bids && bids.length > previousBidCount && previousBidCount > 0) {
      // New bid detected!
      toast.info(`New bid: £${parseFloat(bids[0].bidAmount.toString()).toLocaleString()}`, {
        description: `${bids[0].dealerName || 'A dealer'} just placed a bid`,
      });
      
      // Play sound
      if (audioRef.current) {
        (audioRef.current as any).play();
      }
      
      // Flash border
      setFlashBorder(true);
      setTimeout(() => setFlashBorder(false), 2000);
    }
    
    if (bids) {
      setPreviousBidCount(bids.length);
    }
  }, [bids, previousBidCount]);

  if (!bids || bids.length === 0) {
    return (
      <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
        <CardContent className="p-4 text-center text-white/60">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No bids yet</p>
        </CardContent>
      </Card>
    );
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <Card className={`bg-black/20 backdrop-blur-sm transition-all duration-300 ${
      flashBorder 
        ? 'border-2 border-primary shadow-lg shadow-primary/50 animate-pulse' 
        : 'border-white/10'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-white">Recent Bids</h3>
          <Badge variant="secondary" className="ml-auto">
            {bids.length}
          </Badge>
        </div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {bids.slice(0, 10).map((bid, index) => (
            <div
              key={bid.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                index === 0 ? 'bg-primary/20 border border-primary/30' : 'bg-white/5'
              }`}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-semibold text-white truncate">
                    {bid.dealerName || 'Anonymous Dealer'}
                  </p>
                  {index === 0 && (
                    <Badge variant="default" className="text-xs">
                      Highest
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-lg font-bold text-primary">
                    £{parseFloat(bid.bidAmount.toString()).toLocaleString()}
                  </p>
                  <p className="text-xs text-white/60">
                    {formatTimeAgo(bid.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
