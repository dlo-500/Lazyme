import { paletteById, type PaletteId } from "./palettes";
import { RENDER_FS, SIM_FS, VERT } from "./shaders";

const STEP = 1 / 60;
const MAX_STEPS = 4;
const MAX_DROPS = 12;
const DPR_CAP = 2;

interface Drop {
  x: number;
  y: number;
  amp: number;
  radius: number;
}

interface SimUniforms {
  uCurr: WebGLUniformLocation | null;
  uTexel: WebGLUniformLocation | null;
  uDamping: WebGLUniformLocation | null;
  uTravel: WebGLUniformLocation | null;
  uDiffuse: WebGLUniformLocation | null;
  uEncode: WebGLUniformLocation | null;
  uDrops: WebGLUniformLocation | null;
  uDropCount: WebGLUniformLocation | null;
  uAspect: WebGLUniformLocation | null;
}

interface RenderUniforms {
  uCurr: WebGLUniformLocation | null;
  uTexel: WebGLUniformLocation | null;
  uEncode: WebGLUniformLocation | null;
  uAspect: WebGLUniformLocation | null;
  uTime: WebGLUniformLocation | null;
  uLight: WebGLUniformLocation | null;
  uC0: WebGLUniformLocation | null;
  uC1: WebGLUniformLocation | null;
  uC2: WebGLUniformLocation | null;
  uC3: WebGLUniformLocation | null;
  uSpec: WebGLUniformLocation | null;
}

export interface EngineParams {
  viscosity: number;
  strength: number;
  palette: PaletteId;
}

export class RippleEngine {
  readonly canvas: HTMLCanvasElement;
  readonly ok: boolean;
  readonly error: string | null;

  private gl: WebGL2RenderingContext | null = null;
  private useFloat = false;
  private simW = 1;
  private simH = 1;
  private tex: [WebGLTexture, WebGLTexture] | null = null;
  private fbo: [WebGLFramebuffer, WebGLFramebuffer] | null = null;
  private curr = 0;
  private simProg: WebGLProgram | null = null;
  private renderProg: WebGLProgram | null = null;
  private simUni: SimUniforms | null = null;
  private renderUni: RenderUniforms | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private quad: WebGLBuffer | null = null;

  private pending: Drop[] = [];
  private params: EngineParams = { viscosity: 0.32, strength: 0.68, palette: "abyss" };
  private pointer: { x: number; y: number; down: boolean } | null = null;
  private lastPointer: { x: number; y: number } | null = null;
  private light = { x: 0.35, y: 0.45 };
  private time = 0;
  private lastMs = 0;
  private accum = 0;
  private raf = 0;
  private running = false;
  private resizeObs: ResizeObserver | null = null;
  private disposed = false;
  private encode = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
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

  setParams(params: EngineParams) {
    this.params = params;
  }

