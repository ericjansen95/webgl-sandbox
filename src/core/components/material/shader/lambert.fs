precision highp float;

uniform vec3 uLightDir;
uniform float uAmbientLight;
uniform vec3 uColor;

varying vec3 vVertexNormal;

void main() {
  float lumaIntensity = dot(vVertexNormal, uLightDir);
  gl_FragColor = vec4(uColor, 1.0);
  gl_FragColor.rgb *= max(uAmbientLight, lumaIntensity);
}