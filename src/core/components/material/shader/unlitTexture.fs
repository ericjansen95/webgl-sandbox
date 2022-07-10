precision highp float;

uniform sampler2D uTexture;

varying vec2 vVertexUv;

void main() {
  gl_FragColor = texture2D(uTexture, vVertexUv);
}