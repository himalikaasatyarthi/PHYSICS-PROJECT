# CoordinateVerse

A beginner-friendly interactive physics project using:
- C for coordinate calculations
- Emscripten to compile C into WebAssembly
- HTML and CSS for the website
- JavaScript for controls
- Three.js for the interactive 3D scene

## 1. Open the project

Open this folder in Visual Studio Code.

## 2. Compile the C calculation engine

Open the Emscripten Command Prompt (or a terminal where `emcc` is available), navigate to this project folder, and run:

```bash
emcc c-engine/coordinates.c -O2 -s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORTED_FUNCTIONS='["_get_r","_get_theta_deg","_get_rho","_get_phi_deg"]' -o wasm/coordinates.js
```

This generates:
- `wasm/coordinates.js`
- `wasm/coordinates.wasm`

The web page dynamically loads this generated module. Until it exists, the site uses a JavaScript fallback so the visualizer can still be explored.

### Windows PowerShell note

If the quoted `EXPORTED_FUNCTIONS` argument causes a shell parsing issue, use the Emscripten Command Prompt and paste the command there. Emscripten's shell environment handles this form reliably.

## 3. Run the website using a local server

Do not open `index.html` by double-clicking it. ES modules and WebAssembly need to be served over HTTP.

In VS Code:
1. Install the **Live Server** extension.
2. Right-click `index.html`.
3. Select **Open with Live Server**.

Alternatively, if Python is installed, open a terminal in the project folder and run:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## 4. Test it

1. Move the X, Y and Z sliders.
2. Confirm that the 3D point moves.
3. Confirm that Polar, Cylindrical and Spherical values change.
4. Rotate the scene by dragging; zoom using the mouse wheel.
5. Compile the C code and refresh. The sidebar should show "C / WebAssembly active".

## 5. Coordinate conventions

- Polar: `(r, theta)` in the XY plane.
- Cylindrical: `(r, theta, z)`.
- Spherical: `(rho, theta, phi)`.
- `theta` is measured from +X in the XY plane.
- `phi` is measured down from +Z.
- Angles displayed by the app are degrees.

At the origin, angular coordinates are mathematically undefined. This demo displays zero as a convenient placeholder.

## 6. Important project explanation

The C code calculates the numerical coordinate values. JavaScript passes the user's point into the compiled C functions and receives the results. Three.js draws the point and axes. The 3D rendering itself is handled by JavaScript, not C.

## 7. Next improvements

- Add a draggable 3D point using Three.js Raycaster/TransformControls.
- Add a cylindrical wire and spherical shell physics experiment.
- Add a Jacobian/volume-element demonstration.
- Add quiz questions and a score system.
