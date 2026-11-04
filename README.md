Coordinate Universe
An accessible, futuristic coordinate-system converter and Engineering Physics learning aid.
Files in this project
File	Language	Purpose
README.md	Markdown	Setup, file guide and usage notes
index.html	HTML5	Page structure and accessible interface
style.css	CSS3	Layout, futuristic theme, responsive styling and accessibility modes
main.js	JavaScript	App state, validation, coordinate maths, conversion results and examples
controls.js	JavaScript	Theme, accessibility, speech, clipboard and view buttons
visualizer.js	JavaScript	Interactive 3D canvas models, camera movement and zoom
coordinates.c	C11	Native C implementation of the coordinate conversion maths


Run the browser application
1. Keep all project files in the same folder.
2. Open index.html in Chrome, Edge, Firefox or another modern browser.
3. Choose a source system and a target system, enter values, and select Convert coordinates.
The app uses classic JavaScript files (not JavaScript modules), so it can be opened directly from your file manager. No package installation, sign-in or internet connection is required.
Coordinate conventions
- Cartesian: (x, y, z).
- Polar: (r, θ) on a selected plane. The plane can be XY, XZ or YZ. When converted to 3D, the coordinate absent from the selected plane is zero.
- Cylindrical: (r, θ, z), with θ measured from +X toward +Y.
- Spherical: (ρ, θ, φ), where θ is azimuth around +Z and φ is measured down from +Z.
- All angles are entered and displayed in degrees.
- Inputs accept values from −1,000,000,000,000 through +1,000,000,000,000 and up to 10 decimal places. Display precision is separately adjustable from 0 to 10 places.
What each JavaScript file does
- main.js owns the application state, validates input, converts all four systems through a shared Cartesian point, renders the output, and loads physics examples.
- controls.js owns the usability features: light/dark mode, high contrast, larger text, easy-read spacing, reduced motion, copy result, speech readout and camera buttons.
- visualizer.js owns both 3D canvas views, including coordinate geometry, pointer dragging, wheel zoom and keyboard camera controls.
About coordinates.c
Browsers do not execute C source files directly. For that reason, the web app uses the equivalent JavaScript conversion routines in main.js and remains directly runnable without a build step. coordinates.c is a separate, real C11 implementation of the same conversion operations, intended for native C use or for a future WebAssembly build.

Compile the C source into an object file with GCC or Clang:
cc -std=c11 -Wall -Wextra -pedantic -c coordinates.c -o coordinates.o
The C source defines its coordinate enums and structs near the top, then exposes these functions:
- cu_to_cartesian(...)
- cu_from_cartesian(...)
- cu_convert(...)
Link a native C program that uses the library with the math library where required:
cc your_program.c coordinates.c -lm -o your_program
Accessibility features
The interface includes visible labels, keyboard focus indicators, input error announcements, screen-reader descriptions for the visualisations, high-contrast and light themes, larger text, easy-read spacing, reduced-motion mode, and optional speech output (browser support varies).
Numerical note
The converter uses JavaScript Number and C double floating-point arithmetic. Ten decimal places can be entered, but decimal precision is not unlimited; at very large magnitudes, tiny fractional differences may be rounded by floating-point representation. The app reports formatted output to the selected number of decimal places.
