import { Patient, DecisionTreeModel, DTNode, RandomForestModel, ModelMetrics, DISEASE_CLASSES, Hyperparameters } from '../types';

// Unique ID generator for nodes
let nodeCounter = 0;
const generateNodeId = () => `node_${Date.now()}_${nodeCounter++}`;

/**
 * Generate synthetic patient data with realistic medical distributions
 * according to the clinical correlations of each heart condition.
 * Generates N patients.
 */
export function generateSyntheticDataset(count: number = 150): Patient[] {
  const dataset: Patient[] = [];
  
  for (let i = 0; i < count; i++) {
    // Determine target disease first to draw correlating features
    // 0: CAD, 1: Arrhythmia, 2: Heart Failure, 3: Valve Disease, 4: Cardiomyopathy, 5: Congenital
    const diseaseClass = Math.floor(Math.random() * 6);
    
    let age = 50;
    let gender: 'Male' | 'Female' = Math.random() > 0.5 ? 'Male' : 'Female';
    let bloodPressure = 120;
    let cholesterol = 200;
    let heartRate = 72;
    let ecgResult: 'Normal' | 'ST-T Wave Abnormality' | 'Left Ventricular Hypertrophy' = 'Normal';
    let bloodSugar = 100;
    let chestPain: 'Typical Angina' | 'Atypical Angina' | 'Non-Anginal' | 'Asymptomatic' = 'Asymptomatic';
    let smokingHistory: 'Never' | 'Former' | 'Current' = 'Never';
    let familyHistory: 'Yes' | 'No' = 'No';
    let bmi = 24.5;

    // Helper to add random Gaussian-like variation
    const rn = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const gaussian = (mean: number, stdDev: number) => {
      const u = 1 - Math.random();
      const v = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      return Math.round(mean + z * stdDev);
    };

    switch (diseaseClass) {
      case 0: // CAD (Coronary Artery Disease)
        age = rn(55, 78);
        bloodPressure = gaussian(145, 15);
        cholesterol = gaussian(260, 30);
        heartRate = gaussian(78, 12);
        ecgResult = Math.random() > 0.4 ? 'ST-T Wave Abnormality' : 'Normal';
        bloodSugar = gaussian(125, 20);
        chestPain = Math.random() > 0.3 ? 'Typical Angina' : 'Atypical Angina';
        smokingHistory = Math.random() > 0.4 ? 'Current' : 'Former';
        familyHistory = Math.random() > 0.5 ? 'Yes' : 'No';
        bmi = gaussian(28.5, 4);
        break;

      case 1: // Heart Arrhythmias
        age = rn(35, 70);
        bloodPressure = gaussian(130, 12);
        cholesterol = gaussian(195, 25);
        heartRate = Math.random() > 0.5 ? gaussian(105, 15) : gaussian(48, 8); // Very high or low HR
        ecgResult = 'ST-T Wave Abnormality';
        bloodSugar = gaussian(105, 15);
        chestPain = Math.random() > 0.6 ? 'Atypical Angina' : 'Non-Anginal';
        smokingHistory = Math.random() > 0.6 ? 'Former' : 'Never';
        familyHistory = Math.random() > 0.6 ? 'Yes' : 'No';
        bmi = gaussian(24.0, 3);
        break;

      case 2: // Heart Failure
        age = rn(60, 85);
        bloodPressure = gaussian(155, 20);
        cholesterol = gaussian(220, 35);
        heartRate = gaussian(85, 12);
        ecgResult = Math.random() > 0.3 ? 'Left Ventricular Hypertrophy' : 'ST-T Wave Abnormality';
        bloodSugar = gaussian(140, 30);
        chestPain = 'Asymptomatic'; // often presents as shortness of breath rather than classic chest pain
        smokingHistory = Math.random() > 0.5 ? 'Former' : 'Never';
        familyHistory = Math.random() > 0.3 ? 'Yes' : 'No';
        bmi = gaussian(31.0, 5);
        break;

      case 3: // Heart Valve Disease
        age = rn(45, 75);
        bloodPressure = gaussian(132, 14);
        cholesterol = gaussian(215, 30);
        heartRate = gaussian(78, 10);
        ecgResult = Math.random() > 0.5 ? 'Left Ventricular Hypertrophy' : 'Normal';
        bloodSugar = gaussian(108, 15);
        chestPain = Math.random() > 0.4 ? 'Non-Anginal' : 'Asymptomatic';
        smokingHistory = Math.random() > 0.7 ? 'Former' : 'Never';
        familyHistory = Math.random() > 0.7 ? 'Yes' : 'No';
        bmi = gaussian(26.2, 4.2);
        break;

      case 4: // Cardiomyopathy
        age = rn(30, 65);
        bloodPressure = gaussian(135, 16);
        cholesterol = gaussian(210, 32);
        heartRate = gaussian(82, 14);
        ecgResult = 'Left Ventricular Hypertrophy';
        bloodSugar = gaussian(112, 18);
        chestPain = Math.random() > 0.5 ? 'Atypical Angina' : 'Asymptomatic';
        smokingHistory = Math.random() > 0.7 ? 'Former' : 'Never';
        familyHistory = Math.random() > 0.2 ? 'Yes' : 'No'; // highly genetic
        bmi = gaussian(29.0, 4.5);
        break;

      case 5: // Congenital Heart Defects
        age = rn(5, 32); // much younger
        bloodPressure = gaussian(115, 10);
        cholesterol = gaussian(175, 20);
        heartRate = gaussian(85, 12);
        ecgResult = Math.random() > 0.6 ? 'ST-T Wave Abnormality' : 'Normal';
        bloodSugar = gaussian(92, 12);
        chestPain = Math.random() > 0.6 ? 'Atypical Angina' : 'Asymptomatic';
        smokingHistory = 'Never'; // too young or non-smokers typically
        familyHistory = Math.random() > 0.3 ? 'Yes' : 'No';
        bmi = gaussian(21.8, 3.2);
        break;
    }

    // Constraints and boundaries
    age = Math.max(1, Math.min(100, age));
    bloodPressure = Math.max(80, Math.min(220, bloodPressure));
    cholesterol = Math.max(100, Math.min(450, cholesterol));
    heartRate = Math.max(35, Math.min(180, heartRate));
    bloodSugar = Math.max(50, Math.min(300, bloodSugar));
    bmi = Math.max(12, Math.min(55, Math.round(bmi * 10) / 10));

    dataset.push({
      id: `p_${i + 1}`,
      age,
      gender,
      bloodPressure,
      cholesterol,
      heartRate,
      ecgResult,
      bloodSugar,
      chestPain,
      smokingHistory,
      familyHistory,
      bmi,
      diseaseClass
    });
  }

  return dataset;
}

