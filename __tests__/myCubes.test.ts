/**
 * @format
 */

import {
  MAX_NAME_LENGTH,
  createCube,
  cubeLabel,
  findById,
  findByName,
  normaliseName,
  type MyCube,
} from '../src/lib/myCubes';

describe('names', () => {
  it('trims and collapses the spaces', () => {
    expect(normaliseName('  GAN   356  M ')).toBe('GAN 356 M');
    expect(normaliseName('\n o azul \t')).toBe('o azul');
  });

  it('is empty when there is nothing but space', () => {
    expect(normaliseName('   ')).toBe('');
    expect(normaliseName('')).toBe('');
  });

  it('caps the length', () => {
    expect(normaliseName('x'.repeat(100))).toHaveLength(MAX_NAME_LENGTH);
  });
});

describe('creating', () => {
  it('stores the name already normalised', () => {
    expect(createCube('  MoYu   RS3M ').name).toBe('MoYu RS3M');
  });

  it('gives every cube its own id', () => {
    const ids = new Set(
      Array.from({ length: 50 }, () => createCube('qualquer').id),
    );
    expect(ids.size).toBe(50);
  });
});

describe('looking up', () => {
  const cubes: MyCube[] = [
    { id: 'a', name: 'GAN 356', addedAt: 1 },
    { id: 'b', name: 'MoYu RS3M', addedAt: 2 },
  ];

  it('matches a name whatever the case or spacing', () => {
    expect(findByName(cubes, 'gan 356')?.id).toBe('a');
    expect(findByName(cubes, '  GAN   356  ')?.id).toBe('a');
    expect(findByName(cubes, 'GAN 357')).toBeUndefined();
  });

  it('finds by id, and copes with no id at all', () => {
    expect(findById(cubes, 'b')?.name).toBe('MoYu RS3M');
    expect(findById(cubes, 'sumiu')).toBeUndefined();
    expect(findById(cubes, null)).toBeUndefined();
    expect(findById(cubes, undefined)).toBeUndefined();
  });

  it('labels a solve, or says there is nothing to show', () => {
    expect(cubeLabel(cubes, 'a')).toBe('GAN 356');
    expect(cubeLabel(cubes, null)).toBeNull();
    // A cube removed after the solve was saved.
    expect(cubeLabel(cubes, 'removido')).toBeNull();
  });
});
