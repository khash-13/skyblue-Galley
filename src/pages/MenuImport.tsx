import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { extractMenuFromImage } from '../services/ocr';
import { saveVendorMenuItem } from '../services/db';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function MenuImport() {
  const { id: vendorId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const handleExtract = async () => {
    if (!preview || !file) return;
    setLoading(true);
    setError(null);
    try {
      const base64Data = preview.split(',')[1];
      const data = await extractMenuFromImage(base64Data, file.type);
      setExtractedData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to extract menu');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!extractedData || !vendorId) return;
    setLoading(true);
    try {
      const currency = extractedData.currency || 'USD';
      for (const section of extractedData.sections) {
        for (const item of section.items) {
          await saveVendorMenuItem({
            vendorId,
            name: item.name,
            description: item.description || '',
            price: item.price || 0,
            currency,
            category: section.sectionName,
            dietaryTags: item.dietaryTags || [],
            allergens: item.allergens || []
          });
        }
      }
      navigate('/vendors');
    } catch (err: any) {
      setError('Failed to save items: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Menu</h1>
      <p className="text-gray-500 mb-8">Upload a photo or PDF of a menu to extract items automatically.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Menu Image</label>
            <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            
            {preview && (
              <div className="mt-4 border rounded-md overflow-hidden bg-gray-50">
                {file?.type.startsWith('image/') ? (
                  <img src={preview} alt="Menu preview" className="w-full h-auto max-h-96 object-contain" />
                ) : (
                  <div className="p-8 text-center text-gray-500">PDF Selected</div>
                )}
              </div>
            )}

            <button 
              onClick={handleExtract} 
              disabled={!file || loading}
              className="mt-4 w-full flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Extracting...' : <><Upload className="w-4 h-4" /> Extract Items</>}
            </button>
            {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2"><AlertCircle className="w-5 h-5" /> {error}</div>}
          </div>
        </div>

        <div>
          {extractedData && (
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Review Extracted Data</h2>
                <button onClick={handleConfirm} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50">
                  Confirm & Import
                </button>
              </div>
              
              <div className="mb-4 text-sm text-gray-600">
                <p><strong>Vendor Detected:</strong> {extractedData.vendorName || 'Unknown'}</p>
                <p><strong>Currency:</strong> {extractedData.currency || 'Not detected'}</p>
              </div>

              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                {extractedData.sections.map((section: any, sIdx: number) => (
                  <div key={sIdx}>
                    <h3 className="font-semibold text-gray-900 border-b pb-2 mb-3">{section.sectionName}</h3>
                    <ul className="space-y-3">
                      {section.items.map((item: any, iIdx: number) => (
                        <li key={iIdx} className="text-sm bg-gray-50 p-3 rounded-md">
                          <div className="flex justify-between font-medium">
                            <span>{item.name}</span>
                            <span>{item.price}</span>
                          </div>
                          {item.description && <p className="text-gray-500 mt-1">{item.description}</p>}
                          <div className="flex gap-2 mt-2">
                            {item.dietaryTags?.map((tag: string) => <span key={tag} className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">{tag}</span>)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
