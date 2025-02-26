#version 300 es

//@Author: Rui Xavier nº65815
//@Author: Rodrigo Santos nº63263
//This shader is used to render a B-spline curve using cubic B-spline basis functions.

// Index of the vertex in the curve
in uint index;

// Maximum number of control points for the curve
const int MAX_CONTROL_POINTS = 256;

// Number of segments per curve
uniform int num_segments;

// Control points for the curve
uniform vec2 control_points[MAX_CONTROL_POINTS];

uniform float u_size;

// B-spline basis functions for cubic B-splines
float basisFunction0(float t) {
    // Basis function for the first control point
    return (1.0f / 6.0f) * (-t * t * t + 3.0f * t * t - 3.0f * t + 1.0f);
}

float basisFunction1(float t) {
    // Basis function for the second control point
    return (1.0f / 6.0f) * (3.0f * t * t * t - 6.0f * t * t + 4.0f);
}

float basisFunction2(float t) {
    // Basis function for the third control point
    return (1.0f / 6.0f) * (-3.0f * t * t * t + 3.0f * t * t + 3.0f * t + 1.0f);
}

float basisFunction3(float t) {
    // Basis function for the fourth control point
    return (1.0f / 6.0f) * t * t * t;
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

    // Interpolate the curve position using the B-spline basis functions
    vec2 position = basisFunction0(t) * p0 +
        basisFunction1(t) * p1 +
        basisFunction2(t) * p2 +
        basisFunction3(t) * p3;

    // Convert the 2D position to a vec4 for gl_Position, with z = 0.0 and w = 1.0
    gl_Position = vec4(position, 0.0f, 1.0f);

    // Set the point size, modulating it with a sine and cosine function for variation
    gl_PointSize = max(15.0f, u_size * (1.0f + sin(float(index) * 0.2f) * cos(float(index) * 0.3f)));
}