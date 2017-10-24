import { SideEffect, SideEffects } from './../src';

describe('Side effects should work', () => {
  it('Side effects should be applied correctly', () => {
    /// Setup
    let object = 2;
    let testObject = 1;
    let se1: SideEffect<number> = value => testObject += value;
    let se2: SideEffect<number> = value => testObject *= value;

    /// When
    SideEffects.applySideEffects(object, [se1, se2]);

    /// Then
    expect(testObject).toBe((1 + 2) * 2);
  });
});