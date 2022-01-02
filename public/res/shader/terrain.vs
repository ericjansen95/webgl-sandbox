attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform sampler2D uTexture;

varying vec4 vVertexNormal;

// ToDo(Eric) Move this in a uniform?
float STEP = 0.00195;

float HEIGHT_SCALAR = 0.02;

void main() {
  float heightLeft = texture2D(uTexture, vec2((aVertexPosition.x - STEP + 1.0) * 0.5, (aVertexPosition.z + 1.0) * 0.5)).y;
  float heightTop = texture2D(uTexture, vec2((aVertexPosition.x + 1.0) * 0.5, (aVertexPosition.z + STEP + 1.0) * 0.5)).y;
  float heightRight = texture2D(uTexture, vec2((aVertexPosition.x + STEP + 1.0) * 0.5, (aVertexPosition.z + 1.0) * 0.5)).y;
  float heightBottom = texture2D(uTexture, vec2((aVertexPosition.x + 1.0) * 0.5, (aVertexPosition.z - STEP + 1.0) * 0.5)).y;
  
  float heightCenter = texture2D(uTexture, vec2((aVertexPosition.x + 1.0) * 0.5, (aVertexPosition.z + 1.0) * 0.5)).y;

  vec4 position = vec4(aVertexPosition.x, aVertexPosition.y + heightCenter * HEIGHT_SCALAR, aVertexPosition.z, aVertexPosition.w);

  // https://stackoverflow.com/questions/49640250/calculate-normals-from-heightmap
  vVertexNormal = vec4(normalize(vec3(2.0 * (heightRight - heightLeft), 4.0, 2.0 * (heightBottom - heightTop))), heightCenter);

  mat4 modelViewMatrix = uViewMatrix * uModelMatrix;
  gl_Position = uProjectionMatrix * modelViewMatrix * position;  
}