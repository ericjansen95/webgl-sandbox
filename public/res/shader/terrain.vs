attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

uniform mat4 uOffsetMatrix;

uniform sampler2D uTexture;
uniform float uHeight;

varying vec4 vVertexNormal;

// ToDo(Eric) Move this in a uniform?
float STEP = 0.025;

void main() {

  vec2 uvPosition = (uOffsetMatrix * aVertexPosition).xz * 2.0 + vec2(1.0, 1.0);

  float heightLeft = texture2D(uTexture, vec2((uvPosition.x - STEP + 1.0) * 0.5, (uvPosition.y  + 1.0) * 0.5)).y;
  float heightTop = texture2D(uTexture, vec2((uvPosition.x  + 1.0) * 0.5, (uvPosition.y + STEP  + 1.0) * 0.5)).y;
  float heightRight = texture2D(uTexture, vec2((uvPosition.x + STEP  + 1.0) * 0.5, (uvPosition.y  + 1.0) * 0.5)).y;
  float heightBottom = texture2D(uTexture, vec2((uvPosition.x  + 1.0) * 0.5, (uvPosition.y - STEP  + 1.0) * 0.5)).y;

  float heightCenter = texture2D(uTexture, vec2((uvPosition.x  + 1.0) * 0.5, (uvPosition.y  + 1.0) * 0.5)).y;
  
  vec4 position = vec4(aVertexPosition.x, aVertexPosition.y + heightCenter * uHeight, aVertexPosition.z, aVertexPosition.w);

  vVertexNormal = vec4(normalize(vec3((heightRight - heightLeft), 0.15, (heightBottom - heightTop))), heightCenter);

  gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * position;  
}