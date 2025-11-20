import * as THREE from 'three';
import { useEffect, useRef } from "react";
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

export function MyThree({ roll, pitch, yaw, lightMode }) {
  const refContainer = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const rocketRef = useRef(null);
  const AmbientLight = useRef(null);

  let bgColor = lightMode ?  0x272727 : 0xCACACA;

  //darkmode : lightmode 
  let rocketOutlineColor = lightMode ? new THREE.Color().setRGB(20,20,20) : new THREE.Color().setRGB(0,0,0);
  let rocketOutlineThickness = lightMode ?  0.005 : 0.0075;
  let rocketOutlineAlpha = lightMode ?  0.4 : 0.8;

  let ambientLightIntensity = lightMode ? 0.4 : 0.85;
  
  useEffect(() => {
    const scene = sceneRef.current;
    const rocket = rocketRef.current;
    if (!scene || !rocket) return;
    // Update background color
    const startColor = scene.background.clone();
    const endColor = new THREE.Color(bgColor);

    const duration = 300; // transition time for scene background color 
    const startTime = performance.now();

    function animate() {
      const now = performance.now();
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1); // Clamp from 0 to 1

      scene.background.copy(startColor).lerp(endColor, t);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        scene.background.copy(endColor); // Final color
      }
    }

    animate();

    AmbientLight.current.intensity = ambientLightIntensity;

    const outline = rocket.material.userData.outlineParameters;
    outline.color[0] = rocketOutlineColor.r;
    outline.color[1] = rocketOutlineColor.g;
    outline.color[2] = rocketOutlineColor.b;

    outline.thickness = rocketOutlineThickness;
    outline.alpha = rocketOutlineAlpha;
  }, [lightMode]);

  useEffect(() => {
    if (!refContainer.current) return;

    const width = refContainer.current.clientWidth; 
    const height = refContainer.current.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);
    const camera = new THREE.PerspectiveCamera(80, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    rendererRef.current = renderer;
    sceneRef.current = scene;

    refContainer.current.appendChild(renderer.domElement);

    const loader = new STLLoader();
    let effect = new OutlineEffect(renderer);

    loader.load('/NautilusModel.stl', function (geometry) {
      const posAttr = geometry.attributes.position;
      const vertexCount = posAttr.count;

      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox;
      const minZ = bbox.min.z;
      const maxZ = bbox.max.z;
      const height = maxZ - minZ;
      const thresholdZ = minZ + Math.floor(0.855 * height);

      const finsMask = new Float32Array(vertexCount);
      for (let i = 0; i < vertexCount; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);
        if (z > -40 && z < 170) {
          if (Math.abs(x) > 28 || Math.abs(y) > 28) finsMask[i] = 1.0;
        } else finsMask[i] = 0.0;
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

      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const materialTEMP = new THREE.MeshStandardMaterial({
        color: 0xFAFAFA,
        side: THREE.DoubleSide,
        flatShading: true,
        vertexColors: true,
      });

      materialTEMP.userData.outlineParameters = {
        thickness: rocketOutlineThickness,
        color: rocketOutlineColor.toArray(),
        alpha: rocketOutlineAlpha,
        visible: true
      };

      const realRocket = new THREE.Mesh(geometry, materialTEMP);
      realRocket.scale.set(0.01, 0.01, 0.005);
      realRocket.position.set(0, 0, 0);
      realRocket.rotation.set(-Math.PI / 2, 0, 0);
      rocketRef.current = realRocket;

      scene.add(realRocket);
    });

    // Grid setup
    const gridSize = 20;
    const gridDivisions = 20;
    const gridOffset = 6;
    

    const gridXZ = new THREE.GridHelper(gridSize, gridDivisions, 0x000000, 0x000000);
    gridXZ.position.y = -gridOffset;
    scene.add(gridXZ);

    const gridYZ = new THREE.GridHelper(gridSize, gridDivisions, 0x000000, 0x000000);
    gridYZ.rotation.z = Math.PI / 2;
    gridYZ.position.x = -gridSize / 2;
    gridYZ.position.y = -gridOffset + gridSize / 2;
    scene.add(gridYZ);

    const gridXY = new THREE.GridHelper(gridSize, gridDivisions, 0x000000, 0x000000);
    gridXY.rotation.x = Math.PI / 2;
    gridXY.position.z = -gridSize / 2;
    gridXY.position.y = -gridOffset + gridSize / 2;
    scene.add(gridXY);

    // Lighting & camera
    camera.position.set(10, 7, 10);
    camera.lookAt(0, 0, 0);
    const ambient = new THREE.AmbientLight(0xffffff, ambientLightIntensity);
    AmbientLight.current = ambient;
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffee, 1);
    directional.position.set(-20, 10, 100);
    scene.add(directional);

    const axesOffset = 0.1;
    const axes = new THREE.AxesHelper(gridSize);
    axes.position.set(-(gridSize / 2) + axesOffset, axesOffset - gridOffset, -(gridSize / 2) + axesOffset);
    scene.add(axes);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      effect.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const newWidth = refContainer.current.clientWidth;
      const newHeight = refContainer.current.clientHeight;
      renderer.setSize(newWidth, newHeight);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      refContainer.current?.removeChild(renderer.domElement);
      if (rocketRef.current) scene.remove(rocketRef.current);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!rocketRef.current) return;

    const rollRad = THREE.MathUtils.degToRad(isFinite(roll) ? roll : 0);
    const pitchRad = THREE.MathUtils.degToRad(isFinite(pitch) ? pitch : 0);
    const yawRad = THREE.MathUtils.degToRad(isFinite(yaw) ? yaw : 0);

    rocketRef.current.rotation.order = 'ZYX';

    // Keep your original logic, but fully in radians
    if (Math.abs(roll) < 6 && Math.abs(pitch) < 6 && Math.abs(yaw) < 6) {
      rocketRef.current.rotation.set(pitchRad - Math.PI / 2, yawRad, 0);
    } else {
      rocketRef.current.rotation.set(pitchRad - Math.PI / 2, yawRad, 0);
    }
  }, [roll, pitch, yaw]);

  return <div ref={refContainer} className="w-full h-full" />;
}

export default MyThree;