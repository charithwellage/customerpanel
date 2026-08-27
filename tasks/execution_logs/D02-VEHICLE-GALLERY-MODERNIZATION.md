# D02 Vehicle Gallery Modernization

## Scope

The shared `@carchief/vehicle-detail` gallery was aligned with the approved POC
interaction pattern for Public Web vehicle details, Customer inventory details,
and Customer My Vehicles details. POC files and external image services were not
changed or copied.

## Changes

- Added shared semantic status/condition badges, image-load fallback, and
  `aria-current` thumbnail state to `VehicleGalleryPrimitive`.
- Preserved circular previous/next navigation, touch swiping, eager active-image
  loading, lazy thumbnails, empty-media handling, and responsive thumbnail rail.
- Replaced the Customer My Vehicles static image/thumbnail markup with the shared
  gallery.
- Kept Customer inventory and Public Web media projections, routes, pricing,
  reservation, inquiry, freight, and authorization behavior unchanged.
- Removed the Customer My Vehicles external fallback image so missing media uses
  the shared accessible empty state.

## Validation

Status: implementation complete; local validation passed. Browser evidence is
recorded with the runner limitation below.

- Shared gallery package build/typecheck: PASS.
- Customer App typecheck/tests: PASS — 97 tests.
- Public Web typecheck/tests: PASS — 211 tests.
- Boundary validation, task validation, and `git diff --check`: PASS.
- Fresh Compose build and startup: PASS; PostgreSQL, Mock API, Public Web, and
  Customer App containers reported healthy. Health and reset endpoints passed.
- Focused Customer inventory/My Vehicles browser checks passed across Chromium,
  mobile-Chromium, and tablet-Chromium.
- Public vehicle-detail browser checks passed for gallery rendering, empty media,
  redirects, canonical routing, and fabricated-slug 404 handling across all
  three projects.
- The existing Public Web keyboard-navigation assertion and unknown-slug body
  selector did not pass in the local Playwright runner: the keyboard assertion
  remained on image 1 despite a direct focused-browser probe advancing to image
  2, while the HTTP 404 status passed but the expected body selector was absent.
  These are retained as validation follow-ups rather than weakening the product
  gallery behavior or the 404 assertion.

## Review boundaries

- No POC files, API endpoints, fixtures, or external integrations changed.
- Gallery styles remain in `packages/vehicle-detail/src/vehicle-detail.css` and
  use semantic theme tokens for `carchief` and `ocean`.
