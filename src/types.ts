export interface Patient {
  id: string;
  age: number;
  gender: 'Male' | 'Female';
  bloodPressure: number; // mmHg
  cholesterol: number; // mg/dL
  heartRate: number; // bpm
  ecgResult: 'Normal' | 'ST-T Wave Abnormality' | 'Left Ventricular Hypertrophy';
  bloodSugar: number; // mg/dL
  chestPain: 'Typical Angina' | 'Atypical Angina' | 'Non-Anginal' | 'Asymptomatic';
  smokingHistory: 'Never' | 'Former' | 'Current';
  familyHistory: 'Yes' | 'No';
  bmi: number;
  diseaseClass: number; // 0: CAD, 1: Arrhythmia, 2: Heart Failure, 3: Valve Disease, 4: Cardiomyopathy, 5: Congenital Defects
}

export const DISEASE_CLASSES = [
  { classId: 0, name: 'Coronary Artery Disease (CAD)', shortName: 'CAD', color: '#ef4444', desc: 'Narrowed arteries reduce blood flow, often triggered by age, high cholesterol, smoking, and blood pressure.' },
  { classId: 1, name: 'Heart Arrhythmias', shortName: 'Arrhythmia', color: '#f59e0b', desc: 'Irregular heartbeat conditions, heavily correlated with atypical ECG results and blood pressure abnormalities.' },
  { classId: 2, name: 'Heart Failure', shortName: 'Heart Failure', color: '#3b82f6', desc: 'Inability to pump blood effectively, characterized by high age, extreme heart rates, and high blood pressure.' },
  { classId: 3, name: 'Heart Valve Disease', shortName: 'Valve Disease', color: '#8b5cf6', desc: 'Damaged or dysfunctional heart valves, causing abnormal turbulence and specific ECG irregularities.' },
  { classId: 4, name: 'Cardiomyopathy', shortName: 'Cardiomyopathy', color: '#ec4899', desc: 'Diseased, thickened, or enlarged heart muscle, linked to high blood pressure, irregular ECGs, and elevated BMI.' },
  { classId: 5, name: 'Congenital Heart Defects', shortName: 'Congenital', color: '#10b981', desc: 'Structural heart defects present from birth, often seen in younger demographics with family histories of cardiac conditions.' },
];

export interface ModelMetrics {
  accuracy: number;
  precision: number[];
  recall: number[];
  f1Score: number;
  confusionMatrix: number[][]; // 6x6 matrix
}

export interface DTNode {
  id: string;
  isLeaf: boolean;
  feature?: keyof Omit<Patient, 'id' | 'diseaseClass'>;
  threshold?: number | string;
  leftClassId?: number; // path when <= threshold or equals
  rightClassId?: number; // path when > threshold or not-equals
  left?: DTNode;
  right?: DTNode;
  classDistribution?: Record<number, number>;
  predictionClassId?: number;
  samplesCount: number;
  depth: number;
}

export interface DecisionTreeModel {
  root: DTNode;
  maxDepth: number;
  minSamplesSplit: number;
  featuresUsed: string[];
}

export interface RandomForestModel {
  trees: DecisionTreeModel[];
  numTrees: number;
  maxDepth: number;
  featureSubsamplingRatio: number;
  oobError?: number;
}

export interface Hyperparameters {
  maxDepth: number;
  minSamplesSplit: number;
  numTrees: number;
  featureSubsamplingRatio: number;
}
