import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVendor, Vendor, saveVendorMenuItem, VendorMenuItem } from '../services/db';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function VendorImport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState<VendorMenuItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      getVendor(id).then(v => {
        if (v) setVendor(v);
      });
    }
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleExtract = async () => {
    if (!file || !vendor) return;
    setIsExtracting(true);
    setError('');

    try {
      // Convert file to base64 using a Promise
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
      });
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        Extract the menu items from this image/document.
        Return a JSON array of objects, where each object has:
        - name: string (the name of the dish/item)
        - description: string (brief description or ingredients)
        - price: number (the price as a number, no currency symbols)
        - category: string (e.g., Starters, Mains, Desserts, Beverages)
        
        Only return the JSON array, nothing else.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: base64String, mimeType: file.type } }
          ]
        },
        config: {
          responseMimeType: 'application/json'
        }
      });

      try {
        const jsonStr = response.text?.trim() || '[]';
        const items = JSON.parse(jsonStr);
        
        const formattedItems: VendorMenuItem[] = items.map((item: any) => ({
          vendorId: vendor.id!,
          name: item.name,
          description: item.description,
          price: Number(item.price) || 0,
          currency: vendor.currency || 'USD',
          category: item.category || 'Uncategorized',
          isAvailable: true
        }));
        
        setExtractedItems(formattedItems);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        setError("Failed to parse the extracted data. Please try again.");
      }
    } catch (err) {
      console.error("Extraction error:", err);
      setError(err instanceof Error ? err.message : "An error occurred during extraction.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async () => {
    if (extractedItems.length === 0) return;
    
    try {
      // Save all items
      await Promise.all(extractedItems.map(item => saveVendorMenuItem(item)));
      navigate('/vendors');
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save items to the database.");
    }
  };

  if (!vendor) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <button onClick={() => navigate('/vendors')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Vendors
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Import Menu: {vendor.name}</h1>
        <p className="text-slate-500">Upload a menu image or PDF to automatically extract items.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-12 bg-slate-50">
          <Upload className="w-12 h-12 text-slate-400 mb-4" />
          <p className="text-slate-600 font-medium mb-2">Drag and drop a file, or click to select</p>
          <p className="text-sm text-slate-500 mb-6">Supports JPG, PNG, PDF</p>
          <input 
            type="file" 
            accept="image/*,application/pdf" 
            onChange={handleFileChange}
            className="block w-full max-w-xs text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
          />
        </div>

        {file && (
          <div className="mt-6 flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-200">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-slate-500" />
              <div>
                <p className="font-medium text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button 
              onClick={handleExtract} 
              disabled={isExtracting}
              className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
            >
              {isExtracting ? 'Extracting...' : 'Extract Items'}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}
      </div>

      {extractedItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" /> 
              Extracted {extractedItems.length} Items
            </h2>
            <button onClick={handleSave} className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800">
              Save to Menu
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {extractedItems.map((item, idx) => (
              <div key={idx} className="p-4 flex justify-between items-start hover:bg-slate-50">
                <div>
                  <h3 className="font-medium text-slate-900">{item.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium border border-slate-200">
                    {item.category}
                  </span>
                </div>
                <div className="text-right font-medium text-slate-900">
                  {item.price} {item.currency}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
