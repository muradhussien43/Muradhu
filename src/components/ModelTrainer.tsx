import React, { useState } from 'react';
import { ModelMetrics, Hyperparameters, DISEASE_CLASSES } from '../types';
import { getFeatureImportances } from '../utils/mlEngine';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  Settings, Zap, Sparkles, TrendingUp, CheckSquare, Maximize2, 
  HelpCircle, BarChart3, Binary, RefreshCw
} from 'lucide-react';

interface ModelTrainerProps {
  hyperparams: Hyperparameters;
  onUpdateHyperparams: (params: Hyperparameters) => void;
  onRetrain: () => void;
  isTraining: boolean;
  dtMetrics: ModelMetrics | null;
  rfMetrics: ModelMetrics | null;
  dtModel: any;
  rfModel: any;
}

export default function ModelTrainer({
  hyperparams,
  onUpdateHyperparams,
  onRetrain,
  isTraining,
  dtMetrics,
  rfMetrics,
  dtModel,
  rfModel
}: ModelTrainerProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'matrix' | 'features'>('metrics');

  const handleSliderChange = (field: keyof Hyperparameters, val: number) => {
    onUpdateHyperparams({
      ...hyperparams,
      [field]: val
    });
  };

  // Compute feature importances
  const dtFeatures = dtModel ? getFeatureImportances(dtModel) : [];
  const rfFeatures = rfModel ? getFeatureImportances(rfModel) : [];

  // Combine feature importances for a dual bar chart
  const combinedFeaturesData = dtFeatures.map(dtF => {
    const rfF = rfFeatures.find(f => f.name === dtF.name);
    return {
      name: dtF.name,
      'Decision Tree': dtF.score,
      'Random Forest': rfF ? rfF.score : 0
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm" id="model_trainer">
      {/* Upper header */}
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600">
            <Settings className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h2 className="text-lg font-sans font-medium text-slate-900 leading-tight">Training Control & Hyperparameters</h2>
            <p className="text-xs font-sans text-slate-500 mt-1">
              Adjust entropy tree splits, bag counts, and train models on patient variables.
            </p>
          </div>
        </div>

        {/* Bigretrain button */}
        <button 
          onClick={onRetrain}
          disabled={isTraining}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-sans font-medium rounded-xl text-xs shadow-xs hover:shadow-md transition duration-200"
          id="trigger_train_btn"
        >
          <RefreshCw className={`w-4 h-4 ${isTraining ? 'animate-spin' : ''}`} />
          {isTraining ? 'Constructing Forest Trees...' : 'Compute Splits & Fit Models'}
        </button>
      </div>

      {/* Main control rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 border-b border-slate-100" id="hp_sliders_section">
        
        {/* Decision Tree Param */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Binary className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-700">Decision Tree Parameters</h3>
          </div>

          <div className="space-y-4 text-xs font-sans">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600 flex items-center gap-1">
                  Max Tree Depth
                  <span className="text-[10px] text-slate-400 font-normal" title="Max level of splits down the root. Prevent overfitting.">(?)</span>
                </span>
                <span className="font-mono font-semibold text-slate-900">{hyperparams.maxDepth} levels</span>
              </div>
              <input 
                type="range" min="2" max="7" step="1"
                value={hyperparams.maxDepth}
                onChange={(e) => handleSliderChange('maxDepth', Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600 flex items-center gap-1">
                  Min Samples Split
                  <span className="text-[10px] text-slate-400 font-normal" title="Minimum samples in tree branch to allow further division.">(?)</span>
                </span>
                <span className="font-mono font-semibold text-slate-900">{hyperparams.minSamplesSplit} records</span>
              </div>
              <input 
                type="range" min="2" max="12" step="1"
                value={hyperparams.minSamplesSplit}
                onChange={(e) => handleSliderChange('minSamplesSplit', Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Random Forest Parameters */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-700">Random Forest Parameters</h3>
          </div>

          <div className="space-y-4 text-xs font-sans">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600 flex items-center gap-1">
                  Forest Tree Count
                  <span className="text-[10px] text-slate-400 font-normal" title="Number of bootstrap trees fitted inside forest ensemble.">(?)</span>
                </span>
                <span className="font-mono font-semibold text-slate-900">{hyperparams.numTrees} Trees</span>
              </div>
              <input 
                type="range" min="3" max="15" step="1"
                value={hyperparams.numTrees}
                onChange={(e) => handleSliderChange('numTrees', Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600 flex items-center gap-1">
                  Feature Subsampling
                  <span className="text-[10px] text-slate-400 font-normal" title="Fraction of total patient features shown to any node split (adds diversity to forest nodes).">(?)</span>
                </span>
                <span className="font-mono font-semibold text-slate-900">{Math.round(hyperparams.featureSubsamplingRatio * 100)}% features</span>
              </div>
              <input 
                type="range" min="0.2" max="1.0" step="0.1"
                value={hyperparams.featureSubsamplingRatio}
                onChange={(e) => handleSliderChange('featureSubsamplingRatio', Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Explainer card on metrics */}
        <div className="p-6 bg-slate-50/50 flex flex-col justify-center">
          <div className="space-y-2 text-xs font-sans">
            <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-medium rounded text-[10px]">ML SPLIT MECHANISM</span>
            <h4 className="font-semibold text-slate-800">Train/Test Evaluation Spits</h4>
            <p className="text-slate-500 leading-relaxed">
              We leverage an <strong>honest 70/30 split ratio</strong>. The trees fit split configurations solely on 70% of historical patient cases, and then formulate predictions on the remaining unexamined 30% to assess generalizability.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation tabs for metrics viewer */}
      <div className="px-6 bg-slate-50 border-b border-slate-100 flex items-center">
        <button 
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-3 text-xs font-sans font-medium border-b-2 transition-all ${activeTab === 'metrics' ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Model Accuracy Scores
        </button>
        <button 
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-3 text-xs font-sans font-medium border-b-2 transition-all ${activeTab === 'matrix' ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Confusion Heatmaps
        </button>
        <button 
          onClick={() => setActiveTab('features')}
          className={`px-4 py-3 text-xs font-sans font-medium border-b-2 transition-all ${activeTab === 'features' ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Gini Feature Importance
        </button>
      </div>

      {/* Tabs output */}
      <div className="p-6">
        
        {/* Tab 1: Accuracy & comparison indicators */}
        {activeTab === 'metrics' && (
          <div className="space-y-6" id="accuracy_tab_view">
            {dtMetrics && rfMetrics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Decision Tree Card */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">Single Decision Tree Target</span>
                    <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-mono rounded">1 Model</span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-slate-800">
                      {Math.round(dtMetrics.accuracy * 100)}%
                    </span>
                    <span className="text-xs text-slate-500">Test Accuracy</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-slate-200/60">
                      <span className="text-slate-400 font-sans block mb-0.5">Macro F1-Score</span>
                      <span className="font-mono font-bold text-slate-800">{Math.round(dtMetrics.f1Score * 100)}%</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200/60">
                      <span className="text-slate-400 font-sans block mb-0.5">Unique Leaves</span>
                      <span className="font-mono font-bold text-slate-800">Fitted</span>
                    </div>
                  </div>

                  <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
                    *Trained on 70% subset, prone to split volatility if Max Depth is configured over 5.
                  </p>
                </div>

                {/* Random Forest Card */}
                <div className="p-5 rounded-2xl bg-indigo-950 text-white space-y-4 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-5 pointer-events-none">
                    <TrendingUp className="w-64 h-64" />
                  </div>
                  
                  <div className="flex justify-between items-center relative z-10">
                    <span className="text-xs font-mono font-semibold text-indigo-300 uppercase tracking-wider">Random Forest Ensemble</span>
                    <span className="px-2 py-0.5 bg-indigo-800/80 border border-indigo-700 text-indigo-200 text-[10px] font-mono rounded">{hyperparams.numTrees} Trees</span>
                  </div>

                  <div className="flex items-baseline gap-2 relative z-10">
                    <span className="text-4xl font-extrabold text-emerald-400">
                      {Math.round(rfMetrics.accuracy * 100)}%
                    </span>
                    <span className="text-xs text-indigo-200">Test Accuracy</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs relative z-10">
                    <div className="bg-indigo-900/60 p-3 rounded-lg border border-indigo-800/80">
                      <span className="text-indigo-300 font-sans block mb-0.5">Macro F1-Score</span>
                      <span className="font-mono font-bold text-emerald-400">{Math.round(rfMetrics.f1Score * 100)}%</span>
                    </div>
                    <div className="bg-indigo-900/60 p-3 rounded-lg border border-indigo-800/80">
                      <span className="text-indigo-300 font-sans block mb-0.5">Forest stability</span>
                      <span className="font-bold text-emerald-400">Optimal</span>
                    </div>
                  </div>

                  <p className="text-[11px] font-sans text-indigo-300 relative z-10 leading-relaxed">
                    *Features high defense against noise due to bagging. Selected most voted outputs.
                  </p>
                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 font-sans text-xs">
                Click &quot;Compute Splits & Fit Models&quot; to initialize ML training.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Confusion Matrices */}
        {activeTab === 'matrix' && (
          <div className="space-y-6" id="confusion_matrix_tab_view">
            {dtMetrics && rfMetrics ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Decision Tree Confusion Matrix */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-semibold uppercase text-slate-500 tracking-wider">Decision Tree Heatmap Matrix</h4>
                  <p className="text-xs text-slate-400">Shows true patient condition labels versus tree model mappings</p>
                  
                  <div className="overflow-x-auto">
                    <div className="min-w-[320px] bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {/* Matrix Header labels */}
                      <div className="grid grid-cols-7 gap-1 font-mono text-[9px] text-slate-500 text-center font-bold pb-2 border-b border-slate-200">
                        <div>True \ Pred</div>
                        {DISEASE_CLASSES.map(cls => (
                          <div key={cls.classId} title={cls.name}>{cls.shortName}</div>
                        ))}
                      </div>

                      {/* Matrix Grid */}
                      <div className="space-y-1 pt-2 font-mono text-[11px]">
                        {DISEASE_CLASSES.map((trueCls, rIdx) => (
                          <div key={trueCls.classId} className="grid grid-cols-7 gap-1 items-center text-center">
                            <div className="text-left font-bold text-slate-500 truncate text-[9px]">{trueCls.shortName}</div>
                            {DISEASE_CLASSES.map((predCls, cIdx) => {
                              const value = dtMetrics.confusionMatrix[rIdx][cIdx];
                              const maxRowVal = Math.max(...dtMetrics.confusionMatrix[rIdx], 1);
                              const intensity = value / maxRowVal; // scale brightness by matching ratio
                              const isDiagonal = rIdx === cIdx;
                              
                              return (
                                <div 
                                  key={predCls.classId} 
                                  className={`py-2 rounded font-semibold text-xs border ${
                                    isDiagonal 
                                      ? 'bg-indigo-600 text-white' 
                                      : value > 0 
                                        ? 'bg-red-50 text-red-700 border-red-150' 
                                        : 'bg-white text-slate-300 border-slate-100'
                                  }`}
                                  style={{ opacity: isDiagonal ? Math.max(0.4, intensity) : 1 }}
                                >
                                  {value}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Random Forest Confusion Matrix */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-semibold uppercase text-slate-500 tracking-wider">Random Forest Heatmap Matrix</h4>
                  <p className="text-xs text-slate-400">Shows patient condition labels versus forest voted results</p>
                  
                  <div className="overflow-x-auto">
                    <div className="min-w-[320px] bg-indigo-950/5 p-4 rounded-xl border border-indigo-950/10">
                      {/* Matrix Header labels */}
                      <div className="grid grid-cols-7 gap-1 font-mono text-[9px] text-indigo-900/60 text-center font-bold pb-2 border-b border-indigo-950/10">
                        <div>True \ Pred</div>
                        {DISEASE_CLASSES.map(cls => (
                          <div key={cls.classId} title={cls.name}>{cls.shortName}</div>
                        ))}
                      </div>

                      {/* Matrix Grid */}
                      <div className="space-y-1 pt-2 font-mono text-[11px]">
                        {DISEASE_CLASSES.map((trueCls, rIdx) => (
                          <div key={trueCls.classId} className="grid grid-cols-7 gap-1 items-center text-center">
                            <div className="text-left font-bold text-slate-500 truncate text-[9px]">{trueCls.shortName}</div>
                            {DISEASE_CLASSES.map((predCls, cIdx) => {
                              const value = rfMetrics.confusionMatrix[rIdx][cIdx];
                              const maxRowVal = Math.max(...rfMetrics.confusionMatrix[rIdx], 1);
                              const intensity = value / maxRowVal;
                              const isDiagonal = rIdx === cIdx;
                              
                              return (
                                <div 
                                  key={predCls.classId} 
                                  className={`py-2 rounded font-semibold text-xs border ${
                                    isDiagonal 
                                      ? 'bg-emerald-600 text-white' 
                                      : value > 0 
                                        ? 'bg-red-50 text-red-700 border-red-150 font-normal' 
                                        : 'bg-white text-slate-300 border-slate-100 font-normal'
                                  }`}
                                  style={{ opacity: isDiagonal ? Math.max(0.4, intensity) : 1 }}
                                >
                                  {value}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 font-sans text-xs">
                Click &quot;Compute Splits & Fit Models&quot; to initialize ML training.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Feature Importances */}
        {activeTab === 'features' && (
          <div className="space-y-6" id="features_tab_view">
            {dtMetrics && rfMetrics ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-mono font-semibold uppercase text-slate-500 tracking-wider">Split Gini Relevance Score</h4>
                  <p className="text-xs text-slate-400">Measures the predictive capability of clinical parameters during training</p>
                </div>

                <div className="h-80 w-full bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={combinedFeaturesData} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" label={{ value: 'Weighted Split Prevalence %', position: 'insideBottom', offset: -5, style: { fontSize: 10, fill: '#64748b' } }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontFamily: 'serif' }} width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Decision Tree" fill="#6366f1" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="Random Forest" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-4 bg-white border border-slate-150 rounded-xl text-xs font-sans text-slate-500 space-y-2">
                  <p className="font-semibold text-slate-700">How to interpret feature importances:</p>
                  <p className="leading-relaxed">
                    A clinical indicator gets a high score if it is chosen at the root level of multiple trees inside the forest. If a parameter (like <strong>Age</strong> or <strong>Chest Pain Type</strong>) split high subsets of mixed patient cohorts with high Information Gain, it is deemed biologically critical for predicting that subset condition class.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 font-sans text-xs">
                Click &quot;Compute Splits & Fit Models&quot; to initialize ML training.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
