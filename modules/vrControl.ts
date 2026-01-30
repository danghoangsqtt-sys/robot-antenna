
import { HandGesture } from '../types';
import { useStore } from '../store';

// Extended Gesture Types
export enum VRGesture {
    PINCH = 'PINCH', // Thumb + Index touch
    SWIPE_LEFT = 'SWIPE_LEFT',
    SWIPE_RIGHT = 'SWIPE_RIGHT'
}

let lastHandX = 0;
let lastGestureTime = 0;

export const detectAdvancedGestures = (landmarks: any[]): VRGesture | null => {
    // MediaPipe Hand landmarks usually contain 21 points
    if (!landmarks || landmarks.length < 21) return null;
    
    // landmarks passed here is the array of points for a single hand
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const wrist = landmarks[0];

    if (!thumbTip || !indexTip || !wrist) return null;

    // Distance util
    const d = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

    // 1. PINCH Detection (Thumb tip close to Index tip)
    if (d(thumbTip, indexTip) < 0.05) {
        return VRGesture.PINCH;
    }

    // 2. SWIPE Detection (Wrist velocity proxy)
    const now = performance.now();
    if (now - lastGestureTime > 500) { // Debounce swipes
        const deltaX = wrist.x - lastHandX;
        lastHandX = wrist.x;
        
        if (Math.abs(deltaX) > 0.15) { // Threshold for swipe speed
            lastGestureTime = now;
            return deltaX > 0 ? VRGesture.SWIPE_LEFT : VRGesture.SWIPE_RIGHT; // Camera mirrored?
        }
    }
    lastHandX = wrist.x;

    return null;
};

export const handleVRAction = (gesture: VRGesture) => {
    // DISABLED FOR DEMO
    console.log(`[DEMO MODE] Detected Gesture: ${gesture} - Action Suppressed`);
};

export const toggleVRMode = (start: boolean) => {
    if (start) {
        alert("VR Mode is currently in Demo/Preview state.");
    }
};
