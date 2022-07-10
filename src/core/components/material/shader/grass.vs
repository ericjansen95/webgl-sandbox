attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aVertexUv;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uTime;

varying vec2 vVertexUv;
varying vec2 vVertexPosition;

void main() {
  vec4 worldPosition = uWorldMatrix * aVertexPosition;
  vec4 position = uProjectionMatrix * uViewMatrix * worldPosition;

  float offset = aVertexPosition.y * sin(uTime * 0.003) * 0.2;
  vec4 positionOffset = vec4(offset, 0.0, 0.0, 0.0);
  gl_Position = position + positionOffset;

  vVertexPosition = worldPosition.xz;
  vVertexUv = aVertexUv;
}