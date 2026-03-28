import { Grid, OrbitControls, Text } from "@react-three/drei";
import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import type { YardElement } from "../types/yard";

interface Canvas3DProps {
  elements: YardElement[];
  selectedId: bigint | null;
  yardLength: number;
  yardWidth: number;
  onSelectElement: (id: bigint | null) => void;
}

interface ElementMeshProps {
  el: YardElement;
  isSelected: boolean;
  yardLength: number;
  yardWidth: number;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function ElementMesh({
  el,
  isSelected,
  yardLength,
  yardWidth,
  onClick,
}: ElementMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const elH = el.height3d;
  const halfL = yardLength / 2;
  const halfW = yardWidth / 2;
  const px = el.xPosition - halfL;
  const pz = el.yPosition - halfW;
  const py = elH / 2;

  const w = el.width;
  const d = Math.max(el.height, 0.5);

  const color = new THREE.Color(el.color);
  const selectedColor = new THREE.Color("#1E7ACB");

  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (isSelected) {
        mat.emissive.lerp(selectedColor, 0.1);
        mat.emissiveIntensity = 0.3;
      } else {
        mat.emissive.lerp(new THREE.Color(0, 0, 0), 0.1);
        mat.emissiveIntensity = 0;
      }
    }
  });

  const matProps = { color, roughness: 0.6, metalness: 0.1 };

  const renderShape = () => {
    switch (el.shape) {
      case "circle":
        return (
          // biome-ignore lint/a11y/useKeyWithClickEvents: 3D scene interaction
          <mesh ref={meshRef} castShadow receiveShadow onClick={onClick}>
            <cylinderGeometry args={[w / 2, w / 2, elH, 32]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        );
      case "l-shape": {
        const legW = w * 0.5;
        const legD = d * 0.5;
        return (
          <group>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: 3D scene interaction */}
            <mesh
              castShadow
              receiveShadow
              onClick={onClick}
              position={[0, 0, legD / 2]}
            >
              <boxGeometry args={[legW, elH, d]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: 3D scene interaction */}
            <mesh
              castShadow
              receiveShadow
              onClick={onClick}
              position={[legW / 2, 0, -legD / 2]}
            >
              <boxGeometry args={[w - legW, elH, legD]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
          </group>
        );
      }
      case "t-shape": {
        const flangeD = d * 0.35;
        const webW = w * 0.4;
        const stemD = d - flangeD;
        return (
          <group>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: 3D scene interaction */}
            <mesh
              castShadow
              receiveShadow
              onClick={onClick}
              position={[0, 0, -(d / 2) + flangeD / 2]}
            >
              <boxGeometry args={[w, elH, flangeD]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: 3D scene interaction */}
            <mesh
              castShadow
              receiveShadow
              onClick={onClick}
              position={[0, 0, flangeD / 2 + stemD / 2 - d / 2]}
            >
              <boxGeometry args={[webW, elH, stemD]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
          </group>
        );
      }
      case "i-shape": {
        const flangeH = elH * 0.25;
        const webH = elH - flangeH * 2;
        const webW = w * 0.35;
        return (
          <group>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: 3D scene interaction */}
            <mesh
              castShadow
              receiveShadow
              onClick={onClick}
              position={[0, webH / 2 + flangeH / 2, 0]}
            >
              <boxGeometry args={[w, flangeH, d]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: 3D scene interaction */}
            <mesh
              ref={meshRef}
              castShadow
              receiveShadow
              onClick={onClick}
              position={[0, 0, 0]}
            >
              <boxGeometry args={[webW, webH, d]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: 3D scene interaction */}
            <mesh
              castShadow
              receiveShadow
              onClick={onClick}
              position={[0, -(webH / 2 + flangeH / 2), 0]}
            >
              <boxGeometry args={[w, flangeH, d]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
          </group>
        );
      }
      case "open": {
        // Three slabs: front, back, and top cover
        // 0.5m wall thickness
        const wallT = 0.5;
        return (
          <group>
            {/* Front wall (full width, at front edge) */}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: 3D scene interaction */}
            <mesh
              castShadow
              receiveShadow
              onClick={onClick}
              position={[0, 0, -(d / 2 - wallT / 2)]}
            >
              <boxGeometry args={[w, elH, wallT]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* Back wall (full width, at back edge) */}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: 3D scene interaction */}
            <mesh
              castShadow
              receiveShadow
              onClick={onClick}
              position={[0, 0, d / 2 - wallT / 2]}
            >
              <boxGeometry args={[w, elH, wallT]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* Top cover slab (horizontal, covers full width and depth at top) */}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: 3D scene interaction */}
            <mesh
              castShadow
              receiveShadow
              onClick={onClick}
              position={[0, elH / 2 - wallT / 2, 0]}
            >
              <boxGeometry args={[w, wallT, d]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
          </group>
        );
      }
      default:
        return (
          // biome-ignore lint/a11y/useKeyWithClickEvents: 3D scene interaction
          <mesh ref={meshRef} castShadow receiveShadow onClick={onClick}>
            <boxGeometry args={[w, elH, d]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        );
    }
  };

  return (
    <group
      position={[px + w / 2, py, pz + d / 2]}
      rotation={[0, -degToRad(el.rotationAngle), 0]}
    >
      {renderShape()}
      {isSelected && (
        <lineSegments>
          <edgesGeometry
            args={[new THREE.BoxGeometry(w + 0.2, elH + 0.2, d + 0.2)]}
          />
          <lineBasicMaterial color="#1E7ACB" linewidth={2} />
        </lineSegments>
      )}
      <Text
        position={[0, elH / 2 + 0.5, 0]}
        fontSize={1.5}
        color="#1F2A33"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.1}
        outlineColor="white"
      >
        {el.name.split(" ").slice(-1)[0]}
      </Text>
    </group>
  );
}

