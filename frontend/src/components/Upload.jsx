import React, { useState } from 'react';
import { Upload as UploadIcon, FileText, Trash2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadAPI } from '../services/api';

const Upload = () => {
  const [nodesFile, setNodesFile] = useState(null);
  const [routesFile, setRoutesFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
        toast.error('Please upload a CSV or Excel file');
        return;
      }
      
      if (type === 'nodes') {
        setNodesFile(file);
      } else {
        setRoutesFile(file);
      }
    }
  };

  const handleUpload = async (type) => {
    const file = type === 'nodes' ? nodesFile : routesFile;
    
    if (!file) {
      toast.error(`Please select a ${type} file first`);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = type === 'nodes' 
        ? await uploadAPI.uploadNodes(formData)
        : await uploadAPI.uploadRoutes(formData);

      toast.success(response.data.message);
      
      // Show warning if there are missing nodes
      if (response.data.warning) {
        toast.error(response.data.warning, { duration: 6000 });
        if (response.data.missingNodes && response.data.missingNodes.length > 0) {
          console.warn('Missing node IDs:', response.data.missingNodes);
          toast.error(
            `Missing nodes: ${response.data.missingNodes.join(', ')}. ${response.data.hint}`,
            { duration: 8000 }
          );
        }
      }
      
      setUploadResults(prev => ({
        ...prev,
        [type]: response.data
      }));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || `Failed to upload ${type}`);
    } finally {
      setUploading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all nodes and routes? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await uploadAPI.clearAll();
      toast.success(response.data.message);
      setNodesFile(null);
      setRoutesFile(null);
      setUploadResults(null);
    } catch (error) {
      console.error('Clear error:', error);
      toast.error(error.response?.data?.message || 'Failed to clear data');
    }
  };

  const downloadSampleCSV = (type) => {
    let csvContent = '';
    
    if (type === 'nodes') {
      csvContent = `id,name,type,latitude,longitude,capacity,region,country,city,status
N1,Supplier A,supplier,40.7128,-74.0060,1000,North America,USA,New York,active
N2,Warehouse B,warehouse,34.0522,-118.2437,5000,North America,USA,Los Angeles,active
N3,Retailer C,retailer,51.5074,-0.1278,500,Europe,UK,London,active
N4,Distributor D,distributor,48.8566,2.3522,2000,Europe,France,Paris,active
N5,Manufacturer E,manufacturer,35.6762,139.6503,3000,Asia,Japan,Tokyo,active`;
    } else {
      csvContent = `source,target,distance,cost,time,capacity,status,transportMode,riskLevel
N1,N2,2800,5000,48,1000,active,road,low
N2,N3,5500,12000,120,800,active,air,medium
N3,N4,350,800,8,1200,active,road,low
N4,N5,9500,20000,240,600,active,sea,high
N1,N4,6000,15000,150,900,active,multimodal,medium`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-${type}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Sample ${type} CSV downloaded`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Supply Chain Data</h1>
          <p className="text-gray-600">Upload CSV or Excel files containing nodes and routes information</p>
        </div>

        {/* Sample Downloads */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-2">Need sample data?</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => downloadSampleCSV('nodes')}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Sample Nodes CSV</span>
                </button>
                <button
                  onClick={() => downloadSampleCSV('routes')}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Sample Routes CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Nodes Upload */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Nodes Data</h2>
                <p className="text-sm text-gray-500">Suppliers, warehouses, retailers</p>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4 hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileChange(e, 'nodes')}
                className="hidden"
                id="nodes-file"
              />
              <label htmlFor="nodes-file" className="cursor-pointer">
                <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                {nodesFile ? (
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{nodesFile.name}</p>
                    <p className="text-gray-500">{(nodesFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Click to upload nodes file</p>
                    <p className="text-xs mt-1">CSV or Excel (max 10MB)</p>
                  </div>
                )}
              </label>
            </div>

            <button
              onClick={() => handleUpload('nodes')}
              disabled={!nodesFile || uploading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload Nodes'}
            </button>

            {uploadResults?.nodes && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900">Upload Successful</p>
                    <p className="text-green-700">Inserted: {uploadResults.nodes.inserted}</p>
                    {uploadResults.nodes.errors > 0 && (
                      <p className="text-orange-600">Errors: {uploadResults.nodes.errors}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Routes Upload */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Routes Data</h2>
                <p className="text-sm text-gray-500">Connections between nodes</p>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4 hover:border-purple-400 transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileChange(e, 'routes')}
                className="hidden"
                id="routes-file"
              />
              <label htmlFor="routes-file" className="cursor-pointer">
                <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                {routesFile ? (
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{routesFile.name}</p>
                    <p className="text-gray-500">{(routesFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Click to upload routes file</p>
                    <p className="text-xs mt-1">CSV or Excel (max 10MB)</p>
                  </div>
                )}
              </label>
            </div>

            <button
              onClick={() => handleUpload('routes')}
              disabled={!routesFile || uploading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload Routes'}
            </button>

            {uploadResults?.routes && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900">Upload Successful</p>
                    <p className="text-green-700">Inserted: {uploadResults.routes.inserted}</p>
                    {uploadResults.routes.errors > 0 && (
                      <p className="text-orange-600">Errors: {uploadResults.routes.errors}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* File Format Guide */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">File Format Guide</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Nodes CSV Columns:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>id</strong> - Unique node identifier (required)</li>
                <li>• <strong>name</strong> - Node name (required)</li>
                <li>• <strong>type</strong> - supplier, warehouse, retailer, etc. (required)</li>
                <li>• <strong>latitude</strong> - Latitude coordinate (required)</li>
                <li>• <strong>longitude</strong> - Longitude coordinate (required)</li>
                <li>• <strong>capacity</strong> - Node capacity (optional)</li>
                <li>• <strong>region</strong> - Geographic region (optional)</li>
                <li>• <strong>country</strong> - Country (optional)</li>
                <li>• <strong>city</strong> - City (optional)</li>
                <li>• <strong>status</strong> - active, inactive, disrupted (optional)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Routes CSV Columns:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>source</strong> - Source node ID (required)</li>
                <li>• <strong>target</strong> - Target node ID (required)</li>
                <li>• <strong>distance</strong> - Distance in km (optional)</li>
                <li>• <strong>cost</strong> - Transportation cost (optional)</li>
                <li>• <strong>time</strong> - Time in hours (optional)</li>
                <li>• <strong>capacity</strong> - Route capacity (optional)</li>
                <li>• <strong>status</strong> - active, inactive, disrupted (optional)</li>
                <li>• <strong>transportMode</strong> - road, rail, air, sea (optional)</li>
                <li>• <strong>riskLevel</strong> - low, medium, high, critical (optional)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Clear Data */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Clear All Data</h3>
              <p className="text-sm text-gray-600">Remove all nodes and routes from the database</p>
            </div>
            <button
              onClick={handleClearAll}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
