attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aVertexUv;

uniform sampler2D uTexture;
uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uTime;

varying vec2 vVertexUv;
varying vec2 vVertexPosition;

void main() {
  vec4 worldPosition = uWorldMatrix * aVertexPosition;
  vec4 position = uProjectionMatrix * uViewMatrix * worldPosition;

  float variation = texture2D(uTexture, aVertexPosition.xz * uTime * 0.0003).b; // wind speed
  float offset = aVertexPosition.y * sin(variation * 3.14159265359) * 0.4; // bend strength
  position.x += offset;
  gl_Position = position;

  vVertexPosition = worldPosition.xz;
  vVertexUv = aVertexUv;
}