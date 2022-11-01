precision highp float;

uniform vec3 uColor;
uniform sampler2D uAlbedo;

uniform float uSpecular;
uniform float uRoughness;
uniform sampler2D uEnviroment;

uniform vec3 uViewDir;

uniform float uAmbientLight;
uniform vec3 uLightDir;

varying vec2 vVertexUv;
varying vec3 vVertexNormal;

#define PI 3.14159265359

vec2 directionToRectilinear(vec3 direction) {
  float x = atan(direction.z, direction.x) / PI + 0.5;
  float y = direction.y * 0.5 + 0.5;
  return vec2(x, y);
}

void main() {
  vec3 normal = normalize(vVertexNormal);

  vec3 reflection = vec3(0.0);
  float reflectionIntensity = 0.0;
  
  if(uRoughness > 0.0) {
    vec3 LrN = reflect(uLightDir, normal);
    float rimIntensity = pow(clamp(1.0 + dot(uViewDir, normal), 0.0, 1.0), max(uSpecular * 0.5, 1.0));
    float specularIntensity = pow(clamp(dot(LrN, uViewDir), 0.0, 1.0), uSpecular);
    reflectionIntensity = (specularIntensity + rimIntensity) * uRoughness;
    
    vec3 VrN = reflect(-uViewDir, normal);
    vec4 enviroment = texture2D(uEnviroment, directionToRectilinear(VrN));
    reflection = enviroment.xyz * reflectionIntensity;
  }

  float lumaIntensity = dot(normal, uLightDir);
  vec3 diffuse = texture2D(uAlbedo, vVertexUv).xyz * uColor * (1.0 - reflectionIntensity) * max(lumaIntensity, uAmbientLight);

  vec4 color = vec4(diffuse + reflection, 1.0);

  gl_FragColor = color;
}