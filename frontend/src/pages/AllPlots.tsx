import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Trash2, Eye, Download, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Plot {
  id: string;
  name: string;
  coordinates: [number, number][];
}

const AllPlots = () => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [plotToDelete, setPlotToDelete] = useState<Plot | null>(null);
  const [viewPlot, setViewPlot] = useState<Plot | null>(null);
  const [mlImage, setMlImage] = useState<string | null>(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [detectingPlotId, setDetectingPlotId] = useState<string | null>(null);
  const [lastDetections, setLastDetections] = useState<Record<string, { time: string; percentChange: number; severity: string }>>({});

  // Helper to convert [lat, lng] to GeoJSON [[[lng, lat], ...]]
  function toGeoJsonPolygon(coords: [number, number][]) {
    const ring = coords.map(([lat, lng]) => [lng, lat]);
    if (ring.length < 3 || ring[0][0] !== ring[ring.length-1][0] || ring[0][1] !== ring[ring.length-1][1]) {
      ring.push([...ring[0]]);
    }
    return [ring];
  }

  useEffect(() => {
    const fetchPlots = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('landwatch_token');
        const res = await fetch('/api/plots', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        // Map _id to id for frontend consistency
        setPlots((data as { _id: string; name: string; coordinates: [number, number][] }[]).map(plot => ({
          id: plot._id,
          name: plot.name,
          coordinates: plot.coordinates,
        })));
      } catch (err: unknown) {
        setError('Failed to load plots');
      } finally {
        setLoading(false);
      }
    };
    fetchPlots();
  }, []);

  // Fetch last detection info for each plot (from alerts API)
  useEffect(() => {
    const fetchLastDetections = async () => {
      try {
        const token = localStorage.getItem('landwatch_token');
        const res = await fetch('/api/alerts', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const byPlot: Record<string, { time: string; percentChange: number; severity: string }> = {};
        data.forEach((alert: any) => {
          if (alert.type === 'change') {
            if (!byPlot[alert.plotId] || new Date(alert.timestamp) > new Date(byPlot[alert.plotId].time)) {
              byPlot[alert.plotId] = {
                time: alert.timestamp,
                percentChange: alert.percentChange ?? 0,
                severity: alert.severity
              };
            }
          }
        });
        setLastDetections(byPlot);
      } catch {}
    };
    fetchLastDetections();
  }, []);

  const handleDelete = (plot: Plot) => {
    setPlotToDelete(plot);
  };

  const confirmDeletePlot = async () => {
    if (!plotToDelete) return;
    try {
      const token = localStorage.getItem('landwatch_token');
      const res = await fetch(`/api/plots/${plotToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete plot');
      }
      setPlots(prev => prev.filter(p => p.id !== plotToDelete.id));
      toast({
        title: 'Plot Deleted',
        description: `${plotToDelete.name} has been deleted.`,
        variant: 'destructive',
      });
      setPlotToDelete(null);
    } catch (err: unknown) {
      const message = (typeof err === 'object' && err && 'message' in err) ? (err as { message?: string }).message : undefined;
      toast({ title: 'Delete Failed', description: message || 'Failed to delete plot', variant: 'destructive' });
    }
  };

  const handleViewPlot = async (plot: Plot) => {
    setViewPlot(plot);
    setMlImage(null);
    setMlError('');
    setMlLoading(true);
    try {
      const token = localStorage.getItem('landwatch_token');
      const res = await fetch('/api/ml/latest-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plotId: plot.id, coordinates: toGeoJsonPolygon(plot.coordinates) })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || 'Failed to fetch image');
      }
      const data = await res.json();
      // Assume the backend returns { imageUrl: ... } or similar
      setMlImage(data.imageUrl || data.url || data.thumbnail || null);
      if (!data.imageUrl && !data.url && !data.thumbnail) {
        setMlError('No image available');
      }
    } catch (err: unknown) {
      const message = (typeof err === 'object' && err && 'message' in err) ? (err as { message?: string }).message : undefined;
      setMlError(message || 'Failed to fetch image');
    } finally {
      setMlLoading(false);
    }
  };

  const handleDownloadLatestImage = async (plot: Plot) => {
    setMlError('');
    setMlLoading(true);
    try {
      const token = localStorage.getItem('landwatch_token');
      const res = await fetch('/api/ml/download-latest-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plotId: plot.id, coordinates: toGeoJsonPolygon(plot.coordinates) })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || 'Failed to fetch download link');
      }
      const data = await res.json();
      if (data.download_url) {
        window.open(data.download_url, '_blank');
      } else {
        toast({ title: 'No Download Available', description: 'No download link available for this plot.', variant: 'destructive' });
      }
    } catch (err: unknown) {
      const message = (typeof err === 'object' && err && 'message' in err) ? (err as { message?: string }).message : undefined;
      toast({ title: 'Download Failed', description: message || 'Failed to fetch download link', variant: 'destructive' });
    } finally {
      setMlLoading(false);
    }
  };

  const handleManualDetect = async (plot: Plot) => {
    setDetectingPlotId(plot.id);
    try {
      const token = localStorage.getItem('landwatch_token');
      const res = await fetch(`/api/plots/${plot.id}/detect-change`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || `Change detected: ${data.percentChange}%`);
        // Optionally refresh last detections
        const newLast = { ...lastDetections };
        newLast[plot.id] = {
          time: new Date().toISOString(),
          percentChange: data.percentChange ?? 0,
          severity: data.alert?.severity || 'low'
        };
        setLastDetections(newLast);
      } else {
        alert(data.message || 'Failed to detect change');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to detect change');
    } finally {
      setDetectingPlotId(null);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">All Plots</h1>
      {plots.length === 0 ? (
        <div>No plots found.</div>
      ) : (
        <div className="space-y-4">
          {plots.map(plot => (
            <Card key={plot.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{plot.name}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleViewPlot(plot)} title="View Plot">
                    <Eye className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleDownloadLatestImage(plot)} title="Download Latest Image">
                    <Download className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleManualDetect(plot)} disabled={!!detectingPlotId} title="Manual Detect Change">
                    {detectingPlotId === plot.id ? <span className="animate-spin">⏳</span> : <AlertTriangle className="h-5 w-5" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(plot)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <Badge variant="secondary">{plot.coordinates.length} Points</Badge>
                </div>
                <div className="text-xs text-muted-foreground break-all">
                  {plot.coordinates.map(([lat, lng], idx) => (
                    <div key={idx}>
                      Lat: {lat}, Lng: {lng}
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs">
                  <span className="font-semibold">Last Detection:</span>{' '}
                  {lastDetections[plot.id] ? (
                    <span>
                      {new Date(lastDetections[plot.id].time).toLocaleString()} —
                      {lastDetections[plot.id].percentChange}%
                      <Badge variant={lastDetections[plot.id].severity === 'high' ? 'destructive' : lastDetections[plot.id].severity === 'medium' ? 'secondary' : 'outline'} className="ml-2">
                        {lastDetections[plot.id].severity}
                      </Badge>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No detection yet</span>
                  )}
                  <Button variant="link" size="sm" className="ml-2 p-0 h-auto text-xs" onClick={() => navigate(`/alerts?plot=${plot.id}`)}>
                    View History
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* View Plot Dialog */}
      {viewPlot && (
        <Dialog open={!!viewPlot} onOpenChange={(open) => { if (!open) setViewPlot(null); }}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Latest Image for "{viewPlot.name}"</DialogTitle>
              <DialogDescription>
                This image is fetched from the ML service for the selected plot. If no image is available, it means there is no recent cloud-free satellite image for this area.
              </DialogDescription>
            </DialogHeader>
            {mlLoading ? (
              <div>Loading image...</div>
            ) : mlError ? (
              <div className="text-red-500">{mlError}</div>
            ) : mlImage ? (
              <img src={mlImage} alt="Latest plot" className="w-full rounded border" />
            ) : (
              <div className="text-muted-foreground">No image available for this plot. Try again later or check the plot coordinates.</div>
            )}
          </DialogContent>
        </Dialog>
      )}
      {/* Delete Plot Confirmation Dialog */}
      {plotToDelete && (
        <Dialog open={!!plotToDelete} onOpenChange={(open) => { if (!open) setPlotToDelete(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to delete "{plotToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex space-x-2 pt-4">
              <Button variant="outline" onClick={() => setPlotToDelete(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeletePlot}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AllPlots; 