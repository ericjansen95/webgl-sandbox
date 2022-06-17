precision highp float;

uniform vec3 uColor;
uniform vec3 uLightDir;
uniform vec3 uViewDir;
uniform float uAmbientLight;

varying vec3 vVertexNormal;

void main() {
  float lumaIntensity = dot(vVertexNormal, uLightDir);
  float specularIntensity = pow(clamp(dot(reflect(uLightDir, vVertexNormal), uViewDir), 0.0, 1.0), 4.0);
  
  float intensity = max(uAmbientLight, max(lumaIntensity, specularIntensity));
  
  gl_FragColor = vec4(uColor * intensity, 1.0);
}