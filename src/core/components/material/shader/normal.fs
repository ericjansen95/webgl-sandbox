precision highp float;

varying vec3 vVertexNormal;

void main() {
  gl_FragColor = vec4(vVertexNormal, 1.0);
}