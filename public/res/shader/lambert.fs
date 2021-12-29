precision highp float;

uniform vec3 uLightDir;
uniform float uAmbientLight;

varying vec3 vVertexNormal;

void main() {
  vec3 normal = normalize(vVertexNormal);
  float light = dot(normal, uLightDir);
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  gl_FragColor.rgb *= max(uAmbientLight, light);
}