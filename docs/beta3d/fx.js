/* fx.js — posproceso: render HDR con MSAA, bloom, tonos de película (ACES), aberración cromática, viñeta y grano. */
(() => {
  const Q = window.QX;
  const FinalShader = {
    uniforms: { tDiffuse: { value: null }, time: { value: 0 }, exposure: { value: 1.2 }, resolution: { value: new THREE.Vector2(1, 1) }, grain: { value: 0.045 }, vig: { value: 0.62 }, ca: { value: 0.0022 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float time, exposure, grain, vig, ca; uniform vec2 resolution; varying vec2 vUv;
      vec3 aces(vec3 x){ const float a=2.51, b=0.03, c=2.43, d=0.59, e=0.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0); }
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec2 d = vUv - 0.5; float r2 = dot(d, d);
        vec3 col;
        col.r = texture2D(tDiffuse, vUv + d * ca * r2 * 9.0).r;
        col.g = texture2D(tDiffuse, vUv).g;
        col.b = texture2D(tDiffuse, vUv - d * ca * r2 * 9.0).b;
        col *= exposure;
        col = aces(col);
        col = pow(col, vec3(1.0 / 2.2));
        float v = smoothstep(0.95, 0.2, length(d) * 1.25);
        col *= mix(1.0 - vig, 1.0, v);
        col = mix(col, vec3(dot(col, vec3(0.299, 0.587, 0.114))), 0.08);
        col += (hash(vUv * resolution + fract(time) * 100.0) - 0.5) * grain * (1.0 - dot(col, vec3(0.33)) * 0.6);
        gl_FragColor = vec4(col, 1.0);
      }`,
  };

  Q.initFX = (renderer, scene, camera, pr) => {
    const fx = { on: false, composer: null, bloom: null, final: null };
    try {
      if (!THREE.EffectComposer || !THREE.UnrealBloomPass) throw new Error('sin posproceso');
      const gl2 = renderer.capabilities.isWebGL2;
      const hdr = gl2 && renderer.extensions.has('EXT_color_buffer_float');
      const opts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: hdr ? THREE.HalfFloatType : THREE.UnsignedByteType };
      const w = Math.floor(innerWidth * pr), h = Math.floor(innerHeight * pr);
      const rt = gl2 && THREE.WebGLMultisampleRenderTarget ? new THREE.WebGLMultisampleRenderTarget(w, h, opts) : new THREE.WebGLRenderTarget(w, h, opts);
      if (rt.samples !== undefined) rt.samples = 4;
      const composer = new THREE.EffectComposer(renderer, rt);
      composer.addPass(new THREE.RenderPass(scene, camera));
      const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.48, 0.65, 0.9);
      composer.addPass(bloom);
      const fin = new THREE.ShaderPass(FinalShader);
      composer.addPass(fin);
      Object.assign(fx, { on: true, composer, bloom, final: fin, hdr });
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.outputEncoding = THREE.LinearEncoding;
    } catch (e) { console.warn('Posproceso desactivado:', e.message); fx.on = false; }

    fx.resize = (cssW, cssH, ratio) => {
      if (!fx.on) return;
      fx.composer.setPixelRatio(ratio); fx.composer.setSize(cssW, cssH);
      fx.final.uniforms.resolution.value.set(cssW * ratio, cssH * ratio);
    };
    fx.render = (t) => {
      if (!fx.on) return false;
      fx.final.uniforms.time.value = t;
      fx.composer.render();
      return true;
    };
    return fx;
  };
})();
