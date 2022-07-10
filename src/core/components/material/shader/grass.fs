precision highp float;

uniform sampler2D uTexture;

varying vec2 vVertexUv;

void main() {
  vec4 mask = texture2D(uTexture, vVertexUv);

  if(mask.r < 0.1)
    discard;

  vec3 color = vec3(0.419,0.608,0.117) * mask.g;

  gl_FragColor = vec4(color.rgb, 1.0);
}