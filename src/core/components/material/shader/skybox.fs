precision highp float;

uniform sampler2D uTexture;
uniform float uTime;
uniform float uSpeed;
uniform float uStrength;

varying vec3 vWindDirection;
varying vec3 vVertexBinormal;
varying vec2 vVertexUv;

vec3 flowUv(vec2 flowVelocity, float offset) {
  float progress = fract((uTime * uSpeed) + offset);
  // sabretooth
  float opacity = 1.0 - abs(1.0 - 2.0 * progress);

  vec2 flowUv = vec2(flowVelocity.x, flowVelocity.y) * progress * uStrength;
  vec2 uv = vec2(vVertexUv.x + flowUv.x, vVertexUv.y - flowUv.y);

  return vec3(uv.xy, opacity);
}

vec4 flowColor(vec2 flowVelocity, float offset) {
  vec3 uv = flowUv(flowVelocity, offset);

  vec4 color = texture2D(uTexture, uv.xy);
  // sabretooth opacity blend
  color.xyz *= uv.z;

  return color;
}

void main() {
  vec3 normal = normalize(vVertexBinormal);
  vec2 flowVelocity = cross(normal, vWindDirection).xy;
  flowVelocity.y = 1.0 - flowVelocity.y;

  gl_FragColor = flowColor(flowVelocity, 0.0) + flowColor(flowVelocity, 0.5);
}