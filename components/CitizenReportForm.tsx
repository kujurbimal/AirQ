
import React, { useState, useRef } from 'react';
import { Camera, Send, AlertCircle, CheckCircle2, Image as ImageIcon, X } from 'lucide-react';

interface CitizenReportFormProps {
  currentLocationName?: string;
  coords?: { lat: number; lng: number };
  onReportSubmitted?: (report: { title: string; loc: string; time: string; score: number }) => void;
}

const CitizenReportForm: React.FC<CitizenReportFormProps> = ({ 
  currentLocationName, 
  coords,
  onReportSubmitted 
}) => {
  const [report, setReport] = useState('');
  const [type, setType] = useState<'pollution' | 'odor' | 'haze'>('pollution');
  const [locationName, setLocationName] = useState(currentLocationName || 'Spring St, Los Angeles');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (currentLocationName) {
      setLocationName(currentLocationName);
    }
  }, [currentLocationName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!report.trim()) return;

    const titleMap = {
      pollution: 'Visible Smoke / Exhaust',
      odor: 'Chemical / Sulfur Odor',
      haze: 'Dense Ground Haze',
    };

    const newReport = {
      title: titleMap[type] || 'Hyperlocal Observation',
      loc: locationName,
      time: 'Just now',
      score: Math.floor(Math.random() * 10) + 90, // AI Trust Score 90-99%
    };

    if (onReportSubmitted) {
      onReportSubmitted(newReport);
    }

    setSubmittedMessage('Report submitted for AI verification. Thank you for contributing to science!');
    setReport('');
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setTimeout(() => {
      setSubmittedMessage(null);
    }, 4500);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl border border-blue-100">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-600 rounded-lg text-white">
          <AlertCircle size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Citizen Science</h3>
          <p className="text-xs text-slate-500">Report hyperlocal pollution events</p>
        </div>
      </div>

      {submittedMessage && (
        <div className="mb-4 p-3 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-300">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{submittedMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Type of Event</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Pollution', 'Odor', 'Haze'] as const).map((t) => {
              const val = t.toLowerCase() as 'pollution' | 'odor' | 'haze';
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(val)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    type === val 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Description</label>
          <textarea
            value={report}
            onChange={(e) => setReport(e.target.value)}
            placeholder="E.g., Unusual heavy smoke from construction site near Maple St..."
            className="w-full bg-white rounded-2xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            rows={3}
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase">Location Note</label>
            {currentLocationName && (
              <button
                type="button"
                onClick={() => setLocationName(currentLocationName)}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 underline"
              >
                Use Active Location
              </button>
            )}
          </div>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Street or neighborhood"
            className="w-full bg-white rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {photoPreview && (
          <div className="relative inline-block mt-2">
            <img 
              src={photoPreview} 
              alt="Observation Upload" 
              className="w-24 h-24 object-cover rounded-xl border-2 border-blue-200 shadow-sm"
            />
            <button
              type="button"
              onClick={() => setPhotoPreview(null)}
              className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow hover:bg-rose-600"
              title="Remove photo"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all"
          >
            <Camera size={18} /> {photoPreview ? 'Change Photo' : 'Add Photo'}
          </button>
          <button
            type="submit"
            className="flex-[2] flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
          >
            <Send size={18} /> Submit Report
          </button>
        </div>
      </form>
    </div>
  );
};

export default CitizenReportForm;
