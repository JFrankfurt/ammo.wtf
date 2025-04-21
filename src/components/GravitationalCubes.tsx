import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Physics,
  RapierRigidBody,
  RigidBody,
  RigidBodyProps,
} from "@react-three/rapier";
import React, { useCallback, useState } from "react";

import {
  Vector3,
  Euler,
  ShaderMaterial,
  FrontSide,
  Mesh,
  Vector2,
  Raycaster,
} from "three";

const CENTER_RADIUS = 1;
const GRAVITY_STRENGTH = 4;
const MODEL_SCALE = 1;
const INITIAL_LINEAR_VELOCITY_MAG = 3;

interface SpawnedObject {
  ref: React.RefObject<RapierRigidBody>;
  position: Vector3;
  rotation?: Euler;
}

function CenterSphere() {
  const shaderMaterial = React.useMemo(() => {
    return new ShaderMaterial({
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
        time: { value: 0 },
      },
      transparent: false,
      side: FrontSide,
    });
  }, []);
  return (
    <RigidBody type="fixed" colliders="ball">
      {/* @ts-ignore */}
      <mesh material={shaderMaterial}>
        {/* @ts-ignore */}
        <sphereGeometry args={[CENTER_RADIUS, 32, 32]} />
        {/* @ts-ignore */}
      </mesh>
    </RigidBody>
  );
}

const ImportedModel = React.forwardRef<RapierRigidBody, RigidBodyProps>(
  (props, ref) => {
    const { scene } = useGLTF("/5.56_lowpoly.glb");
    const clonedScene = React.useMemo(() => scene.clone(true), [scene]);

    const customMaterial = React.useMemo(() => {
      return new ShaderMaterial({
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
        `,
      });
    }, []);

    React.useEffect(() => {
      clonedScene.traverse((child) => {
        if ((child as Mesh).isMesh) {
          (child as Mesh).material = customMaterial;
        }
      });
    }, [clonedScene, customMaterial]);

    return (
      <RigidBody ref={ref} colliders="hull" {...props}>
        {/* @ts-ignore */}
        <primitive
          object={clonedScene}
          scale={[MODEL_SCALE, MODEL_SCALE, MODEL_SCALE]}
        />
      </RigidBody>
    );
  }
);
ImportedModel.displayName = "ImportedModel";

const initialObjectPosition = new Vector3(
  (Math.random() * 2.0 - 1.0) * 15,
  (Math.random() * 2.0 - 1.0) * 15,
  Math.random() * 15 - 7.5
);

// Important: Type assertion to tell TypeScript the result is safe
const initialObject = {
  ref: React.createRef<RapierRigidBody>(),
  position: initialObjectPosition,
} as SpawnedObject;

function Scene() {
  const { camera, size } = useThree();
  const [objects, setObjects] = useState<SpawnedObject[]>([initialObject]);

  const center = new Vector3(0, 0, 0);

  // Apply custom gravity force towards center each frame
  useFrame(() => {
    for (const { ref } of objects) {
      const body = ref.current;
      if (!body) continue;
      const pos = body.translation();
      const bodyPos = new Vector3(pos.x, pos.y, pos.z);

      // Direction from object to center
      const dir = new Vector3().subVectors(center, bodyPos);
      const distance = dir.length();
      if (distance < 0.1) continue; // Avoid division by zero or huge forces near center
      dir.normalize();

      const forceMagnitude = GRAVITY_STRENGTH / (distance * distance);
      dir.multiplyScalar(forceMagnitude);

      body.applyImpulse({ x: dir.x, y: dir.y, z: dir.z }, true);
    }
  });

  const handleClick = useCallback(
    (e: MouseEvent) => {
      // Convert mouse position to normalized device coordinates (-1 to +1)
      const mouse = new Vector2(
        (e.clientX / size.width) * 2 - 1,
        -(e.clientY / size.height) * 2 + 1
      );

      // Create ray caster and set it up with camera and mouse position
      const raycaster = new Raycaster();
      raycaster.setFromCamera(mouse, camera);

      // Calculate position 15 units along the ray
      const position = new Vector3();
      raycaster.ray.at(15, position);

      // Generate random rotation in radians (0 to 2π)
      const rotation = new Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      // Type assertion to fix the ref type issue
      const newObject = {
        ref: React.createRef<RapierRigidBody>(),
        position,
        rotation,
      } as SpawnedObject;

      setObjects((prev) => {
        if (prev.length <= 200) {
          return [...prev, newObject];
        }
        return prev;
      });
    },
    [camera, size.height, size.width]
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
      {/* @ts-ignore */}
      <ambientLight intensity={0.6} />
      {/* @ts-ignore */}
      <pointLight position={[10, 10, 10]} intensity={1.0} />
      <CenterSphere />

      {objects.map(({ ref, position, rotation }, i) => {
        const toCenter = new Vector3()
          .copy(position)
          .multiplyScalar(-1)
          .normalize()
          .multiplyScalar(INITIAL_LINEAR_VELOCITY_MAG);

        return (
          <ImportedModel
            key={i}
            ref={ref}
            position={[position.x, position.y, position.z]}
            rotation={
              rotation ? [rotation.x, rotation.y, rotation.z] : [0, 0, 0]
            }
            linearVelocity={[toCenter.x, toCenter.y, toCenter.z]}
            angularVelocity={[
              (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 2,
            ]}
            friction={1}
            restitution={0.5}
            angularDamping={0.1}
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
    <div className="fixed -z-10 inset-0 w-full h-full overflow-hidden">
      <Canvas frameloop="demand" performance={{ min: 0.5 }} dpr={[1, 2]}>
        <Physics gravity={[0, 0, 0]}>
          <Scene />
        </Physics>
      </Canvas>
    </div>
  );
}
