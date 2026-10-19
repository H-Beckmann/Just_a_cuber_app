declare module 'cubejs' {
  interface CubeInstance {
    solve(maxDepth?: number): string | null;
    isSolved(): boolean;
    /** Applies a sequence in standard notation. */
    move(moves: string): CubeInstance;
    /** The 54 facelets in URFDLB order. */
    asString(): string;
  }

  interface CubeStatic {
    new (): CubeInstance;
    /** Precomputed tables can be assigned instead of built at runtime. */
    moveTables: Record<string, unknown>;
    pruningTables: Record<string, unknown>;
    /** Builds the pruning tables for the two-phase solver. Blocking. */
    initSolver(): void;
    /** A cube in a uniformly random state. */
    random(): CubeInstance;
    /** Random-state scramble, as a sequence in standard notation. */
    scramble(): string;
    inverse(moves: string): string;
  }

  const Cube: CubeStatic;
  export default Cube;
}
