import { describe, expect, it } from 'vitest';

describe('build version', () => {
  // vite.config.ts defines APP_VERSION as "v<package version> · <YYMMDDHHmm>"
  it('is injected as package version plus a build stamp', () => {
    expect(APP_VERSION).toMatch(/^v\d+\.\d+\.\d+ · \d{10}$/);
  });
});
