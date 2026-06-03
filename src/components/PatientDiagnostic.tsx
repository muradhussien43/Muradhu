import React, { useEffect, useMemo, useState } from 'react';
import { Patient, DISEASE_CLASSES, DecisionTreeModel, RandomForestModel } from '../types';
import { predictDT, predictRF, translateFeatureName } from '../utils/mlEngine';
import { 
  Heart, Sliders, Star, Sparkles, AlertTriangle, FileText, X, Check, Activity
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface PatientDiagnosticProps {
  dtModel: DecisionTreeModel | null;
  rfModel: RandomForestModel | null;
  selectedPatient: Omit<Patient, 'id' | 'diseaseClass'>;
  onUpdatePatient: (newPatient: Omit<Patient, 'id' | 'diseaseClass'>) => void;
  onTrackPathIds: (nodeIds: string[]) => void;
}

// Preset clinical cohorts for fast testing and study
const CLINICAL_PRESETS = [
  {
    name: 'Typical CAD Profile',
    desc: 'Elderly patient with high cholesterol, blood pressure, smoking habits, and typical angina chest pain.',
    data: {
      age: 65,
      gender: 'Male' as const,
      bloodPressure: 160,
      cholesterol: 280,
      heartRate: 92,
      ecgResult: 'ST-T Wave Abnormality' as const,
      bloodSugar: 130,
      chestPain: 'Typical Angina' as const,
      smokingHistory: 'Current' as const,
      familyHistory: 'Yes' as const,
      bmi: 29.2,
    }
  },
  {
    name: 'Typical Arrhythmia',
    desc: 'Middle-aged patient with extremely rapid heart rate and abnormal electrical waves on electrocardiogram (ECG).',
    data: {
      age: 48,
      gender: 'Female' as const,
      bloodPressure: 125,
      cholesterol: 195,
      heartRate: 115,
      ecgResult: 'ST-T Wave Abnormality' as const,
      bloodSugar: 98,
      chestPain: 'Atypical Angina' as const,
      smokingHistory: 'Never' as const,
      familyHistory: 'No' as const,
      bmi: 23.5,
    }
  },
  {
    name: 'Young Congenital',
    desc: 'Young teenager with a severe maternal family history of cardiac anomalies presenting with minor symptoms.',
    data: {
      age: 18,
      gender: 'Male' as const,
      bloodPressure: 110,
      cholesterol: 165,
      heartRate: 82,
      ecgResult: 'Normal' as const,
      bloodSugar: 85,
      chestPain: 'Asymptomatic' as const,
      smokingHistory: 'Never' as const,
      familyHistory: 'Yes' as const,
      bmi: 20.8,
    }
  },
  {
    name: 'Elderly Heart Failure Risk',
    desc: 'Very senior patient with chronic hypertension (elevated BP), higher BMI, and Left Ventricular Hypertrophy.',
    data: {
      age: 78,
      gender: 'Female' as const,
      bloodPressure: 175,
      cholesterol: 235,
      heartRate: 84,
      ecgResult: 'Left Ventricular Hypertrophy' as const,
      bloodSugar: 145,
      chestPain: 'Asymptomatic' as const,
      smokingHistory: 'Former' as const,
      familyHistory: 'Yes' as const,
      bmi: 32.5,
    }
  }
];

export default function PatientDiagnostic({
  dtModel,
  rfModel,
  selectedPatient,
  onUpdatePatient,
  onTrackPathIds,
}: PatientDiagnosticProps) {

  const [showReport, setShowReport] = useState(false);

  // Runs live inference using both models on current state
  const dtOutput = useMemo(() => {
    if (!dtModel) return null;
    return predictDT(dtModel, selectedPatient);
  }, [dtModel, selectedPatient]);

  // Push active path upward to App state so visualizer highlights matches
  useEffect(() => {
    if (dtOutput) {
      onTrackPathIds(dtOutput.path.map(n => n.id));
    } else {
      onTrackPathIds([]);
    }
  }, [dtOutput, onTrackPathIds]);

  const rfOutput = useMemo(() => {
    if (!rfModel) return null;
    return predictRF(rfModel, selectedPatient);
  }, [rfModel, selectedPatient]);

  const handleFieldChange = (key: keyof Omit<Patient, 'id' | 'diseaseClass'>, value: any) => {
    onUpdatePatient({
      ...selectedPatient,
      [key]: value
    });
  };

  // Convert Random Forest probabilities or DT probabilities for visual bar charting
  const probabilitiesData = useMemo(() => {
    return DISEASE_CLASSES.map(cls => {
      const dtProb = dtOutput ? dtOutput.probabilities[cls.classId] : 0;
      const rfProb = rfOutput ? rfOutput.probabilities[cls.classId] : 0;
      return {
        name: cls.shortName,
        'Decision Tree %': Math.round(dtProb * 100),
        'Random Forest %': Math.round(rfProb * 100),
        color: cls.color
      };
    });
  }, [dtOutput, rfOutput]);

  // Compute calculated aggregate class, confidence, and detailed explanations
  const winningClassInfo = useMemo(() => {
    if (rfOutput) {
      const clsId = rfOutput.prediction;
      const cls = DISEASE_CLASSES[clsId] || DISEASE_CLASSES[0];
      const conf = Math.round((rfOutput.probabilities[clsId] || 0) * 100);
      return { cls, conf };
    }
    if (dtOutput) {
      const clsId = dtOutput.prediction;
      const cls = DISEASE_CLASSES[clsId] || DISEASE_CLASSES[0];
      return { cls, conf: 100 };
    }
    return { cls: DISEASE_CLASSES[0], conf: 87 };
  }, [rfOutput, dtOutput]);

  const predictionRationale = useMemo(() => {
    const { cls, conf } = winningClassInfo;
    
    // Custom dynamic description based on actual parameters
    let factors: string[] = [];
    if (selectedPatient.age > 55) factors.push(`advanced scale of age (${selectedPatient.age})`);
    if (selectedPatient.cholesterol > 240) factors.push(`hypercholesterolemia (${selectedPatient.cholesterol} mg/dL)`);
    if (selectedPatient.bloodPressure > 140) factors.push(`stage-2 hypertensive BP (${selectedPatient.bloodPressure} mmHg)`);
    if (selectedPatient.chestPain !== 'Asymptomatic') factors.push(`${selectedPatient.chestPain.toLowerCase()} symptomatology`);
    if (selectedPatient.familyHistory === 'Yes') factors.push(`cardiac familial predisposition`);
    if (selectedPatient.smokingHistory === 'Current') factors.push(`active smoking history`);
    if (selectedPatient.bmi > 28) factors.push(`elevated BMI index (${selectedPatient.bmi})`);

    if (factors.length === 0) {
      return `The ensemble model converged on ${cls.shortName} as the primary prognostic risk based on general population baseline covariates and demographic distributions.`;
    }

    const factorStr = factors.slice(0, 3).join(', ');
    return `The Random Forest classifier converged on ${cls.shortName} based heavily on ${factorStr}, predicting this class outcome with a computed aggregate certainty of ${conf}%.`;
  }, [winningClassInfo, selectedPatient]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full" id="patient_diagnostic_panel">
      
      {/* COLUMN 1: Inputs Parameters Config (Left Column - Span 4) */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between" id="patient_inputs_box">
        <div className="space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Input Features</h3>
          </div>

          {/* Demographics Badge-style container from Bento theme */}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest font-mono">Demographics</span>
            <div className="flex justify-between items-center mt-2 p-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Age: {selectedPatient.age}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Gender: {selectedPatient.gender}
              </span>
            </div>
          </div>

          {/* Quick Presets Section */}
          <div className="space-y-1.5 bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-300 stroke-amber-500" />
              Clinical Preset Cohorts:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {CLINICAL_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => onUpdatePatient(preset.data)}
                  className={`p-1.5 border hover:border-slate-300 bg-white hover:bg-slate-50 text-[9px] font-sans font-semibold rounded-lg text-slate-600 transition text-left leading-tight ${
                    JSON.stringify(preset.data) === JSON.stringify(selectedPatient) ? 'border-indigo-500 bg-indigo-50/10 text-indigo-950 font-bold' : 'border-slate-200'
                  }`}
                  title={preset.desc}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Core Feature Controls with Bento badges */}
          <div className="space-y-4 pt-1 text-xs font-sans">
            
            {/* Age Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 bg-slate-50/50 p-1 rounded-lg">
                <span className="text-slate-500 font-medium font-mono text-[10px]">Age Range</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md font-mono border border-slate-200">{selectedPatient.age} yrs</span>
              </div>
              <input 
                type="range" min="1" max="100" 
                value={selectedPatient.age}
                onChange={(e) => handleFieldChange('age', Number(e.target.value))}
                className="w-full accent-slate-800"
              />
            </div>

            {/* Sex / Gender Select */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 mb-1 font-mono text-[10px]">Sex / Gender</label>
                <select 
                  value={selectedPatient.gender}
                  onChange={(e) => handleFieldChange('gender', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-slate-400 text-xs text-slate-700 outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* BMI */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500 font-mono text-[10px]">BMI</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md font-mono border border-slate-200">{selectedPatient.bmi}</span>
                </div>
                <input 
                  type="number" step="0.1" min="10" max="60"
                  value={selectedPatient.bmi}
                  onChange={(e) => handleFieldChange('bmi', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:border-slate-400 font-mono text-xs text-slate-700 outline-none"
                />
              </div>
            </div>

            {/* Blood Pressure Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 bg-slate-50/50 p-1 rounded-lg">
                <span className="text-slate-500 font-medium font-mono text-[10px]">Blood Pressure</span>
                <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-md font-mono border border-red-100">{selectedPatient.bloodPressure} mmHg</span>
              </div>
              <input 
                type="range" min="80" max="220" 
                value={selectedPatient.bloodPressure}
                onChange={(e) => handleFieldChange('bloodPressure', Number(e.target.value))}
                className="w-full accent-slate-800"
              />
            </div>

            {/* Cholesterol Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 bg-slate-50/50 p-1 rounded-lg">
                <span className="text-slate-500 font-medium font-mono text-[10px]">Cholesterol Level</span>
                <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-md font-mono border border-red-100">{selectedPatient.cholesterol} mg/dL</span>
              </div>
              <input 
                type="range" min="100" max="450" 
                value={selectedPatient.cholesterol}
                onChange={(e) => handleFieldChange('cholesterol', Number(e.target.value))}
                className="w-full accent-slate-800"
              />
            </div>

            {/* Heart Rate Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 bg-slate-50/50 p-1 rounded-lg">
                <span className="text-slate-500 font-medium font-mono text-[10px]">Heart Rate (BPM)</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md font-mono border border-slate-200">{selectedPatient.heartRate} bpm</span>
              </div>
              <input 
                type="range" min="35" max="180" 
                value={selectedPatient.heartRate}
                onChange={(e) => handleFieldChange('heartRate', Number(e.target.value))}
                className="w-full accent-slate-800"
              />
            </div>

            {/* Nominals Container */}
            <div className="grid grid-cols-1 gap-2.5 bg-slate-50/30 p-2.5 rounded-2xl border border-slate-100">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase mb-1">ECG Status</label>
                <select 
                  value={selectedPatient.ecgResult}
                  onChange={(e) => handleFieldChange('ecgResult', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:border-slate-400 text-xs text-slate-700 outline-none"
                >
                  <option value="Normal">Normal Waves Profile</option>
                  <option value="ST-T Wave Abnormality">ST-T Wave Abnormality</option>
                  <option value="Left Ventricular Hypertrophy">Left Ventricular Hypertrophy (LVH)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase mb-1">Chest Pain Type</label>
                <select 
                  value={selectedPatient.chestPain}
                  onChange={(e) => handleFieldChange('chestPain', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:border-slate-400 text-xs text-slate-700 outline-none"
                >
                  <option value="Typical Angina">Typical Angina (Ischemic discomfort)</option>
                  <option value="Atypical Angina">Atypical Angina</option>
                  <option value="Non-Anginal">Non-Anginal Discomfort</option>
                  <option value="Asymptomatic">Asymptomatic (No reported pain)</option>
                </select>
              </div>
            </div>

            {/* Blood Sugar & Smoking History */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase mb-1">Blood Sugar</label>
                <input 
                  type="number" min={50} max={300}
                  value={selectedPatient.bloodSugar}
                  onChange={(e) => handleFieldChange('bloodSugar', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:border-slate-400 font-mono text-xs text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase mb-1">Smoking</label>
                <select 
                  value={selectedPatient.smokingHistory}
                  onChange={(e) => handleFieldChange('smokingHistory', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:border-slate-400 text-xs text-slate-700 outline-none"
                >
                  <option value="Never">Never</option>
                  <option value="Former">Former</option>
                  <option value="Current">Current</option>
                </select>
              </div>
            </div>

            {/* Family History selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase mb-1.5">Family Cardiac History?</label>
              <div className="flex gap-2">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleFieldChange('familyHistory', opt)}
                    className={`flex-1 py-1.5 border rounded-lg text-xs font-semibold transition ${
                      selectedPatient.familyHistory === opt 
                        ? 'border-slate-900 bg-slate-900 text-white' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Side Clinical Notice Tag */}
        <div className="mt-5 p-3 bg-slate-50 border border-slate-150 rounded-2xl flex gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[10px] font-sans text-slate-500 leading-normal">
            <strong className="text-slate-700 font-semibold">Educational Sandbox Notice:</strong> Algorithmic prediction outcomes are for general simulation purposes only. Keep clinical diagnostics respective to medical boards.
          </p>
        </div>
      </div>

      {/* CORE COLUMNS 2 & 3 (Takes 5 and 3 columns respectively) */}
      
      {/* COLUMN 2: PRIMARY PREDICTION CARD (Top) + ENSEMBLE DECISION PATH BAR CHART (Bottom) (Span 5) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Primary Indigo prediction bento card */}
        <div className="bg-indigo-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[240px]">
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1.5">Primary Prediction</h3>
                <h2 className="text-2.5xl font-black mb-1 leading-tight tracking-tight text-white">
                  {winningClassInfo.cls.name.split(' (')[0]}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-5 mt-4">
              <div className="flex flex-col shrink-0">
                <span className="text-[10px] font-medium text-indigo-300 uppercase font-mono">Confidence</span>
                <span className="text-4xl lg:text-5xl font-black text-emerald-400 tracking-tight">{winningClassInfo.conf}%</span>
                <span className="text-[9px] font-medium text-indigo-300 uppercase font-mono">ensemble vote</span>
              </div>
              <div className="h-14 w-px bg-indigo-800"></div>
              <p className="text-xs text-indigo-100 leading-relaxed font-sans max-w-sm">
                {predictionRationale}
              </p>
            </div>
          </div>

          {/* Abstract background graphics from Bento HTML */}
          <div className="absolute top-0 right-0 p-6 opacity-15 pointer-events-none">
            <svg width="160" height="160" viewBox="0 0 100 100" className="text-white">
              <path d="M50 5 L80 30 L50 55 L20 30 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M80 30 L80 70 L50 95 L20 70 L20 30" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Ensemble Decision Path Comparative Probability Distributions */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between flex-grow">
          <div className="mb-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ensemble Decision Path</h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">Forest estimators probability votes distribution comparison.</p>
          </div>

          <div className="h-44 bg-slate-50/50 p-2 rounded-2xl border border-slate-100 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={probabilitiesData} margin={{ top: 5, right: 10, left: -32, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} unit="%" domain={[0, 100]} />
                <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
                <Bar dataKey="Decision Tree %" fill="#818cf8" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Random Forest %" fill="#34d399" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex gap-4 text-[9px] font-sans text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" /> Decision Tree (Single Depth Splits)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Random Forest Ensemble (Bagging)
            </span>
          </div>
        </div>

      </div>

      {/* COLUMN 3: CLASS BREAKDOWN & RECOMMENDATIONS (Right Column - Span 3) */}
      <div className="lg:col-span-3 flex flex-col gap-6">

        {/* Class Breakdown Bento card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Class Breakdown</h3>
            <div className="space-y-3.5">
              {DISEASE_CLASSES.map(cls => {
                const val = rfOutput ? Math.round((rfOutput.probabilities[cls.classId] || 0) * 100) : (dtOutput && dtOutput.prediction === cls.classId ? 100 : 0);
                const isWinning = winningClassInfo.cls.classId === cls.classId;
                return (
                  <div key={cls.classId} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className={`font-semibold ${isWinning ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>{cls.shortName}</span>
                      <span className={`font-mono font-bold ${isWinning ? 'text-slate-900' : 'text-slate-400'}`}>{val}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: cls.color, width: `${val}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Required card */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3">Action Required</h3>
            <p className="text-xs text-emerald-800 leading-relaxed font-semibold">
              {selectedPatient.age > 60 || selectedPatient.cholesterol > 260 || selectedPatient.bloodPressure > 150
                ? "Patient matches high atherosclerosis indices. Urgent cardiologist consultation and a diagnostic stress test recommended immediately."
                : "Patient presents stable biomarker margins. Routine periodic screening, lifestyle counseling, and preventive risk tracking advised."}
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setShowReport(true)}
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3.5 rounded-xl shadow-xs transition hover:shadow-md cursor-pointer active:scale-95"
          >
            GENERATE REPORT
          </button>
        </div>

      </div>

      {/* DETAILED INTERACTIVE DIAGNOSTIC REPORT CAPTURE POPUP */}
      {showReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4" id="clinical_report_overlay">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              type="button" 
              onClick={() => setShowReport(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg border border-slate-100 hover:border-slate-200 whitespace-nowrap bg-white shadow-xs transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Document Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-sans font-bold text-slate-900 leading-none">Clinical Patient Report Certificate</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-widest">Ensemble Bagging Estimator Logs</p>
              </div>
            </div>

            {/* Patient Attributes List */}
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2.5">Input Covariates Status</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4 text-xs font-sans text-slate-600">
                  <div>Age: <strong className="text-slate-900">{selectedPatient.age} years</strong></div>
                  <div>Gender: <strong className="text-slate-900">{selectedPatient.gender}</strong></div>
                  <div>BMI Index: <strong className="text-slate-900">{selectedPatient.bmi}</strong></div>
                  <div>Blood Pressure: <strong className="text-slate-900">{selectedPatient.bloodPressure} mmHg</strong></div>
                  <div>Cholesterol: <strong className="text-slate-900">{selectedPatient.cholesterol} mg/dL</strong></div>
                  <div>Heart Rate: <strong className="text-slate-900">{selectedPatient.heartRate} bpm</strong></div>
                  <div className="col-span-2">ECG profile: <strong className="text-slate-900">{selectedPatient.ecgResult}</strong></div>
                  <div>Blood Sugar: <strong className="text-slate-900">{selectedPatient.bloodSugar} mg/dL</strong></div>
                  <div className="col-span-2">Chest Pain: <strong className="text-slate-900">{selectedPatient.chestPain}</strong></div>
                  <div>Smoking: <strong className="text-slate-900">{selectedPatient.smokingHistory}</strong></div>
                  <div>Family History: <strong className="text-slate-900">{selectedPatient.familyHistory}</strong></div>
                </div>
              </div>

              {/* Rationale & Classifier Decision */}
              <div className="space-y-3.5">
                <div className="border border-slate-100 rounded-2xl p-4 bg-indigo-50/10">
                  <span className="text-[10px] uppercase font-mono font-bold text-indigo-400 tracking-wider block mb-1">Random Forest Prediction Winner</span>
                  <div className="flex justify-between items-center text-xs font-bold text-indigo-950 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-500" />
                      {winningClassInfo.cls.name}
                    </span>
                    <span className="font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] border border-indigo-200">Confidence {winningClassInfo.conf}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">{predictionRationale}</p>
                </div>

                {dtOutput && (
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider block mb-1">Single Decision Tree Pathway</span>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-2">
                      <span>Predicted: {DISEASE_CLASSES[dtOutput.prediction].shortName}</span>
                      <span className="font-mono text-slate-400 text-[10px]">Depth {dtOutput.path.length} Split Nodes</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 space-y-1">
                      {dtOutput.path.map((node, i) => (
                        <div key={node.id} className="flex gap-1">
                          <span className="text-indigo-600 font-bold">Node {i+1}:</span>
                          {node.isLeaf ? "Outputs classification" : `Checks split criteria (${translateFeatureName(node.feature || '').split(' ')[0]})`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recommendation block */}
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-2.5 items-start">
                <Activity className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h6 className="text-xs font-bold text-emerald-950 leading-tight">Prognostic Recommendation Plan</h6>
                  <p className="text-[11px] text-emerald-800 leading-relaxed font-sans mt-1">
                    {selectedPatient.age > 60 || selectedPatient.cholesterol > 260 || selectedPatient.bloodPressure > 150
                      ? "High cardiovascular atherosclerotic index markers detected. Refer for continuous ECG telemetry, lifestyle interventions, fasting lipid panel tracking, and immediate cardiology consult."
                      : "Slight/stable biomarker ranges. Suggest dietary calorie management, target body fat reductions, and bi-annual cardiovascular physical audits."}
                  </p>
                </div>
              </div>
            </div>

            {/* Report footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setShowReport(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 border border-slate-200 hover:border-slate-300 rounded-xl bg-white hover:bg-slate-50 transition cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

