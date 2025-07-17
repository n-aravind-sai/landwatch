import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  // Helper to convert [lat, lng] to GeoJSON [[[lng, lat], ...]]
  function toGeoJsonPolygon(coords: [number, number][]) {
    let ring = coords.map(([lat, lng]) => [lng, lat]);
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
        setPlots(data.map((plot: any) => ({ ...plot, id: plot._id })));
      } catch (err) {
        setError('Failed to load plots');
      } finally {
        setLoading(false);
      }
    };
    fetchPlots();
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
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err.message || 'Failed to delete plot', variant: 'destructive' });
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
        body: JSON.stringify({ coordinates: toGeoJsonPolygon(plot.coordinates) })
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
    } catch (err: any) {
      setMlError(err.message || 'Failed to fetch image');
    } finally {
      setMlLoading(false);
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* View Plot Dialog */}
      {viewPlot && (
        <Dialog open={!!viewPlot} onOpenChange={setViewPlot}>
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
        <Dialog open={!!plotToDelete} onOpenChange={setPlotToDelete}>
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