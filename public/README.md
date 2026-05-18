# Static assets

Files in this folder are served from the site root.

Drop your logo here as `degensea-logo.png` and the next deploy will use
it everywhere (loading screen + top bar). Until then the Logo component
falls back to the Drive thumbnail URL and then to gradient text.

Recommended logo specs:
- Transparent PNG
- ~1024 x 256 px (any size works, the component scales by height)
- The art itself should fill most of the canvas — too much whitespace
  around the edges will make the logo look small in context.
