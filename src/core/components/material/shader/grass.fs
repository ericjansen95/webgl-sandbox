precision highp float;

uniform sampler2D uTexture;

varying vec2 vVertexUv;
varying vec2 vVertexPosition;

void main() {
  vec4 mask = texture2D(uTexture, vVertexUv);

  if(mask.r < 0.75)
    discard;

  vec4 variation = texture2D(uTexture, vVertexPosition * 0.15);
  vec3 color = vec3(0.419,0.608,0.117) * mask.r * variation.g;

  gl_FragColor = vec4(color.rgb, 1.0);
}