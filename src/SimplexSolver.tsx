import { createSignal, For, createEffect, onMount } from 'solid-js';

interface TableauRow {
  [key: string]: number;
}

interface SimplexIteration {
  iteration: number;
  tableau: TableauRow[];
  pivotRow?: number;
  pivotCol?: string;
  message: string;
}

const LOCAL_STORAGE_KEYS = {
  NUM_VARIABLES: 'simplex_numVariables',
  NUM_CONSTRAINTS: 'simplex_numConstraints',
  OBJECTIVE_COEFFICIENTS: 'simplex_objectiveCoefficients',
  CONSTRAINT_COEFFICIENTS: 'simplex_constraintCoefficients',
  CONSTRAINT_VALUES: 'simplex_constraintValues',
};

export default function SimplexSolver() {
  // Initialize signals with default values first
  const [numVariables, setNumVariables] = createSignal(2);
  const [numConstraints, setNumConstraints] = createSignal(1);
  const [objectiveCoefficients, setObjectiveCoefficients] = createSignal<number[]>(Array(2).fill(0));
  const [constraintCoefficients, setConstraintCoefficients] = createSignal<number[][]>(Array(1).fill(null).map(() => Array(2).fill(0)));
  const [constraintValues, setConstraintValues] = createSignal<number[]>(Array(1).fill(0));

  const [iterations, setIterations] = createSignal<SimplexIteration[]>([]);
  const [optimalValues, setOptimalValues] = createSignal<Record<string, number> | null>(null);

  // Load from localStorage on mount
  onMount(() => {
    const storedNumVariables = localStorage.getItem(LOCAL_STORAGE_KEYS.NUM_VARIABLES);
    const loadedNumVariables = storedNumVariables ? parseInt(storedNumVariables, 10) : 2;
    setNumVariables(loadedNumVariables > 0 ? loadedNumVariables : 2);

    const storedNumConstraints = localStorage.getItem(LOCAL_STORAGE_KEYS.NUM_CONSTRAINTS);
    const loadedNumConstraints = storedNumConstraints ? parseInt(storedNumConstraints, 10) : 1;
    setNumConstraints(loadedNumConstraints > 0 ? loadedNumConstraints : 1);

    try {
      const storedObjective = localStorage.getItem(LOCAL_STORAGE_KEYS.OBJECTIVE_COEFFICIENTS);
      if (storedObjective) {
        const parsed = JSON.parse(storedObjective);
        if (Array.isArray(parsed) && parsed.length === numVariables()) {
          setObjectiveCoefficients(parsed);
        } else {
          setObjectiveCoefficients(Array(numVariables()).fill(0));
        }
      } else {
        setObjectiveCoefficients(Array(numVariables()).fill(0));
      }
    } catch (e) {
      console.error("Error loading objective coefficients:", e);
      setObjectiveCoefficients(Array(numVariables()).fill(0));
    }

    try {
      const storedConstraintCoeff = localStorage.getItem(LOCAL_STORAGE_KEYS.CONSTRAINT_COEFFICIENTS);
      if (storedConstraintCoeff) {
        const parsed = JSON.parse(storedConstraintCoeff);
        if (Array.isArray(parsed) && parsed.length === numConstraints() && (parsed.length === 0 || parsed.every((r: any) => Array.isArray(r) && r.length === numVariables()))) {
          setConstraintCoefficients(parsed);
        } else {
          setConstraintCoefficients(Array(numConstraints()).fill(null).map(() => Array(numVariables()).fill(0)));
        }
      } else {
        setConstraintCoefficients(Array(numConstraints()).fill(null).map(() => Array(numVariables()).fill(0)));
      }
    } catch (e) {
      console.error("Error loading constraint coefficients:", e);
      setConstraintCoefficients(Array(numConstraints()).fill(null).map(() => Array(numVariables()).fill(0)));
    }

    try {
      const storedConstraintVal = localStorage.getItem(LOCAL_STORAGE_KEYS.CONSTRAINT_VALUES);
      if (storedConstraintVal) {
        const parsed = JSON.parse(storedConstraintVal);
        if (Array.isArray(parsed) && parsed.length === numConstraints()) {
          setConstraintValues(parsed);
        } else {
          setConstraintValues(Array(numConstraints()).fill(0));
        }
      } else {
        setConstraintValues(Array(numConstraints()).fill(0));
      }
    } catch (e) {
      console.error("Error loading constraint values:", e);
      setConstraintValues(Array(numConstraints()).fill(0));
    }
  });

  const handleClear = () => {
    const defaultNumVariables = 2;
    const defaultNumConstraints = 1;

    // Update signals to their default states
    setNumVariables(defaultNumVariables);
    setNumConstraints(defaultNumConstraints);

    const defaultObjectiveCoefficients = Array(defaultNumVariables).fill(0);
    const defaultConstraintCoefficients = Array(defaultNumConstraints).fill(null).map(() => Array(defaultNumVariables).fill(0));
    const defaultConstraintValues = Array(defaultNumConstraints).fill(0);

    setObjectiveCoefficients(defaultObjectiveCoefficients);
    setConstraintCoefficients(defaultConstraintCoefficients);
    setConstraintValues(defaultConstraintValues);

    setIterations([]);
    setOptimalValues(null);

    // Explicitly set localStorage to the default values
    localStorage.setItem(LOCAL_STORAGE_KEYS.NUM_VARIABLES, defaultNumVariables.toString());
    localStorage.setItem(LOCAL_STORAGE_KEYS.NUM_CONSTRAINTS, defaultNumConstraints.toString());
    localStorage.setItem(LOCAL_STORAGE_KEYS.OBJECTIVE_COEFFICIENTS, JSON.stringify(defaultObjectiveCoefficients));
    localStorage.setItem(LOCAL_STORAGE_KEYS.CONSTRAINT_COEFFICIENTS, JSON.stringify(defaultConstraintCoefficients));
    localStorage.setItem(LOCAL_STORAGE_KEYS.CONSTRAINT_VALUES, JSON.stringify(defaultConstraintValues));
  };

  // Effects to save to localStorage and resize arrays
  createEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.NUM_VARIABLES, numVariables().toString());
    // Resize objectiveCoefficients
    setObjectiveCoefficients(prev => {
      const next = Array(numVariables()).fill(0);
      for (let i = 0; i < Math.min(prev.length, numVariables()); i++) {
        next[i] = prev[i];
      }
      return next;
    });
    // Resize constraintCoefficients (rows are based on numConstraints, cols on numVariables)
    setConstraintCoefficients(prev => {
      const next = Array(numConstraints()).fill(null).map(() => Array(numVariables()).fill(0));
      for (let i = 0; i < Math.min(prev.length, numConstraints()); i++) {
        for (let j = 0; j < Math.min(prev[i]?.length || 0, numVariables()); j++) {
          next[i][j] = prev[i][j];
        }
      }
      return next;
    });
  });

  createEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.NUM_CONSTRAINTS, numConstraints().toString());
    // Resize constraintCoefficients (rows)
    setConstraintCoefficients(prev => {
      const next = Array(numConstraints()).fill(null).map(() => Array(numVariables()).fill(0));
      for (let i = 0; i < Math.min(prev.length, numConstraints()); i++) {
        for (let j = 0; j < Math.min(prev[i]?.length || 0, numVariables()); j++) {
          next[i][j] = prev[i][j];
        }
      }
      return next;
    });
    // Resize constraintValues
    setConstraintValues(prev => {
      const next = Array(numConstraints()).fill(0);
      for (let i = 0; i < Math.min(prev.length, numConstraints()); i++) {
        next[i] = prev[i];
      }
      return next;
    });
  });

  createEffect(() => {
    // Only save if not the initial empty/default array during setup
    if (objectiveCoefficients().length > 0 || numVariables() === 0) { // check if it has been initialized
        localStorage.setItem(LOCAL_STORAGE_KEYS.OBJECTIVE_COEFFICIENTS, JSON.stringify(objectiveCoefficients()));
    }
  });

  createEffect(() => {
    if (constraintCoefficients().length > 0 || numConstraints() === 0) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.CONSTRAINT_COEFFICIENTS, JSON.stringify(constraintCoefficients()));
    }
  });

  createEffect(() => {
    if (constraintValues().length > 0 || numConstraints() === 0) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.CONSTRAINT_VALUES, JSON.stringify(constraintValues()));
    }
  });

  const handleNumVariablesChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    if (value > 0) {
      setNumVariables(value);
    }
  };

  const handleNumConstraintsChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    if (value > 0) {
      setNumConstraints(value);
    }
  };

  const handleObjectiveChange = (index: number, value: number) => {
    setObjectiveCoefficients(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleConstraintCoeffChange = (rowIndex: number, colIndex: number, value: number) => {
    setConstraintCoefficients(prev => {
      const next = [...prev];
      next[rowIndex] = [...(next[rowIndex] || [])];
      next[rowIndex][colIndex] = value;
      return next;
    });
  };

  const handleConstraintValueChange = (index: number, value: number) => {
    setConstraintValues(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const solve = () => {
    // Basic Simplex Algorithm (Maximization Problem)
    setIterations([]);
    setOptimalValues(null);

    const numVars = numVariables();
    const numCons = numConstraints();

    const tableauWidth = numVars + numCons + 2;
    let currentTableau: TableauRow[] = [];

    for (let i = 0; i < numCons; i++) {
      const row: TableauRow = {};
      for (let j = 0; j < numVars; j++) {
        row[`x${j + 1}`] = constraintCoefficients()[i]?.[j] || 0;
      }
      for (let j = 0; j < numCons; j++) {
        row[`s${j + 1}`] = (i === j) ? 1 : 0;
      }
      row['RHS'] = constraintValues()[i] || 0;
      row['Z'] = 0;
      currentTableau.push(row);
    }

    const objectiveRow: TableauRow = {};
    for (let j = 0; j < numVars; j++) {
      objectiveRow[`x${j + 1}`] = -(objectiveCoefficients()[j] || 0);
    }
    for (let j = 0; j < numCons; j++) {
      objectiveRow[`s${j + 1}`] = 0;
    }
    objectiveRow['RHS'] = 0;
    objectiveRow['Z'] = 1;
    currentTableau.push(objectiveRow);

    addIteration(currentTableau, "Initial Tableau");

    let iterationCount = 0;
    const MAX_ITERATIONS = 50;

    while (iterationCount < MAX_ITERATIONS) {
      iterationCount++;

      const objRow = currentTableau[currentTableau.length - 1];
      let pivotCol: string | undefined = undefined;
      let minObjectiveCoeff = 0;

      Object.keys(objRow).forEach(key => {
        if (key !== 'RHS' && key !== 'Z' && objRow[key] < minObjectiveCoeff) {
          minObjectiveCoeff = objRow[key];
          pivotCol = key;
        }
      });

      if (!pivotCol) {
        addIteration(currentTableau, "Optimal solution found.");
        extractOptimalValues(currentTableau);
        return;
      }

      let pivotRowIndex: number | undefined = undefined;
      let minRatio = Infinity;

      for (let i = 0; i < currentTableau.length - 1; i++) {
        const pivotColValue = currentTableau[i][pivotCol!];
        if (pivotColValue > 0) {
          const ratio = currentTableau[i]['RHS'] / pivotColValue;
          if (ratio >= 0 && ratio < minRatio) {
            minRatio = ratio;
            pivotRowIndex = i;
          }
        }
      }

      if (pivotRowIndex === undefined) {
        addIteration(currentTableau, "Unbounded solution.");
        return;
      }

      addIteration(currentTableau, `Pivot Column: ${pivotCol}, Pivot Row: ${pivotRowIndex + 1}`, pivotRowIndex, pivotCol);

      const pivotElement = currentTableau[pivotRowIndex][pivotCol!];
      const newTableau = currentTableau.map(r => ({ ...r }));

      const pivotRowToNormalize = { ...newTableau[pivotRowIndex] };
      Object.keys(pivotRowToNormalize).forEach(key => {
        newTableau[pivotRowIndex][key] = pivotRowToNormalize[key] / pivotElement;
      });

      for (let i = 0; i < newTableau.length; i++) {
        if (i !== pivotRowIndex) {
          const factor = newTableau[i][pivotCol!];
          const currentRowToUpdate = { ...newTableau[i] };
          const normalizedPivotRow = { ...newTableau[pivotRowIndex] };
          Object.keys(currentRowToUpdate).forEach(key => {
            newTableau[i][key] = currentRowToUpdate[key] - factor * normalizedPivotRow[key];
          });
        }
      }
      currentTableau = newTableau;
    }
    addIteration(currentTableau, "Max iterations reached.");
  };

  const addIteration = (tableau: TableauRow[], message: string, pivotRow?: number, pivotCol?: string) => {
    setIterations(prev => [...prev, {
      iteration: prev.length + 1,
      tableau: tableau.map(row => ({ ...row })),
      pivotRow,
      pivotCol,
      message
    }]);
  };

  const extractOptimalValues = (finalTableau: TableauRow[]) => {
    const values: Record<string, number> = {};
    const numVars = numVariables();
    const numCons = numConstraints();

    for (let j = 0; j < numVars + numCons; j++) {
      const varName = j < numVars ? `x${j + 1}` : `s${j - numVars + 1}`;
      let oneCount = 0;
      let oneRowIndex = -1;
      for (let i = 0; i < finalTableau.length -1; i++) {
        if (Math.abs(finalTableau[i][varName] - 1) < 1e-6) {
          oneCount++;
          oneRowIndex = i;
        } else if (Math.abs(finalTableau[i][varName]) > 1e-6) {
          oneCount = 99;
          break;
        }
      }
      if (oneCount === 1 && oneRowIndex !== -1) {
        values[varName] = finalTableau[oneRowIndex]['RHS'];
      } else {
        values[varName] = 0;
      }
    }
    values['Z'] = finalTableau[finalTableau.length - 1]['RHS'];
    setOptimalValues(values);
  };

  const getTableauHeaders = (tableau: TableauRow[]) => {
    if (!tableau || tableau.length === 0) return [];
    return Object.keys(tableau[0]);
  };

  return (
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Simplex Method Solver</h1>

      <div class="mb-4 p-4 border rounded">
        <h2 class="text-xl mb-2">Problem Setup</h2>
        <div class="grid grid-cols-2 gap-4 mb-2">
          <div>
            <label for="numVariables" class="block text-sm font-medium text-gray-700">Number of Variables (x):</label>
            <input type="number" id="numVariables" value={numVariables()} onInput={handleNumVariablesChange} min="1" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
          </div>
          <div>
            <label for="numConstraints" class="block text-sm font-medium text-gray-700">Number of Constraints:</label>
            <input type="number" id="numConstraints" value={numConstraints()} onInput={handleNumConstraintsChange} min="1" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
          </div>
        </div>

        <h3 class="text-lg mt-3 mb-1">Objective Function (Maximize Z)</h3>
        <div class="flex items-center space-x-2">
          <span>Z =</span>
          <For each={objectiveCoefficients()}>{(coeff, i) =>
            <>
              <input type="number" value={coeff} onInput={(e) => handleObjectiveChange(i(), parseFloat(e.target.value))} class="w-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1" />
              <span>x<sub>{i() + 1}</sub></span>
              {i() < objectiveCoefficients().length - 1 ? <span>+</span> : null}
            </>
          }</For>
        </div>

        <h3 class="text-lg mt-3 mb-1">Constraints</h3>
        <For each={constraintCoefficients()}>{(coeffs, i) =>
          <div class="flex items-center space-x-2 mb-2">
            <For each={coeffs}>{(coeff, j) =>
              <>
                <input type="number" value={coeff} onInput={(e) => handleConstraintCoeffChange(i(), j(), parseFloat(e.target.value))} class="w-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1" />
                <span>x<sub>{j() + 1}</sub></span>
                {j() < coeffs.length - 1 ? <span>+</span> : null}
              </>
            }</For>
            <span>&le;</span>
            <input type="number" value={constraintValues()[i()]} onInput={(e) => handleConstraintValueChange(i(), parseFloat(e.target.value))} class="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1" />
          </div>
        }</For>
      </div> {/* End of Problem Setup div */}

      <div class="my-4 flex space-x-2">
        <button onClick={solve} class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">Solve</button>
        <button onClick={handleClear} class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50">Clear</button>
      </div>

      <For each={iterations()}>{(iter, index) =>
        <div class="mb-6 p-4 border rounded">
          <h3 class="text-lg font-semibold">Iteration {iter.iteration}: {iter.message}</h3>
          <div class="overflow-x-auto mt-2">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <For each={getTableauHeaders(iter.tableau)}>{(header) =>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                  }</For>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <For each={iter.tableau}>{(row, rowIndex) =>
                  <tr class={`${iter.pivotRow === rowIndex() ? 'bg-yellow-100' : ''}`}>
                    <For each={getTableauHeaders(iter.tableau)}>{(header) =>
                      <td class={`px-3 py-2 whitespace-nowrap text-sm ${iter.pivotCol === header && iter.pivotRow === rowIndex() ? 'font-bold text-red-600' : ''}`}>
                        {typeof row[header] === 'number' ? row[header].toFixed(2) : row[header]}
                      </td>
                    }</For>
                  </tr>
                }</For>
              </tbody>
            </table>
          </div>
        </div>
      }</For>

      {optimalValues() && (
        <div class="mt-6 p-4 border rounded bg-green-50">
          <h2 class="text-xl font-bold text-green-700">Optimal Solution Found</h2>
          <For each={Object.entries(optimalValues()!)}>{([key, value]) =>
            <p class="text-md text-green-600">{key}: {typeof value === 'number' ? value.toFixed(2) : value}</p>
          }</For>
        </div>
      )}
    </div>
  );
}
