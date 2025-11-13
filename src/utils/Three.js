import * as THREE from 'three';
import { useEffect, useRef, useState } from "react";
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';


export function MyThree({ roll, pitch, yaw }) {
  const refContainer = useRef(null);
  const rendererRef = useRef(null);
  const rocketRef = useRef(null);
  
  //Runs Once on MOUNT
  useEffect(() => {
    if (!refContainer.current) return;

    const width = refContainer.current.clientWidth;
    const height = refContainer.current.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x272727);
    const camera = new THREE.PerspectiveCamera(80, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    let realRocket = null;
    const loader = new STLLoader();

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    rendererRef.current = renderer;
    refContainer.current.appendChild(renderer.domElement);
    

    //load STL model
    loader.load('/NautilusModel.stl', function (geometry) {
      const materialTEMP = new THREE.MeshStandardMaterial({ 
        color: 0xFAFAFA,
        side: THREE.DoubleSide,   // For visibility
        flatShading: true,        // STL mesh normals are often flat
      });
      
      realRocket = new THREE.Mesh(geometry, materialTEMP);
      realRocket.scale.set(0.01, 0.01, 0.005); // scale down the model
      realRocket.position.set(0, 0, 0);
      realRocket.rotation.set(-Math.PI / 2,0,0); // Adjust orientation to be upright

      rocketRef.current = realRocket;
      

      scene.add(realRocket);

      animate();

    });

    
    // create a grid
    const gridSize = 20;
    const gridDivisions = 20;
    const gridOffset = 4;
   
    // XZ plane, floor
    const gridXZ = new THREE.GridHelper(gridSize, gridDivisions, 0x000000, 0x000000);
    gridXZ.position.y = -gridOffset;
    scene.add(gridXZ);
    
    // YZ plane, Left Wall
    const gridYZ = new THREE.GridHelper(gridSize, gridDivisions, 0x000000, 0x000000);
    gridYZ.rotation.z = Math.PI / 2;
    gridYZ.position.x = -gridSize / 2;
    gridYZ.position.y = -gridOffset + gridSize/2;
    scene.add(gridYZ);
    
    // XY plane, Right Wall
    const gridXY = new THREE.GridHelper(gridSize, gridDivisions, 0x000000, 0x000000);
    gridXY.rotation.x = Math.PI / 2;
    gridXY.position.z = -gridSize / 2;
    gridXY.position.y = -gridOffset + gridSize/2;
    scene.add(gridXY);
        
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
    //const geometry = new THREE.ConeGeometry(1, 5, 50, 1, false);
    //const rocket = new THREE.Mesh(geometry, material);
    //scene.add(rocket);

    // Camera
    camera.position.set(10, 7, 10);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.40)); // Soft white light

    const directional = new THREE.DirectionalLight(0xFAFAFA, 1);
    directional.position.set(15, 0, 10);
    scene.add(directional);

    // Optional axis helper
    const axesOffset = 0.1; // Slightly above the grid, prevents flickering
    const axes = new THREE.AxesHelper(gridSize);
    axes.position.x = -(gridSize / 2) + axesOffset;
    axes.position.y = axesOffset - gridOffset;
    axes.position.z = -(gridSize / 2) + axesOffset;
    scene.add(axes);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
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
      if (rocketRef.current) scene.remove(rocketRef.current);

      renderer.dispose();
      
    };
  }, []);

  useEffect(() => {
    const rollDeg  = isFinite(roll) ?  roll  : 0;
    const pitchDeg = isFinite(pitch) ? pitch : 0;
    const yawDeg   = isFinite(yaw) ? yaw   : 0;
    //console.log("Updating rotations:", { rollDeg, pitchDeg, yawDeg });

    const rollRad  = THREE.MathUtils.degToRad(rollDeg);
    const pitchRad = THREE.MathUtils.degToRad(pitchDeg);
    const yawRad   = THREE.MathUtils.degToRad(yawDeg);

    if (!rocketRef.current) return;
    rocketRef.current.rotation.order = 'ZYX';

    
    rocketRef.current.rotation.set(pitchRad-Math.PI/2, yawRad, 0); //DO NOT ADD ROLL, FUCKS EVERYTHIGN UP -Fernando
    //setOldRotations({ roll: rollDeg, pitch: pitchDeg, yaw: yawDeg });


    
  }, [roll, pitch, yaw]);

  return <div ref={refContainer} className="w-full h-full" />;
}

export default MyThree;