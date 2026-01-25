import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Share2, Copy, Phone } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface ShareBillDialogProps {
  open: boolean;
  onClose: () => void;
  clientName: string;
  clientPhone?: string;
  vehicleInfo: string;
  totalAmount: string;
  onShare: (message: string) => Promise<void>;
}

export const ShareBillDialog = ({
  open,
  onClose,
  clientName,
  clientPhone,
  vehicleInfo,
  totalAmount,
  onShare,
}: ShareBillDialogProps) => {
  const { toast } = useNotifications();
  const [isSharing, setIsSharing] = useState(false);

  const defaultMessage = `Hi ${clientName}, your bill for ${vehicleInfo} is ready.
Total: ${totalAmount}
Thank you! - Chip`;

  const [message, setMessage] = useState(defaultMessage);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await onShare(message);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast({
        title: 'Message Copied',
        description: 'You can now paste it in any messaging app.',
      });
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy message to clipboard.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Bill with Client
          </DialogTitle>
          <DialogDescription>
            Share the bill PDF and message with {clientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {clientPhone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{clientPhone}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Message Preview</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Skip
          </Button>
          <Button variant="outline" onClick={handleCopyMessage}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button onClick={handleShare} disabled={isSharing}>
            <Share2 className="h-4 w-4 mr-2" />
            {isSharing ? 'Sharing...' : 'Share'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
