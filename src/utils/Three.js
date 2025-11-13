import * as THREE from 'three';
import { useEffect, useRef } from "react";

export function MyThree({ roll, pitch, yaw }) {
  const refContainer = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    if (!refContainer.current) return;

    const width = refContainer.current.clientWidth;
    const height = refContainer.current.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x272727);
    const camera = new THREE.PerspectiveCamera(80, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    rendererRef.current = renderer;
    refContainer.current.appendChild(renderer.domElement);

    // Grid helpers
    const gridXZ = new THREE.GridHelper(20, 20, 0x000000, 0x000000);
    // create a grid
    const gridSize = 20;
    const divisions = 20;
   
    
    // XZ plane, floor
    const gridXZ = new THREE.GridHelper(gridSize, divisions, 0x000000, 0x000000);
    
    gridXZ.rotation.x = 0;
    const gridXZ2 = new THREE.GridHelper(gridSize, divisions, 0x000000, 0x000000);
    gridXZ2.rotation.x = 0;
    scene.add(gridXZ);
    scene.add(gridXZ2);
    gridXZ.position.y = 0;
    scene.add(gridXZ);

    // Red/white shader
    gridXZ2.position.y = .01;
    
    //Grid on YZ plane (left wall)
    const gridYZ = new THREE.GridHelper(gridSize, divisions, 0x000000, 0x000000);
    gridYZ.rotation.z = Math.PI / 2;
    gridYZ.position.x = -gridSize / 2;
    scene.add(gridYZ);
    gridYZ.position.y = 10;
    
    const gridYZ2 = new THREE.GridHelper(gridSize, divisions, 0x000000, 0x000000);
    gridYZ2.rotation.z = Math.PI / 2;
    gridYZ2.position.x = -gridSize / 2;
    scene.add(gridYZ2);
    gridYZ2.position.y = 10.01;
    
    // Grid on XY plane (right wall)
    const gridXY = new THREE.GridHelper(gridSize, divisions, 0x000000, 0x000000);
    gridXY.rotation.x = Math.PI / 2;
    gridXY.position.z = -gridSize / 2;
    scene.add(gridXY);
    gridXY.position.y = 10;
    
    const gridXY2 = new THREE.GridHelper(gridSize, divisions, 0x000000, 0x000000);
    gridXY2.rotation.x = Math.PI / 2;
    gridXY2.position.z = -gridSize / 2;
    scene.add(gridXY2);
    gridXY2.position.y = 10.01;
    
    // Create a cone
    const geometry = new THREE.ConeGeometry(1, 5, 50);
    //const material = new THREE.MeshBasicMaterial({ color: 0x8a2929 });
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `,
        fragmentShader: `
        varying vec2 vUv;
        void main() {
          if (vUv.x < 0.5) {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // red
            } else {
              gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // white
          }
        }
      `,
      side: THREE.DoubleSide
    });

    // Default cone points +Y
    const geometry = new THREE.ConeGeometry(1, 5, 50, 1, false);
    const rocket = new THREE.Mesh(geometry, material);
    scene.add(rocket);

    // Camera
    camera.position.set(10, 7, 10);
    camera.lookAt(0, 0, 0);

    // Optional axis helper
    const axes = new THREE.AxesHelper(3);
    scene.add(axes);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      const rollDeg  = isFinite(roll)  ? roll  : 0;
      const pitchDeg = isFinite(pitch) ? pitch : 0;
      const yawDeg   = isFinite(yaw)   ? yaw   : 0;

      const rollRad  = THREE.MathUtils.degToRad(rollDeg);
      const pitchRad = THREE.MathUtils.degToRad(pitchDeg);
      const yawRad   = THREE.MathUtils.degToRad(yawDeg);

      // Reset and apply in order
      rocket.rotation.set(0, 0, 0);

      // Yaw (around Y - turn left/right)
      rocket.rotateY(yawRad);

      // Pitch (around X - nose up/down)
      rocket.rotateX(pitchRad);

      // Roll (around forward axis, +Y by default)
      rocket.rotateY(0); // ensure local axes are updated
      rocket.rotateOnAxis(new THREE.Vector3(0, 1, 0), rollRad);

      renderer.render(scene, camera);
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
      renderer.dispose();
    };
  }, [roll, pitch, yaw]);

  return <div ref={refContainer} className="w-full h-full" />;
}

export default MyThree;