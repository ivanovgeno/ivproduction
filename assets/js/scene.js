import * as THREE from 'https://esm.sh/three@0.165.0';
import { GLTFLoader } from 'https://esm.sh/three@0.165.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://esm.sh/three@0.165.0/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'https://esm.sh/three@0.165.0/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'https://esm.sh/three@0.165.0/examples/jsm/geometries/RoundedBoxGeometry.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const compactViewport = matchMedia('(max-width: 760px)').matches;

if (!reducedMotion && !compactViewport) {
  const stage = document.createElement('div');
  stage.className = 'scene-stage';
  stage.setAttribute('aria-hidden', 'true');

  const canvas = document.createElement('canvas');
  canvas.className = 'scene-canvas';
  canvas.dataset.sceneCanvas = '';

  const overlay = document.createElement('div');
  overlay.className = 'scene-overlay';
  stage.append(canvas, overlay);
  document.body.prepend(stage);

  try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
    camera.position.set(0, 0.1, 10.8);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.55));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.09;

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
      color: 0x090b0e,
      metalness: 0.68,
      roughness: 0.3,
      clearcoat: 0.65,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.35
    });
    const graphite = new THREE.MeshPhysicalMaterial({
      color: 0x15191e,
      metalness: 0.82,
      roughness: 0.28,
      clearcoat: 0.52,
      envMapIntensity: 1.3
    });
    const rubber = new THREE.MeshStandardMaterial({
      color: 0x050607,
      metalness: 0.08,
      roughness: 0.86
    });
    const gold = new THREE.MeshPhysicalMaterial({
      color: 0xd4af37,
      metalness: 1,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.65
    });
    const goldDark = new THREE.MeshPhysicalMaterial({
      color: 0x7d5208,
      metalness: 1,
      roughness: 0.24,
      clearcoat: 0.7,
      envMapIntensity: 1.45
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x101a28,
      metalness: 0.12,
      roughness: 0.035,
      transmission: 0.58,
      transparent: true,
      opacity: 0.94,
      thickness: 1.35,
      ior: 1.48,
      envMapIntensity: 1.7
    });
    const screen = new THREE.MeshPhysicalMaterial({
      color: 0x102233,
      emissive: 0x071521,
      emissiveIntensity: 0.38,
      roughness: 0.14,
      clearcoat: 1
    });

    const makeTextTexture = (text, width = 512, height = 160, fontSize = 74) => {
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = width;
      labelCanvas.height = height;
      const context = labelCanvas.getContext('2d');
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#f4f0e5';
      context.font = `700 ${fontSize}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, width / 2, height / 2);
      const texture = new THREE.CanvasTexture(labelCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return texture;
    };

    const createA7Fallback = () => {
      const cameraGroup = new THREE.Group();
      cameraGroup.name = 'A7StyleFallback';

      const body = new THREE.Mesh(new RoundedBoxGeometry(4.5, 2.8, 1.62, 8, 0.18), black);
      body.position.set(0, 0, 0);
      cameraGroup.add(body);

      const lowerBody = new THREE.Mesh(new RoundedBoxGeometry(4.15, 0.55, 1.52, 6, 0.12), graphite);
      lowerBody.position.set(-0.08, -1.35, 0);
      cameraGroup.add(lowerBody);

      const grip = new THREE.Mesh(new RoundedBoxGeometry(1.3, 2.3, 1.88, 8, 0.2), rubber);
      grip.position.set(1.82, -0.12, 0.1);
      grip.rotation.z = -0.045;
      cameraGroup.add(grip);

      const topPlate = new THREE.Mesh(new RoundedBoxGeometry(2.8, 0.46, 1.4, 6, 0.1), graphite);
      topPlate.position.set(-0.22, 1.55, 0);
      cameraGroup.add(topPlate);

      const viewfinder = new THREE.Mesh(new RoundedBoxGeometry(1.35, 0.95, 1.28, 6, 0.14), black);
      viewfinder.position.set(-0.28, 1.82, -0.03);
      cameraGroup.add(viewfinder);

      const eyecup = new THREE.Mesh(new RoundedBoxGeometry(0.82, 0.53, 0.2, 5, 0.1), rubber);
      eyecup.position.set(-0.28, 1.84, -0.72);
      cameraGroup.add(eyecup);

      const mount = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.22, 96), goldDark);
      mount.rotation.x = Math.PI / 2;
      mount.position.set(-2.28, 0.02, 0.01);
      cameraGroup.add(mount);

      const mountRing = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.045, 18, 128), gold);
      mountRing.rotation.y = Math.PI / 2;
      mountRing.position.set(-2.4, 0.02, 0.01);
      cameraGroup.add(mountRing);

      const lensGroup = new THREE.Group();
      lensGroup.name = 'Lens';
      lensGroup.position.set(-2.4, 0.02, 0.01);

      const addLensSection = (radius, length, material, x) => {
        const section = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 96), material);
        section.rotation.z = Math.PI / 2;
        section.position.x = x;
        lensGroup.add(section);
        return section;
      };

      addLensSection(1.27, 0.8, black, -0.38);
      addLensSection(1.22, 0.14, gold, -0.84);
      addLensSection(1.18, 0.82, rubber, -1.32);
      addLensSection(1.13, 0.12, goldDark, -1.78);
      addLensSection(1.09, 0.68, graphite, -2.16);
      addLensSection(1.02, 0.12, gold, -2.56);

      for (let index = 0; index < 15; index += 1) {
        const ridge = new THREE.Mesh(new THREE.TorusGeometry(1.185, 0.012, 8, 96), graphite);
        ridge.rotation.y = Math.PI / 2;
        ridge.position.x = -1.02 - index * 0.043;
        lensGroup.add(ridge);
      }

      const frontBezel = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.07, 20, 128), black);
      frontBezel.rotation.y = Math.PI / 2;
      frontBezel.position.x = -2.66;
      lensGroup.add(frontBezel);

      const frontGlass = new THREE.Mesh(new THREE.CircleGeometry(0.92, 128), glass);
      frontGlass.rotation.y = Math.PI / 2;
      frontGlass.position.x = -2.735;
      lensGroup.add(frontGlass);

      const innerGlass = new THREE.Mesh(
        new THREE.CircleGeometry(0.5, 96),
        new THREE.MeshPhysicalMaterial({
          color: 0x192032,
          metalness: 0.2,
          roughness: 0.02,
          transmission: 0.36,
          transparent: true,
          opacity: 0.86,
          envMapIntensity: 1.9
        })
      );
      innerGlass.rotation.y = Math.PI / 2;
      innerGlass.position.x = -2.75;
      lensGroup.add(innerGlass);
      cameraGroup.add(lensGroup);

      const rearScreen = new THREE.Mesh(new RoundedBoxGeometry(2.42, 1.5, 0.09, 5, 0.08), screen);
      rearScreen.position.set(-0.22, -0.03, -0.86);
      cameraGroup.add(rearScreen);

      const hotShoe = new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.1, 0.5, 4, 0.03), goldDark);
      hotShoe.position.set(-0.2, 2.31, 0.02);
      cameraGroup.add(hotShoe);

      const dialPositions = [0.55, 1.05, 1.48];
      dialPositions.forEach((position, index) => {
        const dial = new THREE.Mesh(
          new THREE.CylinderGeometry(index === 2 ? 0.24 : 0.31, index === 2 ? 0.24 : 0.31, 0.16, 48),
          index === 0 ? goldDark : graphite
        );
        dial.rotation.x = Math.PI / 2;
        dial.position.set(position, 1.82, -0.02);
        cameraGroup.add(dial);
      });

      const shutter = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.13, 48), gold);
      shutter.rotation.x = Math.PI / 2;
      shutter.position.set(1.5, 1.68, 0.39);
      cameraGroup.add(shutter);

      const sonyLabel = new THREE.Mesh(
        new THREE.PlaneGeometry(1.18, 0.34),
        new THREE.MeshBasicMaterial({ map: makeTextTexture('SONY', 512, 160, 72), transparent: true, depthWrite: false })
      );
      sonyLabel.position.set(-0.22, 1.31, 0.83);
      cameraGroup.add(sonyLabel);

      const alphaLabel = new THREE.Mesh(
        new THREE.PlaneGeometry(0.72, 0.38),
        new THREE.MeshBasicMaterial({ map: makeTextTexture('α7', 360, 180, 92), transparent: true, depthWrite: false })
      );
      alphaLabel.position.set(1.25, 0.62, 0.83);
      cameraGroup.add(alphaLabel);

      cameraGroup.rotation.set(-0.04, Math.PI * 0.78, 0.015);
      cameraGroup.scale.setScalar(0.92);
      return cameraGroup;
    };

    let activeModel = createA7Fallback();
    modelHolder.add(activeModel);
    stage.classList.add('is-ready', 'is-fallback-model');

    const haloGroup = new THREE.Group();
    haloGroup.position.set(2.5, 0, -1.2);
    scene.add(haloGroup);

    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    [2.75, 3.25, 3.85].forEach((radius, index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.012 + index * 0.004, 12, 180), haloMaterial.clone());
      ring.material.opacity = 0.16 - index * 0.035;
      ring.rotation.set(index * 0.28, index * 0.18, index * 0.34);
      haloGroup.add(ring);
    });

    const dustGeometry = new THREE.BufferGeometry();
    const dustCount = 180;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let index = 0; index < dustCount; index += 1) {
      dustPositions[index * 3] = (Math.random() - 0.5) * 15;
      dustPositions[index * 3 + 1] = (Math.random() - 0.5) * 9;
      dustPositions[index * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
    }
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dust = new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({
        color: 0xf2d978,
        size: 0.018,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    scene.add(dust);

    scene.add(new THREE.HemisphereLight(0xfff4dd, 0x080a0d, 1.08));
    const key = new THREE.DirectionalLight(0xffe4b0, 3.7);
    key.position.set(4.8, 5.7, 6.8);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xd4af37, 3.0);
    rim.position.set(-5.8, 1.8, 3.8);
    scene.add(rim);

    const cool = new THREE.PointLight(0x6783a3, 20, 19, 2.2);
    cool.position.set(2.5, -4.0, 3.5);
    scene.add(cool);

    const warmSpot = new THREE.SpotLight(0xffd66f, 32, 25, 0.42, 0.72, 1.3);
    warmSpot.position.set(4, 4.8, 5.8);
    warmSpot.target = rig;
    scene.add(warmSpot, warmSpot.target);

    const states = {
      hero:      { p:[2.6, .06, 0], r:[-.08, -.48, .025], s:1.04, z:10.7, f:33, e:1.1 },
      intro:     { p:[2.28, -.08, .15], r:[-.02, -.08, -.015], s:.96, z:10.15, f:34, e:1.04 },
      services:  { p:[2.02, -.12, .32], r:[-.04, .46, -.02], s:1.13, z:9.15, f:31, e:1.11 },
      premium:   { p:[2.72, .02, -.2], r:[-.11, -1.06, .04], s:.92, z:10.5, f:35, e:1.14 },
      portfolio: { p:[2.88, .08, -.28], r:[-.13, -1.38, .025], s:.85, z:11.0, f:36, e:1.06 },
      process:   { p:[1.92, -.08, .25], r:[-.03, .7, -.02], s:1.09, z:9.45, f:32, e:1.08 },
      contact:   { p:[1.68, .02, .42], r:[-.02, .98, 0], s:1.2, z:8.55, f:30, e:1.15 }
    };

    const stateMap = [
      ['.hero-3d', 'hero'],
      ['.manifesto', 'intro'],
      ['.experience-section', 'services'],
      ['.gold-stage', 'premium'],
      ['.selected-work', 'portfolio'],
      ['.process-section', 'process'],
      ['.final-cta', 'contact'],
      ['.service-hero', 'hero'],
      ['.service-intro', 'intro'],
      ['.service-benefits', 'services'],
      ['.package-section', 'premium'],
      ['.contact-hero', 'hero'],
      ['.inquiry-section', 'contact']
    ];

    let anchors = [];
    const rebuildAnchors = () => {
      const found = [];
      stateMap.forEach(([selector, stateName]) => {
        document.querySelectorAll(selector).forEach((element) => {
          const rect = element.getBoundingClientRect();
          found.push({ center: scrollY + rect.top + rect.height * 0.5, state: states[stateName] });
        });
      });
      anchors = found.sort((a, b) => a.center - b.center);
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const smoothstep = (value) => value * value * (3 - 2 * value);
    const mix = (a, b, amount) => a + (b - a) * amount;
    const mixArray = (a, b, amount) => a.map((value, index) => mix(value, b[index], amount));

    const sampleScrollState = () => {
      if (!anchors.length) return states.hero;
      const point = scrollY + innerHeight * 0.52;
      if (point <= anchors[0].center) return anchors[0].state;
      if (point >= anchors.at(-1).center) return anchors.at(-1).state;

      for (let index = 0; index < anchors.length - 1; index += 1) {
        const current = anchors[index];
        const next = anchors[index + 1];
        if (point >= current.center && point <= next.center) {
          const amount = smoothstep(clamp((point - current.center) / Math.max(1, next.center - current.center), 0, 1));
          return {
            p: mixArray(current.state.p, next.state.p, amount),
            r: mixArray(current.state.r, next.state.r, amount),
            s: mix(current.state.s, next.state.s, amount),
            z: mix(current.state.z, next.state.z, amount),
            f: mix(current.state.f, next.state.f, amount),
            e: mix(current.state.e, next.state.e, amount)
          };
        }
      }
      return states.hero;
    };

    const normalizeModel = (model) => {
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const largestDimension = Math.max(size.x, size.y, size.z) || 1;
      model.scale.setScalar(5.9 / largestDimension);
      model.rotation.set(-0.03, Math.PI * 0.78, 0.01);
    };

    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    const modelUrl = new URL('../3d/sony-a7.glb?v=20260622-signature3', import.meta.url).href;
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        model.traverse((object) => {
          if (!object.isMesh) return;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.filter(Boolean).forEach((material) => {
            material.envMapIntensity = Math.max(1.2, material.envMapIntensity || 0);
            if (material.map) {
              material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
              material.map.colorSpace = THREE.SRGBColorSpace;
            }
            material.needsUpdate = true;
          });
        });
        normalizeModel(model);
        modelHolder.remove(activeModel);
        activeModel = model;
        modelHolder.add(activeModel);
        stage.classList.remove('is-fallback-model');
        stage.classList.add('is-model-loaded');
        draco.dispose();
      },
      undefined,
      () => draco.dispose()
    );

    const pointer = { x:0, y:0, tx:0, ty:0 };
    addEventListener('pointermove', (event) => {
      pointer.tx = (event.clientX / innerWidth - 0.5) * 2;
      pointer.ty = (event.clientY / innerHeight - 0.5) * 2;
    }, { passive:true });

    const currentState = {
      p:[...states.hero.p],
      r:[...states.hero.r],
      s:states.hero.s,
      z:states.hero.z,
      f:states.hero.f,
      e:states.hero.e
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
    let frameId = 0;

    const render = () => {
      const elapsed = clock.getElapsedTime();
      const sampled = sampleScrollState();
      const ease = 0.045;

      pointer.x += (pointer.tx - pointer.x) * 0.035;
      pointer.y += (pointer.ty - pointer.y) * 0.035;

      currentState.p = mixArray(currentState.p, sampled.p, ease);
      currentState.r = mixArray(currentState.r, sampled.r, ease);
      currentState.s = mix(currentState.s, sampled.s, ease);
      currentState.z = mix(currentState.z, sampled.z, ease);
      currentState.f = mix(currentState.f, sampled.f, ease);
      currentState.e = mix(currentState.e, sampled.e, ease);

      rig.position.set(...currentState.p);
      rig.rotation.set(
        currentState.r[0] + pointer.y * 0.04,
        currentState.r[1] + pointer.x * 0.085,
        currentState.r[2] + Math.sin(elapsed * 0.36) * 0.008
      );
      rig.scale.setScalar(currentState.s);

      floatGroup.position.y = Math.sin(elapsed * 0.58) * 0.045;
      floatGroup.rotation.y = Math.sin(elapsed * 0.2) * 0.032;

      haloGroup.rotation.x = Math.sin(elapsed * 0.12) * 0.08;
      haloGroup.rotation.y = elapsed * 0.025;
      haloGroup.children.forEach((ring, index) => {
        ring.rotation.z = elapsed * (0.035 + index * 0.014) * (index % 2 ? -1 : 1);
      });
      dust.rotation.y = elapsed * 0.01;
      dust.position.y = Math.sin(elapsed * 0.23) * 0.08;

      camera.position.z = currentState.z;
      camera.position.y = 0.1 + pointer.y * 0.05;
      camera.fov = currentState.f;
      camera.updateProjectionMatrix();

      renderer.toneMappingExposure = currentState.e;
      key.position.x = 4.8 + pointer.x * 1.0;
      key.position.y = 5.7 - pointer.y * 0.6;
      warmSpot.intensity = 30 + Math.sin(elapsed * 0.6) * 2;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(render);
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(frameId);
      else render();
    });
    render();
  } catch (error) {
    stage.remove();
    console.warn('3D camera scene disabled.', error);
  }
}
