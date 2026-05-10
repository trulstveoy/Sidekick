import { describe, expect, it } from 'vitest';
import config from '../../vite.main.config';

describe('main bundle configuration', () => {
  it('bundles repomix instead of leaving a runtime require in packaged builds', () => {
    const external = config.build?.rollupOptions?.external;

    expect(JSON.stringify(external ?? [])).not.toContain('repomix');
  });
});
