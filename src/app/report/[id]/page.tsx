'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Removed legacy HighlightedText in favor of backend native PDF highlights

export default function ReportPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`${API_BASE_URL}/api/v1/scan/${id}`)
      .then(res => res.json())
      .then(json => {
         setData(json);
         setLoading(false);
      })
      .catch(err => {
         console.error(err);
         setData({ error: "Failed to fetch" });
         setLoading(false);
      });
  }, [id]);

  if (loading || !id) return <div className="min-h-screen text-slate-800 flex items-center justify-center">Loading Report Engine...</div>;
  if (!data || data.error) return <div className="min-h-screen flex items-center justify-center text-red-500 text-center mt-20">Report not found or expired.</div>;

  const { document, flags } = data;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-10 lg:p-20 font-sans print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto bg-white p-6 sm:p-12 rounded-2xl shadow-xl print:shadow-none print:p-0 border border-slate-100">
        
        {/* Header - Print actions hidden during print */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 border-b pb-6 print:hidden gap-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 transition-colors text-sm sm:text-base">
            ← Back to Dashboard
          </Link>
          <button 
            onClick={() => window.open(`${API_BASE_URL}/api/v1/scan/${document.id}/report.pdf`, '_blank')}
            className="w-full sm:w-auto bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium shadow-md hover:bg-slate-800 transition-colors text-sm"
          >
            Download PDF
          </button>
        </div>

        {/* Official Report Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Originality Report</h1>
          <p className="text-slate-500">Document ID: <span className="font-mono text-xs">{document.id}</span></p>
          <div className="mt-6 flex flex-wrap gap-x-12 gap-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Filename / Source</p>
              <p className="font-medium text-slate-800 mt-1">{document.filename}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Date Generated</p>
              <p className="font-medium text-slate-800 mt-1">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Analysis Engine</p>
              <p className="font-medium text-slate-800 mt-1">Gemini 1.5 & Pinecone</p>
            </div>
          </div>
        </header>

        {/* Global Scores */}
        <div className="flex flex-col sm:flex-row bg-slate-50 rounded-xl p-6 sm:p-8 mb-12 border border-slate-100 justify-around text-center gap-8 sm:gap-0">
          <div>
            <span className="block text-4xl sm:text-5xl font-black text-emerald-500 mb-1 sm:mb-2">{document.unique_score}%</span>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-500">Unique Content</span>
          </div>
          <div className="hidden sm:block w-px bg-slate-200"></div>
          <div className="sm:hidden h-px w-full bg-slate-200"></div>
          <div>
            <span className="block text-4xl sm:text-5xl font-black text-rose-500 mb-1 sm:mb-2">{document.plagiarism_score}%</span>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-500">Plagiarism Found</span>
          </div>
        </div>

        {/* Detailed Flags */}
        <div>
          <h3 className="text-2xl font-bold mb-6 text-slate-800 border-b pb-2">Flagged Analysis Breakdown</h3>
          {flags.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
               <svg className="w-12 h-12 mx-auto text-emerald-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <p className="text-lg font-medium">No plagiarism detected.</p>
               <p className="text-sm">The document appears to be entirely original and uniquely written.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {flags.map((flag: any, idx: number) => {
                const colorMatches = [
                  { bg: 'bg-pink-100', border: 'border-pink-500', text: 'text-pink-700', badge: 'bg-pink-500' },
                  { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700', badge: 'bg-blue-500' },
                  { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-700', badge: 'bg-purple-500' },
                  { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700', badge: 'bg-orange-500' },
                  { bg: 'bg-emerald-100', border: 'border-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-500' },
                  { bg: 'bg-cyan-100', border: 'border-cyan-500', text: 'text-cyan-700', badge: 'bg-cyan-500' },
                ];
                const color = colorMatches[idx % colorMatches.length];

                return (
                <div key={idx} className={`bg-white border-l-4 ${color.border} p-4 sm:p-6 shadow-sm rounded-r-xl border-y border-r border-slate-100 overflow-hidden break-words relative pl-10 sm:pl-12`}>
                   <div 
                     className={`absolute left-0 top-0 bottom-0 w-6 sm:w-8 flex items-center justify-center ${color.badge}`}
                     style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                   >
                     <span className="text-white font-bold text-[9px] sm:text-xs tracking-widest rotate-180" style={{ writingMode: 'vertical-rl' }}>
                       SOURCE {idx + 1}
                     </span>
                   </div>

                   <div>
                     <div className="flex justify-between items-start mb-4">
                       <span className={`inline-block ${color.bg} ${color.text} text-xs font-bold px-3 py-1 uppercase tracking-wide rounded-full`} style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                         {flag.type}
                       </span>
                       <span className="text-sm font-bold text-slate-400">{flag.similarity}% Confidence</span>
                     </div>
                     <blockquote className={`text-slate-700 italic border-l-2 ${color.border} pl-4 mb-4 text-sm leading-relaxed`}>
                       "{flag.text}"
                     </blockquote>
                     <div className="bg-slate-50 p-3 rounded-lg flex md:items-center flex-col md:flex-row gap-3">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Source Match:</span>
                       <span className={`text-sm font-mono ${color.text} ${color.bg} px-2 py-1 rounded inline-block`} style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                         {flag.source}
                       </span>
                     </div>
                   </div>
                </div>
              )})}
            </div>
          )}
        </div>
        
        {/* Native Official PDF Report instead of text */}
        <div style={{ pageBreakBefore: 'always' }} className="mt-20 pt-12 border-t border-slate-200 print:hidden">
           <h3 className="text-2xl font-bold mb-6 text-slate-800 flex justify-between items-center">
             Official Highlighted Document
             <a href={`${API_BASE_URL}/api/v1/scan/${document.id}/report.pdf`} target="_blank" rel="noreferrer" className="text-sm border border-slate-300 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50">
               Open in New Tab
             </a>
           </h3>
           <div className="w-full h-[800px] border border-slate-200 rounded-xl overflow-hidden bg-slate-100 hidden sm:block">
             <iframe 
               src={`${API_BASE_URL}/api/v1/scan/${document.id}/report.pdf#page=2`} 
               className="w-full h-full"
               title="Highlighted PDF Report"
             />
           </div>
           <div className="sm:hidden text-center py-8 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-500">
              <p>PDF Viewer is only available on desktop.</p>
              <a href={`${API_BASE_URL}/api/v1/scan/${document.id}/report.pdf`} className="text-blue-600 underline mt-2 inline-block">Tap here to download PDF</a>
           </div>
        </div>

        <footer className="mt-20 pt-8 border-t border-slate-200 text-center print:mt-12">
          <p className="text-xs text-slate-400 font-medium">Generated by Smart Originality Suite with Agentic AI</p>
        </footer>

      </div>
    </main>
  );
}
