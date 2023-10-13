precision highp float;

uniform sampler2D uAlbedo;

varying vec2 vVertexUv;

void main() {
  vec4 color = texture2D(uAlbedo, vVertexUv);

  if(color.a < 0.75)
    discard;

  gl_FragColor = color; 
}