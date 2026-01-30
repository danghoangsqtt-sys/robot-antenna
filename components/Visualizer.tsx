import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { HandGesture } from '../types';
import { PhysicalAntenna } from '../antenna/geometry';

// Import restored modular visualization components
import { NearFieldParticles, NearFieldSlice } from '../modules/nearFieldPhysics';
import { RadiationParticles, CoverageVisualizer } from '../modules/radiationParticles';
import { FDTDVisualizer } from '../modules/fdtd';
import { MultipathRenderer } from '../modules/multipath';

const LAMBDA_SCALE = 10;

const SceneContent: React.FC = () => {
  const { 
      antennaType, resolution, customFormula, gain, gesture, physicalGeometry, showPhysicalAntenna,
      arrayEnabled, arrayElements, elementSpacing, steeringAngle,
      transmitPowerdBm, receiverSensitivitydBm, frequencyGHz, showCoverage,
      nearFieldEnabled, nearFieldConfig, multipathEnabled, obstacles, maxReflections, terrainType,
      mimo, freqSweep, fdtd,
      zoomDelta
  } = useStore();
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  
  useFrame(() => {
    // Rotation Control
    if (controlsRef.current) {
        if (gesture === HandGesture.FIST) {
           controlsRef.current.autoRotate = true;
           controlsRef.current.autoRotateSpeed = 5.0;
        } else {
          controlsRef.current.autoRotate = false;
        }
    }

    // Zoom Control
    if (Math.abs(zoomDelta) > 0.001) {
        // Simple Dolly Zoom: Move camera along the vector to origin
        const dir = new THREE.Vector3(0, 0, 0).sub(camera.position).normalize();
        // zoomDelta > 0 means hands spreading -> Zoom In -> Move closer
        // zoomDelta < 0 means hands pinching -> Zoom Out -> Move away
        const speed = 15.0; 
        camera.position.addScaledVector(dir, zoomDelta * speed);
    }
  });

  const rangeKm = React.useMemo(() => {
      const freqHz = frequencyGHz * 1e9;
      const c = 3e8;
      const lambda = c / freqHz;
      const activeElements = mimo.enabled ? mimo.txCount : (arrayEnabled ? arrayElements : 1);
      const arrayGaindB = (mimo.enabled || arrayEnabled) ? 10 * Math.log10(activeElements) : 0;
      
      const totalGaindBi = gain + arrayGaindB;
      const pathLossBudget = transmitPowerdBm + totalGaindBi - receiverSensitivitydBm;
      const distMeters = (lambda / (4 * Math.PI)) * Math.pow(10, pathLossBudget / 20);
      return distMeters / 1000;
  }, [frequencyGHz, transmitPowerdBm, gain, receiverSensitivitydBm, arrayEnabled, arrayElements, mimo]);

  return (
    <>
      <fog attach="fog" args={['#0b1220', 15, 80]} />
      <PerspectiveCamera makeDefault position={[12, 12, 12]} />
      <OrbitControls ref={controlsRef} enableDamping />
      
      <gridHelper args={[60, 60, 0x334155, 0x1e293b]} />
      <axesHelper args={[5]} />
      
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <directionalLight position={[-10, 10, 5]} intensity={0.5} />
      
      {(arrayEnabled || mimo.enabled) && (
          <group rotation={[0, 0, (steeringAngle) * Math.PI / 180]}>
             <arrowHelper args={[new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,0), 10, 0xec4899]} />
          </group>
      )}
      
      <CoverageVisualizer rangeKm={rangeKm} show={showCoverage} />

      {showPhysicalAntenna && (
        <group position={[0, 0, 0]}>
           <PhysicalAntenna geometry={physicalGeometry} />
        </group>
      )}

      {multipathEnabled && (
          <MultipathRenderer 
              obstacles={obstacles} 
              maxReflections={maxReflections}
              antennaType={antennaType}
              customFormula={customFormula}
              terrainType={terrainType}
          />
      )}

      <FDTDVisualizer fdtdState={fdtd} />

      {nearFieldEnabled ? (
          <>
            {(nearFieldConfig.visualizationMode === 'particles' || nearFieldConfig.visualizationMode === 'both') && (
                <NearFieldParticles 
                    antennaType={antennaType}
                    customFormula={customFormula}
                    resolution={resolution}
                />
            )}
            {(nearFieldConfig.visualizationMode === 'slice' || nearFieldConfig.visualizationMode === 'both') && (
                <NearFieldSlice config={nearFieldConfig} />
            )}
          </>
      ) : (
          <RadiationParticles 
            antennaType={antennaType}
            resolution={resolution}
            customFormula={customFormula}
            gain={gain}
            arrayEnabled={arrayEnabled}
            arrayElements={arrayElements}
            elementSpacing={elementSpacing}
            steeringAngle={steeringAngle}
            mimoEnabled={mimo.enabled}
            mimoTxCount={mimo.txCount}
            beamformingType={mimo.beamformingType}
            frequencyGHz={frequencyGHz}
            freqSweepEnabled={freqSweep.enabled}
            freqSweepStart={freqSweep.startHz}
            freqSweepEnd={freqSweep.endHz}
          />
      )}
    </>
  );
};

export const Visualizer: React.FC = () => {
  return (
    <div className="w-full h-full bg-[#0b1220] relative">
      <Canvas 
        id="antenna-canvas"
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <SceneContent />
      </Canvas>
      
      <div className="absolute top-4 right-4 text-[10px] font-mono text-slate-400 pointer-events-none bg-[#101c2e]/90 p-2 border border-slate-700 rounded backdrop-blur-sm shadow-sm">
        <p className="font-bold border-b border-slate-700 pb-1 mb-1 text-blue-400">TRẠNG THÁI MÔ PHỎNG</p>
        <p>TRỤC: X(Đỏ) Y(Xanh lá) Z(Xanh dương)</p>
        <p>RENDER: GLSL CORE ACTIVE</p>
        <p>CHẾ ĐỘ: {useStore.getState().fdtd.enabled ? 'MIỀN THỜI GIAN (FDTD)' : (useStore.getState().nearFieldEnabled ? `TRƯỜNG GẦN (${useStore.getState().nearFieldConfig.visualizationMode.toUpperCase()})` : (useStore.getState().multipathEnabled ? 'ĐA ĐƯỜNG (RAY TRACING)' : (useStore.getState().showPhysicalAntenna ? 'LAI (VẬT LÝ + BỨC XẠ)' : 'CHỈ BỨC XẠ')))}</p>
        <p>TỶ LỆ: 1λ = {LAMBDA_SCALE} ĐƠN VỊ</p>
        {(useStore.getState().arrayEnabled || useStore.getState().mimo.enabled) && (
            <p className="text-pink-400 font-bold">ĐIỀU HƯỚNG CHÙM TIA: {useStore.getState().steeringAngle}°</p>
        )}
        {useStore.getState().freqSweep.enabled && (
            <p className="text-amber-400 mt-1 font-bold">ĐANG QUÉT: {useStore.getState().frequencyGHz.toFixed(2)} GHz</p>
        )}
      </div>
    </div>
  );
};