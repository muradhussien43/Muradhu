import React, { useState, useMemo } from 'react';
import { Patient, DISEASE_CLASSES } from '../types';
import { translateFeatureName } from '../utils/mlEngine';
import { 
  Database, Plus, RefreshCw, Trash2, Search, Filter, Cpu,
  TrendingUp, BarChart3, Users, ChevronLeft, ChevronRight, Activity
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

interface DatasetManagerProps {
  patients: Patient[];
  onUpdatePatients: (newPatients: Patient[]) => void;
  onRegenerateDataset: (size: number) => void;
}

export default function DatasetManager({ 
  patients, 
  onUpdatePatients, 
  onRegenerateDataset 
}: DatasetManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'table' | 'analytics'>('table');
  const [datasetSize, setDatasetSize] = useState(150);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // New patient modal simulation (simple Form state toggle)
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPatient, setNewPatient] = useState<Omit<Patient, 'id'>>({
    age: 45,
    gender: 'Male',
    bloodPressure: 130,
    cholesterol: 220,
    heartRate: 75,
    ecgResult: 'Normal',
    bloodSugar: 100,
    chestPain: 'Atypical Angina',
    smokingHistory: 'Never',
    familyHistory: 'No',
    bmi: 24.5,
    diseaseClass: 0,
  });

  // Handle adding custom patient records
  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Patient = {
      ...newPatient,
      id: `p_custom_${Date.now()}`
    };
    onUpdatePatients([created, ...patients]);
    setShowAddForm(false);
    // reset form
    setNewPatient({
      age: 45,
      gender: 'Male',
      bloodPressure: 130,
      cholesterol: 220,
      heartRate: 75,
      ecgResult: 'Normal',
      bloodSugar: 100,
      chestPain: 'Atypical Angina',
      smokingHistory: 'Never',
      familyHistory: 'No',
      bmi: 24.5,
      diseaseClass: 0,
    });
  };

  // Handle deleting single patient rows
  const handleDeletePatient = (id: string) => {
    onUpdatePatients(patients.filter(p => p.id !== id));
  };

  // Filtered patient list
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchText = p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.gender.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ecgResult.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.chestPain.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchClass = classFilter === 'all' || p.diseaseClass === parseInt(classFilter);
      return matchText && matchClass;
    });
  }, [patients, searchTerm, classFilter]);

  // Paged list
  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPatients.slice(start, start + PAGE_SIZE);
  }, [filteredPatients, currentPage]);

  const totalPages = Math.ceil(filteredPatients.length / PAGE_SIZE) || 1;

  // Analytics helper metrics
  const classDistData = useMemo(() => {
    const counts = new Array(6).fill(0);
    patients.forEach(p => {
      if (p.diseaseClass >= 0 && p.diseaseClass < 6) {
        counts[p.diseaseClass]++;
      }
    });
    return DISEASE_CLASSES.map(cls => ({
      name: cls.shortName,
      fullName: cls.name,
      value: counts[cls.classId],
      color: cls.color,
    }));
  }, [patients]);

  const featureAveragesByClass = useMemo(() => {
    const stats = DISEASE_CLASSES.map(cls => ({
      name: cls.shortName,
      color: cls.color,
      ageSum: 0,
      bpSum: 0,
      cholSum: 0,
      hrSum: 0,
      count: 0
    }));

    patients.forEach(p => {
      const cls = stats.find(s => s.name === DISEASE_CLASSES[p.diseaseClass]?.shortName);
      if (cls) {
        cls.ageSum += p.age;
        cls.bpSum += p.bloodPressure;
        cls.cholSum += p.cholesterol;
        cls.hrSum += p.heartRate;
        cls.count++;
      }
    });

    return stats.map(s => ({
      name: s.name,
      'Avg Age': s.count > 0 ? Math.round(s.ageSum / s.count) : 0,
      'Avg Blood Pressure': s.count > 0 ? Math.round(s.bpSum / s.count) : 0,
      'Avg Cholesterol': s.count > 0 ? Math.round(s.cholSum / s.count) : 0,
      'Avg Heart Rate': s.count > 0 ? Math.round(s.hrSum / s.count) : 0,
    }));
  }, [patients]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm flex flex-col" id="dataset_manager">
      {/* Top Header Row */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-700">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-sans font-medium text-slate-900 leading-tight">Patient Dataset Explorer</h2>
            <p className="text-xs font-sans text-slate-500 mt-1">
              Active Cohort: <strong className="text-slate-800">{patients.length} records</strong>. Configure inputs and study clinical splits.
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Size Select */}
          <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-slate-50/50">
            <select 
              value={datasetSize} 
              onChange={(e) => setDatasetSize(Number(e.target.value))}
              className="text-xs font-sans text-slate-700 bg-transparent px-2 py-1 outline-none border-none cursor-pointer"
              id="dataset_size_select"
            >
              <option value={100}>100 Profiles</option>
              <option value={150}>150 Profiles</option>
              <option value={250}>250 Profiles</option>
              <option value={400}>400 Profiles</option>
            </select>
            <button 
              onClick={() => {
                onRegenerateDataset(datasetSize);
                setCurrentPage(1);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-sans font-medium bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-700 transition"
              title="Regenerate random patient cohort matching medical criteria"
              id="regen_dataset_btn"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regen Dataset
            </button>
          </div>

          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-sans font-medium shadow-xs transition"
            id="add_patient_btn"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Patient Info
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="px-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setActiveTab('table')}
            className={`px-4 py-2 text-xs font-sans font-medium transition-all ${activeTab === 'table' ? 'border-b-2 border-indigo-600 text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Dataset Table View
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-xs font-sans font-medium transition-all ${activeTab === 'analytics' ? 'border-b-2 border-indigo-600 text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics & Distribution
            </div>
          </button>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          *Gini optimization is recalculated instantly on split updates.
        </div>
      </div>

      {/* Conditional Forms for custom patient add */}
      {showAddForm && (
        <form onSubmit={handleAddPatient} className="m-6 p-5 rounded-xl bg-indigo-50/50 border border-indigo-100/50 space-y-4 shadow-inner" id="add_patient_form">
          <div className="flex justify-between items-center border-b border-indigo-100/40 pb-2">
            <span className="font-sans font-medium text-indigo-950 text-sm flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-600" />
              Insert Custom Heart Patient Profile (Mock Dataset Record)
            </span>
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)} 
              className="text-xs text-indigo-500 hover:text-indigo-800 font-sans"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 font-sans mb-1">Age</label>
              <input 
                type="number" min={1} max={105} required
                value={newPatient.age}
                onChange={(e) => setNewPatient({ ...newPatient, age: Number(e.target.value) })}
                className="w-full bg-white p-1.5 border border-slate-200 rounded"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-sans mb-1">Gender</label>
              <select 
                value={newPatient.gender}
                onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value as 'Male' | 'Female' })}
                className="w-full bg-white p-1.5 border border-slate-200 rounded"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-sans mb-1">BP (mmHg)</label>
              <input 
                type="number" min={80} max={220} required
                value={newPatient.bloodPressure}
                onChange={(e) => setNewPatient({ ...newPatient, bloodPressure: Number(e.target.value) })}
                className="w-full bg-white p-1.5 border border-slate-200 rounded"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-sans mb-1">Cholesterol (mg/dL)</label>
              <input 
                type="number" min={100} max={450} required
                value={newPatient.cholesterol}
                onChange={(e) => setNewPatient({ ...newPatient, cholesterol: Number(e.target.value) })}
                className="w-full bg-white p-1.5 border border-slate-200 rounded"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-sans mb-1">Heart Rate (bpm)</label>
              <input 
                type="number" min={35} max={180} required
                value={newPatient.heartRate}
                onChange={(e) => setNewPatient({ ...newPatient, heartRate: Number(e.target.value) })}
                className="w-full bg-white p-1.5 border border-slate-200 rounded"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-sans mb-1">ECG Result</label>
              <select 
                value={newPatient.ecgResult}
                onChange={(e) => setNewPatient({ ...newPatient, ecgResult: e.target.value as any })}
                className="w-full bg-white p-1.5 border border-slate-200 rounded font-sans text-[11px]"
              >
                <option value="Normal">Normal</option>
                <option value="ST-T Wave Abnormality">ST-T Wave Abnormality</option>
                <option value="Left Ventricular Hypertrophy">Left Ventricular Hypertrophy</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-sans mb-1">Blood Sugar (mg/dL)</label>
              <input 
                type="number" min={50} max={300} required
                value={newPatient.bloodSugar}
                onChange={(e) => setNewPatient({ ...newPatient, bloodSugar: Number(e.target.value) })}
                className="w-full bg-white p-1.5 border border-slate-200 rounded"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-sans mb-1">Chest Pain</label>
              <select 
                value={newPatient.chestPain}
                onChange={(e) => setNewPatient({ ...newPatient, chestPain: e.target.value as any })}
                className="w-full bg-white p-1.5 border border-slate-200 rounded font-sans text-[11px]"
              >
                <option value="Typical Angina">Typical Angina</option>
                <option value="Atypical Angina">Atypical Angina</option>
                <option value="Non-Anginal">Non-Anginal</option>
                <option value="Asymptomatic">Asymptomatic</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-sans mb-1">Smoking History</label>
              <select 
                value={newPatient.smokingHistory}
                onChange={(e) => setNewPatient({ ...newPatient, smokingHistory: e.target.value as any })}
                className="w-full bg-white p-1.5 border border-slate-200 rounded font-sans"
              >
                <option value="Never">Never</option>
                <option value="Former">Former</option>
                <option value="Current">Current</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-sans mb-1">Family History</label>
              <select 
                value={newPatient.familyHistory}
                onChange={(e) => setNewPatient({ ...newPatient, familyHistory: e.target.value as any })}
                className="w-full bg-white p-1.5 border border-slate-200 rounded font-sans"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-sans mb-1">BMI</label>
              <input 
                type="number" step="0.1" min={10} max={60} required
                value={newPatient.bmi}
                onChange={(e) => setNewPatient({ ...newPatient, bmi: Number(e.target.value) })}
                className="w-full bg-white p-1.5 border border-slate-200 rounded"
              />
            </div>
            <div>
              <label className="block text-indigo-600 font-semibold mb-1">Target Disease</label>
              <select 
                value={newPatient.diseaseClass}
                onChange={(e) => setNewPatient({ ...newPatient, diseaseClass: Number(e.target.value) })}
                className="w-full bg-indigo-50 p-1.5 border border-indigo-200 rounded text-indigo-950 font-semibold font-sans text-[11px]"
              >
                {DISEASE_CLASSES.map(cls => (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.shortName} ({cls.classId})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="submit" 
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium font-sans"
            >
              Add Record To Tree Input
            </button>
          </div>
        </form>
      )}

      {/* Tab 1: Patients Table */}
      {activeTab === 'table' && (
        <div className="flex-1 flex flex-col min-h-0" id="dataset_table_tab">
          {/* Filters Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search patient parameters (e.g. Male, ST-T, Normal)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-sans outline-none focus:border-indigo-500 placeholder-slate-400"
                id="search_dataset_input"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={classFilter}
                onChange={(e) => {
                  setClassFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg text-xs font-sans px-3 py-1.5 focus:border-indigo-500"
                id="class_filter_select"
              >
                <option value="all">All Conditions (No Filter)</option>
                {DISEASE_CLASSES.map(cls => (
                  <option key={cls.classId} value={cls.classId}>
                    Class {cls.classId}: {cls.shortName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="patient_records_table">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="py-3 px-4">Patient ID</th>
                  <th className="py-3 px-2">Age / Sex</th>
                  <th className="py-3 px-2">BP (mmHg)</th>
                  <th className="py-3 px-2">Cholesterol</th>
                  <th className="py-3 px-2">HR (bpm)</th>
                  <th className="py-3 px-2">ECG Output</th>
                  <th className="py-3 px-2">BMI</th>
                  <th className="py-3 px-2">Chest Pain</th>
                  <th className="py-3 px-2">Target Label</th>
                  <th className="py-3 px-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-sans">
                {paginatedPatients.length > 0 ? (
                  paginatedPatients.map((p) => {
                    const diseaseCls = DISEASE_CLASSES[p.diseaseClass] || { classId: p.diseaseClass, shortName: 'Unknown', color: '#64748b' };
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500 font-medium">#{p.id.replace('p_', '')}</td>
                        <td className="py-3 px-2">
                          <span className="font-semibold text-slate-800">{p.age}</span>
                          <span className="text-slate-400"> y/o </span>
                          <span className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">{p.gender}</span>
                        </td>
                        <td className="py-3 px-2 font-mono text-slate-700">{p.bloodPressure}</td>
                        <td className="py-3 px-2">
                          <span className="font-mono text-slate-700">{p.cholesterol}</span>
                          <span className="text-[10px] text-slate-400 block">mg/dL</span>
                        </td>
                        <td className="py-3 px-2 font-mono text-slate-700">{p.heartRate}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-block px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium leading-none ${
                            p.ecgResult === 'Normal' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {p.ecgResult === 'Left Ventricular Hypertrophy' ? 'LVH' : p.ecgResult}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-mono text-slate-700">{p.bmi}</td>
                        <td className="py-3 px-2 text-slate-600 truncate max-w-[120px]" title={p.chestPain}>{p.chestPain}</td>
                        <td className="py-3 px-2">
                          <span 
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{ backgroundColor: `${diseaseCls.color}0c`, color: diseaseCls.color, border: `1px solid ${diseaseCls.color}1e` }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: diseaseCls.color }} />
                            {diseaseCls.shortName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button 
                            onClick={() => handleDeletePatient(p.id)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition"
                            title="Delete record from workspace dataset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 font-sans">
                      No patient profiles correspond to matching filters. Try adjusting search string.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination footer */}
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans">
            <div>
              Showing <span className="font-semibold text-slate-700">{Math.min(filteredPatients.length, (currentPage - 1) * PAGE_SIZE + 1)}</span> to{' '}
              <span className="font-semibold text-slate-700">{Math.min(filteredPatients.length, currentPage * PAGE_SIZE)}</span> of{' '}
              <span className="font-semibold text-slate-700">{filteredPatients.length}</span> patient cases
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3">Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Analytics & Distributions */}
      {activeTab === 'analytics' && (
        <div className="p-6 space-y-6" id="dataset_analytics_tab">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Pie chart of distribution */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col justify-between" id="pie_chart_box">
              <div>
                <h4 className="text-xs font-mono font-medium uppercase text-slate-500 tracking-wider mb-1">Target Class Representation</h4>
                <p className="text-xs text-slate-400 mb-4">Patient prevalence ratios in current diagnostic set</p>
              </div>

              <div className="h-64 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classDistData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {classDistData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg border border-slate-800 shadow-md">
                              <p className="font-semibold" style={{ color: data.color }}>{data.fullName}</p>
                              <p className="font-mono mt-1">Cases: {data.value} ({Math.round(data.value / patients.length * 100)}%)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Central Stat */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold font-sans text-slate-800">{patients.length}</span>
                  <span className="text-[10px] text-slate-400 font-mono">TOTAL PATIENTS</span>
                </div>
              </div>

              {/* Legends */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4 text-[11px] font-sans">
                {classDistData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="truncate font-semibold text-slate-800">{entry.name}:</span>
                    <span className="font-mono text-slate-500">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Averages comparison */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col justify-between" id="bar_chart_box">
              <div>
                <h4 className="text-xs font-mono font-medium uppercase text-slate-500 tracking-wider mb-1">Risk Indicator Analysis</h4>
                <p className="text-xs text-slate-400 mb-4">Average cholesterol of patients across core disease outputs (mg/dL)</p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={featureAveragesByClass} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                    <YAxis label={{ value: 'Cholesterol (mg/dL)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: '#64748b' } }} tick={{ fontSize: 11 }} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white border border-slate-200 p-2 text-xs rounded-xl shadow-lg">
                              <p className="font-semibold text-slate-800 mb-1">{payload[0].payload.name}</p>
                              {payload.map((p) => (
                                <p key={p.name} className="font-mono" style={{ color: p.color }}>
                                  {p.name}: <span className="font-semibold text-slate-900">{p.value}</span>
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="Avg Cholesterol" radius={[4, 4, 0, 0]}>
                      {featureAveragesByClass.map((entry, index) => {
                        const origCls = DISEASE_CLASSES[index] || { color: '#6366f1' };
                        return <Cell key={`cell-${index}`} fill={origCls.color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 p-3 bg-white border border-slate-150 rounded-lg text-xs font-sans text-slate-500 leading-relaxed">
                <strong>Gini Impurity Signal:</strong> You will notice Coronary Artery Disease (CAD) and Heart Failure models are biased towards higher cholesterol distributions, meaning that features relative to high cholesterol serve as highly optimal root branches.
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
