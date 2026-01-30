export const exportCanvasToPNG = (canvasId: string) => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `antenna_viz_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
};

export const exportCanvasToVideo = (canvasId: string) => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];
    
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'simulation.webm';
      a.click();
    };
    
    recorder.start();
    return recorder; // caller should stop it
};
