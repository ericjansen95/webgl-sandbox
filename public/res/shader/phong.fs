precision highp float;

uniform vec3 uLightDir;
uniform vec3 uViewDir;
uniform float uAmbientLight;

varying vec3 vVertexNormal;

void main() {
  vec3 normal = normalize(vVertexNormal);
  float light = dot(normal, uLightDir);

  vec3 specular = vec3(0.9, 0.9, 0.9) * pow(clamp(dot(reflect(uLightDir, normal), uViewDir), 0.0, 1.0), 6.0);

  gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
  gl_FragColor.rgb *= max(uAmbientLight, light);

  gl_FragColor.rgb += specular;
}