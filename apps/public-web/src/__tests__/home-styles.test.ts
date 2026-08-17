import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Home Components Style Ownership & Static Inline Style Source Guard', () => {
  const namedHomeComponents = [
    'BuyingProcessPreview.tsx',
    'CorporateTrustShowcase.tsx',
    'FaqPreview.tsx',
    'GlobalLogisticsSection.tsx',
    'HomeShowroom.tsx',
    'MarketControls.tsx',
    'PremiumTeaserSection.tsx',
    'PromotionsCountdown.tsx',
    'TestimonialsPreview.tsx',
  ];

  const componentsDir = path.resolve(__dirname, '../features/home/components');

  namedHomeComponents.forEach((componentFileName) => {
    it(`prohibits static inline style={{...}} declarations in ${componentFileName}`, () => {
      const filePath = path.join(componentsDir, componentFileName);
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Regex matching static JSX style attributes style={{...}}
      const hasStaticInlineStyle = /style=\s*\{\{/.test(fileContent);

      expect(
        hasStaticInlineStyle,
        `Prohibited static inline style={{...}} found in ${componentFileName}. Move styles to home.css.`
      ).toBe(false);
    });
  });

  it('verifies Home feature stylesheet is imported in globals.css', () => {
    const globalsCssPath = path.resolve(__dirname, '../app/globals.css');
    const globalsContent = fs.readFileSync(globalsCssPath, 'utf-8');

    expect(globalsContent).toContain('@import "../features/home/home.css";');
  });

  it('uses theme variables without feature-level fallback palettes', () => {
    const homeStylesPath = path.resolve(__dirname, '../features/home/home.css');
    const homeStyles = fs.readFileSync(homeStylesPath, 'utf-8');

    expect(homeStyles).not.toMatch(/var\([^)]*,/);
    expect(homeStyles).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(homeStyles).not.toMatch(/rgba?\(/i);
  });
});
