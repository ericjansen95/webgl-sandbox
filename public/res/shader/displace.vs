attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform sampler2D uTexture;

varying vec3 vVertexNormal;

void main() {
  float heightScalar = 0.025;
  float height = texture2D(uTexture, vec2((aVertexPosition.x + 1.0) * 0.5, (aVertexPosition.z + 1.0) * 0.5)).y;
  gl_Position = uProjectionMatrix * uModelViewMatrix * (aVertexPosition + vec4(0.0, height * heightScalar, 0.0, 0.0));
  vVertexNormal = vec3(height, height, height);
}