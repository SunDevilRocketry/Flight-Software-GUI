import * as THREE from 'three';
import { useEffect, useRef, useState } from "react";
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

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
      const posAttr = geometry.attributes.position;
      const vertexCount = posAttr.count;

      // Compute local-space height thresholds from the geometry's bounding box
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox;
      const minZ = bbox.min.z;
      const maxZ = bbox.max.z;
      const height = maxZ - minZ;
      const thresholdZ = minZ + Math.floor(0.855 * height); // 85% up the model

      const finsMask = new Float32Array(vertexCount);
        for (let i = 0; i < vertexCount; i++) {
          const x = posAttr.getX(i);
          const y = posAttr.getY(i);
          const z = posAttr.getZ(i);
          

          if (z > -40 && z < 170) {
            if (Math.abs(x) > 28 || Math.abs(y) > 28){
              finsMask[i] = 1.0;

            }
          
          }else{
            finsMask[i] = 0.0;
          }
        }

      const colors = new Float32Array(vertexCount * 3);

      for (let i = 0; i < vertexCount; i++) {
        const z = posAttr.getZ(i);

        if (z >= thresholdZ) {
          colors[i * 3 + 0] = 1.0; // red
          colors[i * 3 + 1] = 0.051;
          colors[i * 3 + 2] = 0.051;
        } else if(z < -940){
          colors[i * 3 + 0] = 0.01; // black
          colors[i * 3 + 1] = 0.01;
          colors[i * 3 + 2] = 0.01;

        }else {
          colors[i * 3 + 0] = 0.9; // grey
          colors[i * 3 + 1] = 0.9;
          colors[i * 3 + 2] = 0.9;
        }

        // Override fins with  red
        if (finsMask[i] > 0.9) {
          colors[i * 3 + 0] = 1.0; // red
          colors[i * 3 + 1] = 0.051;
          colors[i * 3 + 2] = 0.051;
        }
        
      }

      // Attach the color attribute
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const materialTEMP = new THREE.MeshStandardMaterial({ 
        color: 0xFAFAFA,
        side: THREE.DoubleSide,   // For visibility
        flatShading: true,      
        vertexColors: true,
      });

      //outline
      materialTEMP.userData.outlineParameters = {
        thickness: 0.005,
        color: new THREE.Color().setRGB(240,240,240).toArray(),
        alpha: .5,
        visible: true
      };
      
      realRocket = new THREE.Mesh(geometry, materialTEMP);
      realRocket.scale.set(0.01, 0.01, 0.005); // scale down the model
      realRocket.position.set(0, 0, 0);
      realRocket.rotation.set(-Math.PI / 2,0,0); // Adjust orientation to be upright

      rocketRef.current = realRocket;
      

    
      scene.add(realRocket);

      
      

      animate();

    });

    
    let effect = new OutlineEffect( renderer );


    // create a grid
    const gridSize = 20;
    const gridDivisions = 20;
    const gridOffset = 6;
   
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

    
    // Camera
    camera.position.set(10, 7, 10);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.40)); // Soft white light

    const directional = new THREE.DirectionalLight(0xFFFFEE, 1);
    directional.position.set(-20, 10, 100);
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
    const rollDeg  = isFinite(roll) ?  roll : 0;
    const pitchDeg = isFinite(pitch) ? pitch : 0;
    const yawDeg   = isFinite(yaw) ? yaw: 0;
    //console.log("Updating rotations:", { rollDeg, pitchDeg, yawDeg });

    const rollRad  = THREE.MathUtils.degToRad(rollDeg);
    const pitchRad = THREE.MathUtils.degToRad(pitchDeg);
    const yawRad   = THREE.MathUtils.degToRad(yawDeg);

    if (!rocketRef.current) return;
    rocketRef.current.rotation.order = 'ZYX';

    console.log
    rollDeg < 6 && pitchDeg < 6 && yawDeg < 6 ? rocketRef.current.rotation.set(pitchDeg-Math.PI/2, yawDeg, 0) : rocketRef.current.rotation.set(pitchRad-Math.PI/2, yawRad, 0); //DO NOT ADD ROLL, FUCKS EVERYTHIGN UP -Fernando
    //setOldRotations({ roll: rollDeg, pitch: pitchDeg, yaw: yawDeg });


    
  }, [roll, pitch, yaw]);

  return <div ref={refContainer} className="w-full h-full" />;
}

export default MyThree;