// -------------------------------------------------------------------
// DECISION TREE IMPLEMENTATION
// -------------------------------------------------------------------

/**
 * Calculates Gini Impurity of a subset of patient classes
 */
function calculateGini(patients: Patient[]): number {
  if (patients.length === 0) return 0;
  const counts: Record<number, number> = {};
  for (const p of patients) {
    counts[p.diseaseClass] = (counts[p.diseaseClass] || 0) + 1;
  }
  
  let sumSquares = 0;
  for (const c in counts) {
    const probability = counts[c] / patients.length;
    sumSquares += probability * probability;
  }
  return 1 - sumSquares;
}

interface SplitResult {
  giniGain: number;
  feature: keyof Omit<Patient, 'id' | 'diseaseClass'>;
  threshold: number | string;
  left: Patient[];
  right: Patient[];
}

/**
 * Finds the best split for a set of patient data, exploring randomized subsets if in RF
 */
function findBestSplit(
  patients: Patient[],
  featuresToConsiderCount?: number
): SplitResult | null {
  if (patients.length <= 1) return null;
  const initialGini = calculateGini(patients);
  if (initialGini === 0) return null; // perfectly pure

  let bestGain = -1;
  let bestSplit: SplitResult | null = null;
  
  // All candidate splits
  const allFeatures: Array<keyof Omit<Patient, 'id' | 'diseaseClass'>> = [
    'age', 'gender', 'bloodPressure', 'cholesterol', 'heartRate',
    'ecgResult', 'bloodSugar', 'chestPain', 'smokingHistory',
    'familyHistory', 'bmi'
  ];

  // Random feature subset sampling (for Random Forest)
  let features = allFeatures;
  if (featuresToConsiderCount && featuresToConsiderCount < allFeatures.length) {
    const shuffled = [...allFeatures].sort(() => 0.5 - Math.random());
    features = shuffled.slice(0, featuresToConsiderCount);
  }

  for (const feature of features) {
    const values = patients.map(p => p[feature]);
    const uniqueValues = Array.from(new Set(values));

    // Try splits
    const isNumerical = typeof values[0] === 'number';

    if (isNumerical) {
      const sortedVals = (uniqueValues as number[]).sort((a, b) => a - b);
      // Test midpoints
      for (let idx = 0; idx < sortedVals.length - 1; idx++) {
        const threshold = (sortedVals[idx] + sortedVals[idx + 1]) / 2;
        const left = patients.filter(p => (p[feature] as number) <= threshold);
        const right = patients.filter(p => (p[feature] as number) > threshold);

        if (left.length === 0 || right.length === 0) continue;

        const leftGini = calculateGini(left);
        const rightGini = calculateGini(right);
        const weightedGini = (left.length / patients.length) * leftGini + (right.length / patients.length) * rightGini;
        const gain = initialGini - weightedGini;

        if (gain > bestGain) {
          bestGain = gain;
          bestSplit = { giniGain: gain, feature, threshold, left, right };
        }
      }
    } else {
      // Categorical string splits: is equals 'value'
      for (const val of uniqueValues as string[]) {
        const left = patients.filter(p => p[feature] === val);
        const right = patients.filter(p => p[feature] !== val);

        if (left.length === 0 || right.length === 0) continue;

        const leftGini = calculateGini(left);
        const rightGini = calculateGini(right);
        const weightedGini = (left.length / patients.length) * leftGini + (right.length / patients.length) * rightGini;
        const gain = initialGini - weightedGini;

        if (gain > bestGain) {
          bestGain = gain;
          bestSplit = { giniGain: gain, feature, threshold: val, left, right };
        }
      }
    }
  }

  return bestSplit;
}

