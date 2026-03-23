'use client';

import { useState, useEffect } from 'react';

// --- Sub-Components ---

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Tab 1: Originality Check (Existing Logic Refactored)
 */
function OriginalityTab() {
  const [inputType, setInputType] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startScan = async () => {
    if (inputType === 'file' && !file) return;
    if (inputType === 'text' && !textInput.trim()) return;
    
    setScanning(true);
    setProgress(0);
    setResults(null);

    let progressInterval: NodeJS.Timeout | undefined;

    try {
      const formData = new FormData();
      if (inputType === 'file' && file) {
        formData.append('file', file);
      } else if (inputType === 'text') {
        formData.append('text', textInput);
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/scan`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Failed to start scan');
      const data = await res.json();
      const docId = data.document_id;
      setDocumentId(docId);

      // Polling
      progressInterval = setInterval(async () => {
        try {
          const pollRes = await fetch(`${API_BASE_URL}/api/v1/scan/${docId}`);
          if (!pollRes.ok) return;
          const pollData = await pollRes.json();
          
          if (pollData.document.status === 'completed') {
            clearInterval(progressInterval);
            setProgress(100);
            setTimeout(() => {
              setScanning(false);
              setResults({
                uniqueScore: pollData.document.unique_score,
                plagiarismScore: pollData.document.plagiarism_score,
                flags: pollData.flags
              });
            }, 600);
          } else {
             setProgress((prev) => (prev < 90 ? prev + Math.floor(Math.random() * 5) + 1 : prev));
          }
        } catch (e) {
          console.error('Polling error', e);
        }
      }, 2500);

    } catch (error) {
       console.error(error);
       setScanning(false);
       if (progressInterval) clearInterval(progressInterval);
       alert("Error connecting to backend API.");
    }
  };

  const isScanDisabled = (inputType === 'file' && !file) || (inputType === 'text' && !textInput.trim()) || scanning;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-1 glass-panel p-6 flex flex-col space-y-6 lg:h-[460px] min-h-[400px]">
        <div className="flex bg-white/5 p-1 rounded-xl">
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${inputType === 'file' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setInputType('file')}
          >
            Upload File
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${inputType === 'text' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setInputType('text')}
          >
            Paste Text
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl relative p-4 transition-all hover:border-blue-500/50 overflow-hidden">
          {inputType === 'file' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <label htmlFor="file-upload" className="cursor-pointer text-center w-full">
                <span className="block px-4 py-2 bg-white/5 hover:bg-white/10 transition-all rounded-lg text-sm font-medium truncate">
                  {file ? file.name : 'Select PDF or Docx...'}
                </span>
                <input id="file-upload" type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileUpload} />
              </label>
            </>
          ) : (
            <textarea 
              className="w-full h-full bg-transparent resize-none outline-none text-sm text-slate-200 placeholder:text-slate-500 p-2"
              placeholder="Paste your document text here..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          )}
        </div>

        <button 
          className={`w-full py-3 rounded-xl font-bold tracking-wide transition-all shadow-lg ${isScanDisabled ? 'bg-slate-700/50 cursor-not-allowed text-slate-400 shadow-none' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-500/25'}`}
          onClick={startScan}
          disabled={isScanDisabled}
        >
          {scanning ? 'Analyzing Context...' : 'Start Deep Scan'}
        </button>
      </div>

      <div className="lg:col-span-2 glass-panel p-6 sm:p-8 lg:h-[460px] min-h-[460px] flex flex-col relative overflow-hidden">
        {!scanning && !results && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
            <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" strokeWidth={0.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-center font-medium">Submit your document to see potential plagiarism and uniqueness scores.</p>
          </div>
        )}

        {scanning && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle className="text-white/5 stroke-current" strokeWidth="6" cx="50" cy="50" r="42" fill="transparent"></circle>
                <circle className="text-blue-500 progress-ring stroke-current transition-all duration-300 ease-out" strokeWidth="6" strokeLinecap="round" cx="50" cy="50" r="42" fill="transparent" strokeDasharray="263.89" strokeDashoffset={263.89 - (263.89 * progress) / 100}></circle>
              </svg>
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">{progress}%</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-white/90">Agentic Scan in progress...</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Cross-referencing web & internal databases</p>
            </div>
          </div>
        )}

        {results && (
          <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-4 duration-700 h-full">
            <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Scan Results</h2>
                <p className="text-sm text-slate-400 truncate max-w-[200px]">{inputType === 'text' ? 'Pasted Content' : file?.name}</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-6">
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-rose-400">{results.plagiarismScore}%</span>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold tracking-widest">Plagiarized</p>
                </div>
                <div className="w-px h-8 sm:h-10 bg-white/10"></div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">{results.uniqueScore}%</span>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold tracking-widest">Unique</p>
                </div>
              </div>
            </div>

            <a 
              href={`/report/${documentId}`} 
              target="_blank" 
              className="w-full mb-6 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-xl text-center text-sm font-semibold text-blue-400 transition-all flex items-center justify-center gap-2"
            >
              Open Detailed Report ↗
            </a>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Detailed Findings</h3>
              {results.flags.map((flag: any, idx: number) => (
                <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 uppercase tracking-wider">{flag.type}</span>
                    <span className="text-xs font-semibold text-slate-400">{flag.similarity}% Confidence</span>
                  </div>
                  <p className="text-sm italic text-slate-300">"{flag.text}"</p>
                </div>
              ))}
              {results.flags.length === 0 && (
                <div className="text-center py-6 text-emerald-400 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                  Perfect! Content is 100% original.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Tab 2: Plagiarism Remover
 */
function PlagiarismRemoverTab() {
  const [text, setText] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleProcess = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setCopySuccess(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/tools/remove-plagiarism`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.output) {
        setOutput(data.output);
      } else {
        alert(data.detail || "Error processing text.");
      }
    } catch (e) {
      alert("Error connecting to backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const loadExample = () => {
    setText("The quick brown fox jumps over the lazy dog. This sentence is quite famous and often used for testing typefaces because it contains every letter of the alphabet.");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[540px] animate-in slide-in-from-right-4 duration-500">
      <div className="glass-panel p-6 flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Original / Plagiarized Text</label>
          <div className="flex gap-2">
             <button onClick={loadExample} className="text-[10px] font-bold text-blue-400 hover:underline px-2 py-1">Try Example</button>
             <button onClick={() => {setText(''); setOutput('');}} className="text-[10px] font-bold text-slate-500 hover:text-white px-2 py-1">Clear</button>
          </div>
        </div>
        <textarea 
          className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-blue-500/50 resize-none"
          placeholder="Paste text that was flagged for plagiarism..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button 
          className={`py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] transition-all shadow-lg shadow-blue-500/20 ${loading || !text.trim() ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={handleProcess}
        >
          {loading ? 'Rephrasing Context...' : 'Ethically Remove Plagiarism'}
        </button>
      </div>
      <div className="glass-panel p-6 flex flex-col space-y-4 relative">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Uniquely Rephrased Output</label>
        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-sm relative overflow-y-auto custom-scrollbar">
          {output ? (
            <p className="whitespace-pre-wrap animate-in fade-in duration-700">{output}</p>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
              <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              <p>Resulting text will appear here.</p>
            </div>
          )}
        </div>
        {output && (
          <button 
            className={`absolute top-4 right-10 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md transition-all ${copySuccess ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-blue-400/10 text-blue-400 border border-white/10 hover:text-blue-300'}`}
            onClick={handleCopy}
          >
            {copySuccess ? 'Copied ✓' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Tab 3: Article Rewriter
 */
function ArticleRewriterTab() {
  const [text, setText] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleProcess = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setCopySuccess(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/tools/rewrite-article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.output) {
        setOutput(data.output);
      } else {
        alert(data.detail || "Error rewriting article.");
      }
    } catch (e) {
      alert("Error connecting to backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const loadExample = () => {
    setText("The environmental impact of plastic pollution in our oceans has reached a critical tipping point. Each year, millions of tons of plastic waste enter marine ecosystems, threatening biodiversity and potentially entering the human food chain through microplastics. Global initiatives are currently focusing on circular economy models to reduce dependency on single-use items.");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[540px] animate-in slide-in-from-right-4 duration-500">
      <div className="glass-panel p-6 flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Initial Article Content</label>
          <div className="flex gap-2">
             <button onClick={loadExample} className="text-[10px] font-bold text-purple-400 hover:underline px-2 py-1">Try Example</button>
             <button onClick={() => {setText(''); setOutput('');}} className="text-[10px] font-bold text-slate-500 hover:text-white px-2 py-1">Clear</button>
          </div>
        </div>
        <textarea 
          className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-purple-500/50 resize-none"
          placeholder="Paste an article to rewrite creatively..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button 
          className={`py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.02] transition-all shadow-lg shadow-purple-500/20 ${loading || !text.trim() ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={handleProcess}
        >
          {loading ? 'Generating Original Content...' : 'Full Article Rewrite'}
        </button>
      </div>
      <div className="glass-panel p-6 flex flex-col space-y-4 relative">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Creative Re-written Article</label>
        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-sm relative overflow-y-auto custom-scrollbar">
          {output ? (
            <p className="whitespace-pre-wrap animate-in fade-in duration-700">{output}</p>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
              <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 4v4h4" /></svg>
              <p>Re-written article will appear here.</p>
            </div>
          )}
        </div>
        {output && (
          <button 
            className={`absolute top-4 right-10 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md transition-all ${copySuccess ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-purple-400/10 text-purple-400 border border-white/10 hover:text-purple-300'}`}
            onClick={handleCopy}
          >
            {copySuccess ? 'Copied ✓' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
}

// --- Main App Dashboard ---

export default function Home() {
  const [activeTab, setActiveTab] = useState<'originality' | 'remover' | 'rewriter'>('originality');

  return (
    <main className="min-h-screen py-10 px-4 sm:px-6 lg:px-24 flex flex-col items-center bg-[#0a0f1a] text-white selection:bg-blue-500/30">
      <div className="w-full max-w-6xl space-y-8">
        
        {/* Hero Header */}
        <header className="text-center space-y-4">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">
            Agentic AI Powered
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Originality Suite
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            The all-in-one workspace for academic integrity and content generation.
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex justify-center">
          <nav className="flex flex-wrap justify-center bg-white/5 p-1.5 rounded-2xl border border-white/10 gap-2">
            {[
              { id: 'originality', label: 'Originality Check', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { id: 'remover', label: 'Plagiarism Remover', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
              { id: 'rewriter', label: 'Article Rewriter', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 sm:gap-2.5 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-sm font-bold transition-all duration-300 ${activeTab === tab.id ? 'bg-white shadow-xl text-[#0a0f1a] scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon}></path>
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="pt-4">
          {activeTab === 'originality' && <OriginalityTab />}
          {activeTab === 'remover' && <PlagiarismRemoverTab />}
          {activeTab === 'rewriter' && <ArticleRewriterTab />}
        </div>

        {/* Footer */}
        <footer className="pt-12 border-t border-white/5 text-center space-y-4">
           <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Powered by Gemini 2.5 & Pinecone Ecosystem</p>
           <div className="flex flex-col items-center space-y-2">
             <p className="text-sm text-slate-400">Maintained By <span className="text-blue-400 font-semibold">Kadari Uday</span></p>
             <div className="flex items-center gap-4">
               <span className="text-xs text-slate-500">Contact me</span>
               <a 
                 href="https://www.linkedin.com/in/kadariuday" 
                 target="_blank" 
                 className="flex items-center gap-2 px-4 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-lg text-xs font-bold text-blue-400 transition-all"
               >
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                 LinkedIn
               </a>
             </div>
           </div>
        </footer>
      </div>
    </main>
  );
}
