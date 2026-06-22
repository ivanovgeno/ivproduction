import * as THREE from 'https://esm.sh/three@0.165.0';
import { GLTFLoader } from 'https://esm.sh/three@0.165.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://esm.sh/three@0.165.0/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'https://esm.sh/three@0.165.0/examples/jsm/environments/RoomEnvironment.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const compactViewport = window.matchMedia('(max-width: 760px)').matches;

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
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.55));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.06;

        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
        pmrem.dispose();

        const rig = new THREE.Group();
        const floatGroup = new THREE.Group();
        const modelHolder = new THREE.Group();
        floatGroup.add(modelHolder);
        rig.add(floatGroup);
        scene.add(rig);

        const hemisphere = new THREE.HemisphereLight(0xfff4dd, 0x080a0d, 1.05);
        scene.add(hemisphere);

        const key = new THREE.DirectionalLight(0xffe4b0, 3.4);
        key.position.set(4.5, 5.5, 6.5);
        scene.add(key);

        const rim = new THREE.DirectionalLight(0xc89f57, 2.5);
        rim.position.set(-5.5, 1.5, 3.5);
        scene.add(rim);

        const cool = new THREE.PointLight(0x6f89a8, 18, 18, 2.2);
        cool.position.set(2.5, -3.8, 3.5);
        scene.add(cool);

        const states = {
            hero:      { p:[2.65, .05, 0], r:[-.08, -.48, .025], s:1.02, z:10.8, f:33, e:1.06 },
            intro:     { p:[2.35, -.08, .15], r:[-.02, -.08, -.015], s:.96, z:10.2, f:34, e:1.02 },
            services:  { p:[2.05, -.12, .32], r:[-.04, .42, -.02], s:1.12, z:9.25, f:31, e:1.08 },
            premium:   { p:[2.72, .02, -.2], r:[-.11, -1.02, .04], s:.9, z:10.55, f:35, e:1.1 },
            portfolio: { p:[2.9, .08, -.28], r:[-.13, -1.35, .025], s:.84, z:11.1, f:36, e:1.03 },
            process:   { p:[1.95, -.08, .25], r:[-.03, .66, -.02], s:1.08, z:9.55, f:32, e:1.05 },
            contact:   { p:[1.72, .02, .42], r:[-.02, .94, 0], s:1.2, z:8.65, f:30, e:1.11 }
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
                    found.push({
                        center: window.scrollY + rect.top + rect.height * .5,
                        state: states[stateName]
                    });
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
            const point = window.scrollY + window.innerHeight * .52;
            if (point <= anchors[0].center) return anchors[0].state;
            if (point >= anchors[anchors.length - 1].center) return anchors[anchors.length - 1].state;

            for (let index = 0; index < anchors.length - 1; index += 1) {
                const current = anchors[index];
                const next = anchors[index + 1];
                if (point >= current.center && point <= next.center) {
                    const raw = clamp((point - current.center) / Math.max(1, next.center - current.center), 0, 1);
                    const amount = smoothstep(raw);
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

        const draco = new DRACOLoader();
        draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

        const loader = new GLTFLoader();
        loader.setDRACOLoader(draco);

        const modelUrl = new URL('../3d/sony-a7.glb?v=20260622-elite2', import.meta.url).href;
        loader.load(
            modelUrl,
            (gltf) => {
                const model = gltf.scene;

                model.traverse((object) => {
                    if (!object.isMesh) return;
                    object.castShadow = false;
                    object.receiveShadow = false;
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    materials.filter(Boolean).forEach((material) => {
                        material.envMapIntensity = Math.max(1.15, material.envMapIntensity || 0);
                        if (material.map) {
                            material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                            material.map.colorSpace = THREE.SRGBColorSpace;
                        }
                        material.needsUpdate = true;
                    });
                });

                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center);

                const largestDimension = Math.max(size.x, size.y, size.z) || 1;
                const normalizedScale = 5.9 / largestDimension;
                modelHolder.scale.setScalar(normalizedScale);
                modelHolder.rotation.set(-.03, Math.PI * .78, .01);
                modelHolder.add(model);

                rebuildAnchors();
                stage.classList.add('is-ready');
            },
            undefined,
            () => {
                draco.dispose();
                stage.remove();
            }
        );

        const pointer = { x:0, y:0, tx:0, ty:0 };
        window.addEventListener('pointermove', (event) => {
            pointer.tx = (event.clientX / window.innerWidth - .5) * 2;
            pointer.ty = (event.clientY / window.innerHeight - .5) * 2;
        }, { passive:true });

        const targetPosition = new THREE.Vector3();
        const currentState = {
            p:[...states.hero.p],
            r:[...states.hero.r],
            s:states.hero.s,
            z:states.hero.z,
            f:states.hero.f,
            e:states.hero.e
        };

        const resize = () => {
            renderer.setSize(window.innerWidth, window.innerHeight, false);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            rebuildAnchors();
        };
        window.addEventListener('resize', resize, { passive:true });
        window.addEventListener('load', rebuildAnchors, { once:true });
        resize();

        const clock = new THREE.Clock();
        let frameId = 0;

        const render = () => {
            const elapsed = clock.getElapsedTime();
            const sampled = sampleScrollState();
            const ease = .045;

            pointer.x += (pointer.tx - pointer.x) * .035;
            pointer.y += (pointer.ty - pointer.y) * .035;

            currentState.p = mixArray(currentState.p, sampled.p, ease);
            currentState.r = mixArray(currentState.r, sampled.r, ease);
            currentState.s = mix(currentState.s, sampled.s, ease);
            currentState.z = mix(currentState.z, sampled.z, ease);
            currentState.f = mix(currentState.f, sampled.f, ease);
            currentState.e = mix(currentState.e, sampled.e, ease);

            targetPosition.set(...currentState.p);
            rig.position.copy(targetPosition);
            rig.rotation.set(
                currentState.r[0] + pointer.y * .035,
                currentState.r[1] + pointer.x * .075,
                currentState.r[2] + Math.sin(elapsed * .36) * .006
            );
            rig.scale.setScalar(currentState.s);

            floatGroup.position.y = Math.sin(elapsed * .58) * .035;
            floatGroup.rotation.y = Math.sin(elapsed * .19) * .025;

            camera.position.z = currentState.z;
            camera.position.y = .1 + pointer.y * .045;
            camera.fov = currentState.f;
            camera.updateProjectionMatrix();

            renderer.toneMappingExposure = currentState.e;
            key.position.x = 4.5 + pointer.x * .8;
            key.position.y = 5.5 - pointer.y * .45;

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
        console.warn('Premium 3D scene disabled.', error);
    }
}
