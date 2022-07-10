precision highp float;

uniform sampler2D uTexture;

varying vec2 vVertexUv;
varying vec2 vVertexPosition;

void main() {
  vec4 mask = texture2D(uTexture, vVertexUv);

  if(mask.r < 0.1)
    discard;

  vec4 variation = texture2D(uTexture, vVertexPosition * 0.25);
  vec3 color = vec3(0.419,0.608,0.117) * mask.g * variation.b;

  gl_FragColor = vec4(color.rgb, 1.0);
}