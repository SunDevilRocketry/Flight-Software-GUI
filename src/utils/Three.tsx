declare module "three";
declare module "three/examples/jsm/loaders/STLLoader";
declare module "three/examples/jsm/effects/OutlineEffect.js";
 
import * as THREE from "three";
import { useEffect, useRef, type FC } from "react";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OutlineEffect } from "three/examples/jsm/effects/OutlineEffect.js";
 
export interface MyThreeProps {
  w: number;
  x: number;
  y: number;
  z: number;
  lightMode: boolean;
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
 
/**
 * Change-of-basis quaternion mapping the firmware body frame
 * (+X = nose/roll axis, +Y = right/pitch axis, +Z = down/yaw axis,
 * right-handed) onto Three.js's world frame (+Y up, right-handed).
 *
 * At the identity orientation the model's nose points along Three's
 * +Y (see baseQuat below), so firmware's roll axis (body +X) must map
 * onto world +Y for a roll command to spin the model about its own
 * nose-to-tail axis on screen.
 *
 * A single 90° rotation about one coordinate axis can satisfy that
 * roll mapping on its own, but it only swaps the *other* two axes
 * with each other rather than assigning each firmware axis its own
 * distinct world axis — that's what caused pitch and yaw to swap.
 * What's actually needed is a full cyclic permutation of all three
 * axes: X_fw -> Y_three, Y_fw -> Z_three, Z_fw -> X_three. That
 * specific permutation is a 120° rotation about the (1,1,1) diagonal.
 *
 * NOTE: this axis/angle must match the firmware's actual inertial
 * reference convention. Verify empirically — command a pure roll and
 * confirm the model spins about its own nose-to-tail axis, then pure
 * pitch and pure yaw and confirm each tips the nose in the expected
 * plane — before relying on this in flight-critical contexts. If any
 * single axis turns the wrong direction (mirrored) once the plane of
 * rotation is otherwise correct, that's a separate, per-axis sign fix
 * rather than a change to this permutation.
 */
const FRAME_QUAT = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 1, 1).normalize(),
  (2 * Math.PI) / 3,
);
const FRAME_QUAT_INV = FRAME_QUAT.clone().invert();
 
/**
 * Converts a firmware body-frame quaternion (w, x, y, z) into a
 * THREE.Quaternion expressed in Three's world frame.
 *
 * Two things happen here:
 *  1. Reordering into THREE's (x, y, z, w) constructor convention.
 *  2. Re-expressing the rotation in Three's coordinate system via
 *     similarity transform (conjugation), since firmware's body-frame
 *     axes are not the same axes as Three's world frame axes. This is
 *     NOT the same as composing two rotations (simple multiplication) —
 *     conjugation is what's required when changing the basis a
 *     rotation is expressed in, rather than combining two rotations
 *     that already live in the same frame.
 *
 * Falls back to identity if the input quaternion is degenerate.
 */
function toThreeQuat(w: number, x: number, y: number, z: number): THREE.Quaternion {
  const q = new THREE.Quaternion(x, y, z, w); // THREE: (x, y, z, w)
  const len = q.length();
  if (len < 1e-6) return new THREE.Quaternion(0, 0, 0, 1);
  q.normalize();
 
  // Re-express the firmware-frame rotation in Three's world frame
  return FRAME_QUAT.clone().multiply(q).multiply(FRAME_QUAT_INV);
}
 
export const MyThree: FC<MyThreeProps> = ({ w, x, y, z, lightMode }) => {
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
 
      // Apply the model-space base rotation as a quaternion.
      // The STL's "up" axis is +Z; we rotate it to Three.js's +Y up-axis
      // (-90° around X) so that a unit quaternion (w=1, x=y=z=0) shows the
      // rocket pointing straight up — identical to the original behaviour.
      const baseQuat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        -Math.PI / 2,
      );
 
      // Compose with the incoming orientation quaternion. toThreeQuat now
      // performs the firmware-body-frame -> Three-world-frame conversion
      // internally (via similarity transform), so orientQuat is already
      // expressed in Three's world frame here.
      const orientQuat = toThreeQuat(w, x, y, z);
      realRocket.quaternion.copy(orientQuat.clone().multiply(baseQuat));
 
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
 
  useEffect(() => {
    const rocket = rocketRef.current;
    if (!rocket) return;
 
    // Base rotation: -90° around X so the STL's +Z nose maps to Three.js +Y
    const baseQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      -Math.PI / 2,
    );
 
    // toThreeQuat converts from the firmware body frame into Three's
    // world frame (see FRAME_QUAT above), so this is now expressed in
    // the same frame the model's rest pose lives in.
    const orientQuat = toThreeQuat(w, x, y, z);
 
    // Apply: first orient in world space, then apply base model correction
    rocket.quaternion.copy(orientQuat.clone().multiply(baseQuat));
  }, [w, x, y, z]);
 
  return <div ref={refContainer} className="w-full h-full" />;
};
 
export default MyThree;