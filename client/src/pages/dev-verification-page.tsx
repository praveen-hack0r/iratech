import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layouts/main-layout';

export default function DevVerificationPage() {
  const [token, setToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!token) {
      toast({
        title: 'Error',
        description: 'Please enter a verification token',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const res = await apiRequest('GET', `/api/verify-email?token=${token}`);
      
      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Your email has been verified successfully',
        });
        setTimeout(() => {
          setLocation('/');
        }, 2000);
      } else {
        const data = await res.json();
        toast({
          title: 'Verification failed',
          description: data.message || 'Invalid or expired verification token',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was an error verifying your email',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <MainLayout>
      <div className="container py-10 flex justify-center items-center min-h-[calc(100vh-300px)]">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Development Email Verification</CardTitle>
            <CardDescription className="text-center">
              Enter your verification token to verify your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Verification Token</Label>
              <Input
                id="token"
                placeholder="Enter your verification token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>
                The verification token can be found in the server logs when you register or
                request a verification email.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}