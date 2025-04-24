import * as THREE from 'three';

import { useEffect, useRef } from "react";

function MyThree({roll, pitch, yaw, accelerationX, accelerationY, accelerationZ}) {
  const refContainer = useRef(null);
  const rendererRef = useRef(null); 

  useEffect(() => {
    if (!refContainer.current) return;

    // Get container dimensions
    const width = refContainer.current.clientWidth;
    const height = refContainer.current.clientHeight;

    // Create Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8F8482);
    const camera = new THREE.PerspectiveCamera(80, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    rendererRef.current = renderer; // Store renderer reference

    refContainer.current.appendChild(renderer.domElement);

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
          vUv = uv; // pass UV coordinates to fragment shader
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
    });
    const rocket = new THREE.Mesh(geometry, material);
    scene.add(rocket);
    rocket.position.y = 3
    rocket.position.z = -2.5
    rocket.position.x = -2.5

    camera.position.set(10, 7, 10);
    camera.lookAt(0, 3, 0);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      let xRotation = Math.atan2(-accelerationX, Math.sqrt(Math.sqrt(accelerationY) + Math.sqrt(accelerationZ)));
      console.log("xRotation: " + xRotation);
      if (isNaN(xRotation))
      {
        xRotation = 99999;
      }
     rocket.rotation.x = xRotation; // pitch , pitch = atan2(-ax, sqrt(ay^2 + az^2))
     rocket.rotation.y = 0; // yaw 
     rocket.rotation.z = 0//Math.atan2(accelerationY, Math.sqrt(Math.sqrt(accelerationX) + Math.sqrt(accelerationZ))); // roll , roll = atan2(ay, sqrt(ax^2 + az^2))
      renderer.render(scene, camera);
    };
    animate();

    // Resize handling
    const handleResize = () => {
      if (refContainer.current) {
        const newWidth = refContainer.current.clientWidth;
        const newHeight = refContainer.current.clientHeight;
        renderer.setSize(newWidth, newHeight);
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
      }
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