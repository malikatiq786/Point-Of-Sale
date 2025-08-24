import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { RegisterDenominationBreakdown } from './RegisterDenominationBreakdown';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  DollarSign, 
  Calendar,
  User,
  FileText,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface RegisterSession {
  id: number;
  sessionNumber: string;
  registerId: number;
  userId: string;
  branchId: number;
  declaredOpeningBalance: string;
  calculatedOpeningBalance: string;
  declaredClosingBalance?: string;
  calculatedClosingBalance?: string;
  discrepancyAmount?: string;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  notes?: string;
}

interface RegisterSessionManagerProps {
  registerId: number;
  registerName: string;
  branchId: number;
  onSessionChange?: (session: RegisterSession | null) => void;
}

export function RegisterSessionManager({ 
  registerId, 
  registerName, 
  branchId,
  onSessionChange 
}: RegisterSessionManagerProps) {
  const [activeSession, setActiveSession] = useState<RegisterSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<RegisterSession[]>([]);
  const [currentView, setCurrentView] = useState<'overview' | 'open-session' | 'close-session'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const { toast } = useToast();

  // Load active session and session history
  useEffect(() => {
    loadActiveSession();
    loadSessionHistory();
  }, [registerId]);

  const loadActiveSession = async () => {
    try {
      const response = await fetch(`/api/register-sessions/active/${registerId}`);
      if (response.ok) {
        const data = await response.json();
        setActiveSession(data);
        onSessionChange?.(data);
      } else if (response.status !== 404) {
        console.error('Error loading active session');
      }
    } catch (error) {
      console.error('Error loading active session:', error);
    }
  };

  const loadSessionHistory = async () => {
    try {
      const response = await fetch(`/api/register-sessions/history/${registerId}`);
      if (response.ok) {
        const data = await response.json();
        setSessionHistory(data);
      }
    } catch (error) {
      console.error('Error loading session history:', error);
    }
  };

  // Handle opening a new session
  const handleOpenSession = async (data: {
    declaredBalance: string;
    denominationBreakdown: Array<{
      denominationId: number;
      quantity: number;
      amount: string;
    }>;
    notes?: string;
  }) => {
    setIsLoading(true);
    setLoadingText('Opening register session...');
    
    try {
      const response = await fetch('/api/register-sessions/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registerId,
          branchId,
          declaredOpeningBalance: data.declaredBalance,
          denominationBreakdown: data.denominationBreakdown,
          notes: data.notes,
        }),
      });

      if (response.ok) {
        const newSession = await response.json();
        setActiveSession(newSession);
        onSessionChange?.(newSession);
        setCurrentView('overview');
        
        await loadSessionHistory(); // Refresh history
        
        toast({
          title: 'Success',
          description: `Register session opened successfully with opening balance of PKR ${data.declaredBalance}`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to open register session',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error opening session:', error);
      toast({
        title: 'Error',
        description: 'Failed to open register session',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  // Handle closing a session
  const handleCloseSession = async (data: {
    declaredBalance: string;
    denominationBreakdown: Array<{
      denominationId: number;
      quantity: number;
      amount: string;
    }>;
    notes?: string;
  }) => {
    if (!activeSession) return;

    setIsLoading(true);
    setLoadingText('Closing register session...');
    
    try {
      const response = await fetch(`/api/register-sessions/${activeSession.id}/close`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          declaredClosingBalance: data.declaredBalance,
          denominationBreakdown: data.denominationBreakdown,
          notes: data.notes,
        }),
      });

      if (response.ok) {
        const closedSession = await response.json();
        setActiveSession(null);
        onSessionChange?.(null);
        setCurrentView('overview');
        
        await loadSessionHistory(); // Refresh history
        
        const hasDiscrepancy = parseFloat(closedSession.discrepancyAmount || '0') !== 0;
        
        toast({
          title: hasDiscrepancy ? 'Session Closed with Discrepancy' : 'Success',
          description: hasDiscrepancy 
            ? `Register session closed with discrepancy of PKR ${Math.abs(parseFloat(closedSession.discrepancyAmount)).toFixed(2)}`
            : `Register session closed successfully with closing balance of PKR ${data.declaredBalance}`,
          variant: hasDiscrepancy ? 'destructive' : 'default',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to close register session',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error closing session:', error);
      toast({
        title: 'Error',
        description: 'Failed to close register session',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  // Render session overview
  const renderSessionOverview = () => (
    <div className="space-y-6">
      {/* Current Session Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Register: {registerName}
            </span>
            <Badge 
              variant={activeSession ? "default" : "secondary"}
              className={activeSession ? "bg-green-500" : ""}
            >
              {activeSession ? 'Active Session' : 'No Active Session'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeSession ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Session Number</p>
                  <p className="font-medium" data-testid="active-session-number">
                    {activeSession.sessionNumber}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Opening Balance</p>
                  <p className="font-medium" data-testid="active-opening-balance">
                    PKR {parseFloat(activeSession.declaredOpeningBalance).toFixed(2)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Opened At</p>
                  <p className="font-medium" data-testid="active-opened-at">
                    {format(new Date(activeSession.openedAt), 'PPp')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium">
                    {Math.floor((Date.now() - new Date(activeSession.openedAt).getTime()) / (1000 * 60 * 60))}h {Math.floor(((Date.now() - new Date(activeSession.openedAt).getTime()) % (1000 * 60 * 60)) / (1000 * 60))}m
                  </p>
                </div>
              </div>

              {activeSession.notes && (
                <div>
                  <p className="text-sm text-gray-600">Opening Notes</p>
                  <p className="text-sm bg-gray-50 p-2 rounded">{activeSession.notes}</p>
                </div>
              )}

              <Button 
                onClick={() => setCurrentView('close-session')}
                className="w-full"
                data-testid="button-close-session"
              >
                Close Register Session
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No active register session</p>
              <p className="text-sm text-gray-500 mb-6">
                You need to open a register session before you can process sales or manage cash.
              </p>
              <Button 
                onClick={() => setCurrentView('open-session')}
                data-testid="button-open-session"
              >
                Open Register Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Session History */}
      {sessionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionHistory.slice(0, 5).map((session) => (
                <div 
                  key={session.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`session-history-${session.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={session.status === 'open' ? 'default' : 'secondary'}
                      className={session.status === 'open' ? 'bg-green-500' : ''}
                    >
                      {session.status}
                    </Badge>
                    <div>
                      <p className="font-medium">{session.sessionNumber}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(session.openedAt), 'PPp')}
                        {session.closedAt && ` - ${format(new Date(session.closedAt), 'PPp')}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      PKR {parseFloat(session.declaredOpeningBalance).toFixed(2)}
                    </p>
                    {session.status === 'closed' && session.discrepancyAmount && parseFloat(session.discrepancyAmount) !== 0 && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="text-sm">
                          PKR {Math.abs(parseFloat(session.discrepancyAmount)).toFixed(2)} discrepancy
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (currentView === 'open-session') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Open Register Session</h2>
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('overview')}
            data-testid="button-back-to-overview"
          >
            Back to Overview
          </Button>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please count all cash denominations and enter the quantities below. 
            The system will calculate the total and verify it matches your declared opening balance.
          </AlertDescription>
        </Alert>

        <RegisterDenominationBreakdown
          mode="opening"
          onSubmit={handleOpenSession}
          isLoading={isLoading}
          title={`Opening Balance for ${registerName}`}
        />
        
        {loadingText && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">{loadingText}</p>
          </div>
        )}
      </div>
    );
  }

  if (currentView === 'close-session') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Close Register Session</h2>
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('overview')}
            data-testid="button-back-to-overview"
          >
            Back to Overview
          </Button>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please count all cash denominations at the end of your shift and enter the quantities below. 
            The system will calculate discrepancies and generate a reconciliation report.
          </AlertDescription>
        </Alert>

        <RegisterDenominationBreakdown
          mode="closing"
          onSubmit={handleCloseSession}
          isLoading={isLoading}
          title={`Closing Balance for ${registerName}`}
        />
        
        {loadingText && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">{loadingText}</p>
          </div>
        )}
      </div>
    );
  }

  return renderSessionOverview();
}