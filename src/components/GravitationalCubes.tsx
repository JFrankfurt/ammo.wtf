"use client";

import { Text, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Physics,
  RapierRigidBody,
  RigidBody,
  RigidBodyProps,
} from "@react-three/rapier";
import React, { useCallback, useState } from "react";
import * as THREE from "three";

// Customize these constants as needed
const CENTER_RADIUS = 1;
const GRAVITY_STRENGTH = 1;
const MODEL_SCALE = 1; // Adjust to fit your model size
const INITIAL_LINEAR_VELOCITY_MAG = 1;

interface SpawnedObject {
  ref: React.RefObject<RapierRigidBody>;
  position: THREE.Vector3;
}

function CenterSphere() {
  const shaderMaterial = React.useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform float time;

        void main() {
            gl_FragColor = vec4(vNormal, 1.0);
        }
      `,
      uniforms: {
        // color: { value: new THREE.Color("#C94A3D") }, // Base color
        time: { value: 0 }, // Dynamic time uniform
      },
      transparent: false, // No transparency for this shader
      side: THREE.DoubleSide, // Render both sides of the sphere
    });
  }, []);
  return (
    <RigidBody type="fixed" colliders="ball">
      <Text>wtf</Text>
      <mesh material={shaderMaterial}>
        <sphereGeometry args={[CENTER_RADIUS, 32, 32]} />
      </mesh>
    </RigidBody>
  );
}

const ImportedModel = React.forwardRef<RapierRigidBody, RigidBodyProps>(
  (props, ref) => {
    const { scene } = useGLTF("/5.56_lowpoly.glb");
    const clonedScene = React.useMemo(() => scene.clone(true), [scene]);

    const customMaterial = React.useMemo(() => {
      return new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;

          void main() {
              vNormal = normalize(normalMatrix * normal);
              vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;

          void main() {
              gl_FragColor = vec4(vNormal, 1.0);
          }
        `
      });
    }, []);

    React.useEffect(() => {
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = customMaterial;
        }
      });
    }, [clonedScene, customMaterial]);

    return (
      <RigidBody ref={ref} colliders="hull" {...props}>
        <primitive
          object={clonedScene}
          scale={[MODEL_SCALE, MODEL_SCALE, MODEL_SCALE]}
        />
      </RigidBody>
    );
  }
);
ImportedModel.displayName = "ImportedModel";

function Scene() {
  const { camera, size } = useThree();
  const [objects, setObjects] = useState<SpawnedObject[]>([]);

  const center = new THREE.Vector3(0, 0, 0);

  // Apply custom gravity force towards center each frame
  useFrame(() => {
    for (const { ref } of objects) {
      const body = ref.current;
      if (!body) continue;
      const pos = body.translation();
      const bodyPos = new THREE.Vector3(pos.x, pos.y, pos.z);

      // Direction from object to center
      const dir = new THREE.Vector3().subVectors(center, bodyPos);
      const distance = dir.length();
      dir.normalize();

      // Force magnitude: scaled by distance
      const forceMagnitude = GRAVITY_STRENGTH * (distance * 0.5);
      dir.multiplyScalar(forceMagnitude);

      // Apply force each frame
      if (distance > 0.5) {
        body.applyImpulse({ x: dir.x, y: dir.y, z: dir.z }, true);
      }
    }
  });

  const handleClick = useCallback(
    (e: MouseEvent) => {
      // Convert screen coordinates to world space position
      const mouse = new THREE.Vector2(
        (e.clientX / size.width) * 2 - 1,
        -(e.clientY / size.height) * 2 + 1
      );

      const position = new THREE.Vector3(
        mouse.x + (Math.random() * 2.0 - 1.0) * 15,
        mouse.y + (Math.random() * 2.0 - 1.0) * 15,
        Math.random() * 15 - 7.5
      );

      // Create a new RigidBody reference so we can track it
      const ref = React.createRef<RapierRigidBody>();
      setObjects((prev) => [...prev, { ref, position }]);
    },
    [size]
  );

  React.useEffect(() => {
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, [handleClick]);

  // Initial camera position
  React.useEffect(() => {
    camera.position.z = 15;
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <CenterSphere />

      {objects.map(({ ref, position }, i) => {
        const toCenter = new THREE.Vector3()
          .copy(position as THREE.Vector3)
          .multiplyScalar(-1)
          .normalize()
          .multiplyScalar(INITIAL_LINEAR_VELOCITY_MAG);

        return (
          <ImportedModel
            key={i}
            ref={ref}
            position={[position.x, position.y, position.z]}
            linearVelocity={[toCenter.x, toCenter.y, toCenter.z]}
            angularVelocity={[
              (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 2,
            ]}
            friction={1}
            restitution={0.5}
            angularDamping={1}
            linearDamping={1}
            mass={1}
          />
        );
      })}
    </>
  );
}

export default function GravityObjects() {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-kumoGray animate-bgCycle">
      <Canvas>
        <Physics gravity={[0, 0, 0]}>
          <Scene />
        </Physics>
      </Canvas>
    </div>
  );
}
