# Curve Visualization

This WebGL application enables the creation and visualization of cubic B-Spline curves, along with support for Catmull-Rom and Bézier curves. The project features an interactive editor for defining control points and an animation system for dynamic visualization.

## Features

- **Curve Types**: Supports B-Spline, Catmull-Rom, and Bézier curves.
- **Interactive Editing**:
  - Add control points one by one with mouse clicks.
  - Draw curves by holding and dragging the mouse.
  - Remove all curves with a single command.
- **Real-Time Animation**:
  - Control points have individual movement speeds.
  - Animations can be paused or resumed.
  - Curves are confined within the visible area.
- **Customizable Rendering**:
  - Adjustable curve smoothness.
  - Toggle visibility of sample points and segment lines.

## Controls

| Key                    | Action                             |
| ---------------------- | ---------------------------------- |
| `Left Click`           | Add a control point                |
| `Left Mouse Down Drag` | Draw a Continuous Curve            |
| `Z`                    | Finish the current curve           |
| `C`                    | Clear all curves                   |
| `+ / -`                | Increase/decrease curve smoothness |
| `> / <`                | Increase/decrease animation speed  |
| `Space`                | Pause/resume animations            |
| `P`                    | Show/hide sample points            |
| `L`                    | Show/hide curve segments           |
| `S`                    | Toggle special mode                |
| `0`                    | B-Spline Mode                      |
| `1`                    | Bezier Mode                        |
| `2`                    | Catmull-Rom Mode                   |


## Technical Details

- **Rendering**: Uses GLSL shaders to compute intermediate points on the GPU.
- **Animation**: Each control point has a base speed with slight random variations.
- **Performance Optimization**: Uses a preallocated buffer to avoid reallocation during rendering.

## How to Run

1. Clone the repository:
   ```sh
   git clone https://github.com/RuiXavier/Curve-Visualization.git
   cd Curve-Visualization/
   ```
2. Open `index.html` in a WebGL-compatible browser.