  clear() {
    const gl = this.gl;
    if (!gl || !this.fbo) return;
    if (this.useFloat) gl.clearColor(0, 0, 0, 1);
    else gl.clearColor(0.5, 0.5, 0, 1);
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

  queueDrop(x: number, y: number, amp: number, radius: number) {
    this.pending.push({
      x: clamp01(x),
      y: clamp01(y),
      amp,
      radius,
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

  private boot(gl: WebGL2RenderingContext) {
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
      uDrops:
        gl.getUniformLocation(this.simProg, "uDrops[0]") ??
        gl.getUniformLocation(this.simProg, "uDrops"),
      uDropCount: gl.getUniformLocation(this.simProg, "uDropCount"),
      uAspect: gl.getUniformLocation(this.simProg, "uAspect"),
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
      uSpec: gl.getUniformLocation(this.renderProg, "uSpec"),
    };

    this.vao = gl.createVertexArray();
    this.quad = gl.createBuffer();
    if (!this.vao || !this.quad) throw new Error("Could not allocate geometry.");
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.layout();
    this.bindInput();
    this.resizeObs = new ResizeObserver(() => this.layout());
    this.resizeObs.observe(this.canvas);
  }

  private bindInput() {
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
    this.canvas.addEventListener("pointerleave", this.onPointerLeave);
    this.canvas.addEventListener("contextmenu", prevent);
    window.addEventListener("keydown", this.onKey);
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  private layout() {
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
    let simW: number;
    let simH: number;
    if (aspect >= 1) {
      simW = long;
      simH = Math.max(160, Math.round(long / aspect));
    } else {
      simH = long;
      simW = Math.max(160, Math.round(long * aspect));
    }
    simW = Math.max(160, simW & ~1);
    simH = Math.max(160, simH & ~1);

    if (simW === this.simW && simH === this.simH && this.tex) return;
    this.rebuildTargets(gl, simW, simH);
  }

  private rebuildTargets(gl: WebGL2RenderingContext, w: number, h: number) {
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

    if (!fboComplete(gl, fboA) || !fboComplete(gl, fboB)) {
      throw new Error("Could not allocate the ripple field.");
    }

    this.tex = [texA, texB];
    this.fbo = [fboA, fboB];
    this.simW = w;
    this.simH = h;
    this.curr = 0;
    this.clear();
    if (this.running) this.prewarm();
  }

  private prewarm() {
    const seeds: Array<[number, number, number]> = [
      [0.34, 0.42, 0.95],
      [0.62, 0.55, 0.72],
      [0.48, 0.3, 0.55],
      [0.72, 0.36, 0.4],
      [0.28, 0.68, 0.48],
    ];
    for (const [x, y, a] of seeds) this.queueDrop(x, y, a, 0.028);
    for (let i = 0; i < 36; i++) {
      if (i === 10) this.queueDrop(0.52, 0.48, 0.7, 0.024);
      if (i === 18) this.queueDrop(0.4, 0.58, 0.5, 0.022);
      this.simStep();
    }
  }

  private tick = (ms: number) => {
    if (!this.running || this.disposed) return;
    this.raf = requestAnimationFrame(this.tick);
    if (document.visibilityState === "hidden") {
      this.lastMs = 0;
      return;
    }
    if (!this.lastMs) this.lastMs = ms;
    let dt = (ms - this.lastMs) / 1000;
    this.lastMs = ms;
    if (dt > 0.1) dt = 0.1;
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

  private sampleHeldPointer() {
    const p = this.pointer;
    if (!p?.down) return;
    if (this.lastPointer) {
      const dist = Math.hypot(p.x - this.lastPointer.x, p.y - this.lastPointer.y);
      if (dist > 0.001) this.trace(this.lastPointer.x, this.lastPointer.y, p.x, p.y, 1);
      else this.impulse(p.x, p.y, 0.28);
    } else {
      this.impulse(p.x, p.y, 1.15);
    }
    this.lastPointer = { x: p.x, y: p.y };
  }

  private simStep() {
    const gl = this.gl;
    const prog = this.simProg;
    const uni = this.simUni;
    if (!gl || !prog || !uni || !this.fbo || !this.tex) return;

    const visc = this.params.viscosity;
    const damping = lerp(0.9965, 0.938, visc);
    const travel = lerp(0.4, 0.16, visc);
    const diffuse = visc * 0.085;

    const drops = this.pending.splice(0, MAX_DROPS);
    const packed = new Float32Array(MAX_DROPS * 4);
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

  private render() {
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

  private updateLight(dt: number) {
    const targetX = this.pointer ? (this.pointer.x - 0.5) * 1.4 : Math.sin(this.time * 0.23) * 0.35;
    const targetY = this.pointer ? (0.5 - this.pointer.y) * 1.2 : Math.cos(this.time * 0.17) * 0.28;
    const k = 1 - Math.exp(-3.2 * dt);
    this.light.x += (targetX - this.light.x) * k;
    this.light.y += (targetY - this.light.y) * k;
  }

  private uvFromEvent(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / Math.max(rect.width, 1);
    const y = (e.clientY - rect.top) / Math.max(rect.height, 1);
    return { x: clamp01(x), y: clamp01(y) };
  }

  private impulse(x: number, y: number, scale: number) {
    const s = this.params.strength;
    const amp = lerp(0.16, 1.22, s) * scale;
    const radius = lerp(0.016, 0.04, s);
    this.queueDrop(x, y, amp, radius);
  }

  private trace(x0: number, y0: number, x1: number, y1: number, scale: number) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const vel = dist * 18;
    const boost = 1 + Math.min(1.4, vel * 0.35);
    const spacing = 0.018;
    const steps = Math.min(MAX_DROPS, Math.max(1, Math.round(dist / spacing)));
    const s = this.params.strength;
    const amp = (lerp(0.12, 0.95, s) * scale * boost) / Math.max(1, steps * 0.55);
    const radius = lerp(0.014, 0.034, s);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      this.queueDrop(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, amp, radius);
    }
  }

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    this.canvas.setPointerCapture(e.pointerId);
    const uv = this.uvFromEvent(e);
    this.pointer = { ...uv, down: true };
    this.lastPointer = uv;
    this.impulse(uv.x, uv.y, 1.25);
  };

  private onPointerMove = (e: PointerEvent) => {
    const uv = this.uvFromEvent(e);
    const down = this.pointer?.down ?? (e.buttons & 1) !== 0;
    if (down) {
      this.pointer = { ...uv, down: true };
      return;
    }
    if (e.pointerType !== "mouse") return;
    const prev = this.pointer;
    this.pointer = { ...uv, down: false };
    if (prev && Math.hypot(uv.x - prev.x, uv.y - prev.y) > 0.003) {
      this.trace(prev.x, prev.y, uv.x, uv.y, 0.22);
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.canvas.hasPointerCapture(e.pointerId)) {
      this.canvas.releasePointerCapture(e.pointerId);
    }
    const uv = this.uvFromEvent(e);
    const hover = e.pointerType === "mouse";
    this.pointer = hover ? { ...uv, down: false } : null;
    this.lastPointer = hover ? uv : null;
  };

  private onPointerLeave = () => {
    if (this.pointer?.down) return;
    this.pointer = null;
    this.lastPointer = null;
  };

  private onKey = (e: KeyboardEvent) => {
    if (e.code === "KeyC" && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      this.clear();
    }
  };

  private onVisibility = () => {
    if (document.visibilityState === "visible") this.lastMs = 0;
  };
}

function prevent(e: Event) {
  e.preventDefault();
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function link(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string) {
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

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
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

function makeHeightTex(gl: WebGL2RenderingContext, w: number, h: number, useFloat: boolean) {
  const tex = gl.createTexture();
  if (!tex) throw new Error("Could not create texture.");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (useFloat) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  } else {
    const rest = new Uint8Array(w * h * 4);
    for (let i = 0; i < rest.length; i += 4) {
      rest[i] = 128;
      rest[i + 1] = 128;
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, rest);
  }
  return tex;
}

function makeFbo(gl: WebGL2RenderingContext, tex: WebGLTexture) {
  const fbo = gl.createFramebuffer();
  if (!fbo) throw new Error("Could not create framebuffer.");
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return fbo;
}

function fboComplete(gl: WebGL2RenderingContext, fbo: WebGLFramebuffer) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return status === gl.FRAMEBUFFER_COMPLETE;
}
