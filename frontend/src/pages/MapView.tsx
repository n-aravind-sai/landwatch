import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents, useMap } from 'react-leaflet';
import { Plus, Save, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import L from 'leaflet';
import 'leaflet-control-geocoder';

interface Plot {
  id: string;
  name: string;
  coordinates: [number, number][]; // [lat, lng]
  area?: string;
  status?: string;
  lastChecked?: string;
}

interface NewPlotForm {
  name: string;
  coordinates: [number, number][];
}

const AP_TG_BOUNDS = [
  [15.0, 77.0], // Southwest (lat, lng)
  [19.0, 85.0], // Northeast (lat, lng)
];
const MAP_CENTER = [17.5, 80.5]; // Center between AP and TG
const MAP_ZOOM = 6.5;

// Geocoder control component
function GeocoderControl() {
  const map = useMap();
  useEffect(() => {
    // @ts-ignore
    if (!map._geocoderControl) {
      // @ts-ignore
      const geocoder = L.Control.geocoder({
        defaultMarkGeocode: true
      })
        .on('markgeocode', function(e) {
          map.setView(e.geocode.center, 14);
        })
        .addTo(map);
      // @ts-ignore
      map._geocoderControl = geocoder;
    }
  }, [map]);
  return null;
}

const MapView = () => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddingPlot, setIsAddingPlot] = useState(false);
  const [newPlot, setNewPlot] = useState<NewPlotForm>({ name: '', coordinates: [] });
  const [drawing, setDrawing] = useState(false);
  const [drawCoords, setDrawCoords] = useState<[number, number][]>([]);
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<'name' | 'drawing'>('name');

  useEffect(() => {
    const fetchPlots = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('landwatch_token');
        const res = await fetch('/api/plots', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setPlots(data.map((plot: any) => ({ ...plot, id: plot._id })));
      } catch (err) {
        setError('Failed to load plots');
      } finally {
        setLoading(false);
      }
    };
    fetchPlots();
  }, []);

  // Debounced search (simple, for now)
  const filteredPlots = search.trim().length === 0
    ? plots
    : plots.filter(plot => plot.name.toLowerCase().includes(search.trim().toLowerCase()));

  // Drawing polygon on map
  function MapClickHandler() {
    useMapEvents({
      click(e) {
        if (drawing) {
          setDrawCoords((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
        }
      },
    });
    return null;
  }

  // Drawing polygon on map (with overlay for point placement)
  function DrawingOverlay() {
    const map = useMap();
    useEffect(() => {
      if (!drawing) return;
      const handleClick = (e: any) => {
        if (!drawing) return;
        const { lat, lng } = e.latlng;
        setDrawCoords((prev) => [...prev, [lat, lng]]);
      };
      map.on('click', handleClick);
      return () => {
        map.off('click', handleClick);
      };
    }, [drawing, map]);
    return null;
  }

  const startDrawing = () => {
    setStep('name');
    setNewPlot({ name: '', coordinates: [] });
    setDrawCoords([]);
    setIsAddingPlot(true);
    setDrawing(false);
  };

  const handleNameNext = () => {
    if (!newPlot.name.trim()) {
      toast({ title: 'Missing Name', description: 'Please enter a plot name.', variant: 'destructive' });
      return;
    }
    setIsAddingPlot(false);
    setDrawing(true);
    setStep('drawing');
    setDrawCoords([]);
  };

  const finishDrawing = async () => {
    if (drawCoords.length < 3) {
      toast({ title: 'Need at least 3 points', variant: 'destructive' });
      return;
    }
    setDrawing(false);
    setStep('name');
    try {
      setLoading(true);
      const token = localStorage.getItem('landwatch_token');
      const res = await fetch('/api/plots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newPlot.name, coordinates: drawCoords })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create plot');
      }
      const createdPlot = await res.json();
      setPlots(prev => [...prev, createdPlot]);
      toast({ title: 'Plot Created', description: `${createdPlot.name} was added successfully.` });
      setNewPlot({ name: '', coordinates: [] });
      setDrawCoords([]);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to create plot', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-card border-b border-border p-4 flex flex-row items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Map View</h1>
        <Button onClick={startDrawing} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          <Plus className="h-4 w-4 mr-2" /> Add Plot
        </Button>
        </div>
      <div className="flex-1 relative" ref={mapRef}>
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          style={{ height: '100%', width: '100%' }}
          maxBounds={AP_TG_BOUNDS}
          className={drawing ? 'cursor-crosshair' : 'cursor-grab'}
        >
          <GeocoderControl />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <MapClickHandler />
          {/* Existing Plots */}
          {plots.map((plot) => (
            <Polygon key={plot.id || plot._id || plot.name} positions={plot.coordinates} pathOptions={{ color: 'blue' }} />
          ))}
          {/* Drawing Polygon */}
          {drawing && drawCoords.length > 0 && (
            <Polygon positions={drawCoords} pathOptions={{ color: 'purple', dashArray: '5,5' }} />
          )}
        </MapContainer>
        {/* Add Plot Name Dialog */}
        <Dialog open={isAddingPlot} onOpenChange={setIsAddingPlot}>
          <DialogContent className="max-w-md z-[9999]">
            <DialogHeader>
              <DialogTitle>Add New Plot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Label htmlFor="plot-name">Plot Name</Label>
              <Input
                id="plot-name"
                value={newPlot.name}
                onChange={(e) => setNewPlot(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter plot name"
              />
              <div className="flex space-x-2 pt-4">
                <Button onClick={handleNameNext} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex-1">
                  Next
                </Button>
                <Button variant="outline" onClick={() => { setIsAddingPlot(false); setDrawing(false); setDrawCoords([]); setNewPlot({ name: '', coordinates: [] }); }}>
                  Cancel
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                After entering a name, you will be able to draw your plot on the map.
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {/* Drawing Controls */}
        {drawing && (
          <div className="absolute top-4 left-4 bg-card border border-border rounded-lg p-3 shadow-lg z-[9999]">
            <p className="text-sm font-medium text-foreground mb-1">Drawing Mode Active</p>
            <p className="text-xs text-muted-foreground mb-2">
              Click on the map to add points ({drawCoords.length} added)
            </p>
            <div className="text-xs text-muted-foreground mb-2 break-all">
              {drawCoords.map(([lat, lng], idx) => (
                <div key={idx}>Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}</div>
              ))}
            </div>
            <div className="flex space-x-2">
              <Button onClick={finishDrawing} disabled={drawCoords.length < 3} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex-1">
                <Save className="h-4 w-4 mr-2" /> Save Plot
              </Button>
              <Button variant="outline" onClick={() => { setDrawing(false); setDrawCoords([]); setNewPlot({ name: '', coordinates: [] }); }}>
                <X className="h-4 w-4" /> Cancel
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Draw your plot by clicking at least 3 points on the map. Then click "Save Plot".
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
