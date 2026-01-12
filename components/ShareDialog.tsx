"use client";

import { useState, useEffect } from "react";
import { LoaderCircle, Mail, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useShare } from "@/lib/contexts/ShareContext";
import { Share } from "@/lib/db/indexeddb";
import { useToast } from "@/lib/hooks/useToast";

interface ShareDialogProps {
  fileId: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ShareDialog = ({ fileId, fileName, isOpen, onClose }: ShareDialogProps) => {
  const [email, setEmail] = useState("");
  const [shares, setShares] = useState<Share[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const { shareFile, getFileShares, revokeShare, isLoading } = useShare();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && fileId) {
      loadFileShares();
    }
  }, [isOpen, fileId]);

  const loadFileShares = async () => {
    setIsLoadingShares(true);
    try {
      const fileShares = await getFileShares(fileId);
      setShares(fileShares);
    } catch (error) {
      console.error("Error loading shares:", error);
    } finally {
      setIsLoadingShares(false);
    }
  };

  const handleShare = async () => {
    if (!email.trim()) return;

    const result = await shareFile(fileId, email);

    if (result.success) {
      toast({
        description: result.message || "File shared successfully",
        className: "success-toast",
      });
      setEmail("");
      await loadFileShares();
    } else {
      toast({
        description: result.message || "Failed to share file",
        className: "error-toast",
      });
    }
  };

  const handleRevoke = async (shareId: string) => {
    const result = await revokeShare(shareId);

    if (result.success) {
      toast({
        description: result.message || "Share revoked successfully",
        className: "success-toast",
      });
      await loadFileShares();
    } else {
      toast({
        description: result.message || "Failed to revoke share",
        className: "error-toast",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && email.trim() && !isLoading) {
      handleShare();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="shad-dialog button max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-light-100">
            Share "{fileName}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Share Input Section */}
          <div>
            <label className="text-sm text-light-200 mb-2 block">
              Share with:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-100"
                  size={16}
                />
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleShare}
                disabled={!email.trim() || isLoading}
                className="modal-submit-button"
              >
                {isLoading ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  "Share"
                )}
              </Button>
            </div>
          </div>

          {/* Shared With Section */}
          <div>
            <label className="text-sm text-light-200 mb-2 block">
              Shared with:
            </label>
            {isLoadingShares ? (
              <div className="flex items-center justify-center py-4">
                <LoaderCircle className="animate-spin text-brand" size={20} />
              </div>
            ) : shares.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between bg-light-400 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Mail className="text-brand flex-shrink-0" size={16} />
                      <span className="text-sm text-light-100 truncate">
                        {share.sharedWithEmail}
                      </span>
                      {!share.sharedWithUserId && (
                        <span className="text-xs text-light-200 bg-light-300 px-2 py-0.5 rounded flex-shrink-0">
                          Pending
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => handleRevoke(share.id)}
                      variant="ghost"
                      size="sm"
                      className="text-error hover:text-error hover:bg-error/10 ml-2 flex-shrink-0"
                      disabled={isLoading}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-light-200 text-center py-4">
                No one has access to this file yet
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={onClose} className="modal-cancel-button">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
