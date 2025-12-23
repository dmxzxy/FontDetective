import React from 'react';
import { AnalysisResult } from '../types';
import { Check, AlertCircle, Info } from 'lucide-react';

interface ResultCardProps {
  result: AnalysisResult;
}

const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
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

      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-sm uppercase tracking-wide text-slate-400 font-semibold mb-2">Best Candidate</h4>
          <p className="text-3xl font-bold text-slate-900">{result.bestMatchFontName}</p>
        </div>

        <div>
          <h4 className="text-sm uppercase tracking-wide text-slate-400 font-semibold mb-2">Analysis Reasoning</h4>
          <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
            {result.reasoning}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="flex items-center gap-2 text-sm uppercase tracking-wide text-slate-400 font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Similarities
            </h4>
            <ul className="space-y-1">
              {result.similarities.map((item, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {result.differences && result.differences.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-sm uppercase tracking-wide text-slate-400 font-semibold mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Differences
              </h4>
              <ul className="space-y-1">
                {result.differences.map((item, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
