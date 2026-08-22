import { describe, expect, it } from 'vitest';

import { getLocalFontStack, isFontPreset, LOCAL_FONT_PRESETS, normalizeFontPreset } from './fonts';

describe('local font presets', () => {
  it('only exposes local CSS font stacks', () => {
    expect(LOCAL_FONT_PRESETS.length).toBeGreaterThan(0);
    for (const preset of LOCAL_FONT_PRESETS) {
      expect(preset.stack).not.toMatch(/https?:|url\s*\(/i);
      expect(getLocalFontStack(preset.id)).toBe(preset.stack);
    }
  });

  it('accepts known presets and rejects arbitrary values', () => {
    expect(isFontPreset('system-mono')).toBe(true);
    expect(isFontPreset('remote-font')).toBe(false);
    expect(normalizeFontPreset('reading-serif')).toBe('reading-serif');
    expect(normalizeFontPreset('remote-font')).toBe('system-sans');
    expect(normalizeFontPreset(null)).toBe('system-sans');
  });
});
