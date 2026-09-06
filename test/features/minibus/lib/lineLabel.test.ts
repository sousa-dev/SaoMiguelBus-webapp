import { describe, expect, it } from 'vitest';

import { directionsLineLabel } from '@/features/minibus/lib/lineLabel';

describe('directionsLineLabel', () => {
  it('strips a leading "Linha " prefix, case-insensitively', () => {
    expect(directionsLineLabel({ line_code: 'A', line_name: 'Linha Amarela' })).toBe('Amarela');
    expect(directionsLineLabel({ line_code: 'A', line_name: 'LINHA Amarela' })).toBe('Amarela');
  });

  it('leaves a name with no "Linha " prefix untouched', () => {
    expect(directionsLineLabel({ line_code: 'A', line_name: 'Yellow' })).toBe('Yellow');
  });

  it('falls back to the line code when there is no name', () => {
    expect(directionsLineLabel({ line_code: 'A', line_name: null })).toBe('A');
    expect(directionsLineLabel({ line_code: 'A', line_name: '  ' })).toBe('A');
  });
});
