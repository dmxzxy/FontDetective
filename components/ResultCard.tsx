import React from 'react';
import { AnalysisResult } from '../types';
import { Check, AlertCircle, Info, Layers, Search, Type } from 'lucide-react';

interface ResultCardProps {
  result: AnalysisResult;
}

const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
      {/* Overall Status Header */}
      <div className={`p-4 ${result.matchFound ? 'bg-green-50' : 'bg-amber-50'} border-b ${result.matchFound ? 'border-green-100' : 'border-amber-100'}`}>
        <div className="flex items-center gap-3">
          {result.matchFound ? (
            <div className="p-2 bg-green-100 rounded-full text-green-600">
              <Check className="w-6 h-6" />
            </div>
          ) : (
            <div className="p-2 bg-amber-100 rounded-full text-amber-600">
              <AlertCircle className="w-6 h-6" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {result.matchFound ? "Match Identified" : "Inconclusive Match"}
            </h3>
            <p className="text-sm text-slate-600">
              Confidence: <span className="font-semibold">{result.confidence}%</span>
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Primary Result */}
        <div>
          <h4 className="text-sm uppercase tracking-wide text-slate-400 font-semibold mb-2">Primary Font Match</h4>
          <p className="text-4xl font-bold text-slate-900 tracking-tight">{result.bestMatchFontName}</p>
          <p className="mt-3 text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
            {result.reasoning}
          </p>
        </div>

        {/* Detailed Breakdown */}
        {result.detailedMatches && result.detailedMatches.length > 0 && (
          <div>
             <h4 className="flex items-center gap-2 text-sm uppercase tracking-wide text-slate-400 font-semibold mb-3">
              <Search className="w-4 h-4" />
              Detailed Segment Analysis
            </h4>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              {result.detailedMatches.map((match, idx) => (
                <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                       <Type className="w-4 h-4 text-indigo-500" />
                       <span className="font-bold text-slate-800">{match.textSegment}</span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      {match.confidence}% Match
                    </span>
                  </div>
                  <div className="ml-6">
                    <p className="text-sm font-medium text-slate-700 mb-0.5">
                      Matched: <span className="text-indigo-600">{match.fontName}</span>
                    </p>
                    <p className="text-xs text-slate-500 italic">
                      "{match.reasoning}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similarities & Differences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="flex items-center gap-2 text-sm uppercase tracking-wide text-slate-400 font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Visual Similarities
            </h4>
            <ul className="space-y-2">
              {result.similarities.map((item, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-2 bg-green-50/50 p-2 rounded border border-green-50">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {result.differences && result.differences.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-sm uppercase tracking-wide text-slate-400 font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Key Differences
              </h4>
              <ul className="space-y-2">
                {result.differences.map((item, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2 bg-amber-50/50 p-2 rounded border border-amber-50">
                    <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {result.recommendations && result.recommendations.length > 0 && (
          <div className="pt-6 border-t border-slate-100">
            <h4 className="flex items-center gap-2 text-sm uppercase tracking-wide text-slate-400 font-semibold mb-4">
              <Layers className="w-4 h-4" />
              Suggested Font Pairings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.recommendations.map((rec, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-bold text-slate-800">{rec.name}</h5>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase">
                      {rec.usage}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {rec.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultCard;