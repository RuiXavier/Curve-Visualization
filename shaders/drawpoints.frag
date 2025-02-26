#version 300 es

//@Author: Rui Xavier nº65815
//@Author: Rodrigo Santos nº63263
// Fragment shader for drawing points with different shapes

precision mediump float;

uniform vec4 u_color;   // Base color
uniform float u_time;   // Time variable for animation
uniform int u_shapeType; // 0 for star, 1 for hexagon, 2 for pentagon
out vec4 frag_color;

void main() {
    vec2 coord = gl_PointCoord * 2.0 - 1.0; // Normalize coordinates from [0,1] to [-1,1]

    // Pulsating effect: ensure that scaling doesn't exceed the bounds
    float scale = 0.8 + 0.2 * sin(u_time * 3.0); // Pulsate but cap the max scale
    coord *= scale; // Apply scaling to coordinates

    // Rotation based on time
    float angle = u_time * 1.5;  // Control speed of rotation
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)); // Rotation matrix
    coord = rotation * coord; // Apply rotation to coordinates

    // Convert to polar coordinates (r, theta)
    float r = length(coord); // Radius
    float theta = atan(coord.y, coord.x); // Angle

    if (u_shapeType == 0) {
        // Draw a star
        int spikes = 6; // Number of spikes in the star
        float outerRadius = 0.7;  // Reduce outer spike radius to stay within bounds
        float innerRadius = 0.35; // Adjust inner concave radius
        float star_factor = mix(innerRadius, outerRadius, step(0.5, mod(float(spikes) * theta / 3.1415926535, 1.0))); // Determine if point is in inner or outer part of the star

        // Define star boundaries
        if (r > star_factor) {
            discard; // Discard fragment if outside star boundary
        }

    } else if (u_shapeType == 1) {
        // Draw a hexagon
        vec2 absCoord = abs(coord); // Absolute value of coordinates
        const float sqrt3 = 1.73205080757; // Square root of 3

        // Hexagon condition based on a combination of distance checks
        if ((absCoord.x > 1.0) || (absCoord.y > sqrt3 * 0.5) || (absCoord.x + absCoord.y * sqrt3 > 1.0)) {
            discard; // Discard fragment if outside hexagon boundary
        }

    } else if (u_shapeType == 2) {
        // Draw a pentagon
        int sides = 5; // Number of sides in the pentagon
        float angleStep = 3.1415926535 * 2.0 / float(sides); // Angle step between each side
        float innerRadius = 0.5; // Radius of the pentagon

        // Compute the distance to the nearest edge of the pentagon
        float edgeFactor = cos(mod(theta, angleStep) - angleStep / 2.0) * innerRadius; // Distance to nearest edge

        if (r > edgeFactor) {
            discard; // Discard fragment if outside pentagon boundary
        }
    }

    frag_color = u_color; // Set the fragment color
}
