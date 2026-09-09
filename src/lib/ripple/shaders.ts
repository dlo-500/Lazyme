export const VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 1.0 - (aPos.y * 0.5 + 0.5));
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const SIM_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uCurr;
uniform vec2 uTexel;
uniform float uDamping;
uniform float uTravel;
uniform float uDiffuse;
uniform float uEncode;
uniform vec4 uDrops[12];
uniform int uDropCount;
uniform float uAspect;

float decode(float r) {
  return mix((r - 0.5) * 4.0, r, uEncode);
}

float encode(float h) {
  return mix(clamp(h * 0.25 + 0.5, 0.0, 1.0), h, uEncode);
}

vec2 sampleHG(vec2 uv) {
  vec4 t = texture(uCurr, uv);
  return vec2(decode(t.r), decode(t.g));
}

void main() {
  vec2 uv = vUv;
  vec2 hg = sampleHG(uv);
  float h = hg.x;
  float hp = hg.y;

  vec2 t = uTexel;
  float hL = sampleHG(uv - vec2(t.x, 0.0)).x;
  float hR = sampleHG(uv + vec2(t.x, 0.0)).x;
  float hB = sampleHG(uv + vec2(0.0, t.y)).x;
  float hT = sampleHG(uv - vec2(0.0, t.y)).x;
  float hTL = sampleHG(uv + vec2(-t.x, -t.y)).x;
  float hTR = sampleHG(uv + vec2(t.x, -t.y)).x;
  float hBL = sampleHG(uv + vec2(-t.x, t.y)).x;
  float hBR = sampleHG(uv + vec2(t.x, t.y)).x;

  float lap = (hL + hR + hB + hT) * 0.2 + (hTL + hTR + hBL + hBR) * 0.05 - h;
  float hNew = (2.0 * h - hp) + uTravel * lap;
  hNew = mix(hNew, (hL + hR + hB + hT) * 0.25, uDiffuse);
  hNew *= uDamping;

  for (int i = 0; i < 12; i++) {
    if (i >= uDropCount) break;
    vec2 d = uv - uDrops[i].xy;
    d.x *= uAspect;
    float rad = max(uDrops[i].w, 0.001);
    float g = exp(-dot(d, d) / (rad * rad));
    hNew += uDrops[i].z * g;
  }

  float edge = smoothstep(0.0, 0.035, uv.x) * smoothstep(1.0, 0.965, uv.x)
             * smoothstep(0.0, 0.035, uv.y) * smoothstep(1.0, 0.965, uv.y);
  hNew *= mix(0.82, 1.0, edge);
  hNew = clamp(hNew, -2.4, 2.4);

  fragColor = vec4(encode(hNew), encode(h), 0.0, 1.0);
}
`;

export const RENDER_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uCurr;
uniform vec2 uTexel;
uniform float uEncode;
uniform float uAspect;
uniform float uTime;
uniform vec2 uLight;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform vec3 uSpec;

float decode(float r) {
  return mix((r - 0.5) * 4.0, r, uEncode);
}

float sampleH(vec2 uv) {
  return decode(texture(uCurr, clamp(uv, 0.0, 1.0)).r);
}

void main() {
  vec2 uv = vUv;
  vec2 t = uTexel;
  float h = sampleH(uv);
  float hL = sampleH(uv - vec2(t.x, 0.0));
  float hR = sampleH(uv + vec2(t.x, 0.0));
  float hT = sampleH(uv - vec2(0.0, t.y));
  float hB = sampleH(uv + vec2(0.0, t.y));

  vec3 n = normalize(vec3((hL - hR) * uAspect * 14.0, 1.35, (hT - hB) * 14.0));

  vec3 V = vec3(0.0, 1.0, 0.0);
  vec3 L = normalize(vec3(uLight.x, 0.82, uLight.y));
  float ndotl = clamp(dot(n, L), 0.0, 1.0);
  vec3 Hv = normalize(L + V);
  float spec = pow(clamp(dot(n, Hv), 0.0, 1.0), 64.0);
  float specWide = pow(clamp(dot(n, Hv), 0.0, 1.0), 12.0);
  float fres = pow(1.0 - clamp(n.y, 0.0, 1.0), 2.4);

  vec2 refr = n.xz * 0.028;
  float hRefr = sampleH(uv + refr);

  float tCol = clamp(0.4 + h * 0.42 + hRefr * 0.08 + ndotl * 0.16, 0.0, 1.0);
  vec3 col = mix(uC0, uC1, smoothstep(0.0, 0.34, tCol));
  col = mix(col, uC2, smoothstep(0.28, 0.66, tCol));
  col = mix(col, uC3, smoothstep(0.6, 1.0, tCol));

  col *= 0.2 + 0.8 * ndotl;
  col += uSpec * (spec * 0.85 + specWide * 0.12);
  col += uC2 * fres * 0.16;

  float steep = clamp(length(n.xz) * 1.65, 0.0, 1.0);
  col = mix(col, uC3, steep * steep * 0.32);

  float caustic = pow(abs(sin((uv.x * 18.0 + n.x * 6.0) + uTime * 0.35)
                        * sin((uv.y * 14.0 + n.z * 6.0) - uTime * 0.22)), 4.0);
  col += uC2 * caustic * 0.07 * (0.4 + ndotl);

  vec2 vc = uv * 2.0 - 1.0;
  float vig = 1.0 - dot(vc, vc) * 0.16;
  col *= vig;

  col = clamp(col, 0.0, 1.0);
  fragColor = vec4(col, 1.0);
}
`;

