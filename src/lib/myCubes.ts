/**
 * The cubes the user owns. A solve can point at one of them, so you can tell
 * later which cube a time was done with.
 */

export interface MyCube {
  id: string;
  name: string;
  addedAt: number;
}

export const MAX_NAME_LENGTH = 40;

/** Trims, collapses runs of spaces and caps the length. */
export function normaliseName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH);
}

/** Two cubes with the same name would be impossible to tell apart. */
export function findByName(cubes: MyCube[], name: string): MyCube | undefined {
  const wanted = normaliseName(name).toLocaleLowerCase();
  return cubes.find(cube => cube.name.toLocaleLowerCase() === wanted);
}

export function createCube(name: string): MyCube {
  const now = Date.now();
  return {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    name: normaliseName(name),
    addedAt: now,
  };
}

export function findById(
  cubes: MyCube[],
  id: string | null | undefined,
): MyCube | undefined {
  return id ? cubes.find(cube => cube.id === id) : undefined;
}

/** The name to show for a solve, or `null` when no cube was recorded. */
export function cubeLabel(
  cubes: MyCube[],
  id: string | null | undefined,
): string | null {
  return findById(cubes, id)?.name ?? null;
}
