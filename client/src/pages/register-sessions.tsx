import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/layouts';
import { RegisterSessionManager } from '@/components/RegisterSessionManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, TrendingDown, AlertTriangle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Register {
  id: number;
  name: string;
  branchId: number;
  status: string;
}

interface Branch {
  id: number;
  name: string;
}

interface DiscrepancyReport {
  sessionId: number;
  sessionNumber: string;
  registerName: string;
  discrepancyAmount: string;
  openedAt: string;
  closedAt: string;
  openedByUser: string;
}

export default function RegisterSessions() {
  const [registers, setRegisters] = useState<Register[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedRegister, setSelectedRegister] = useState<Register | null>(null);
  const [selectedBranch, setBranch] = useState<Branch | null>(null);
  const [discrepancyReports, setDiscrepancyReports] = useState<DiscrepancyReport[]>([]);
  const [currentView, setCurrentView] = useState<'overview' | 'register-details' | 'reports'>('overview');
  const [activeSession, setActiveSession] = useState<RegisterSession | null>(null);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadRegisters();
    loadBranches();
  }, []);

  // Load discrepancy reports when branch is selected
  useEffect(() => {
    if (selectedBranch && currentView === 'reports') {
      loadDiscrepancyReports();
    }
  }, [selectedBranch, currentView]);

  const loadRegisters = async () => {
    try {
      const response = await fetch('/api/registers');
      if (response.ok) {
        const data = await response.json();
        setRegisters(data);
      }
    } catch (error) {
      console.error('Error loading registers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load registers',
        variant: 'destructive',
      });
    }
  };

  const loadBranches = async () => {
    try {
      const response = await fetch('/api/branches');
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
        if (data.length > 0) {
          setBranch(data[0]); // Select first branch by default
        }
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const loadDiscrepancyReports = async () => {
    if (!selectedBranch) return;
    
    try {
      const response = await fetch(`/api/register-sessions/discrepancies/${selectedBranch.id}`);
      if (response.ok) {
        const data = await response.json();
        setDiscrepancyReports(data);
      }
    } catch (error) {
      console.error('Error loading discrepancy reports:', error);
    }
  };

  const handleRegisterSelect = (register: Register) => {
    setSelectedRegister(register);
    setCurrentView('register-details');
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Register Sessions</h1>
          <p className="text-gray-600 mt-2">
            Manage register opening and closing with detailed denomination breakdown
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('reports')}
            data-testid="button-view-reports"
          >
            <FileText className="h-4 w-4 mr-2" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Branch Selection */}
      {branches.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Select Branch:</label>
              <Select
                value={selectedBranch?.id.toString()}
                onValueChange={(value) => {
                  const branch = branches.find(b => b.id === parseInt(value));
                  setBranch(branch || null);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {registers
          .filter(register => !selectedBranch || register.branchId === selectedBranch.id)
          .map((register) => (
            <Card 
              key={register.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleRegisterSelect(register)}
              data-testid={`register-card-${register.id}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {register.name}
                  </span>
                  <Badge 
                    variant={register.status === 'active' ? 'default' : 'secondary'}
                    className={register.status === 'active' ? 'bg-green-500' : ''}
                  >
                    {register.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      register.status === 'active' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {register.status === 'active' ? 'Ready for Service' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Branch:</span>
                    <span className="font-medium">
                      {branches.find(b => b.id === register.branchId)?.name || 'Unknown'}
                    </span>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" className="w-full" size="sm">
                      Manage Session
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      {registers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No registers found</p>
            <p className="text-gray-500 text-sm mb-4">
              Please create registers in the Business Setup section first.
            </p>
            <Button variant="outline">
              Go to Register Setup
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cash Discrepancy Reports</h1>
          <p className="text-gray-600 mt-2">
            Review cash discrepancies and reconciliation reports
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setCurrentView('overview')}
          data-testid="button-back-to-overview"
        >
          Back to Overview
        </Button>
      </div>

      {/* Branch Selection */}
      {branches.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Branch:</label>
              <Select
                value={selectedBranch?.id.toString()}
                onValueChange={(value) => {
                  const branch = branches.find(b => b.id === parseInt(value));
                  setBranch(branch || null);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discrepancy Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Cash Discrepancies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {discrepancyReports.length > 0 ? (
            <div className="space-y-3">
              {discrepancyReports.map((report) => (
                <div 
                  key={report.sessionId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`discrepancy-report-${report.sessionId}`}
                >
                  <div className="flex items-center gap-4">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">{report.sessionNumber}</p>
                      <p className="text-sm text-gray-600">
                        {report.registerName} • Opened by {report.openedByUser}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(report.openedAt).toLocaleDateString()} - {new Date(report.closedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">
                      PKR {Math.abs(parseFloat(report.discrepancyAmount)).toFixed(2)}
                    </p>
                    <Badge variant="destructive" className="mt-1">
                      {parseFloat(report.discrepancyAmount) > 0 ? 'Overage' : 'Shortage'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">No discrepancies found</p>
              <p className="text-gray-500 text-sm">
                All register sessions have been balanced correctly.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (currentView === 'register-details' && selectedRegister) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Register: {selectedRegister.name}</h1>
            <Button 
              variant="outline" 
              onClick={() => setCurrentView('overview')}
              data-testid="button-back-to-registers"
            >
              Back to Registers
            </Button>
          </div>
          
          <RegisterSessionManager
            registerId={selectedRegister.id}
            registerName={selectedRegister.name}
            branchId={selectedRegister.branchId}
            onSessionChange={setActiveSession}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {currentView === 'overview' && renderOverview()}
      {currentView === 'reports' && renderReports()}
    </AppLayout>
  );
}