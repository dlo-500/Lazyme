import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, r as Slot, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as Eraser } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/@radix-ui/react-slider+[...].mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Bf2FWY_T.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PALETTES = [
	{
		id: "abyss",
		label: "Abyss",
		stops: [
			[
				.02,
				.04,
				.07
			],
			[
				.04,
				.2,
				.3
			],
			[
				.28,
				.68,
				.72
			],
			[
				.82,
				.94,
				.96
			]
		],
		spec: [
			.78,
			.94,
			.98
		]
	},
	{
		id: "mercury",
		label: "Mercury",
		stops: [
			[
				.05,
				.055,
				.06
			],
			[
				.16,
				.18,
				.2
			],
			[
				.52,
				.56,
				.6
			],
			[
				.9,
				.92,
				.94
			]
		],
		spec: [
			.95,
			.96,
			.98
		]
	},
	{
		id: "ember",
		label: "Ember",
		stops: [
			[
				.05,
				.03,
				.02
			],
			[
				.28,
				.1,
				.05
			],
			[
				.78,
				.38,
				.16
			],
			[
				.98,
				.86,
				.62
			]
		],
		spec: [
			1,
			.9,
			.7
		]
	},
	{
		id: "kelp",
		label: "Kelp",
		stops: [
			[
				.02,
				.05,
				.04
			],
			[
				.05,
				.18,
				.14
			],
			[
				.22,
				.55,
				.4
			],
			[
				.78,
				.92,
				.76
			]
		],
		spec: [
			.82,
			.98,
			.86
		]
	},
	{
		id: "pearl",
		label: "Pearl",
		stops: [
			[
				.1,
				.13,
				.16
			],
			[
				.28,
				.34,
				.4
			],
			[
				.62,
				.72,
				.78
			],
			[
				.93,
				.96,
				.98
			]
		],
		spec: [
			1,
			1,
			1
		]
	}
];
function paletteById(id) {
	return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}
var VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 1.0 - (aPos.y * 0.5 + 0.5));
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;
var SIM_FS = `#version 300 es
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
var RENDER_FS = `#version 300 es
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
var STEP = 1 / 60;
var MAX_STEPS = 4;
var MAX_DROPS = 12;
var DPR_CAP = 2;
var RippleEngine = class {
	canvas;
	ok;
	error;
	gl = null;
	useFloat = false;
	simW = 1;
	simH = 1;
	tex = null;
	fbo = null;
	curr = 0;
	simProg = null;
	renderProg = null;
	simUni = null;
	renderUni = null;
	vao = null;
	quad = null;
	pending = [];
	params = {
		viscosity: .32,
		strength: .68,
		palette: "abyss"
	};
	pointer = null;
	lastPointer = null;
	light = {
		x: .35,
		y: .45
	};
	time = 0;
	lastMs = 0;
	accum = 0;
	raf = 0;
	running = false;
	resizeObs = null;
	disposed = false;
	encode = 0;
	constructor(canvas) {
		this.canvas = canvas;
		const gl = canvas.getContext("webgl2", {
			alpha: false,
			antialias: false,
			depth: false,
			stencil: false,
			premultipliedAlpha: false,
			preserveDrawingBuffer: false,
			powerPreference: "high-performance"
		});
		if (!gl) {
			this.ok = false;
			this.error = "WebGL2 is required for this surface.";
			return;
		}
		this.gl = gl;
		try {
			this.boot(gl);
			this.ok = true;
			this.error = null;
		} catch (err) {
			this.ok = false;
			this.error = err instanceof Error ? err.message : "Could not start the surface.";
		}
	}
	setParams(params) {
		this.params = params;
	}
	clear() {
		const gl = this.gl;
		if (!gl || !this.fbo) return;
		if (this.useFloat) gl.clearColor(0, 0, 0, 1);
		else gl.clearColor(.5, .5, 0, 1);
		for (let i = 0; i < 2; i++) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo[i]);
			gl.viewport(0, 0, this.simW, this.simH);
			gl.clear(gl.COLOR_BUFFER_BIT);
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		this.pending.length = 0;
		this.pointer = null;
		this.lastPointer = null;
	}
	queueDrop(x, y, amp, radius) {
		this.pending.push({
			x: clamp01(x),
			y: clamp01(y),
			amp,
			radius
		});
	}
	start() {
		if (!this.ok || this.running || this.disposed) return;
		this.running = true;
		this.lastMs = 0;
		this.prewarm();
		this.raf = requestAnimationFrame(this.tick);
	}
	destroy() {
		this.disposed = true;
		this.running = false;
		cancelAnimationFrame(this.raf);
		this.resizeObs?.disconnect();
		this.canvas.removeEventListener("pointerdown", this.onPointerDown);
		this.canvas.removeEventListener("pointermove", this.onPointerMove);
		this.canvas.removeEventListener("pointerup", this.onPointerUp);
		this.canvas.removeEventListener("pointercancel", this.onPointerUp);
		this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
		this.canvas.removeEventListener("contextmenu", prevent);
		window.removeEventListener("keydown", this.onKey);
		document.removeEventListener("visibilitychange", this.onVisibility);
		const gl = this.gl;
		if (gl) {
			if (this.tex) {
				gl.deleteTexture(this.tex[0]);
				gl.deleteTexture(this.tex[1]);
			}
			if (this.fbo) {
				gl.deleteFramebuffer(this.fbo[0]);
				gl.deleteFramebuffer(this.fbo[1]);
			}
			if (this.simProg) gl.deleteProgram(this.simProg);
			if (this.renderProg) gl.deleteProgram(this.renderProg);
			if (this.vao) gl.deleteVertexArray(this.vao);
			if (this.quad) gl.deleteBuffer(this.quad);
		}
		this.gl = null;
	}
	boot(gl) {
		const ext = gl.getExtension("EXT_color_buffer_float");
		gl.getExtension("OES_texture_float_linear");
		this.useFloat = Boolean(ext);
		this.encode = this.useFloat ? 1 : 0;
		this.simProg = link(gl, VERT, SIM_FS);
		this.renderProg = link(gl, VERT, RENDER_FS);
		this.simUni = {
			uCurr: gl.getUniformLocation(this.simProg, "uCurr"),
			uTexel: gl.getUniformLocation(this.simProg, "uTexel"),
			uDamping: gl.getUniformLocation(this.simProg, "uDamping"),
			uTravel: gl.getUniformLocation(this.simProg, "uTravel"),
			uDiffuse: gl.getUniformLocation(this.simProg, "uDiffuse"),
			uEncode: gl.getUniformLocation(this.simProg, "uEncode"),
			uDrops: gl.getUniformLocation(this.simProg, "uDrops[0]") ?? gl.getUniformLocation(this.simProg, "uDrops"),
			uDropCount: gl.getUniformLocation(this.simProg, "uDropCount"),
			uAspect: gl.getUniformLocation(this.simProg, "uAspect")
		};
		this.renderUni = {
			uCurr: gl.getUniformLocation(this.renderProg, "uCurr"),
			uTexel: gl.getUniformLocation(this.renderProg, "uTexel"),
			uEncode: gl.getUniformLocation(this.renderProg, "uEncode"),
			uAspect: gl.getUniformLocation(this.renderProg, "uAspect"),
			uTime: gl.getUniformLocation(this.renderProg, "uTime"),
			uLight: gl.getUniformLocation(this.renderProg, "uLight"),
			uC0: gl.getUniformLocation(this.renderProg, "uC0"),
			uC1: gl.getUniformLocation(this.renderProg, "uC1"),
			uC2: gl.getUniformLocation(this.renderProg, "uC2"),
			uC3: gl.getUniformLocation(this.renderProg, "uC3"),
			uSpec: gl.getUniformLocation(this.renderProg, "uSpec")
		};
		this.vao = gl.createVertexArray();
		this.quad = gl.createBuffer();
		if (!this.vao || !this.quad) throw new Error("Could not allocate geometry.");
		gl.bindVertexArray(this.vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			-1,
			-1,
			3,
			-1,
			-1,
			3
		]), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
		this.layout();
		this.bindInput();
		this.resizeObs = new ResizeObserver(() => this.layout());
		this.resizeObs.observe(this.canvas);
	}
	bindInput() {
		this.canvas.addEventListener("pointerdown", this.onPointerDown);
		this.canvas.addEventListener("pointermove", this.onPointerMove);
		this.canvas.addEventListener("pointerup", this.onPointerUp);
		this.canvas.addEventListener("pointercancel", this.onPointerUp);
		this.canvas.addEventListener("pointerleave", this.onPointerLeave);
		this.canvas.addEventListener("contextmenu", prevent);
		window.addEventListener("keydown", this.onKey);
		document.addEventListener("visibilitychange", this.onVisibility);
	}
	layout() {
		const gl = this.gl;
		if (!gl || this.disposed) return;
		const rect = this.canvas.getBoundingClientRect();
		const cssW = Math.max(1, rect.width);
		const cssH = Math.max(1, rect.height);
		const dpr = Math.min(DPR_CAP, window.devicePixelRatio || 1);
		const bufW = Math.max(1, Math.round(cssW * dpr));
		const bufH = Math.max(1, Math.round(cssH * dpr));
		if (this.canvas.width !== bufW || this.canvas.height !== bufH) {
			this.canvas.width = bufW;
			this.canvas.height = bufH;
		}
		const long = cssW >= 720 ? 640 : cssW >= 480 ? 512 : 384;
		const aspect = cssW / cssH;
		let simW;
		let simH;
		if (aspect >= 1) {
			simW = long;
			simH = Math.max(160, Math.round(long / aspect));
		} else {
			simH = long;
			simW = Math.max(160, Math.round(long * aspect));
		}
		simW = Math.max(160, simW & -2);
		simH = Math.max(160, simH & -2);
		if (simW === this.simW && simH === this.simH && this.tex) return;
		this.rebuildTargets(gl, simW, simH);
	}
	rebuildTargets(gl, w, h) {
		if (this.tex) {
			gl.deleteTexture(this.tex[0]);
			gl.deleteTexture(this.tex[1]);
		}
		if (this.fbo) {
			gl.deleteFramebuffer(this.fbo[0]);
			gl.deleteFramebuffer(this.fbo[1]);
		}
		const tryFloat = this.useFloat;
		let texA = makeHeightTex(gl, w, h, tryFloat);
		let texB = makeHeightTex(gl, w, h, tryFloat);
		let fboA = makeFbo(gl, texA);
		let fboB = makeFbo(gl, texB);
		if (tryFloat && (!fboComplete(gl, fboA) || !fboComplete(gl, fboB))) {
			gl.deleteTexture(texA);
			gl.deleteTexture(texB);
			gl.deleteFramebuffer(fboA);
			gl.deleteFramebuffer(fboB);
			this.useFloat = false;
			this.encode = 0;
			texA = makeHeightTex(gl, w, h, false);
			texB = makeHeightTex(gl, w, h, false);
			fboA = makeFbo(gl, texA);
			fboB = makeFbo(gl, texB);
		}
		if (!fboComplete(gl, fboA) || !fboComplete(gl, fboB)) throw new Error("Could not allocate the ripple field.");
		this.tex = [texA, texB];
		this.fbo = [fboA, fboB];
		this.simW = w;
		this.simH = h;
		this.curr = 0;
		this.clear();
		if (this.running) this.prewarm();
	}
	prewarm() {
		for (const [x, y, a] of [
			[
				.34,
				.42,
				.95
			],
			[
				.62,
				.55,
				.72
			],
			[
				.48,
				.3,
				.55
			],
			[
				.72,
				.36,
				.4
			],
			[
				.28,
				.68,
				.48
			]
		]) this.queueDrop(x, y, a, .028);
		for (let i = 0; i < 36; i++) {
			if (i === 10) this.queueDrop(.52, .48, .7, .024);
			if (i === 18) this.queueDrop(.4, .58, .5, .022);
			this.simStep();
		}
	}
	tick = (ms) => {
		if (!this.running || this.disposed) return;
		this.raf = requestAnimationFrame(this.tick);
		if (document.visibilityState === "hidden") {
			this.lastMs = 0;
			return;
		}
		if (!this.lastMs) this.lastMs = ms;
		let dt = (ms - this.lastMs) / 1e3;
		this.lastMs = ms;
		if (dt > .1) dt = .1;
		this.time += dt;
		this.accum += dt;
		let steps = 0;
		while (this.accum >= STEP && steps < MAX_STEPS) {
			this.sampleHeldPointer();
			this.simStep();
			this.accum -= STEP;
			steps++;
		}
		this.updateLight(dt);
		this.render();
	};
	sampleHeldPointer() {
		const p = this.pointer;
		if (!p?.down) return;
		if (this.lastPointer) {
			if (Math.hypot(p.x - this.lastPointer.x, p.y - this.lastPointer.y) > .001) this.trace(this.lastPointer.x, this.lastPointer.y, p.x, p.y, 1);
			else this.impulse(p.x, p.y, .28);
		} else this.impulse(p.x, p.y, 1.15);
		this.lastPointer = {
			x: p.x,
			y: p.y
		};
	}
	simStep() {
		const gl = this.gl;
		const prog = this.simProg;
		const uni = this.simUni;
		if (!gl || !prog || !uni || !this.fbo || !this.tex) return;
		const visc = this.params.viscosity;
		const damping = lerp(.9965, .938, visc);
		const travel = lerp(.4, .16, visc);
		const diffuse = visc * .085;
		const drops = this.pending.splice(0, MAX_DROPS);
		const packed = /* @__PURE__ */ new Float32Array(48);
		for (let i = 0; i < drops.length; i++) {
			packed[i * 4] = drops[i].x;
			packed[i * 4 + 1] = drops[i].y;
			packed[i * 4 + 2] = drops[i].amp;
			packed[i * 4 + 3] = drops[i].radius;
		}
		const src = this.curr;
		const dst = 1 - this.curr;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo[dst]);
		gl.viewport(0, 0, this.simW, this.simH);
		gl.useProgram(prog);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.tex[src]);
		gl.uniform1i(uni.uCurr, 0);
		gl.uniform2f(uni.uTexel, 1 / this.simW, 1 / this.simH);
		gl.uniform1f(uni.uDamping, damping);
		gl.uniform1f(uni.uTravel, travel);
		gl.uniform1f(uni.uDiffuse, diffuse);
		gl.uniform1f(uni.uEncode, this.encode);
		gl.uniform1f(uni.uAspect, this.simW / this.simH);
		gl.uniform1i(uni.uDropCount, drops.length);
		if (uni.uDrops) gl.uniform4fv(uni.uDrops, packed);
		gl.bindVertexArray(this.vao);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		this.curr = dst;
	}
	render() {
		const gl = this.gl;
		const prog = this.renderProg;
		const uni = this.renderUni;
		if (!gl || !prog || !uni || !this.tex) return;
		const pal = paletteById(this.params.palette);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.useProgram(prog);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.tex[this.curr]);
		gl.uniform1i(uni.uCurr, 0);
		gl.uniform2f(uni.uTexel, 1 / this.simW, 1 / this.simH);
		gl.uniform1f(uni.uEncode, this.encode);
		gl.uniform1f(uni.uAspect, this.simW / this.simH);
		gl.uniform1f(uni.uTime, this.time);
		gl.uniform2f(uni.uLight, this.light.x, this.light.y);
		gl.uniform3f(uni.uC0, pal.stops[0][0], pal.stops[0][1], pal.stops[0][2]);
		gl.uniform3f(uni.uC1, pal.stops[1][0], pal.stops[1][1], pal.stops[1][2]);
		gl.uniform3f(uni.uC2, pal.stops[2][0], pal.stops[2][1], pal.stops[2][2]);
		gl.uniform3f(uni.uC3, pal.stops[3][0], pal.stops[3][1], pal.stops[3][2]);
		gl.uniform3f(uni.uSpec, pal.spec[0], pal.spec[1], pal.spec[2]);
		gl.bindVertexArray(this.vao);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	}
	updateLight(dt) {
		const targetX = this.pointer ? (this.pointer.x - .5) * 1.4 : Math.sin(this.time * .23) * .35;
		const targetY = this.pointer ? (.5 - this.pointer.y) * 1.2 : Math.cos(this.time * .17) * .28;
		const k = 1 - Math.exp(-3.2 * dt);
		this.light.x += (targetX - this.light.x) * k;
		this.light.y += (targetY - this.light.y) * k;
	}
	uvFromEvent(e) {
		const rect = this.canvas.getBoundingClientRect();
		const x = (e.clientX - rect.left) / Math.max(rect.width, 1);
		const y = (e.clientY - rect.top) / Math.max(rect.height, 1);
		return {
			x: clamp01(x),
			y: clamp01(y)
		};
	}
	impulse(x, y, scale) {
		const s = this.params.strength;
		const amp = lerp(.16, 1.22, s) * scale;
		const radius = lerp(.016, .04, s);
		this.queueDrop(x, y, amp, radius);
	}
	trace(x0, y0, x1, y1, scale) {
		const dist = Math.hypot(x1 - x0, y1 - y0);
		const vel = dist * 18;
		const boost = 1 + Math.min(1.4, vel * .35);
		const steps = Math.min(MAX_DROPS, Math.max(1, Math.round(dist / .018)));
		const s = this.params.strength;
		const amp = lerp(.12, .95, s) * scale * boost / Math.max(1, steps * .55);
		const radius = lerp(.014, .034, s);
		for (let i = 1; i <= steps; i++) {
			const t = i / steps;
			this.queueDrop(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, amp, radius);
		}
	}
	onPointerDown = (e) => {
		if (e.button !== 0 && e.pointerType === "mouse") return;
		e.preventDefault();
		this.canvas.setPointerCapture(e.pointerId);
		const uv = this.uvFromEvent(e);
		this.pointer = {
			...uv,
			down: true
		};
		this.lastPointer = uv;
		this.impulse(uv.x, uv.y, 1.25);
	};
	onPointerMove = (e) => {
		const uv = this.uvFromEvent(e);
		if (this.pointer?.down ?? (e.buttons & 1) !== 0) {
			this.pointer = {
				...uv,
				down: true
			};
			return;
		}
		if (e.pointerType !== "mouse") return;
		const prev = this.pointer;
		this.pointer = {
			...uv,
			down: false
		};
		if (prev && Math.hypot(uv.x - prev.x, uv.y - prev.y) > .003) this.trace(prev.x, prev.y, uv.x, uv.y, .22);
	};
	onPointerUp = (e) => {
		if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
		const uv = this.uvFromEvent(e);
		const hover = e.pointerType === "mouse";
		this.pointer = hover ? {
			...uv,
			down: false
		} : null;
		this.lastPointer = hover ? uv : null;
	};
	onPointerLeave = () => {
		if (this.pointer?.down) return;
		this.pointer = null;
		this.lastPointer = null;
	};
	onKey = (e) => {
		if (e.code === "KeyC" && !e.metaKey && !e.ctrlKey && !e.altKey) {
			const tag = e.target?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") return;
			this.clear();
		}
	};
	onVisibility = () => {
		if (document.visibilityState === "visible") this.lastMs = 0;
	};
};
function prevent(e) {
	e.preventDefault();
}
function clamp01(v) {
	return Math.min(1, Math.max(0, v));
}
function lerp(a, b, t) {
	return a + (b - a) * t;
}
function link(gl, vsSrc, fsSrc) {
	const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
	const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
	const prog = gl.createProgram();
	if (!prog) throw new Error("Could not create program.");
	gl.attachShader(prog, vs);
	gl.attachShader(prog, fs);
	gl.linkProgram(prog);
	gl.deleteShader(vs);
	gl.deleteShader(fs);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		const log = gl.getProgramInfoLog(prog);
		gl.deleteProgram(prog);
		throw new Error(log || "Program link failed.");
	}
	return prog;
}
function compile(gl, type, source) {
	const sh = gl.createShader(type);
	if (!sh) throw new Error("Could not create shader.");
	gl.shaderSource(sh, source);
	gl.compileShader(sh);
	if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(sh);
		gl.deleteShader(sh);
		throw new Error(log || "Shader compile failed.");
	}
	return sh;
}
function makeHeightTex(gl, w, h, useFloat) {
	const tex = gl.createTexture();
	if (!tex) throw new Error("Could not create texture.");
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	if (useFloat) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
	else {
		const rest = new Uint8Array(w * h * 4);
		for (let i = 0; i < rest.length; i += 4) {
			rest[i] = 128;
			rest[i + 1] = 128;
		}
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, rest);
	}
	return tex;
}
function makeFbo(gl, tex) {
	const fbo = gl.createFramebuffer();
	if (!fbo) throw new Error("Could not create framebuffer.");
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	return fbo;
}
function fboComplete(gl, fbo) {
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	return status === gl.FRAMEBUFFER_COMPLETE;
}
function RippleCanvas({ viscosity, strength, palette, clearToken }) {
	const canvasRef = (0, import_react.useRef)(null);
	const engineRef = (0, import_react.useRef)(null);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const engine = new RippleEngine(canvas);
		engineRef.current = engine;
		if (!engine.ok) {
			setError(engine.error ?? "Could not start the surface.");
			return;
		}
		engine.setParams({
			viscosity,
			strength,
			palette
		});
		engine.start();
		const win = window;
		win.__undula = {
			clear: () => engine.clear(),
			drop: (x, y) => engine.queueDrop(x, y, .9, .03)
		};
		return () => {
			delete win.__undula;
			engine.destroy();
			engineRef.current = null;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		engineRef.current?.setParams({
			viscosity,
			strength,
			palette
		});
	}, [
		viscosity,
		strength,
		palette
	]);
	(0, import_react.useEffect)(() => {
		if (clearToken > 0) engineRef.current?.clear();
	}, [clearToken]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref: canvasRef,
		className: "absolute inset-0 size-full touch-none",
		"aria-label": "Interactive fluid surface. Drag to create ripples."
	}), error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-10 flex items-center justify-center bg-background px-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-sm text-pretty text-sm text-muted-foreground",
			children: error
		})
	}) : null] });
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 active:opacity-80 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:opacity-90",
			outline: "border border-border bg-transparent text-foreground hover:bg-muted",
			ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
			subtle: "bg-muted text-foreground hover:opacity-90"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-xs",
			pill: "h-9 px-3 rounded-full text-xs",
			icon: "size-11"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		ref,
		type: asChild ? void 0 : type,
		...props
	});
});
Button.displayName = "Button";
var Slider = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
	ref,
	className: cn("relative flex h-11 w-full touch-none select-none items-center", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
		className: "relative h-1 w-full grow overflow-hidden rounded-full bg-muted",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full bg-primary" })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block size-5 rounded-full bg-primary shadow-border transition-[box-shadow] duration-[var(--motion-quick)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none" })]
}));
Slider.displayName = Slider$1.displayName;
function ControlDock({ viscosity, strength, palette, onViscosity, onStrength, onPalette, onClear }) {
	const viscPct = Math.round(viscosity * 100);
	const strPct = Math.round(strength * 100);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "pointer-events-auto w-full max-w-sm rounded-2xl bg-card p-4 shadow-border animate-dock-in",
		"aria-label": "Surface controls",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Viscosity",
					value: `${viscPct}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
						min: 0,
						max: 100,
						step: 1,
						value: [viscPct],
						onValueChange: (v) => onViscosity((v[0] ?? 0) / 100),
						"aria-label": "Viscosity"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Wave strength",
					value: `${strPct}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
						min: 0,
						max: 100,
						step: 1,
						value: [strPct],
						onValueChange: (v) => onStrength((v[0] ?? 0) / 100),
						"aria-label": "Wave strength"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium text-muted-foreground",
						children: "Color map"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1",
						children: PALETTES.map((item) => {
							const selected = item.id === palette;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								"aria-pressed": selected,
								onClick: () => onPalette(item.id),
								className: cn("inline-flex h-11 shrink-0 items-center gap-2 rounded-sm px-3 text-xs font-medium transition-[background-color,color,opacity] duration-150", selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("size-2 rounded-full", swatchClass(item.id)),
									"aria-hidden": "true"
								}), item.label]
							}, item.id);
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					className: "w-full",
					onClick: onClear,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eraser, {}), "Clear surface"]
				})
			]
		})
	});
}
function Field({ label, value, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-baseline justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs font-medium text-muted-foreground",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-xs tabular-nums text-foreground",
				children: value
			})]
		}), children]
	});
}
function swatchClass(id) {
	switch (id) {
		case "abyss": return "bg-swatch-abyss";
		case "mercury": return "bg-swatch-mercury";
		case "ember": return "bg-swatch-ember";
		case "kelp": return "bg-swatch-kelp";
		case "pearl": return "bg-swatch-pearl";
		default: return "bg-primary";
	}
}
function isPaletteId(value) {
	return PALETTES.some((p) => p.id === value);
}
var useRippleStore = create()(persist((set) => ({
	viscosity: .32,
	strength: .68,
	palette: "abyss",
	clearToken: 0,
	setViscosity: (value) => set({ viscosity: Math.min(1, Math.max(0, value)) }),
	setStrength: (value) => set({ strength: Math.min(1, Math.max(0, value)) }),
	setPalette: (palette) => set({ palette }),
	requestClear: () => set((s) => ({ clearToken: s.clearToken + 1 }))
}), {
	name: "undula-settings-v1",
	skipHydration: true,
	partialize: (state) => ({
		viscosity: state.viscosity,
		strength: state.strength,
		palette: state.palette
	}),
	merge: (persisted, current) => {
		const p = persisted ?? {};
		return {
			...current,
			viscosity: typeof p.viscosity === "number" ? Math.min(1, Math.max(0, p.viscosity)) : current.viscosity,
			strength: typeof p.strength === "number" ? Math.min(1, Math.max(0, p.strength)) : current.strength,
			palette: isPaletteId(p.palette) ? p.palette : current.palette
		};
	}
}));
function RippleApp() {
	(0, import_react.useEffect)(() => {
		useRippleStore.persist.rehydrate();
	}, []);
	const viscosity = useRippleStore((s) => s.viscosity);
	const strength = useRippleStore((s) => s.strength);
	const palette = useRippleStore((s) => s.palette);
	const clearToken = useRippleStore((s) => s.clearToken);
	const setViscosity = useRippleStore((s) => s.setViscosity);
	const setStrength = useRippleStore((s) => s.setStrength);
	const setPalette = useRippleStore((s) => s.setPalette);
	const requestClear = useRippleStore((s) => s.requestClear);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh w-full select-none overflow-hidden bg-background text-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RippleCanvas, {
			viscosity,
			strength,
			palette,
			clearToken
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-none absolute inset-0 flex flex-col justify-between p-4 pt-5 sm:p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex max-w-md flex-col gap-1 pr-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl font-medium leading-tight tracking-display text-balance text-foreground sm:text-4xl",
					children: "Undula"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "max-w-xs text-pretty text-sm text-muted-foreground",
					children: "Drag across the surface. Waves expand, then settle."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-12 flex w-full justify-start sm:mb-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ControlDock, {
					viscosity,
					strength,
					palette,
					onViscosity: setViscosity,
					onStrength: setStrength,
					onPalette: setPalette,
					onClear: requestClear
				})
			})]
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RippleApp, {});
}
//#endregion
export { Home as component };
