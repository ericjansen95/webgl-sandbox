precision highp float;

uniform vec3 uLightDir;
uniform float uAmbientLight;

varying vec4 vVertexNormal;

vec4 GREEN = vec4(0.419,0.608,0.117,1.0);
vec4 LIGHT_GREEN = vec4(0.725,0.850,0.502,1.0);  
vec4 BROWN = vec4(0.553,0.431,0.338,1.0);
vec4 WHITE = vec4(1.0,1.0,1.0,1.0);

float STEEPNESS_THRESHOLD = 0.85;
float SNOW_THRESHOLD = 0.6;

vec3 UP_VECTOR = vec3(0.0, 1.0, 0.0);

void main() {
  float height = vVertexNormal.w;

  if(height < 0.01)
    discard;

  vec3 normal = normalize(vVertexNormal.xyz);
  float steepness = dot(normal, normalize(UP_VECTOR));

  float steepnessMask = step(STEEPNESS_THRESHOLD, steepness);
  float snowMask = step(SNOW_THRESHOLD, height);

  // ToDo(Eric) Decrese operation count based on case => snow or not
  vec4 color = (mix(GREEN, LIGHT_GREEN, height) * steepnessMask +
               mix(BROWN, WHITE, height) * (1.0 - steepnessMask)) * (1.0 - snowMask) +
               WHITE * snowMask * steepnessMask + mix(BROWN, WHITE, height) * snowMask * (1.0 - steepnessMask);

  float light = dot(normal, normalize(uLightDir));

  color.xyz *= max(uAmbientLight, light - steepness * 0.05);

  gl_FragColor = color;
}