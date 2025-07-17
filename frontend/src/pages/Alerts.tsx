import { useEffect, useState } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, MapPin, Calendar, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Alert {
  id: string;
  type: 'construction' | 'encroachment' | 'vegetation' | 'change';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  plotName: string;
  timestamp: string;
  status: 'unread' | 'acknowledged' | 'resolved';
  coordinates?: string;
}

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('landwatch_token');
        const res = await fetch('/api/alerts', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setAlerts(data);
      } catch (err) {
        setError('Failed to load alerts');
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.plotName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'all' || alert.status === selectedStatus;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'construction':
        return AlertTriangle;
      case 'encroachment':
        return AlertTriangle;
      case 'vegetation':
        return Info;
      default:
        return Bell;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread':
        return 'destructive';
      case 'acknowledged':
        return 'secondary';
      case 'resolved':
        return 'default';
      default:
        return 'outline';
    }
  };

  const handleAcknowledge = (alertId: string) => {
    // Here you would update the alert status in the backend
    console.log('Acknowledging alert:', alertId);
  };

  const handleResolve = (alertId: string) => {
    // Here you would mark the alert as resolved in the backend
    console.log('Resolving alert:', alertId);
  };

  const unreadCount = alerts.filter(alert => alert.status === 'unread').length;
  const highPriorityCount = alerts.filter(alert => alert.severity === 'high').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-foreground">Alerts Center</h1>
            <div className="flex space-x-2">
              <Badge variant="destructive" className="flex items-center space-x-1">
                <Bell className="h-3 w-3" />
                <span>{unreadCount} Unread</span>
              </Badge>
              <Badge variant="secondary" className="flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3" />
                <span>{highPriorityCount} High Priority</span>
              </Badge>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search alerts or plots..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="timeline" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p>Loading alerts...</p>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="py-12 text-center text-red-500">
                  {error}
                </CardContent>
              </Card>
            ) : filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No alerts found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => {
                  const AlertIcon = getAlertIcon(alert.type);
                  
                  return (
                    <Card key={alert.id} className={`transition-all hover:shadow-md ${alert.status === 'unread' ? 'border-l-4 border-l-destructive' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-full ${alert.severity === 'high' ? 'bg-destructive/10' : alert.severity === 'medium' ? 'bg-yellow-500/10' : 'bg-blue-500/10'}`}>
                              <AlertIcon className={`h-4 w-4 ${alert.severity === 'high' ? 'text-destructive' : alert.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'}`} />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-2">{alert.title}</CardTitle>
                              <p className="text-muted-foreground text-sm">{alert.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-2">
                            <Badge variant={getSeverityColor(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge variant={getStatusColor(alert.status)}>
                              {alert.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{alert.plotName}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{alert.timestamp}</span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            {alert.status === 'unread' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleAcknowledge(alert.id)}
                              >
                                Acknowledge
                              </Button>
                            )}
                            {alert.status !== 'resolved' && (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handleResolve(alert.id)}
                                className="btn-earth"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Resolve
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              View on Map
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="summary">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="feature-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
                      <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
                    </div>
                    <Bell className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="feature-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                      <p className="text-2xl font-bold text-destructive">{highPriorityCount}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="feature-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Unread</p>
                      <p className="text-2xl font-bold text-yellow-600">{unreadCount}</p>
                    </div>
                    <Info className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="feature-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                      <p className="text-2xl font-bold text-green-600">
                        {alerts.filter(a => a.status === 'resolved').length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center space-x-3 py-2">
                      <div className={`w-2 h-2 rounded-full ${alert.severity === 'high' ? 'bg-destructive' : alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.plotName} • {alert.timestamp}</p>
                      </div>
                      <Badge variant={getStatusColor(alert.status)} className="text-xs">
                        {alert.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Alerts;