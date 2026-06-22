import * as THREE from 'https://cdn.jsdelivr.net/npm/three/build/three.module.js';

const canvas = document.querySelector('[data-hero-canvas]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && !prefersReducedMotion) {
    try {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
        camera.position.set(0, 0, 11.5);

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 700 ? 1.15 : 1.65));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.18;

        const lens = new THREE.Group();
        lens.rotation.set(-0.15, -0.38, 0.08);
        lens.position.set(window.innerWidth < 900 ? 1.5 : 2.45, 0.05, 0);
        scene.add(lens);

        const gold = new THREE.MeshPhysicalMaterial({
            color: 0xd4af37,
            metalness: 1,
            roughness: 0.16,
            clearcoat: 1,
            clearcoatRoughness: 0.08,
            reflectivity: 1,
            envMapIntensity: 1.4
        });
        const goldDark = new THREE.MeshStandardMaterial({ color: 0x76510a, metalness: 1, roughness: 0.25 });
        const blackMetal = new THREE.MeshStandardMaterial({ color: 0x090a0d, metalness: 0.92, roughness: 0.3 });
        const graphite = new THREE.MeshStandardMaterial({ color: 0x16181d, metalness: 0.8, roughness: 0.42 });
        const glass = new THREE.MeshPhysicalMaterial({
            color: 0x17110a,
            metalness: 0,
            roughness: 0.08,
            transmission: 0.72,
            thickness: 1.4,
            transparent: true,
            opacity: 0.82,
            ior: 1.48
        });

        const parts = [];
        const makeCylinder = (radius, depth, material, z, segments = 96) => {
            const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, segments, 1, false), material);
            mesh.rotation.x = Math.PI / 2;
            mesh.position.z = z;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            lens.add(mesh);
            parts.push({ mesh, baseZ: z });
            return mesh;
        };

        makeCylinder(2.42, 0.46, blackMetal, -0.62);
        makeCylinder(2.3, 0.16, goldDark, -0.34);
        makeCylinder(2.18, 0.72, graphite, 0.02);
        makeCylinder(2.07, 0.12, gold, 0.48);
        makeCylinder(1.92, 0.4, blackMetal, 0.69);
        makeCylinder(1.78, 0.12, gold, 0.96);
        makeCylinder(1.67, 0.14, blackMetal, 1.09);
        makeCylinder(1.53, 0.12, glass, 1.2);

        const frontGlass = new THREE.Mesh(new THREE.CircleGeometry(1.46, 96), glass);
        frontGlass.position.z = 1.28;
        lens.add(frontGlass);

        const iris = new THREE.Group();
        iris.position.z = 1.33;
        lens.add(iris);
        const bladeMaterial = new THREE.MeshStandardMaterial({ color: 0x080809, metalness: 0.72, roughness: 0.28, side: THREE.DoubleSide });
        for (let i = 0; i < 9; i += 1) {
            const shape = new THREE.Shape();
            shape.moveTo(0.1, -0.08);
            shape.lineTo(1.08, -0.43);
            shape.lineTo(1.38, 0.12);
            shape.lineTo(0.2, 0.22);
            shape.closePath();
            const blade = new THREE.Mesh(new THREE.ShapeGeometry(shape), bladeMaterial);
            blade.rotation.z = (i / 9) * Math.PI * 2;
            iris.add(blade);
        }

        const outerRing = new THREE.Mesh(new THREE.TorusGeometry(2.48, 0.045, 20, 160), gold);
        outerRing.position.z = 1.1;
        lens.add(outerRing);

        const detailRing = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.018, 12, 160), goldDark);
        detailRing.position.z = 0.58;
        lens.add(detailRing);

        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = window.innerWidth < 700 ? 320 : 680;
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i += 1) {
            const radius = 5 + Math.random() * 8;
            const angle = Math.random() * Math.PI * 2;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
            positions[i * 3 + 2] = Math.sin(angle) * radius - 2;
        }
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0xd4af37, size: 0.018, transparent: true, opacity: 0.4, depthWrite: false }));
        scene.add(particles);

        scene.add(new THREE.HemisphereLight(0xffefc2, 0x08080b, 1.15));
        const key = new THREE.PointLight(0xffe39a, 95, 18, 1.5);
        key.position.set(4.8, 4.5, 6.5);
        scene.add(key);
        const rim = new THREE.PointLight(0xd19c24, 110, 16, 1.65);
        rim.position.set(-5, -2.5, 3.5);
        scene.add(rim);
        const fill = new THREE.PointLight(0x5577aa, 28, 14, 2);
        fill.position.set(2, -5, 2);
        scene.add(fill);

        const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
        window.addEventListener('pointermove', (event) => {
            mouse.tx = (event.clientX / window.innerWidth - 0.5) * 2;
            mouse.ty = (event.clientY / window.innerHeight - 0.5) * 2;
        }, { passive: true });

        let scrollProgress = 0;
        const onScroll = () => {
            const heroHeight = document.querySelector('[data-hero]')?.offsetHeight || window.innerHeight;
            scrollProgress = Math.min(1, Math.max(0, window.scrollY / heroHeight));
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        const resize = () => {
            const width = canvas.clientWidth || window.innerWidth;
            const height = canvas.clientHeight || window.innerHeight;
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            lens.position.x = window.innerWidth < 700 ? 1.45 : window.innerWidth < 1000 ? 1.8 : 2.45;
            lens.scale.setScalar(window.innerWidth < 700 ? 0.72 : window.innerWidth < 1000 ? 0.84 : 1);
        };
        new ResizeObserver(resize).observe(canvas);
        resize();

        const clock = new THREE.Clock();
        let animationFrame;
        const render = () => {
            const t = clock.getElapsedTime();
            mouse.x += (mouse.tx - mouse.x) * 0.035;
            mouse.y += (mouse.ty - mouse.y) * 0.035;

            lens.rotation.y = -0.38 + mouse.x * 0.13 + t * 0.055 + scrollProgress * 0.58;
            lens.rotation.x = -0.15 + mouse.y * 0.08 - scrollProgress * 0.22;
            lens.rotation.z = 0.08 + Math.sin(t * 0.45) * 0.025;
            lens.position.y = Math.sin(t * 0.7) * 0.08 - scrollProgress * 0.7;

            parts.forEach((part, index) => {
                const spread = scrollProgress * (index - 3.5) * 0.14;
                part.mesh.position.z = part.baseZ + spread;
            });
            iris.rotation.z = -t * 0.06 - scrollProgress * 0.85;
            outerRing.rotation.z = t * 0.12;
            detailRing.rotation.z = -t * 0.08;
            particles.rotation.y = t * 0.012;
            particles.rotation.z = t * 0.006;
            key.position.x = 4.8 + mouse.x * 1.7;
            key.position.y = 4.5 - mouse.y * 1.2;

            renderer.render(scene, camera);
            animationFrame = requestAnimationFrame(render);
        };

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) cancelAnimationFrame(animationFrame);
            else render();
        });
        render();
    } catch (error) {
        canvas.classList.add('scene-fallback');
        console.warn('3D scene fallback activated.', error);
    }
}
