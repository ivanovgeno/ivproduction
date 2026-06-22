import * as THREE from 'https://esm.sh/three@0.165.0';
import { GLTFLoader } from 'https://esm.sh/three@0.165.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://esm.sh/three@0.165.0/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'https://esm.sh/three@0.165.0/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'https://esm.sh/three@0.165.0/examples/jsm/geometries/RoundedBoxGeometry.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const compact = matchMedia('(max-width: 760px)').matches;

if (!reduceMotion && !compact) {
  const stage = document.createElement('div');
  stage.className = 'scene-stage camera-v5';
  stage.setAttribute('aria-hidden', 'true');

  const canvas = document.createElement('canvas');
  canvas.className = 'scene-canvas';

  const overlay = document.createElement('div');
  overlay.className = 'scene-overlay';
  stage.append(canvas, overlay);
  document.body.prepend(stage);

  try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0.08, 12.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const rig = new THREE.Group();
    const floatGroup = new THREE.Group();
    const modelHolder = new THREE.Group();
    floatGroup.add(modelHolder);
    rig.add(floatGroup);
    scene.add(rig);

    const black = new THREE.MeshPhysicalMaterial({
      color: 0x0b0d10,
      metalness: 0.58,
      roughness: 0.27,
      clearcoat: 0.72,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.55
    });
    const graphite = new THREE.MeshPhysicalMaterial({
      color: 0x20252b,
      metalness: 0.76,
      roughness: 0.25,
      clearcoat: 0.5,
      envMapIntensity: 1.45
    });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x060708, metalness: 0.04, roughness: 0.9 });
    const gold = new THREE.MeshPhysicalMaterial({
      color: 0xd7b23f,
      metalness: 1,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.9
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x16283e,
      metalness: 0.12,
      roughness: 0.025,
      transmission: 0.52,
      transparent: true,
      opacity: 0.93,
      thickness: 1.5,
      ior: 1.5,
      envMapIntensity: 2
    });
    const screen = new THREE.MeshPhysicalMaterial({
      color: 0x102334,
      emissive: 0x071521,
      emissiveIntensity: 0.42,
      roughness: 0.12,
      clearcoat: 1
    });

    const rounded = (width, height, depth, radius, material) =>
      new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 8, radius), material);

    const labelTexture = (text, color = '#f5f0e5') => {
      const label = document.createElement('canvas');
      label.width = 512;
      label.height = 160;
      const ctx = label.getContext('2d');
      ctx.clearRect(0, 0, label.width, label.height);
      ctx.fillStyle = color;
      ctx.font = '700 74px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, label.width / 2, label.height / 2);
      const texture = new THREE.CanvasTexture(label);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return texture;
    };

    const createFallbackCamera = () => {
      const group = new THREE.Group();
      group.name = 'A7CameraV5';

      const body = rounded(4.65, 2.95, 1.72, 0.2, black);
      group.add(body);

      const lower = rounded(4.2, 0.48, 1.62, 0.1, graphite);
      lower.position.set(-0.08, -1.42, 0);
      group.add(lower);

      const grip = rounded(1.36, 2.35, 1.98, 0.22, rubber);
      grip.position.set(1.92, -0.16, 0.08);
      grip.rotation.z = -0.04;
      group.add(grip);

      const topPlate = rounded(2.8, 0.45, 1.42, 0.09, graphite);
      topPlate.position.set(-0.22, 1.64, 0);
      group.add(topPlate);

      const finder = rounded(1.38, 1.0, 1.28, 0.15, black);
      finder.position.set(-0.28, 1.92, -0.02);
      group.add(finder);

      const eyecup = rounded(0.86, 0.55, 0.2, 0.09, rubber);
      eyecup.position.set(-0.28, 1.92, -0.78);
      group.add(eyecup);

      const rearScreen = rounded(2.45, 1.5, 0.08, 0.07, screen);
      rearScreen.position.set(-0.2, -0.05, -0.9);
      group.add(rearScreen);

      const lens = new THREE.Group();
      lens.name = 'Lens';
      lens.position.set(-0.56, -0.02, 0.88);

      const barrel = (radius, length, material, z) => {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 96), material);
        mesh.rotation.x = Math.PI / 2;
        mesh.position.z = z;
        lens.add(mesh);
        return mesh;
      };

      barrel(1.34, 0.22, gold, 0.02);
      barrel(1.28, 0.62, black, 0.4);
      barrel(1.22, 0.12, gold, 0.77);
      barrel(1.18, 0.78, rubber, 1.22);
      barrel(1.12, 0.11, gold, 1.68);
      barrel(1.08, 0.64, graphite, 2.04);
      barrel(1.02, 0.1, gold, 2.42);

      for (let index = 0; index < 15; index += 1) {
        const ridge = new THREE.Mesh(new THREE.TorusGeometry(1.185, 0.012, 8, 96), graphite);
        ridge.position.z = 0.9 + index * 0.045;
        lens.add(ridge);
      }

      const bezel = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.07, 18, 128), black);
      bezel.position.z = 2.5;
      lens.add(bezel);

      const frontGlass = new THREE.Mesh(new THREE.CircleGeometry(0.91, 128), glass);
      frontGlass.position.z = 2.58;
      lens.add(frontGlass);

      const innerGlass = new THREE.Mesh(
        new THREE.CircleGeometry(0.49, 96),
        new THREE.MeshPhysicalMaterial({
          color: 0x243956,
          metalness: 0.15,
          roughness: 0.02,
          transmission: 0.32,
          transparent: true,
          opacity: 0.84,
          envMapIntensity: 2.2
        })
      );
      innerGlass.position.z = 2.6;
      lens.add(innerGlass);
      group.add(lens);

      const hotShoe = rounded(0.74, 0.11, 0.5, 0.03, gold);
      hotShoe.position.set(-0.2, 2.42, 0.02);
      group.add(hotShoe);

      [0.52, 1.04, 1.5].forEach((x, index) => {
        const dial = new THREE.Mesh(
          new THREE.CylinderGeometry(index === 2 ? 0.23 : 0.3, index === 2 ? 0.23 : 0.3, 0.15, 48),
          index === 0 ? gold : graphite
        );
        dial.rotation.x = Math.PI / 2;
        dial.position.set(x, 1.92, 0.03);
        group.add(dial);
      });

      const shutter = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.13, 48), gold);
      shutter.rotation.x = Math.PI / 2;
      shutter.position.set(1.53, 1.76, 0.42);
      group.add(shutter);

      const sony = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, 0.34),
        new THREE.MeshBasicMaterial({ map: labelTexture('SONY'), transparent: true, depthWrite: false })
      );
      sony.position.set(-0.55, 1.38, 0.88);
      group.add(sony);

      const alpha = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 0.36),
        new THREE.MeshBasicMaterial({ map: labelTexture('α7', '#e7c862'), transparent: true, depthWrite: false })
      );
      alpha.position.set(1.23, 0.63, 0.88);
      group.add(alpha);

      group.rotation.set(-0.12, -0.58, 0.04);
      group.scale.setScalar(0.82);
      return group;
    };

    let activeModel = createFallbackCamera();
    modelHolder.add(activeModel);
    stage.classList.add('is-ready', 'is-fallback-model');

    scene.add(new THREE.HemisphereLight(0xfff1cf, 0x05070a, 1.35));

    const key = new THREE.DirectionalLight(0xffe2a6, 5.2);
    key.position.set(5.5, 6.2, 7.5);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xe1b941, 4.4);
    rim.position.set(-5.8, 2.6, 5.4);
    scene.add(rim);

    const fill = new THREE.PointLight(0x6588b5, 24, 20, 2);
    fill.position.set(2.6, -4.2, 5.5);
    scene.add(fill);

    const frontLight = new THREE.PointLight(0xffd86d, 18, 16, 2);
    frontLight.position.set(-1.2, 1.1, 8);
    scene.add(frontLight);

    const halo = new THREE.Group();
    halo.position.set(2.45, 0, -2.4);
    [2.7, 3.25, 3.85].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.012 + index * 0.003, 10, 180),
        new THREE.MeshBasicMaterial({
          color: 0xe0b94b,
          transparent: true,
          opacity: 0.14 - index * 0.03,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      ring.rotation.set(index * 0.22, index * 0.16, index * 0.31);
      halo.add(ring);
    });
    scene.add(halo);

    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(150 * 3);
    for (let index = 0; index < 150; index += 1) {
      dustPositions[index * 3] = (Math.random() - 0.5) * 15;
      dustPositions[index * 3 + 1] = (Math.random() - 0.5) * 9;
      dustPositions[index * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
    }
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dust = new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({
        color: 0xf0d476,
        size: 0.018,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    scene.add(dust);

    const states = {
      hero:      { p:[2.45, .08, -.15], r:[-.02, -.08, .01], s:.92, z:12.2, f:35, e:1.18 },
      intro:     { p:[2.7, -.1, .15], r:[.02, .26, -.015], s:.84, z:12.5, f:36, e:1.12 },
      services:  { p:[2.05, -.05, .35], r:[-.03, .66, -.02], s:1.0, z:11.3, f:33, e:1.2 },
      premium:   { p:[2.75, .04, -.2], r:[-.08, -.42, .035], s:.86, z:12.4, f:36, e:1.24 },
      portfolio: { p:[2.9, .08, -.3], r:[-.1, -.82, .02], s:.78, z:12.8, f:37, e:1.14 },
      process:   { p:[2.0, -.06, .25], r:[-.02, .48, -.02], s:.94, z:11.7, f:34, e:1.17 },
      contact:   { p:[1.8, .02, .45], r:[-.01, .82, 0], s:1.04, z:10.9, f:32, e:1.24 }
    };

    const stateSelectors = [
      ['.hero-3d,.service-hero,.contact-hero', 'hero'],
      ['.manifesto,.service-intro', 'intro'],
      ['.experience-section,.service-benefits', 'services'],
      ['.gold-stage,.package-section', 'premium'],
      ['.selected-work', 'portfolio'],
      ['.process-section', 'process'],
      ['.final-cta,.inquiry-section', 'contact']
    ];

    let anchors = [];
    const rebuildAnchors = () => {
      const found = [];
      stateSelectors.forEach(([selector, stateName]) => {
        document.querySelectorAll(selector).forEach((element) => {
          const rect = element.getBoundingClientRect();
          found.push({ center: scrollY + rect.top + rect.height * 0.5, state: states[stateName] });
        });
      });
      anchors = found.sort((a, b) => a.center - b.center);
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const mix = (a, b, amount) => a + (b - a) * amount;
    const mixArray = (a, b, amount) => a.map((value, index) => mix(value, b[index], amount));
    const smoothstep = (value) => value * value * (3 - 2 * value);

    const sampleState = () => {
      if (!anchors.length) return states.hero;
      const point = scrollY + innerHeight * 0.52;
      if (point <= anchors[0].center) return anchors[0].state;
      if (point >= anchors.at(-1).center) return anchors.at(-1).state;

      for (let index = 0; index < anchors.length - 1; index += 1) {
        const current = anchors[index];
        const next = anchors[index + 1];
        if (point >= current.center && point <= next.center) {
          const progress = smoothstep(clamp((point - current.center) / Math.max(1, next.center - current.center), 0, 1));
          return {
            p: mixArray(current.state.p, next.state.p, progress),
            r: mixArray(current.state.r, next.state.r, progress),
            s: mix(current.state.s, next.state.s, progress),
            z: mix(current.state.z, next.state.z, progress),
            f: mix(current.state.f, next.state.f, progress),
            e: mix(current.state.e, next.state.e, progress)
          };
        }
      }
      return states.hero;
    };

    const normalizeImportedModel = (model) => {
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.scale.setScalar(5.4 / (Math.max(size.x, size.y, size.z) || 1));
      model.rotation.set(-0.1, -0.58, 0.03);
    };

    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    const modelUrl = new URL('../3d/sony-a7.glb?v=20260622-v5', import.meta.url).href;

    loader.load(modelUrl, (gltf) => {
      const model = gltf.scene;
      model.traverse((object) => {
        if (!object.isMesh) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.filter(Boolean).forEach((material) => {
          material.envMapIntensity = Math.max(1.3, material.envMapIntensity || 0);
          if (material.map) {
            material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
            material.map.colorSpace = THREE.SRGBColorSpace;
          }
          material.needsUpdate = true;
        });
      });
      normalizeImportedModel(model);
      modelHolder.remove(activeModel);
      activeModel = model;
      modelHolder.add(activeModel);
      stage.classList.remove('is-fallback-model');
      stage.classList.add('is-model-loaded');
      draco.dispose();
    }, undefined, () => draco.dispose());

    const pointer = { x:0, y:0, tx:0, ty:0 };
    addEventListener('pointermove', (event) => {
      pointer.tx = (event.clientX / innerWidth - 0.5) * 2;
      pointer.ty = (event.clientY / innerHeight - 0.5) * 2;
    }, { passive:true });

    const current = {
      p:[...states.hero.p], r:[...states.hero.r], s:states.hero.s,
      z:states.hero.z, f:states.hero.f, e:states.hero.e
    };

    const resize = () => {
      renderer.setSize(innerWidth, innerHeight, false);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      rebuildAnchors();
    };
    addEventListener('resize', resize, { passive:true });
    addEventListener('load', rebuildAnchors, { once:true });
    resize();

    const clock = new THREE.Clock();
    let frame = 0;
    const render = () => {
      const elapsed = clock.getElapsedTime();
      const target = sampleState();
      const ease = 0.045;

      pointer.x += (pointer.tx - pointer.x) * 0.035;
      pointer.y += (pointer.ty - pointer.y) * 0.035;
      current.p = mixArray(current.p, target.p, ease);
      current.r = mixArray(current.r, target.r, ease);
      current.s = mix(current.s, target.s, ease);
      current.z = mix(current.z, target.z, ease);
      current.f = mix(current.f, target.f, ease);
      current.e = mix(current.e, target.e, ease);

      rig.position.set(...current.p);
      rig.rotation.set(
        current.r[0] + pointer.y * 0.025,
        current.r[1] + pointer.x * 0.055,
        current.r[2] + Math.sin(elapsed * 0.34) * 0.006
      );
      rig.scale.setScalar(current.s);
      floatGroup.position.y = Math.sin(elapsed * 0.58) * 0.04;
      floatGroup.rotation.y = Math.sin(elapsed * 0.18) * 0.018;

      halo.rotation.y = elapsed * 0.02;
      halo.children.forEach((ring, index) => {
        ring.rotation.z = elapsed * (0.03 + index * 0.012) * (index % 2 ? -1 : 1);
      });
      dust.rotation.y = elapsed * 0.008;
      dust.position.y = Math.sin(elapsed * 0.22) * 0.07;

      camera.position.z = current.z;
      camera.position.y = 0.08 + pointer.y * 0.035;
      camera.fov = current.f;
      camera.updateProjectionMatrix();
      renderer.toneMappingExposure = current.e;
      key.position.x = 5.5 + pointer.x * 0.8;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(frame);
      else render();
    });
    render();
  } catch (error) {
    stage.remove();
    console.warn('Camera V5 disabled.', error);
  }
}
