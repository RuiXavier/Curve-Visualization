#version 300 es

//@Author: Rui Xavier nº65815
//@Author: Rodrigo Santos nº63263
// Fragment shader for coloring the lines of the curves

precision mediump float;

// Uniforms
uniform vec4 u_color;

// Output
out vec4 frag_color;

void main() {
    frag_color = u_color;
}