/**
 * Recurses to build decision tree
 */
function buildTreeRecursive(
  patients: Patient[],
  depth: number,
  maxDepth: number,
  minSamplesSplit: number,
  featuresToConsiderCount?: number
): DTNode {
  const nodeGini = calculateGini(patients);
  const samplesCount = patients.length;

  // Track class distribution
  const classDistribution: Record<number, number> = {};
  for (let c = 0; c < 6; c++) classDistribution[c] = 0;
  for (const p of patients) {
    classDistribution[p.diseaseClass]++;
  }

  // Predict the majority class
  let predictionClassId = 0;
  let maxCount = -1;
  for (let c = 0; c < 6; c++) {
    if (classDistribution[c] > maxCount) {
      maxCount = classDistribution[c];
      predictionClassId = c;
    }
  }

  // Base cases: Leaf conditions
  if (
    depth >= maxDepth ||
    samplesCount < minSamplesSplit ||
    nodeGini === 0
  ) {
    return {
      id: generateNodeId(),
      isLeaf: true,
      classDistribution,
      predictionClassId,
      samplesCount,
      depth
    };
  }

  // Find best split
  const split = findBestSplit(patients, featuresToConsiderCount);

  if (!split || split.giniGain <= 0.0001) {
    return {
      id: generateNodeId(),
      isLeaf: true,
      classDistribution,
      predictionClassId,
      samplesCount,
      depth
    };
  }

  // Build standard sub trees
  const leftChild = buildTreeRecursive(split.left, depth + 1, maxDepth, minSamplesSplit, featuresToConsiderCount);
  const rightChild = buildTreeRecursive(split.right, depth + 1, maxDepth, minSamplesSplit, featuresToConsiderCount);

  return {
    id: generateNodeId(),
    isLeaf: false,
    feature: split.feature,
    threshold: split.threshold,
    left: leftChild,
    right: rightChild,
    classDistribution,
    predictionClassId,
    samplesCount,
    depth
  };
}

/**
 * Train a single Decision Tree
 */
export function trainDecisionTree(
  patients: Patient[],
  maxDepth: number = 4,
  minSamplesSplit: number = 2,
  featuresToConsiderCount?: number
): DecisionTreeModel {
  const root = buildTreeRecursive(patients, 0, maxDepth, minSamplesSplit, featuresToConsiderCount);
  
  // Find all distinct features that actually ended up as decision nodes
  const featuresUsedSet = new Set<string>();
  const collectFeatures = (node: DTNode) => {
    if (!node.isLeaf && node.feature) {
      featuresUsedSet.add(node.feature);
      if (node.left) collectFeatures(node.left);
      if (node.right) collectFeatures(node.right);
    }
  };
  collectFeatures(root);

  return {
    root,
    maxDepth,
    minSamplesSplit,
    featuresUsed: Array.from(featuresUsedSet)
  };
}

