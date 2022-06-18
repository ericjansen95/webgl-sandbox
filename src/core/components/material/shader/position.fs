precision highp float;

varying vec3 vVertexPosition;

void main() {
  gl_FragColor = vec4(vVertexPosition, 1.0);
}