
import React, { Suspense, useEffect } from 'react';
import { useStore } from './store';
import { ControlPanel } from './components/ControlPanel';
import { Visualizer } from './components/Visualizer';
import { HandController } from './components/HandController';
import { PolarPlotPanel } from './components/PolarPlotPanel';
import { SParameterPanel } from './components/SParameterPanel';
import { LinkBudgetPanel } from './ui/panels/LinkBudgetPanel';
import { SmithChartPanel } from './ui/panels/SmithChartPanel';
import { MimoPanel } from './ui/panels/MimoPanel';
import { EnvironmentPanel } from './ui/panels/EnvironmentPanel';
import { TimeDomainPanel } from './ui/panels/TimeDomainPanel';
import { MaterialEditorPanel } from './ui/panels/MaterialEditorPanel';
import { GeometryEditorPanel } from './ui/panels/GeometryEditorPanel';
import { AntennaMetricsPanel } from './ui/panels/AntennaMetricsPanel';
import { FormulaLabPanel } from './ui/panels/FormulaLabPanel';
import { NearFieldPanel } from './ui/panels/NearFieldPanel';
import { VisionBuilderPanel } from './ui/panels/VisionBuilderPanel';
import { MaxwellSolverPanel } from './ui/panels/MaxwellSolverPanel';
import { VersionHistoryPanel } from './ui/panels/VersionHistoryPanel';

// EVE System Imports
import { EveController } from './ai-robot-eve/core/EveController';
import { EveChatModule } from './ai-robot-eve/chat-ui/EveChatModule';
import { EveOverlayContainer } from './ai-robot-eve/graphics/EveOverlayContainer';
import { EveSimulationBridge } from './ai-robot-eve/integration/EveSimulationBridge';
import { ChatWindow } from './ai-robot-eve/chat-ui/ChatWindow';

import { HologramBrain } from './eve-hologram-system/ai/HologramBrain';

const App: React.FC = () => {
  const { activeRightPanel } = useStore();

  // Initialize EVE Robot System
  useEffect(() => {
    const eve = EveController.getInstance();
    
    // Register Modules
    eve.registerModule(new EveChatModule());
    eve.registerModule(new HologramBrain());
    eve.registerModule(new EveSimulationBridge());
    
    // Boot System
    eve.initialize();

    return () => {
      eve.shutdown();
    };
  }, []);

  const renderRightPanel = () => {
    switch(activeRightPanel) {
      case 'polar': return <PolarPlotPanel />;
      case 'sparam': return <SParameterPanel />;
      case 'linkBudget': return <LinkBudgetPanel />;
      case 'smith': return <SmithChartPanel />;
      case 'mimo': return <MimoPanel />;
      case 'environment': return <EnvironmentPanel />;
      case 'timeDomain': return <TimeDomainPanel />;
      case 'materials': return <MaterialEditorPanel />;
      case 'geometryEditor': return <GeometryEditorPanel />;
      case 'metrics': return <AntennaMetricsPanel />;
      case 'formulaLab': return <FormulaLabPanel />;
      case 'nearField': return <NearFieldPanel />;
      case 'visionBuilder': return <VisionBuilderPanel />;
      case 'maxwellSolver': return <MaxwellSolverPanel />;
      case 'versionHistory': return <VersionHistoryPanel />;
      default: return <PolarPlotPanel />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#0b1220] overflow-hidden text-slate-200 font-sans">
      {/* Left Panel */}
      <ControlPanel />
      
      {/* Main Viewport */}
      <div className="flex-1 relative h-full flex min-w-0">
        <div className="flex-1 relative h-full border-x border-slate-800 min-w-0">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center text-blue-500 font-mono bg-[#0b1220]">
                INITIALIZING PHYSICS ENGINE...
              </div>
            }>
              <Visualizer />
            </Suspense>

            {/* Hand Overlay */}
            <HandController />
            
            {/* EVE System Layer (Visuals) */}
            <EveOverlayContainer />

            {/* EVE Chat Interface (New Overlay) */}
            <ChatWindow />
        </div>
        
        {/* Right Panel (Charts/Tools) */}
        {renderRightPanel()}
      </div>
    </div>
  );
};

export default App;
