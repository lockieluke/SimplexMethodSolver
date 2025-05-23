# Simplex Method Solver (SolidJS)

**This project makes use of GitHub Copilot with Gemini 2.5 Pro**

This project is an interactive Simplex Method solver built with SolidJS and TypeScript. It allows users to input a linear programming problem (maximization), and it displays each iteration of the Simplex algorithm, including the tableau, pivot element, and the final optimal solution.

## Project Setup

This project was bootstrapped using `bun create solid . --typescript`.

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js and npm/yarn if you prefer to adapt the commands)

### Installation

1.  **Clone the repository (if applicable) or ensure you are in the project directory.**
2.  **Install dependencies:**
    ```bash
    bun install
    ```

## Available Scripts

In the project directory, you can run:

### `bun dev` or `npm run dev` or `yarn dev`

Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal) to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

### `bun run build` or `npm run build` or `yarn build`

Builds the app for production to the `dist` folder.
It correctly bundles SolidJS in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
Your app is ready to be deployed!

## Features

-   **Dynamic Input**: Specify the number of variables and constraints.
-   **Objective Function Input**: Enter coefficients for the maximization objective function.
-   **Constraint Input**: Enter coefficients and RHS values for less-than-or-equal-to constraints.
-   **Step-by-Step Iterations**: View the Simplex tableau at each step, including:
    -   Initial tableau.
    -   Pivot column and pivot row highlighting.
    -   Normalized pivot row.
    -   Updated tableau after each pivot operation.
-   **Optimal Solution**: Displays the optimal values for the decision variables and the objective function (Z) once the algorithm converges.
-   **Messages**: Provides messages for the current state (e.g., "Optimal solution found," "Unbounded solution," "Max iterations reached").

## How to Use

1.  Open the application in your browser.
2.  Set the number of decision variables and constraints for your linear programming problem.
3.  Enter the coefficients for your objective function (the application assumes a maximization problem).
4.  Enter the coefficients and the right-hand side (RHS) values for each constraint (currently assumes all constraints are of the type `<=`).
5.  Click the "Solve" button.
6.  Observe the iterations, with each tableau displayed.
7.  The optimal values will be shown at the end if a solution is found.

## Implementation Details

-   **Framework**: SolidJS
-   **Language**: TypeScript
-   **Build Tool**: Vite (managed via Bun scripts)
-   **Styling**: Basic Tailwind CSS (via `index.css` and utility classes in the component).

### Simplex Algorithm Notes

-   The current implementation is for standard maximization problems with all constraints of the type `<=`.
-   It uses slack variables to convert inequalities to equalities.
-   The pivot selection rules are:
    -   **Pivot Column**: The column with the most negative coefficient in the objective function row (Z-row).
    -   **Pivot Row**: The row with the minimum non-negative ratio of the RHS value to the positive coefficient in the pivot column.
-   Error handling for degenerate cases, cycling, or infeasibility might be basic. Further enhancements could be added.

## Future Enhancements

-   Support for minimization problems.
-   Handling of different types of constraints (e.g., `>=`, `=`).
-   Implementation of the Two-Phase Simplex method or Big M method for problems with artificial variables.
-   More robust error handling and detection of special cases (infeasibility, multiple optimal solutions).
-   Improved UI/UX, potentially with graphical representations.
-   Input validation.
