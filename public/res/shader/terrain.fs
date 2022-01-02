precision mediump float;

uniform vec3 uLightDir;
uniform float uAmbientLight;

varying vec4 vVertexNormal;

vec4 GREEN = vec4(0.419,0.608,0.117,1.0);
vec4 LIGHT_GREEN = vec4(0.725,0.850,0.502,1.0);  
vec4 BROWN = vec4(0.553,0.431,0.338,1.0);
vec4 WHITE = vec4(0.95,0.95,0.95,1.0);

float SNOW_THRESHOLD = 0.4;

void main() {
  float height = vVertexNormal.w;

  if(height < 0.01)
    discard;

  float snowMask = step(SNOW_THRESHOLD, height); 
  vec4 color = mix(GREEN, LIGHT_GREEN, height / SNOW_THRESHOLD) * (1.0 - snowMask) + mix(BROWN, WHITE, (height - SNOW_THRESHOLD + 0.1) / (1.0 - SNOW_THRESHOLD)) * snowMask;

  vec3 normal = normalize(vVertexNormal.xyz);
  float light = dot(normal, normalize(uLightDir));

  color.xyz *= max(uAmbientLight, light);

  gl_FragColor = color;
}