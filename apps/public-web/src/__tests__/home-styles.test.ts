import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Home Components Style Ownership & Static Inline Style Source Guard', () => {
  const namedHomeComponents = [
    'BuyingProcessPreview.tsx',
    'FaqPreview.tsx',
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
});
