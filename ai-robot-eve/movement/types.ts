/**
 * Standard 3D Coordinate
 */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Payload for 'movement:pose_update' events
 */
export interface PoseUpdatePayload {
  sourceId: string;
  positionOffset: Vec3;
  rotationOffset?: Vec3;
  timestamp: number;
}

export interface FloatingConfig {
  speed: number;
  amplitude: number;
}
