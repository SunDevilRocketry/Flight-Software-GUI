declare module "three";
declare module "three/examples/jsm/loaders/STLLoader";
declare module "three/examples/jsm/effects/OutlineEffect.js";

import * as THREE from "three";
import { useEffect, useRef, type FC } from "react";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OutlineEffect } from "three/examples/jsm/effects/OutlineEffect.js";

export interface MyThreeProps {
  roll: number;
  pitch: number;
  yaw: number;
  lightMode: boolean;
  /** Accepted for API symmetry with sensor data; not currently rendered. */
  accelerationX?: number;
  accelerationY?: number;
  accelerationZ?: number;
}

interface OutlineParameters {
  thickness: number;
  color: number[];
  alpha: number;
  visible: boolean;
}

interface OutlinedMesh extends THREE.Mesh {
  material: THREE.MeshStandardMaterial & {
    userData: {
      outlineParameters: OutlineParameters;
    };
  };
}

const GRID_SIZE = 20;
const GRID_DIVISIONS = 20;
const GRID_OFFSET = 6;
const BG_TRANSITION_DURATION_MS = 300;

export const MyThree: FC<MyThreeProps> = ({ roll, pitch, yaw, lightMode }) => {
  const refContainer = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rocketRef = useRef<OutlinedMesh | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);

  const bgColor = lightMode ? 0x272727 : 0xcacaca;

  // darkmode : lightmode
  const rocketOutlineColor = lightMode
    ? new THREE.Color(20, 20, 20)
    : new THREE.Color(0, 0, 0);
  const rocketOutlineThickness = lightMode ? 0.005 : 0.0075;
  const rocketOutlineAlpha = lightMode ? 0.4 : 0.8;

  const ambientLightIntensity = lightMode ? 0.4 : 0.85;

  // Animate scene background + outline/lighting when lightMode changes
  useEffect(() => {
    const scene = sceneRef.current;
    const rocket = rocketRef.current;
    const ambient = ambientLightRef.current;
    if (!scene || !rocket || !ambient || !scene.background) return;

    const startColor = (scene.background as THREE.Color).clone();
    const endColor = new THREE.Color(bgColor);
    const startTime = performance.now();

    function animateBackground() {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / BG_TRANSITION_DURATION_MS, 1);

      (scene.background as THREE.Color).copy(startColor).lerp(endColor, t);

      if (t < 1) {
        requestAnimationFrame(animateBackground);
      } else {
        (scene.background as THREE.Color).copy(endColor);
      }
    }

    animateBackground();

    ambient.intensity = ambientLightIntensity;

    const outline = rocket.material.userData.outlineParameters;
    outline.color[0] = rocketOutlineColor.r;
    outline.color[1] = rocketOutlineColor.g;
    outline.color[2] = rocketOutlineColor.b;
    outline.thickness = rocketOutlineThickness;
    outline.alpha = rocketOutlineAlpha;
  }, [
    lightMode,
    bgColor,
    ambientLightIntensity,
    rocketOutlineColor,
    rocketOutlineThickness,
    rocketOutlineAlpha,
  ]);

  // One-time scene setup
  useEffect(() => {
    const container = refContainer.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);
    const camera = new THREE.PerspectiveCamera(80, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    rendererRef.current = renderer;
    sceneRef.current = scene;

    container.appendChild(renderer.domElement);

    const loader = new STLLoader();
    const effect = new OutlineEffect(renderer);

    loader.load("/NautilusModel.stl", (geometry) => {
      const posAttr = geometry.attributes.position;
      const vertexCount = posAttr.count;

      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox;
      if (!bbox) return;

      const minZ = bbox.min.z;
      const maxZ = bbox.max.z;
      const height3d = maxZ - minZ;
      const thresholdZ = minZ + Math.floor(0.855 * height3d);

      const finsMask = new Float32Array(vertexCount);
      for (let i = 0; i < vertexCount; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);
        if (z > -40 && z < 170) {
          if (Math.abs(x) > 28 || Math.abs(y) > 28) finsMask[i] = 1.0;
        } else {
          finsMask[i] = 0.0;
        }
      }

      const colors = new Float32Array(vertexCount * 3);
      for (let i = 0; i < vertexCount; i++) {
        const z = posAttr.getZ(i);
        if (z >= thresholdZ) {
          colors[i * 3 + 0] = 1.0;
          colors[i * 3 + 1] = 0.051;
          colors[i * 3 + 2] = 0.051;
        } else if (z < -940) {
          colors[i * 3 + 0] = 0.01;
          colors[i * 3 + 1] = 0.01;
          colors[i * 3 + 2] = 0.01;
        } else {
          colors[i * 3 + 0] = 0.9;
          colors[i * 3 + 1] = 0.9;
          colors[i * 3 + 2] = 0.9;
        }

        if (finsMask[i] > 0.9) {
          colors[i * 3 + 0] = 1.0;
          colors[i * 3 + 1] = 0.051;
          colors[i * 3 + 2] = 0.051;
        }
      }

      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const material = new THREE.MeshStandardMaterial({
        color: 0xfafafa,
        side: THREE.DoubleSide,
        flatShading: true,
        vertexColors: true,
      });

      material.userData.outlineParameters = {
        thickness: rocketOutlineThickness,
        color: rocketOutlineColor.toArray(),
        alpha: rocketOutlineAlpha,
        visible: true,
      } satisfies OutlineParameters;

      const realRocket = new THREE.Mesh(geometry, material) as unknown as OutlinedMesh;
      realRocket.scale.set(0.01, 0.01, 0.005);
      realRocket.position.set(0, 0, 0);
      realRocket.rotation.set(-Math.PI / 2, 0, 0);
      rocketRef.current = realRocket;

      scene.add(realRocket);
    });

    // Grid setup
    const gridXZ = new THREE.GridHelper(GRID_SIZE, GRID_DIVISIONS, 0x000000, 0x000000);
    gridXZ.position.y = -GRID_OFFSET;
    scene.add(gridXZ);

    const gridYZ = new THREE.GridHelper(GRID_SIZE, GRID_DIVISIONS, 0x000000, 0x000000);
    gridYZ.rotation.z = Math.PI / 2;
    gridYZ.position.x = -GRID_SIZE / 2;
    gridYZ.position.y = -GRID_OFFSET + GRID_SIZE / 2;
    scene.add(gridYZ);

    const gridXY = new THREE.GridHelper(GRID_SIZE, GRID_DIVISIONS, 0x000000, 0x000000);
    gridXY.rotation.x = Math.PI / 2;
    gridXY.position.z = -GRID_SIZE / 2;
    gridXY.position.y = -GRID_OFFSET + GRID_SIZE / 2;
    scene.add(gridXY);

    // Lighting & camera
    camera.position.set(10, 7, 10);
    camera.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, ambientLightIntensity);
    ambientLightRef.current = ambient;
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffee, 1);
    directional.position.set(-20, 10, 100);
    scene.add(directional);

    const axesOffset = 0.1;
    const axes = new THREE.AxesHelper(GRID_SIZE);
    axes.position.set(
      -(GRID_SIZE / 2) + axesOffset,
      axesOffset - GRID_OFFSET,
      -(GRID_SIZE / 2) + axesOffset,
    );
    scene.add(axes);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      effect.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!refContainer.current) return;
      const newWidth = refContainer.current.clientWidth;
      const newHeight = refContainer.current.clientHeight;
      renderer.setSize(newWidth, newHeight);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      if (rocketRef.current) scene.remove(rocketRef.current);
      renderer.dispose();
    };
    // Intentionally run once on mount; bgColor/outline values are re-applied
    // reactively in the lightMode effect above rather than recreating the scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply orientation updates
  useEffect(() => {
    if (!rocketRef.current) return;

    const safeRoll = Number.isFinite(roll) ? roll : 0;
    const safePitch = Number.isFinite(pitch) ? pitch : 0;
    const safeYaw = Number.isFinite(yaw) ? yaw : 0;

    const rollRad = THREE.MathUtils.degToRad(safeRoll);
    const pitchRad = THREE.MathUtils.degToRad(safePitch);
    const yawRad = THREE.MathUtils.degToRad(safeYaw);

    rocketRef.current.rotation.order = "ZYX";
    rocketRef.current.rotation.set(pitchRad - Math.PI / 2, yawRad, 0);
    void rollRad; // reserved: roll is currently not applied to rotation, matching original behavior
  }, [roll, pitch, yaw]);

  return <div ref={refContainer} className="w-full h-full" />;
};

export default MyThree;
