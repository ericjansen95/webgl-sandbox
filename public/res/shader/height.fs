precision mediump float;

uniform vec3 uLightDir;
uniform float uAmbientLight;

varying vec4 vVertexNormal;

vec4 START_COLOR = vec4(0.419,0.608,0.117,1.0);
vec4 END_COLOR = vec4(0.725,0.850,0.502,1.0);  

void main() {
  float height = vVertexNormal.w;

  if(height < 0.01)
    discard;

  vec4 color = mix(START_COLOR, END_COLOR, height);

  vec3 normal = normalize(vVertexNormal.xyz);
  float light = dot(normal, normalize(uLightDir));

  color.xyz *= max(uAmbientLight, light);

  gl_FragColor = color;
}