// https://codepen.io/recursiveElk/pen/rXaoKY
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { useEffect, useRef } from "react";

/**
 * MyThreeSTL
 * Props:
 *  - accelerationX, accelerationY, accelerationZ : numbers (accelerometer)
 *  - yaw (optional)
 *  - modelUrl (optional) - default points to public/models/device.stl
 */
function MyThreeSTL({
  accelerationX = 0,
  accelerationY = 0,
  accelerationZ = 0,
  yaw = 0,
  modelUrl = "/device.stl",
}) {
  const refContainer = useRef(null);
  const modelRef = useRef(null);
  const accelRef = useRef({ x: accelerationX, y: accelerationY, z: accelerationZ });
  const rafRef = useRef(null);

  // keep latest accelerometer values in a ref so animation loop sees updates
  useEffect(() => {
    accelRef.current = { x: accelerationX, y: accelerationY, z: accelerationZ };
  }, [accelerationX, accelerationY, accelerationZ]);

  useEffect(() => {
    if (!refContainer.current) return;

    // --- Scene, camera, renderer
    const width = refContainer.current.clientWidth;
    const height = refContainer.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8f8482);

    const camera = new THREE.PerspectiveCamera(80, width / height, 0.1, 1000);
    camera.position.set(10, 7, 10);
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(width, height);
    refContainer.current.appendChild(renderer.domElement);

    // --- Lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    hemi.position.set(0, 20, 0);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(10, 10, 10);
    scene.add(dir);

    // --- Grids (floor + walls) — same visual environment as original
    const gridSize = 20;
    const divisions = 20;
    const gridXZ = new THREE.GridHelper(gridSize, divisions, 0x000000, 0x000000);
    const gridXZ2 = gridXZ.clone();
    gridXZ2.position.y = 0.01;
    scene.add(gridXZ, gridXZ2);

    const gridYZ = new THREE.GridHelper(gridSize, divisions, 0x000000, 0x000000);
    gridYZ.rotation.z = Math.PI / 2;
    gridYZ.position.x = -gridSize / 2;
    gridYZ.position.y = 10;
    const gridYZ2 = gridYZ.clone();
    gridYZ2.position.y = 10.01;
    scene.add(gridYZ, gridYZ2);

    const gridXY = new THREE.GridHelper(gridSize, divisions, 0x000000, 0x000000);
    gridXY.rotation.x = Math.PI / 2;
    gridXY.position.z = -gridSize / 2;
    gridXY.position.y = 10;
    const gridXY2 = gridXY.clone();
    gridXY2.position.y = 10.01;
    scene.add(gridXY, gridXY2);

    // --- Load STL
    const stlLoader = new STLLoader();
    let loadedMesh = null; // local handle for cleanup
    stlLoader.load(
      modelUrl,
      (geometry) => {
        // Ensure normals exist
        if (!geometry.hasAttribute("normal")) geometry.computeVertexNormals();

        // Create a default material for STLs (STL has no material info)
        const material = new THREE.MeshStandardMaterial({
          color: 0x888888,
          metalness: 0.3,
          roughness: 0.6,
        });

        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);

        // Compute bounding box to center & scale
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox;
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const center = new THREE.Vector3();
        bbox.getCenter(center);

        // Translate geometry so center is at origin
        geometry.translate(-center.x, -center.y, -center.z);

        // Scale to roughly match original cone height (cone height = 5)
        const desiredHeight = 5;
        const currentHeight = size.y || 1;
        const uniformScale = desiredHeight / currentHeight;
        mesh.scale.setScalar(uniformScale);

        // Place where the cone used to be
        mesh.position.set(-2.5, 3, -2.5);

        // Save refs and add to scene
        loadedMesh = mesh;
        modelRef.current = mesh;
        scene.add(mesh);
      },
      // onProgress (optional)
      undefined,
      (err) => {
        console.error("Error loading STL:", err);
      }
    );

    // --- Animation
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      // read latest accel
      const { x: ax, y: ay, z: az } = accelRef.current;

      // pitch = atan2(-ax, sqrt(ay^2 + az^2))
      const denomPitch = Math.sqrt(ay * ay + az * az) || 1e-6;
      const pitchRad = Math.atan2(-ax, denomPitch);

      // roll = atan2(ay, sqrt(ax^2 + az^2))
      const denomRoll = Math.sqrt(ax * ax + az * az) || 1e-6;
      const rollRad = Math.atan2(ay, denomRoll);

      const model = modelRef.current;
      if (model) {
        // You may need to flip signs or swap axes depending on your device orientation
        model.rotation.x = isFinite(pitchRad) ? pitchRad : 0;
        model.rotation.y = yaw ?? 0;
        model.rotation.z = isFinite(rollRad) ? rollRad : 0;
      }

      renderer.render(scene, camera);
    };
    animate();

    // --- Resize handler
    const handleResize = () => {
      if (!refContainer.current) return;
      const w = refContainer.current.clientWidth;
      const h = refContainer.current.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    // --- Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      // dispose model if loaded
      if (loadedMesh) {
        scene.remove(loadedMesh);
        loadedMesh.traverse((obj) => {
          if (obj.isMesh) {
            if (obj.geometry) obj.geometry.dispose();
            const mat = obj.material;
            if (mat) {
              if (Array.isArray(mat)) {
                mat.forEach((m) => {
                  if (m.map) m.map.dispose();
                  m.dispose();
                });
              } else {
                if (mat.map) mat.map.dispose();
                mat.dispose();
              }
            }
          }
        });
        modelRef.current = null;
        loadedMesh = null;
      }

      // remove canvas and dispose renderer
      if (refContainer.current && renderer.domElement) {
        refContainer.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [modelUrl, yaw]); // accelerometer values use refs so they don't rebuild the scene

  return <div ref={refContainer} className="w-full h-full" />;
}

export default MyThreeSTL;