function Scene({
  elements,
  selectedId,
  yardLength,
  yardWidth,
  onSelectElement,
}: Canvas3DProps) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[80, 120, 80]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={400}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
      />
      <directionalLight position={[-50, 60, -50]} intensity={0.4} />

      <Grid
        args={[yardLength, yardWidth]}
        cellSize={10}
        cellThickness={0.5}
        cellColor="#cbd5e1"
        sectionSize={50}
        sectionThickness={1}
        sectionColor="#94a3b8"
        fadeDistance={400}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />

      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
      >
        <planeGeometry args={[yardLength, yardWidth]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>

      <Suspense fallback={null}>
        {elements.map((el) => (
          <ElementMesh
            key={String(el.id)}
            el={el}
            isSelected={el.id === selectedId}
            yardLength={yardLength}
            yardWidth={yardWidth}
            onClick={(e) => {
              e.stopPropagation();
              onSelectElement(el.id === selectedId ? null : el.id);
            }}
          />
        ))}
      </Suspense>

      <OrbitControls
        enableRotate={true}
        enablePan={true}
        enableZoom={true}
        minZoom={0.5}
        maxZoom={8}
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.ROTATE,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />
    </>
  );
}

export function Canvas3D({
  elements,
  selectedId,
  yardLength,
  yardWidth,
  onSelectElement,
}: Canvas3DProps) {
  return (
    <div className="flex-1 relative" data-ocid="canvas3d.canvas_target">
      <Canvas
        orthographic
        camera={{
          position: [100, 120, 100],
          zoom: 3,
          near: 0.1,
          far: 2000,
        }}
        shadows
        style={{ background: "#f0f4f8" }}
        onPointerMissed={() => onSelectElement(null)}
      >
        <Scene
          elements={elements}
          selectedId={selectedId}
          yardLength={yardLength}
          yardWidth={yardWidth}
          onSelectElement={onSelectElement}
        />
      </Canvas>
      <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded pointer-events-none">
        Pan: drag · Zoom: scroll · Rotate: middle mouse
      </div>
    </div>
  );
}
