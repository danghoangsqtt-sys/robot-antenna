
export interface HologramConfig {
    beamColor: string;
    uiColor: string;
    autoCloseTimeout: number;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'eve' | 'system';
    content: string;
    timestamp: number;
}
