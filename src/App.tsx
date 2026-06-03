import React, { useState, useEffect, useMemo } from 'react';
import { Patient, DecisionTreeModel, RandomForestModel, ModelMetrics, Hyperparameters } from './types';
import { 
  generateSyntheticDataset, 
  trainDecisionTree, 
  trainRandomForest, 
  evaluateModel 
} from './utils/mlEngine';
import DatasetManager from './components/DatasetManager';
import ModelTrainer from './components/ModelTrainer';
import TreeVisualizer from './components/TreeVisualizer';
import PatientDiagnostic from './components/PatientDiagnostic';
import EducationalGuide from './components/EducationalGuide';
import { 
  Activity, Heart, Database, Settings, GitFork, 
  Binary, HelpCircle, LayoutDashboard, BrainCircuit 
} from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<'diagnostics' | 'datasets' | 'training' | 'educate'>('diagnostics');

  // Core Dataset states
  const [patients, setPatients] = useState<Patient[]>([]);

  // Models & Metrics state
  const [dtModel, setDtModel] = useState<DecisionTreeModel | null>(null);
  const [rfModel, setRfModel] = useState<RandomForestModel | null>(null);
  const [dtMetrics, setDtMetrics] = useState<ModelMetrics | null>(null);
  const [rfMetrics, setRfMetrics] = useState<ModelMetrics | null>(null);
  
  // Interactive Custom patient (sliders state representation)
  const [selectedPatient, setSelectedPatient] = useState<Omit<Patient, 'id' | 'diseaseClass'>>({
    age: 65,
    gender: 'Male',
    bloodPressure: 160,
    cholesterol: 280,
    heartRate: 95,
    ecgResult: 'ST-T Wave Abnormality',
    bloodSugar: 130,
    chestPain: 'Typical Angina',
    smokingHistory: 'Current',
    familyHistory: 'Yes',
    bmi: 28.5,
  });

  // Track the tree node path IDs traversed by currently active custom patient
  const [activePathIds, setActivePathIds] = useState<string[]>([]);

  // Simulation loading / training states
  const [isTraining, setIsTraining] = useState(false);

  // Hyperparameters
  const [hyperparams, setHyperparams] = useState<Hyperparameters>({
    maxDepth: 4,
    minSamplesSplit: 2,
    numTrees: 8,
    featureSubsamplingRatio: 0.7,
  });

  // Generate initial cohort and fit both networks on mount
  useEffect(() => {
    const initialDataset = generateSyntheticDataset(150);
    setPatients(initialDataset);
    fitModels(initialDataset, hyperparams);
  }, []);

  // Train / update both models synchronously on a given dataset/hyperparameter state
  const fitModels = (currentPatients: Patient[], currentHyperparams: Hyperparameters) => {
    setIsTraining(true);
    
    // Split dataset into 70% Train and 30% Test
    const shuffled = [...currentPatients].sort(() => 0.5 - Math.random());
    const splitIndex = Math.floor(shuffled.length * 0.7);
    const trainSet = shuffled.slice(0, splitIndex);
    const testSet = shuffled.slice(splitIndex);

    // Train Decision Tree
    const tree = trainDecisionTree(trainSet, currentHyperparams.maxDepth, currentHyperparams.minSamplesSplit);
    // Train Random Forest
    const forest = trainRandomForest(trainSet, currentHyperparams);

    // Evaluate
    const dtEval = evaluateModel(tree, testSet);
    const rfEval = evaluateModel(forest, testSet);

    // Persist
    setDtModel(tree);
    setRfModel(forest);
    setDtMetrics(dtEval);
    setRfMetrics(rfEval);
    
    setIsTraining(false);
  };

  // Callback to retrain triggered by user
  const handleRetrainTrigger = () => {
    fitModels(patients, hyperparams);
  };

  // Callback to regenerate synthetic patients
  const handleRegenerateDataset = (newSize: number) => {
    const freshSet = generateSyntheticDataset(newSize);
    setPatients(freshSet);
    fitModels(freshSet, hyperparams);
  };

  // Callback if patient dataset array gets edited (e.g. addition, deletion)
  const handleUpdatePatients = (newPatientsList: Patient[]) => {
    setPatients(newPatientsList);
    // Re-fit model triggers instantly as the dataset edits to sync splits immediately
    fitModels(newPatientsList, hyperparams);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans" id="app_root">
      
      {/* Top Professional App Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Clinically precise human branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-white border border-red-600 shadow-sm animate-pulse-slow">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-sans font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              Heart Disease Prediction Simulator
            </h1>
            <p className="text-xs text-slate-500">
              Interactive Decision Tree and Random Forest Algorithmic Explorer
            </p>
          </div>
        </div>

        {/* Global tab views switcher */}
        <nav className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 text-xs" id="navigation_tabs">
          <button
            onClick={() => setActiveView('diagnostics')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition ${
              activeView === 'diagnostics' 
                ? 'bg-white text-slate-900 font-bold shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Diagnostics & Tree Traversal
          </button>
          
          <button
            onClick={() => setActiveView('datasets')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition ${
              activeView === 'datasets' 
                ? 'bg-white text-slate-900 font-bold shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Cohort Dataset Manager
          </button>

          <button
            onClick={() => setActiveView('training')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition ${
              activeView === 'training' 
                ? 'bg-white text-slate-900 font-bold shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            Hyperparameters & Heatmaps
          </button>

          <button
            onClick={() => setActiveView('educate')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition ${
              activeView === 'educate' 
                ? 'bg-white text-slate-900 font-bold shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Educational Guide
          </button>
        </nav>
      </header>

      {/* Main Responsive content panels */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-8 select-none">
        
        {/* VIEW 1: PREDICTION DIAGNOSTICS & TRAVERSAL */}
        {activeView === 'diagnostics' && (
          <div className="space-y-8" id="view_diagnostics">
            
            {/* Top Intro Section */}
            <div className="bg-indigo-900 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-md">
              <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-800/40 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-2 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-800 text-indigo-200 font-mono text-[10px] uppercase font-bold rounded-full">
                  <BrainCircuit className="w-3.5 h-3.5 text-indigo-300" />
                  Visual Interactive Sandbox
                </div>
                <h2 className="text-2xl font-serif font-medium tracking-tight">Trace Decisions in Real-Time</h2>
                <p className="max-w-xl text-xs text-indigo-150 leading-relaxed">
                  Modify patient stats using the diagnostic controllers below. Follow the illuminated pathways inside the decision trees to inspect exactly how boundaries generate predictive outputs on specific heart pathologies.
                </p>
              </div>
              <div className="shrink-0 relative z-10 flex flex-col items-center bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 font-mono text-center">
                <span className="text-[10px] text-indigo-200">TRAINING COHORT SIZE:</span>
                <span className="text-2xl font-black text-white">{patients.length}</span>
                <span className="text-[10px] text-indigo-200">Patient Records</span>
              </div>
            </div>

            {/* Layout Diagnostic component */}
            <PatientDiagnostic 
              dtModel={dtModel}
              rfModel={rfModel}
              selectedPatient={selectedPatient}
              onUpdatePatient={setSelectedPatient}
              onTrackPathIds={setActivePathIds}
            />

            {/* Tree SVG Plot Area */}
            <TreeVisualizer 
              dtModel={dtModel}
              rfModel={rfModel}
              selectedPatient={patients[0] ? { ...selectedPatient, id: 'temp', diseaseClass: 0 } : null}
              activePathIds={activePathIds}
            />

          </div>
        )}

        {/* VIEW 2: COHORT DATASET MANAGER */}
        {activeView === 'datasets' && (
          <div id="view_datasets">
            <DatasetManager 
              patients={patients}
              onUpdatePatients={handleUpdatePatients}
              onRegenerateDataset={handleRegenerateDataset}
            />
          </div>
        )}

        {/* VIEW 3: HYPERPARAMETERS & CONFUSION MATRICES HEATMAPS */}
        {activeView === 'training' && (
          <div id="view_training">
            <ModelTrainer 
              hyperparams={hyperparams}
              onUpdateHyperparams={setHyperparams}
              onRetrain={handleRetrainTrigger}
              isTraining={isTraining}
              dtMetrics={dtMetrics}
              rfMetrics={rfMetrics}
              dtModel={dtModel}
              rfModel={rfModel}
            />
          </div>
        )}

        {/* VIEW 4: CONCEPTUAL EDUCATIONAL GUIDE */}
        {activeView === 'educate' && (
          <div id="view_educate">
            <EducationalGuide />
          </div>
        )}

      </main>

      {/* Humble Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 font-sans mt-auto">
        <p>Heart Disease Prediction Simulator — Demonstrating standard clinical Decision Tree and Random Forest bagging models.</p>
        <p className="mt-1 font-mono text-[10px] text-slate-300">Heart Condition Target Categories: Class 0 (CAD) | Class 1 (Arrhythmias) | Class 2 (Heart Failure) | Class 3 (Valve) | Class 4 (Cardiomyopathy) | Class 5 (Congenital Defects)</p>
      </footer>

    </div>
  );
}
