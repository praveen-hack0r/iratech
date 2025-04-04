import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Mail, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Contact message type
interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function ContactMessagesPage() {
  const { toast } = useToast();
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  // Fetch contact messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/admin/contact-messages"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/contact-messages");
      const data = await response.json();
      return data as ContactMessage[];
    }
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest("PATCH", `/api/admin/contact-messages/${messageId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contact-messages"] });
      toast({
        title: "Message marked as read",
        description: "The message has been marked as read."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to mark message as read: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleMarkAsRead = (messageId: number) => {
    markAsReadMutation.mutate(messageId);
  };

  const openMessageDetail = (message: ContactMessage) => {
    setSelectedMessage(message);
    // If message is unread, mark it as read
    if (!message.isRead) {
      markAsReadMutation.mutate(message.id);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Contact Messages</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="bg-card rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-6 py-4 text-left text-sm font-medium">From</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Subject</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {messages.map((message) => (
                    <tr 
                      key={message.id} 
                      className={`hover:bg-muted/30 cursor-pointer ${!message.isRead ? 'font-medium' : ''}`}
                      onClick={() => openMessageDetail(message)}
                    >
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center">
                          <div className="bg-primary/10 p-2 rounded-full mr-3">
                            <Mail className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div>{message.name}</div>
                            <div className="text-muted-foreground text-xs">{message.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{message.subject}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {message.isRead ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            Read
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                            New
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(message.id);
                          }}
                          disabled={message.isRead}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Mark as Read
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-sm border p-8 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No messages yet</h3>
            <p className="text-muted-foreground">
              When users send contact messages, they will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Message from {selectedMessage?.name}</DialogTitle>
            <DialogDescription className="flex justify-between items-center">
              <span>{selectedMessage?.email}</span>
              <span className="text-muted-foreground text-sm">
                {selectedMessage?.createdAt && formatDistanceToNow(new Date(selectedMessage.createdAt), { addSuffix: true })}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">{selectedMessage?.subject}</h3>
            <ScrollArea className="h-60 rounded-md border p-4 bg-muted/30">
              <p className="whitespace-pre-wrap">{selectedMessage?.message}</p>
            </ScrollArea>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setSelectedMessage(null)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}