import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EscalationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
}

export const EscalationDialog = ({ open, onOpenChange, sessionId }: EscalationDialogProps) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [issue, setIssue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Details',
        description: 'Please provide your name and email.',
      });
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-escalation-email', {
        body: {
          userName: name.trim(),
          userEmail: email.trim(),
          userIntent: issue.trim() || 'User requested human agent via voice call',
          conversationSummary: `Voice session: ${sessionId || 'N/A'}\nIssue: ${issue.trim() || 'Not specified'}`,
        },
      });

      if (error) throw new Error(error.message);

      toast({
        title: 'Escalation Submitted',
        description: 'A human agent will contact you shortly at ' + email.trim(),
      });

      // Reset and close
      setName('');
      setEmail('');
      setIssue('');
      onOpenChange(false);
    } catch (err) {
      console.error('Escalation error:', err);
      toast({
        variant: 'destructive',
        title: 'Escalation Failed',
        description: 'Could not submit escalation. Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect with a Human Agent</DialogTitle>
          <DialogDescription>
            Please provide your details so our support team can reach out to you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="esc-name">Name *</Label>
            <Input
              id="esc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="esc-email">Email *</Label>
            <Input
              id="esc-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="esc-issue">Describe your issue (optional)</Label>
            <Textarea
              id="esc-issue"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Briefly describe why you need human support..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSending}>
              {isSending ? 'Sending...' : 'Submit Escalation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