/**
 * Evaluates node criteria against patient features
 */
export function evaluateNodeCriteria(node: DTNode, patient: Patient): 'left' | 'right' {
  if (node.isLeaf || !node.feature) return 'left';
  
  const val = patient[node.feature];
  const thresh = node.threshold;

  if (typeof val === 'number' && typeof thresh === 'number') {
    return val <= thresh ? 'left' : 'right';
  } else {
    // Categorical split
    return val === thresh ? 'left' : 'right';
  }
}

/**
 * Inference on a single patient via Decision Tree, records the complete node path traversed
 */
export function predictDT(
  model: DecisionTreeModel,
  patient: Omit<Patient, 'id' | 'diseaseClass'> | Patient
): { prediction: number; path: DTNode[]; probabilities: number[] } {
  const path: DTNode[] = [];
  let current = model.root;
  path.push(current);

  // Cast input patient safely so we can evaluate features
  const pt = patient as Patient;

  while (!current.isLeaf) {
    const direction = evaluateNodeCriteria(current, pt);
    if (direction === 'left' && current.left) {
      current = current.left;
    } else if (direction === 'right' && current.right) {
      current = current.right;
    } else {
      break;
    }
    path.push(current);
  }

  // Calc probability array based on the final leaf class distributions
  const probs = new Array(6).fill(0);
  const total = current.samplesCount || 1;
  if (current.classDistribution) {
    for (let c = 0; c < 6; c++) {
      probs[c] = (current.classDistribution[c] || 0) / total;
    }
  } else {
    probs[current.predictionClassId ?? 0] = 1.0;
  }

  return {
    prediction: current.predictionClassId ?? 0,
    path,
    probabilities: probs
  };
}

// -------------------------------------------------------------------
// RANDOM FOREST IMPLEMENTATION
// -------------------------------------------------------------------

/**
 * Train a Random Forest using bagging (bootstrap aggregation)
 */
export function trainRandomForest(
  patients: Patient[],
  hyperparams: Hyperparameters
): RandomForestModel {
  const { numTrees, maxDepth, minSamplesSplit, featureSubsamplingRatio } = hyperparams;
  const trees: DecisionTreeModel[] = [];
  
  // Calculate how many features to draw in each tree division (usually sqrt or customized fraction)
  const totalFeaturesCount = 11; // 11 independent fields
  const subCount = Math.max(1, Math.round(totalFeaturesCount * featureSubsamplingRatio));

  for (let t = 0; t < numTrees; t++) {
    // 1. Bootstrapping: draw samples with replacement of size identical to original dataset
    const bootstrapSamples: Patient[] = [];
    for (let s = 0; s < patients.length; s++) {
      const idx = Math.floor(Math.random() * patients.length);
      bootstrapSamples.push(patients[idx]);
    }

    // 2. Train Decision Tree on bootstrapped samples, restricting splitting to random feature list
    const tree = trainDecisionTree(bootstrapSamples, maxDepth, minSamplesSplit, subCount);
    trees.push(tree);
  }

  return {
    trees,
    numTrees,
    maxDepth,
    featureSubsamplingRatio
  };
}

/**
 * Predictions from Random Forest (agg votes)
 */
export function predictRF(
  model: RandomForestModel,
  patient: Omit<Patient, 'id' | 'diseaseClass'> | Patient
): { prediction: number; votes: number[]; probabilities: number[]; treePredictions: number[] } {
  const treePredictions: number[] = [];
  const votes = new Array(6).fill(0);

  // Poll each tree
  for (const tree of model.trees) {
    const { prediction } = predictDT(tree, patient);
    treePredictions.push(prediction);
    votes[prediction]++;
  }

  // Compute final probabilities
  const totalTrees = model.trees.length;
  const probabilities = votes.map(v => v / totalTrees);

  // Maximum vote winner
  let maxVote = -1;
  let prediction = 0;
  for (let c = 0; c < 6; c++) {
    if (votes[c] > maxVote) {
      maxVote = votes[c];
      prediction = c;
    }
  }

  return {
    prediction,
    votes,
    probabilities,
    treePredictions
  };
}

// -------------------------------------------------------------------
// METRICS GENERATOR
// -------------------------------------------------------------------

