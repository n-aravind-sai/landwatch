import { useEffect, useState } from 'react';
import { Map, FileText, AlertTriangle, Clock, BarChart3, MapPin, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [plots, setPlots] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('landwatch_token');
        const [plotsRes, alertsRes] = await Promise.all([
          fetch('/api/plots', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/alerts', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const plotsData = await plotsRes.json();
        const alertsData = await alertsRes.json();
        setPlots(plotsData);
        setAlerts(alertsData);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const recentAlerts = alerts.slice(0, 3);
  const plotsWithAlerts = alerts.filter(alert => alert.alertStatus !== 'safe');

  const StatCard = ({ icon: Icon, title, value, change }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-satellite-600">{title}</p>
            <p className="text-2xl font-bold text-satellite-900">{value}</p>
            {change && (
              <p className="text-xs text-earth-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                {change}
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'safe': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  // Example stats (replace with real calculations as needed)
  const totalPlots = plots.length;
  const totalArea = Math.round(plots.reduce((sum, plot) => sum + (plot.area || 0), 0) * 100) / 100; // Round to 2 decimal places
  const alertsLast30Days = alerts.filter(alert => {
    const alertDate = new Date(alert.timestamp || alert.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return alertDate >= thirtyDaysAgo;
  }).length;

  return (
    <div className="monitoring-bg min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-satellite-900">Dashboard</h1>
          <p className="text-satellite-600">Monitor your land properties from anywhere</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/plots/map">
              <Map className="h-4 w-4 mr-2" />
              View Map
            </Link>
          </Button>
          <Button asChild className="bg-gradient-primary">
            <Link to="/alerts">
              <AlertTriangle className="h-4 w-4 mr-2" />
              All Alerts
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={MapPin} 
          title="Total Plots" 
          value={totalPlots}
          change="+1 this month"
        />
        <StatCard 
          icon={BarChart3} 
          title="Area Monitored" 
          value={`${totalArea} acres`}
        />
        <StatCard 
          icon={AlertTriangle} 
          title="Alerts (30 days)" 
          value={alertsLast30Days}
          change="2 new today"
        />
        <StatCard 
          icon={Clock} 
          title="Avg Detection" 
          value={`${alerts.length > 0 ? alerts.reduce((sum, alert) => sum + (alert.detectionTime || 0), 0) / alerts.length : 0}s`}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-satellite-900">Recent Alerts</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link to="/alerts">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentAlerts.length > 0 ? (
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div key={alert.id || alert._id || alert.timestamp} className="flex items-start gap-3 p-3 rounded-lg border border-satellite-200">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-satellite-900 truncate">{alert.title}</p>
                        <Badge className={getAlertColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-satellite-600 mb-1">{alert.plotName}</p>
                      <p className="text-sm text-satellite-500">{alert.description}</p>
                      <p className="text-xs text-satellite-400 mt-1">
                        {new Date(alert.timestamp || alert.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-satellite-500 text-center py-8">No recent alerts</p>
            )}
          </CardContent>
        </Card>

        {/* Plot Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-satellite-900">Plot Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plots.map((plot) => (
                <div key={plot.id || plot._id || plot.name} className="flex items-center justify-between p-3 rounded-lg border border-satellite-200">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-satellite-900 truncate">{plot.name}</p>
                    <p className="text-sm text-satellite-600">{plot.area} acres</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={getStatusColor(plot.alertStatus)}>
                      {plot.alertStatus}
                    </Badge>
                    {plot.alertCount > 0 && (
                      <span className="text-xs text-satellite-500">
                        {plot.alertCount} alerts
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link to="/plots">
                <MapPin className="h-4 w-4 mr-2" />
                Manage All Plots
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-satellite-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/plots/map">
                <Map className="h-6 w-6 mb-2" />
                Add New Plot
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/documents">
                <FileText className="h-6 w-6 mb-2" />
                Upload Documents
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/alerts">
                <AlertTriangle className="h-6 w-6 mb-2" />
                Review Alerts
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;