import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CarChiefLoadingButton } from '../CarChiefLoadingButton.js';

describe('CarChiefLoadingButton', () => {
  it('renders default CarChief loading button with brand logo and animated spinner', () => {
    const html = renderToStaticMarkup(
      React.createElement(CarChiefLoadingButton, { label: 'CarChief Loading...' })
    );

    expect(html).toContain('CarChief Loading...');
    expect(html).toContain('cc-loading-btn');
    expect(html).toContain('cc-loading-btn__ring');
    expect(html).toContain('role="status"');
  });

  it('supports card variant and custom size', () => {
    const html = renderToStaticMarkup(
      React.createElement(CarChiefLoadingButton, {
        label: 'Processing CarChief Request...',
        variant: 'card',
        size: 'lg',
      })
    );

    expect(html).toContain('Processing CarChief Request...');
    expect(html).toContain('cc-loading-btn-wrap--card');
    expect(html).toContain('cc-loading-btn--lg');
  });

  it('supports floating non-disruptive overlay variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(CarChiefLoadingButton, {
        label: 'Loading statement transactions...',
        variant: 'overlay',
        size: 'sm',
      })
    );

    expect(html).toContain('Loading statement transactions...');
    expect(html).toContain('cc-loading-btn-wrap--overlay');
    expect(html).toContain('cc-loading-btn--overlay');
  });
});
