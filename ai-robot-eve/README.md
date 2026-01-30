# EVE Robot System (AI-Robot-Eve)

This directory contains the modular architecture for the AI Robot EVE system.
It is developed in isolation from the main AntennaViz application core.

## Structure
- **/core**: Main controller and event bus (System Nervous System).
- **/graphics**: Three.js/R3F components for robot visualization.
- **/movement**: Kinematics and animation logic.
- **/chat-ui**: Conversational interface components.
- **/ai-logic**: Brain, reasoning, and decision making (LLM integration).
- **/integration**: Bridges to external sensors or the main app.
- **/data**: State management and persistence.
- **/config**: System configuration and constants.

## Development Rules
- Do not import from the parent `src` or root app directly unless via defined bridges.
- Keep modules loosely coupled via `EveEventBus`.
