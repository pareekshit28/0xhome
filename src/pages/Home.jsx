import { Canvas } from "@react-three/fiber";
import React, { useRef, useEffect, Suspense, useState } from "react";
import { Model as Room } from "../models/Vintage_living_room";
import { OrbitControls } from "@react-three/drei";
import {
  Controllers,
  Hands,
  VRButton,
  XR,
  useXR,
  useController,
  RayGrab,
} from "@react-three/xr";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import Menu from "./Menu";

const Home = () => {
  const [model, setModel] = useState("");
  return (
    <>
      <VRButton />
      <Canvas style={{ height: "100vh" }} gl={{ preserveDrawingBuffer: true }}>
        <XR>
          <ambientLight intensity={2} />
          <Controllers />
          <Hands />
          <Room />
          <FrostedGlassPanel position={[0, 2, -1]} setModel={setModel} />
          <OrbitControls />
          {model === "chair" && (
            <ModelLoader
              path={"chair.glb"}
              scale={[1, 1, 1]}
              position={[5, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
            />
          )}
          {model === "table_tennis" && (
            <ModelLoader
              path={"table_tennis.glb"}
              scale={[0.3, 0.3, 0.3]}
              position={[5, 0, 0]}
              rotation={[0, Math.PI, 0]}
            />
          )}
          {model === "gaming" && (
            <ModelLoader
              path={"gaming.glb"}
              scale={[0.3, 0.3, 0.3]}
              position={[5, 0, 0]}
              rotation={[0, Math.PI, 0]}
            />
          )}
          {model === "plant" && (
            <ModelLoader
              path={"plant.glb"}
              scale={[1, 1, 1]}
              position={[5, 0.5, 0]}
            />
          )}
        </XR>
      </Canvas>
    </>
  );
};

export default Home;

function PlayerController() {
  const { player } = useXR();
  const leftController = useController("left");
  const rightController = useController("right");
  const moveSpeed = 0.05; // Adjust the movement speed
  const rotationSpeed = 0.05; // Adjust the rotation speed

  useFrame(() => {
    // Movement with right controller
    if (
      rightController &&
      rightController.inputSource &&
      rightController.inputSource.gamepad
    ) {
      const { axes } = rightController.inputSource.gamepad;
      if (axes && axes.length >= 4) {
        const forward = new Vector3(0, 0, -1);
        const right = new Vector3(1, 0, 0);
        forward.applyQuaternion(player.rotation);
        right.applyQuaternion(player.rotation);

        // Logging axes values
        console.log("Axes:", axes);

        forward.multiplyScalar(axes[3] * moveSpeed);
        right.multiplyScalar(axes[2] * moveSpeed);

        // Logging scaled vectors
        console.log("Scaled Forward:", forward);
        console.log("Scaled Right:", right);

        // Ensure position is valid before updating
        if (
          isFinite(player.position.x) &&
          isFinite(player.position.y) &&
          isFinite(player.position.z)
        ) {
          player.position.add(forward).add(right);
          console.log("Player Position:", player.position);
        } else {
          console.error("Invalid player position detected:", player.position);
        }
      } else {
        console.warn("Gamepad axes not found or not enough axes data:", axes);
      }
    } else {
      console.warn("Right controller or gamepad not found.");
    }

    // Panning with left controller
    if (leftController && leftController.inputSource.gamepad) {
      const { axes } = leftController.inputSource.gamepad;
      player.rotation.y -= axes[2] * rotationSpeed;
    }
  });

  return null;
}

function FrostedGlassPanel(props) {
  const meshRef = useRef();

  useEffect(() => {
    // Create the rounded rectangle shape
    const shape = new THREE.Shape();
    const x = -1.3; // x coordinate
    const y = -1; // y coordinate
    const width = 3;
    const height = 1.8;
    const radius = 0.1;

    shape.moveTo(x, y + radius);
    shape.lineTo(x, y + height - radius);
    shape.quadraticCurveTo(x, y + height, x + radius, y + height);
    shape.lineTo(x + width - radius, y + height);
    shape.quadraticCurveTo(
      x + width,
      y + height,
      x + width,
      y + height - radius
    );
    shape.lineTo(x + width, y + radius);
    shape.quadraticCurveTo(x + width, y, x + width - radius, y);
    shape.lineTo(x + radius, y);
    shape.quadraticCurveTo(x, y, x, y + radius);

    // Extrude the shape to create a 3D geometry
    const extrudeSettings = {
      depth: 0.01,
      bevelEnabled: false,
    };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Create the frosted glass material
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0,
      transparent: true,
      opacity: 0.8,
    });

    // Apply the geometry and material to the mesh
    if (meshRef.current) {
      meshRef.current.geometry = geometry;
      meshRef.current.material = material;
    }
  }, []);

  return (
    <mesh ref={meshRef} {...props}>
      <Menu scale={0.65} position={[0, 0, 0.02]} setModel={props.setModel} />
    </mesh>
  );
}

function ModelLoader({ path, position, scale, rotation }) {
  const { scene } = useGLTF(path);

  return (
    <RayGrab>
      <group position={position} scale={scale} rotation={rotation}>
        <pointLight position={[0, 1.5, 0]} intensity={3} />
        <primitive object={scene} />
      </group>
    </RayGrab>
  );
}
