import { useEffect, useState, useCallback } from 'react';
import { Upload, File, Download, Trash2, Eye, Search, Filter, FolderOpen, Image, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  name: string;
  type: 'deed' | 'survey' | 'tax' | 'permit' | 'other';
  size: string;
  uploadDate: string;
  plotName: string;
  description?: string;
}

interface UploadForm {
  file: File | null;
  type: string;
  plotName: string;
  description: string;
}

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPlot, setSelectedPlot] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState<UploadForm>({
    file: null,
    type: '',
    plotName: '',
    description: ''
  });
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [docToEdit, setDocToEdit] = useState<Document | null>(null);
  const [editDocData, setEditDocData] = useState({ name: '', description: '' });
  const [plots, setPlots] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem('landwatch_token');
        const res = await fetch('/api/documents', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setDocuments(data);
      } catch (err) {
        toast({ title: 'Failed to load documents', variant: 'destructive' });
      }
    };
    const fetchPlots = async () => {
      try {
        const token = localStorage.getItem('landwatch_token');
        const res = await fetch('/api/plots', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setPlots(data.map((plot: any) => ({ id: plot._id || plot.id, name: plot.name })));
      } catch (err) {
        // ignore for now
      }
    };
    fetchDocuments();
    fetchPlots();
  }, [toast]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.plotName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    const matchesPlot = selectedPlot === 'all' || doc.plotName === selectedPlot;
    
    return matchesSearch && matchesType && matchesPlot;
  });

  const uniquePlots = [...new Set(documents.map(doc => doc.plotName))];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'deed':
      case 'survey':
      case 'tax':
      case 'permit':
        return FileText;
      default:
        return File;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deed':
        return 'destructive';
      case 'survey':
        return 'default';
      case 'tax':
        return 'secondary';
      case 'permit':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadForm(prev => ({ ...prev, file: files[0] }));
      setIsUploading(true);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.type || !uploadForm.plotName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    setIsUploading(true);
    try {
      const token = localStorage.getItem('landwatch_token');
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('type', uploadForm.type);
      formData.append('plotId', uploadForm.plotName); // plotName now holds the plot ID
      formData.append('description', uploadForm.description);
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to upload document');
      }
      const newDoc = await res.json();
      setDocuments(prev => [...prev, newDoc]);
      toast({
        title: "Document Uploaded",
        description: `${uploadForm.file.name} has been uploaded successfully.`,
      });
      setIsUploading(false);
      setUploadForm({ file: null, type: '', plotName: '', description: '' });
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message || 'Failed to upload document', variant: 'destructive' });
      setIsUploading(false);
    }
  };

  const handleDownload = (doc: Document) => {
    // Here you would typically download from your backend
    console.log('Downloading document:', doc.id);
    toast({
      title: "Download Started",
      description: `Downloading ${doc.name}...`,
    });
  };

  const handleEditDocument = (doc: Document) => {
    setDocToEdit(doc);
    setEditDocData({ name: doc.name, description: doc.description || '' });
  };

  const handleUpdateDocument = async () => {
    if (!docToEdit) return;
    try {
      setIsUploading(true);
      const token = localStorage.getItem('landwatch_token');
      const res = await fetch(`/api/documents/${docToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: editDocData.name, description: editDocData.description })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update document');
      }
      const updatedDoc = await res.json();
      setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
      toast({ title: 'Document Updated', description: `${updatedDoc.name} was updated successfully.` });
      setDocToEdit(null);
    } catch (err: any) {
      toast({ title: 'Update Failed', description: err.message || 'Failed to update document', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    setDocToDelete(doc);
  };

  const confirmDeleteDocument = async () => {
    if (!docToDelete) return;
    try {
      const token = localStorage.getItem('landwatch_token');
      const res = await fetch(`/api/documents/${docToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete document');
      }
      setDocuments(prev => prev.filter(d => d.id !== docToDelete.id));
      toast({
        title: "Document Deleted",
        description: `${docToDelete.name} has been deleted.`,
        variant: "destructive",
      });
      setDocToDelete(null);
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err.message || 'Failed to delete document', variant: 'destructive' });
    }
  };

  const totalSize = documents.reduce((acc, doc) => {
    const size = parseFloat(doc.size.replace(/[^\d.]/g, ''));
    return acc + size;
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-foreground">Documents</h1>
            <div className="flex space-x-2">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <FolderOpen className="h-3 w-3" />
                <span>{documents.length} Files</span>
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1">
                <File className="h-3 w-3" />
                <span>{totalSize.toFixed(1)} MB</span>
              </Badge>
            </div>
          </div>
          
          <Dialog open={isUploading} onOpenChange={setIsUploading}>
            <DialogTrigger asChild>
              <Button className="btn-satellite">
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload New Document</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {uploadForm.file ? (
                    <div className="space-y-2">
                      <File className="h-8 w-8 mx-auto text-primary" />
                      <p className="font-medium">{uploadForm.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">Drop files here or click to upload</p>
                      <p className="text-xs text-muted-foreground">
                        Supports PDF, JPG, PNG, DOC files up to 10MB
                      </p>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" className="mt-3" asChild>
                      <span className="cursor-pointer">Choose File</span>
                    </Button>
                  </label>
                </div>
                
                {/* Form Fields */}
                <div>
                  <Label htmlFor="doc-type">Document Type *</Label>
                  <Select 
                    value={uploadForm.type} 
                    onValueChange={(value) => setUploadForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deed">Property Deed</SelectItem>
                      <SelectItem value="survey">Survey Report</SelectItem>
                      <SelectItem value="tax">Tax Document</SelectItem>
                      <SelectItem value="permit">Permit/License</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="doc-plot">Plot Name *</Label>
                  <Select
                    value={uploadForm.plotName}
                    onValueChange={(value) => setUploadForm(prev => ({ ...prev, plotName: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select plot" />
                    </SelectTrigger>
                    <SelectContent>
                      {plots.map((plot) => (
                        <SelectItem key={plot.id} value={plot.id}>{plot.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="doc-description">Description</Label>
                  <Textarea
                    id="doc-description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add a brief description (optional)"
                    rows={3}
                  />
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button onClick={handleUpload} className="btn-earth flex-1">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                  <Button variant="outline" onClick={() => setIsUploading(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Document Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deed">Property Deed</SelectItem>
              <SelectItem value="survey">Survey Report</SelectItem>
              <SelectItem value="tax">Tax Document</SelectItem>
              <SelectItem value="permit">Permit/License</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedPlot} onValueChange={setSelectedPlot}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Plot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plots</SelectItem>
              {uniquePlots.map((plot) => (
                <SelectItem key={plot} value={plot}>{plot}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters or upload your first document.</p>
              <Button onClick={() => setIsUploading(true)} className="btn-satellite">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => {
              const FileIcon = getFileIcon(doc.type);
              
              return (
                <Card key={doc.id} className="feature-card hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium truncate">{doc.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{doc.size}</p>
                        </div>
                      </div>
                      <Badge variant={getTypeColor(doc.type)} className="text-xs">
                        {doc.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="text-sm">
                        <p className="text-muted-foreground">Plot: <span className="font-medium text-foreground">{doc.plotName}</span></p>
                        <p className="text-muted-foreground">Uploaded: <span className="font-medium text-foreground">{doc.uploadDate}</span></p>
                        {doc.description && (
                          <p className="text-muted-foreground text-xs mt-2 line-clamp-2">{doc.description}</p>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditDocument(doc)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(doc)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Document Dialog */}
      {docToEdit && (
        <Dialog open={!!docToEdit} onOpenChange={setDocToEdit}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Document: {docToEdit.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-doc-name">Document Name</Label>
                <Input
                  id="edit-doc-name"
                  value={editDocData.name}
                  onChange={(e) => setEditDocData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-doc-description">Description</Label>
                <Textarea
                  id="edit-doc-description"
                  value={editDocData.description}
                  onChange={(e) => setEditDocData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add a brief description (optional)"
                  rows={3}
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <Button onClick={handleUpdateDocument} className="btn-earth flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Update Document
                </Button>
                <Button variant="outline" onClick={() => setDocToEdit(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Document Confirmation Dialog */}
      {docToDelete && (
        <Dialog open={!!docToDelete} onOpenChange={setDocToDelete}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to delete "{docToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex space-x-2 pt-4">
              <Button variant="outline" onClick={() => setDocToDelete(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteDocument}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Documents;