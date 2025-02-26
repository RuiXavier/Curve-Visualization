#version 300 es

//@Author: Rui Xavier nº65815
//@Author: Rodrigo Santos nº63263
//This shader is used to render a Catmull-Rom curve using cubic Catmull-Rom basis functions.

// Index of the vertex in the curve
in uint index;

// Maximum number of control points for the curve
const int MAX_CONTROL_POINTS = 256;

// Uniforms
uniform int num_segments; // Number of segments in the curve
uniform vec2 control_points[MAX_CONTROL_POINTS]; // Array of control points
uniform float u_size; // Size parameter for point size calculation

// Catmull-Rom basis functions
float basisFunction0(float t) {
  // Basis function for the first control point
  return 0.5f * (-t * t * t + 2.0f * t * t - t);
}

float basisFunction1(float t) {
  // Basis function for the second control point
  return 0.5f * (3.0f * t * t * t - 5.0f * t * t + 2.0f);
}

float basisFunction2(float t) {
  // Basis function for the third control point
  return 0.5f * (-3.0f * t * t * t + 4.0f * t * t + t);
}

float basisFunction3(float t) {
  // Basis function for the fourth control point
  return 0.5f * (t * t * t - t * t);
}

void main() {
  // Calculate which segment of the curve we're in, and compute parameter t
  uint segment_index = index / uint(num_segments);
  float t = float(index % uint(num_segments)) / float(num_segments);

  // Retrieve the control points for this segment of the curve
  vec2 p0 = control_points[segment_index];
  vec2 p1 = control_points[segment_index + 1u];
  vec2 p2 = control_points[segment_index + 2u];
  vec2 p3 = control_points[segment_index + 3u];

  // Interpolate the curve position using the Catmull-Rom basis functions
  vec2 position = basisFunction0(t) * p0 +
    basisFunction1(t) * p1 +
    basisFunction2(t) * p2 +
    basisFunction3(t) * p3;

  // Convert the 2D position to a vec4 for gl_Position, with z = 0.0 and w = 1.0
  gl_Position = vec4(position, 0.0f, 1.0f);

  // Calculate the point size with a sine and cosine modulation
  gl_PointSize = max(15.0f, u_size * (1.0f + sin(float(index) * 0.2f) * cos(float(index) * 0.3f)));
}