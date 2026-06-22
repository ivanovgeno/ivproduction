import * as THREE from 'https://esm.sh/three@0.165.0';
import { GLTFLoader } from 'https://esm.sh/three@0.165.0/examples/jsm/loaders/GLTFLoader.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reducedMotion) {
    const stylesheetUrl = new URL('../css/camera-scene.css', import.meta.url).href;
    if (!document.querySelector(`link[href="${stylesheetUrl}"]`)) {
        const stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = stylesheetUrl;
        document.head.append(stylesheet);
    }

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
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
        camera.position.set(0, 0.15, 11);

        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 700 ? 1.15 : 1.65));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;

        const rig = new THREE.Group();
        const modelPivot = new THREE.Group();
        rig.add(modelPivot);
        scene.add(rig);

        const gold = new THREE.MeshPhysicalMaterial({
            color: 0xd4af37,
            metalness: 1,
            roughness: 0.17,
            clearcoat: 1,
            clearcoatRoughness: 0.06,
            reflectivity: 1
        });
        const goldDark = new THREE.MeshPhysicalMaterial({
            color: 0x76510a,
            metalness: 1,
            roughness: 0.25,
            clearcoat: 0.65
        });
        const bodyMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x0c0d10,
            metalness: 0.72,
            roughness: 0.31,
            clearcoat: 0.58,
            clearcoatRoughness: 0.14
        });
        const rubberMaterial = new THREE.MeshStandardMaterial({
            color: 0x050607,
            metalness: 0.12,
            roughness: 0.78
        });
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x121926,
            roughness: 0.05,
            metalness: 0.05,
            transmission: 0.5,
            thickness: 1.3,
            transparent: true,
            opacity: 0.88,
            ior: 1.48
        });
        const screenMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x101b27,
            roughness: 0.16,
            metalness: 0.2,
            clearcoat: 1,
            emissive: 0x07111b,
            emissiveIntensity: 0.28
        });

        const createFallbackCamera = () => {
            const group = new THREE.Group();
            group.name = 'A7Fallback';

            const body = new THREE.Mesh(new THREE.BoxGeometry(4.3, 2.65, 1.55, 4, 3, 2), bodyMaterial);
            body.position.set(0.05, 0, 0);
            group.add(body);

            const shoulder = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.52, 1.42), bodyMaterial);
            shoulder.position.set(-0.25, 1.45, 0);
            group.add(shoulder);

            const viewfinder = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.84, 1.22), bodyMaterial);
            viewfinder.position.set(-0.22, 1.72, -0.02);
            viewfinder.rotation.z = -0.02;
            group.add(viewfinder);

            const eyecup = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.45, 0.16), rubberMaterial);
            eyecup.position.set(-0.22, 1.74, -0.7);
            group.add(eyecup);

            const grip = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.15, 1.72, 2, 4, 2), rubberMaterial);
            grip.position.set(1.8, -0.12, 0.08);
            grip.rotation.z = -0.055;
            group.add(grip);

            const mount = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.24, 96), goldDark);
            mount.rotation.x = Math.PI / 2;
            mount.position.set(-2.16, 0.03, 0);
            group.add(mount);

            const lens = new THREE.Group();
            lens.name = 'Lens';
            lens.position.set(-2.32, 0.03, 0);
            lens.rotation.y = -Math.PI / 2;

            const addLensPart = (radius, length, material, x) => {
                const part = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 96), material);
                part.rotation.z = Math.PI / 2;
                part.position.x = x;
                lens.add(part);
                return part;
            };

            addLensPart(1.22, 0.82, bodyMaterial, -0.42);
            addLensPart(1.17, 0.12, gold, -0.88);
            addLensPart(1.14, 0.84, rubberMaterial, -1.34);
            addLensPart(1.08, 0.1, goldDark, -1.8);
            addLensPart(1.03, 0.66, bodyMaterial, -2.15);

            const focusRing = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.035, 16, 120), gold);
            focusRing.rotation.y = Math.PI / 2;
            focusRing.position.x = -1.06;
            lens.add(focusRing);

            const frontGlass = new THREE.Mesh(new THREE.CircleGeometry(0.92, 96), glassMaterial);
            frontGlass.rotation.y = Math.PI / 2;
            frontGlass.position.x = -2.5;
            lens.add(frontGlass);
            group.add(lens);

            const screen = new THREE.Mesh(new THREE.BoxGeometry(2.25, 1.42, 0.08), screenMaterial);
            screen.position.set(-0.15, 0, -0.83);
            group.add(screen);

            const hotShoe = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.1, 0.46), goldDark);
            hotShoe.position.set(-0.1, 2.19, 0.02);
            group.add(hotShoe);

            for (let i = 0; i < 3; i += 1) {
                const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.15, 32), i === 0 ? goldDark : bodyMaterial);
                dial.position.set(0.65 + i * 0.47, 1.78, -0.05);
                dial.rotation.x = Math.PI / 2;
                group.add(dial);
            }

            const shutter = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 32), gold);
            shutter.position.set(1.42, 1.61, 0.36);
            shutter.rotation.x = Math.PI / 2;
            group.add(shutter);

            const labelCanvas = document.createElement('canvas');
            labelCanvas.width = 256;
            labelCanvas.height = 128;
            const context = labelCanvas.getContext('2d');
            context.clearRect(0, 0, 256, 128);
            context.fillStyle = '#f3d878';
            context.font = '600 58px Arial';
            context.fillText('α7', 26, 78);
            const labelTexture = new THREE.CanvasTexture(labelCanvas);
            labelTexture.colorSpace = THREE.SRGBColorSpace;
            const label = new THREE.Mesh(
                new THREE.PlaneGeometry(0.78, 0.38),
                new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, depthWrite: false })
            );
            label.position.set(1.15, 0.58, 0.79);
            group.add(label);

            group.rotation.set(-0.06, -0.12, 0.02);
            return group;
        };

        let activeModel = createFallbackCamera();
        modelPivot.add(activeModel);

        const normalizeModel = (model) => {
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            const largest = Math.max(size.x, size.y, size.z) || 1;
            model.scale.setScalar(5.7 / largest);
            model.rotation.set(-0.04, Math.PI * 0.78, 0.015);
        };

        const modelUrl = new URL('../3d/sony-a7.glb', import.meta.url).href;
        new GLTFLoader().load(
            modelUrl,
            (gltf) => {
                const loaded = gltf.scene;
                loaded.traverse((child) => {
                    if (!child.isMesh) return;
                    child.castShadow = false;
                    child.receiveShadow = false;
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map((material) => material.clone());
                    } else if (child.material) {
                        child.material = child.material.clone();
                        child.material.envMapIntensity = 1.3;
                    }
                });
                normalizeModel(loaded);
                modelPivot.remove(activeModel);
                activeModel = loaded;
                modelPivot.add(activeModel);
                stage.classList.add('is-model-loaded');
            },
            undefined,
            () => stage.classList.add('is-fallback-model')
        );

        scene.add(new THREE.HemisphereLight(0xfff0c8, 0x06070a, 1.05));
        const key = new THREE.PointLight(0xffdda0, 115, 25, 1.65);
        key.position.set(5.2, 4.5, 6.4);
        scene.add(key);
        const rim = new THREE.PointLight(0xd4af37, 128, 23, 1.55);
        rim.position.set(-5.4, -2.4, 4.4);
        scene.add(rim);
        const fill = new THREE.PointLight(0x5879a8, 28, 16, 2);
        fill.position.set(2.4, -4.4, 2.8);
        scene.add(fill);
        const top = new THREE.SpotLight(0xffedbd, 46, 30, 0.62, 0.7, 1.2);
        top.position.set(0, 8, 7);
        top.target = rig;
        scene.add(top, top.target);

        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = window.innerWidth < 700 ? 100 : 220;
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i += 1) {
            const radius = 5 + Math.random() * 9;
            const angle = Math.random() * Math.PI * 2;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
            positions[i * 3 + 2] = Math.sin(angle) * radius - 3;
        }
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particles = new THREE.Points(
            particleGeometry,
            new THREE.PointsMaterial({ color: 0xd4af37, size: 0.018, transparent: true, opacity: 0.2, depthWrite: false })
        );
        scene.add(particles);

        const states = {
            hero: { pos: [2.45, 0.12, 0], rot: [-0.12, -0.5, 0.045], scale: 1.05, camZ: 11 },
            intro: { pos: [2.18, -0.02, 0.1], rot: [-0.07, -0.15, -0.015], scale: 1, camZ: 10.35 },
            services: { pos: [2.05, -0.08, 0.22], rot: [-0.04, 0.32, -0.025], scale: 1.18, camZ: 9.35 },
            premium: { pos: [2.5, 0.02, -0.1], rot: [-0.11, -0.98, 0.05], scale: 0.98, camZ: 10.2 },
            portfolio: { pos: [2.78, 0.08, -0.16], rot: [-0.15, -1.26, 0.035], scale: 0.92, camZ: 10.7 },
            process: { pos: [1.95, -0.1, 0.18], rot: [-0.04, 0.58, -0.02], scale: 1.15, camZ: 9.6 },
            contact: { pos: [1.72, 0, 0.38], rot: [-0.03, 0.92, 0], scale: 1.26, camZ: 8.85 }
        };

        const sectionMap = [
            ['.hero-3d', 'hero'],
            ['.manifesto', 'intro'],
            ['.experience-section', 'services'],
            ['.gold-stage', 'premium'],
            ['.selected-work', 'portfolio'],
            ['.process-section', 'process'],
            ['.final-cta', 'contact'],
            ['.service-hero', 'hero'],
            ['.service-benefits', 'services'],
            ['.package-section', 'premium'],
            ['.contact-hero', 'hero'],
            ['.inquiry-section', 'contact']
        ];

        let currentState = states.hero;
        const sectionObserver = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible?.target?.dataset?.sceneState && states[visible.target.dataset.sceneState]) {
                currentState = states[visible.target.dataset.sceneState];
            }
        }, { threshold: [0.22, 0.4, 0.6], rootMargin: '-10% 0px -18% 0px' });

        sectionMap.forEach(([selector, stateName]) => {
            document.querySelectorAll(selector).forEach((section) => {
                section.dataset.sceneState = stateName;
                sectionObserver.observe(section);
            });
        });

        const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        window.addEventListener('pointermove', (event) => {
            mouse.targetX = (event.clientX / window.innerWidth - 0.5) * 2;
            mouse.targetY = (event.clientY / window.innerHeight - 0.5) * 2;
        }, { passive: true });

        const resize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            const mobileScale = width < 700 ? 0.7 : width < 1000 ? 0.84 : 1;
            modelPivot.scale.setScalar(mobileScale);
        };
        window.addEventListener('resize', resize, { passive: true });
        resize();

        const targetPosition = new THREE.Vector3();
        const clock = new THREE.Clock();
        let frameId;
        const render = () => {
            const time = clock.getElapsedTime();
            mouse.x += (mouse.targetX - mouse.x) * 0.035;
            mouse.y += (mouse.targetY - mouse.y) * 0.035;

            targetPosition.set(...currentState.pos);
            rig.position.lerp(targetPosition, 0.042);
            rig.rotation.x += (currentState.rot[0] + mouse.y * 0.045 - rig.rotation.x) * 0.045;
            rig.rotation.y += (currentState.rot[1] + mouse.x * 0.1 - rig.rotation.y) * 0.045;
            rig.rotation.z += (currentState.rot[2] + Math.sin(time * 0.42) * 0.012 - rig.rotation.z) * 0.045;

            const nextScale = rig.scale.x + (currentState.scale - rig.scale.x) * 0.045;
            rig.scale.setScalar(nextScale);
            camera.position.z += (currentState.camZ - camera.position.z) * 0.045;
            camera.position.y += (0.15 + mouse.y * 0.07 - camera.position.y) * 0.03;

            modelPivot.position.y = Math.sin(time * 0.72) * 0.05;
            modelPivot.rotation.y += 0.0019;
            particles.rotation.y = time * 0.018;
            particles.rotation.z = time * 0.004;
            key.position.x = 5.2 + mouse.x * 1.25;
            key.position.y = 4.5 - mouse.y * 0.85;

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
        console.warn('3D camera scene fallback activated.', error);
    }
}