/**
 * Calculates extensive Model Accuracy and Confusion Matrix
 */
export function evaluateModel(
  model: DecisionTreeModel | RandomForestModel,
  testPatients: Patient[]
): ModelMetrics {
  const isRF = 'trees' in model;
  
  // Initialize confusion matrix: size 6x6
  const confusionMatrix: number[][] = Array.from({ length: 6 }, () => new Array(6).fill(0));
  let correct = 0;

  for (const p of testPatients) {
    const predictionClassId = isRF 
      ? predictRF(model as RandomForestModel, p).prediction
      : predictDT(model as DecisionTreeModel, p).prediction;
    
    confusionMatrix[p.diseaseClass][predictionClassId]++;
    if (p.diseaseClass === predictionClassId) {
      correct++;
    }
  }

  const accuracy = testPatients.length > 0 ? correct / testPatients.length : 0;

  // Precision and Recall for each class
  const precision = new Array(6).fill(0);
  const recall = new Array(6).fill(0);
  let f1Sum = 0;
  let classesWithData = 0;

  for (let c = 0; c < 6; c++) {
    // Actual occurrences of class `c`
    const actualTotal = confusionMatrix[c].reduce((a, b) => a + b, 0);
    // Predicted occurrences of class `c`
    let predictedTotal = 0;
    for (let row = 0; row < 6; row++) {
      predictedTotal += confusionMatrix[row][c];
    }

    precision[c] = predictedTotal > 0 ? confusionMatrix[c][c] / predictedTotal : 0;
    recall[c] = actualTotal > 0 ? confusionMatrix[c][c] / actualTotal : 0;

    const p = precision[c];
    const r = recall[c];
    const f1 = p + r > 0 ? (2 * p * r) / (p + r) : 0;
    
    if (actualTotal > 0 || predictedTotal > 0) {
      f1Sum += f1;
      classesWithData++;
    }
  }

  const f1Score = classesWithData > 0 ? f1Sum / classesWithData : 0;

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    confusionMatrix
  };
}

/**
 * Returns feature index scores indicating feature relative split importance (frequency/info-gain split-weight)
 */
export function getFeatureImportances(model: DecisionTreeModel | RandomForestModel): Array<{ name: string; score: number }> {
  const relevance: Record<string, number> = {
    age: 0, gender: 0, bloodPressure: 0, cholesterol: 0, heartRate: 0,
    ecgResult: 0, bloodSugar: 0, chestPain: 0, smokingHistory: 0,
    familyHistory: 0, bmi: 0
  };

  const traverse = (node: DTNode) => {
    if (!node.isLeaf && node.feature) {
      // Scale dynamic score by Gini improvement or simply split presence weighted by samples count
      const importanceWeight = Math.log(node.samplesCount + 1);
      relevance[node.feature] = (relevance[node.feature] || 0) + importanceWeight;
      if (node.left) traverse(node.left);
      if (node.right) traverse(node.right);
    }
  };

  if ('trees' in model) {
    // Collect from all trees in Random Forest
    for (const tree of model.trees) {
      traverse(tree.root);
    }
  } else {
    // Single tree
    traverse((model as DecisionTreeModel).root);
  }

  // Normalize scores
  const features = Object.keys(relevance).map(key => ({
    name: key,
    // Add realistic weights for clinical metrics if tree splits are shallow
    score: relevance[key]
  }));

  const totalScore = features.reduce((a, b) => a + b.score, 0) || 1;
  const normalized = features.map(f => ({
    name: translateFeatureName(f.name),
    score: Math.round((f.score / totalScore) * 100)
  }));

  // Sort descending
  return normalized.sort((a, b) => b.score - a.score);
}

/**
 * Translates low-level feature key to patient-friendly clinical field name
 */
export function translateFeatureName(key: string): string {
  switch (key) {
    case 'age': return 'Age';
    case 'gender': return 'Gender';
    case 'bloodPressure': return 'Blood Pressure';
    case 'cholesterol': return 'Cholesterol';
    case 'heartRate': return 'Heart Rate';
    case 'ecgResult': return 'ECG Results';
    case 'bloodSugar': return 'Blood Sugar';
    case 'chestPain': return 'Chest Pain Type';
    case 'smokingHistory': return 'Smoking History';
    case 'familyHistory': return 'Family History';
    case 'bmi': return 'BMI';
    default: return key;
  }
}
