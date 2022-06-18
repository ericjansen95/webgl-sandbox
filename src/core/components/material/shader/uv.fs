precision highp float;

varying vec2 vVertexUv;

void main() {
  gl_FragColor = vec4(vVertexUv, 0.0, 1.0);
}