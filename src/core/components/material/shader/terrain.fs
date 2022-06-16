precision highp float;

uniform vec3 uLightDir;
uniform float uAmbientLight;

varying vec4 vVertexNormal;
varying vec2 vUvPosition;

uniform sampler2D uTerrain;

vec4 GREEN = vec4(0.419,0.608,0.117,1.0);
vec4 LIGHT_GREEN = vec4(0.725,0.850,0.502,1.0);  
vec4 BROWN = vec4(0.553,0.431,0.338,1.0);
vec4 WHITE = vec4(1.0,1.0,1.0,1.0);

float STEEPNESS_THRESHOLD = 0.425;
float SNOW_THRESHOLD = 0.6;

vec3 UP_VECTOR = vec3(0.0, 1.0, 0.0);

void main() {
  float height = vVertexNormal.w;

  vec3 normal = vVertexNormal.xyz;
  float steepness = dot(normal, UP_VECTOR);

  float steepnessMask = step(STEEPNESS_THRESHOLD, steepness);
  float snowMask = step(SNOW_THRESHOLD, height);

  vec4 terrain = texture2D(uTerrain, vUvPosition * 250.0);

  vec4 grass = steepnessMask * (1.0 - snowMask) * mix(GREEN, LIGHT_GREEN, height) * terrain.g;
  vec4 cliff =  (1.0 - steepnessMask) * mix(BROWN, WHITE, height) * terrain.r;
  vec4 snow = snowMask * steepnessMask * WHITE * terrain.b;

  vec4 color = grass + cliff + snow;
  color.xyz *= dot(uLightDir, normal);

  gl_FragColor = color;
}