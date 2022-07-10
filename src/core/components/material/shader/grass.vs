attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aVertexUv;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uTime;

varying vec2 vVertexUv;

void main() {
  mat4 modelViewMatrix = uViewMatrix * uWorldMatrix;
  vec4 position = uProjectionMatrix * modelViewMatrix * aVertexPosition;

  float offset = aVertexPosition.y * sin(uTime * 0.003) * 0.2;
  vec4 positionOffset = vec4(offset, 0.0, 0.0, 0.0);
  gl_Position = position + positionOffset;

  vVertexUv = aVertexUv;
}