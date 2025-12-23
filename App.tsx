import React, { useState, useRef, useEffect } from 'react';
import { Upload, Type, Image as ImageIcon, Search, RefreshCw, X, Loader2 } from 'lucide-react';
import { extractTextFromImage, analyzeFonts } from './services/geminiService';
import { loadFontFile, createComparisonSheet, fileToBase64 } from './utils/fontHelper';
import { LoadedFont, AnalysisResult, ProcessingStep } from './types';
import StepIndicator from './components/StepIndicator';
import ResultCard from './components/ResultCard';

const App: React.FC = () => {
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [loadedFonts, setLoadedFonts] = useState<LoadedFont[]>([]);
  const [extractedText, setExtractedText] = useState<string>("Sample Text");
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [referenceSheet, setReferenceSheet] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);

  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'upload', label: 'Upload target image', status: 'pending' },
    { id: 'extract', label: 'Extract text', status: 'pending' },
    { id: 'fonts', label: 'Load candidate fonts', status: 'pending' },
    { id: 'render', label: 'Generate comparison sheet', status: 'pending' },
    { id: 'analyze', label: 'AI Comparison Analysis', status: 'pending' },
  ]);

  const updateStep = (id: string, status: ProcessingStep['status']) => {
    setSteps(prev => prev.map(step => step.id === id ? { ...step, status } : step));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTargetImage(null);
    setAnalysisResult(null);
    setReferenceSheet(null);
    setLoadedFonts([]);
    setExtractedText("Sample Text");
    
    // Reset steps
    setSteps(prev => prev.map(s => ({...s, status: 'pending'})));
    updateStep('upload', 'processing');

    try {
      const base64 = await fileToBase64(file);
      setTargetImage(base64);
      updateStep('upload', 'completed');
      
      // Automatically trigger text extraction
      await handleExtractText(base64);
    } catch (error) {
      console.error(error);
      updateStep('upload', 'error');
    }
  };

  const handleExtractText = async (image: string) => {
    setIsExtractingText(true);
    updateStep('extract', 'processing');
    try {
      const text = await extractTextFromImage(image);
      setExtractedText(text);
      updateStep('extract', 'completed');
    } catch (error) {
      console.error(error);
      updateStep('extract', 'error');
    } finally {
      setIsExtractingText(false);
    }
  };

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    updateStep('fonts', 'processing');
    const newFonts: LoadedFont[] = [];

    for (const file of files) {
      try {
        const loaded = await loadFontFile(file);
        newFonts.push(loaded);
      } catch (error) {
        console.error(`Failed to load font ${file.name}`, error);
      }
    }

    setLoadedFonts(prev => [...prev, ...newFonts]);
    updateStep('fonts', 'completed');
  };

  const handleRemoveFont = (indexToRemove: number) => {
    setLoadedFonts(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const runAnalysis = async () => {
    if (!targetImage || loadedFonts.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      // Step 1: Render Reference Sheet
      updateStep('render', 'processing');
      const sheetBase64 = await createComparisonSheet(extractedText, loadedFonts);
      setReferenceSheet(sheetBase64);
      updateStep('render', 'completed');

      // Step 2: Call Gemini
      updateStep('analyze', 'processing');
      const result = await analyzeFonts(
        targetImage, 
        sheetBase64, 
        loadedFonts.map(f => f.name)
      );
      setAnalysisResult(result);
      updateStep('analyze', 'completed');

    } catch (error) {
      console.error("Analysis failed", error);
      updateStep('analyze', 'error');
      updateStep('render', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              FontDetective
            </h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Powered by Gemini Vision
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Target Image Section */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-500" />
              1. Target Image
            </h2>
            
            {!targetImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg h-48 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors group"
              >
                <div className="p-3 bg-slate-100 rounded-full mb-3 group-hover:bg-white transition-colors">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                </div>
                <p className="text-sm font-medium text-slate-600">Click to upload image</p>
                <p className="text-xs text-slate-400 mt-1">JPG, PNG supported</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
            ) : (
              <div className="relative group rounded-lg overflow-hidden border border-slate-200">
                <img src={targetImage} alt="Target" className="w-full h-auto max-h-64 object-contain bg-slate-100" />
                <button 
                  onClick={() => {
                    setTargetImage(null);
                    setAnalysisResult(null);
                    setReferenceSheet(null);
                    setLoadedFonts([]);
                  }}
                  className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur rounded-full shadow-sm hover:bg-red-50 text-slate-600 hover:text-red-500 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}
          </section>

          {/* Extracted Text Section */}
          {targetImage && (
             <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Type className="w-5 h-5 text-indigo-500" />
                2. Text to Match
              </h2>
              <div className="relative">
                <input 
                  type="text" 
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none pr-10"
                />
                {isExtractingText && (
                  <div className="absolute right-3 top-3.5">
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Gemini extracts this automatically. Edit if incorrect. This text will be used to render font samples.
              </p>
             </section>
          )}

          {/* Font Upload Section */}
          {targetImage && (
            <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="font-serif italic text-xl font-bold text-indigo-500">Ag</span>
                  3. Candidate Fonts
                </h2>
                <button 
                  onClick={() => fontInputRef.current?.click()}
                  className="text-sm px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 font-medium transition-colors"
                >
                  + Add Fonts
                </button>
              </div>
              <input 
                type="file" 
                ref={fontInputRef} 
                className="hidden" 
                accept=".ttf,.otf,.woff,.woff2"
                multiple
                onChange={handleFontUpload}
              />

              {loadedFonts.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                  <p className="text-sm text-slate-500">Upload .ttf or .otf files to compare</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {loadedFonts.map((font, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium text-slate-700 truncate">{font.name}</p>
                        <p className="text-xs text-slate-400 truncate" style={{ fontFamily: font.family }}>
                          {extractedText}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleRemoveFont(idx)}
                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Action Button */}
          {targetImage && loadedFonts.length > 0 && (
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Identify Font
                </>
              )}
            </button>
          )}
        </div>

        {/* Right Column: Results & Visualization */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Progress / Status */}
          {targetImage && (
             <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
               <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Process Status</h3>
               <StepIndicator steps={steps} />
             </div>
          )}

          {/* Analysis Result */}
          {analysisResult && (
            <ResultCard result={analysisResult} />
          )}

          {/* Generated Reference Sheet (Visual Proof) */}
          {referenceSheet && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Generated Comparison Sheet</h3>
              <p className="text-sm text-slate-500 mb-4">
                This image was generated in your browser using your uploaded fonts and the text extracted from the target image. Gemini used this to compare against the original.
              </p>
              <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 p-2">
                <img src={referenceSheet} alt="Reference Sheet" className="w-full h-auto shadow-sm" />
              </div>
            </div>
          )}

          {!targetImage && (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-600">Ready to Detect</h3>
              <p className="max-w-xs mt-2">Upload an image and some font files to start the identification process.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default App;