# System Architecture

## Overview
SchedulR is a desktop application built using **Electron**, **React**, and **TypeScript**. It follows a standard Electron architecture with a Main Process handling system-level operations and a Renderer Process handling the UI and business logic.

## High-Level Architecture

```mermaid
graph TD
    User[User / Student Affairs] --> UI[React UI (Renderer)]
    UI --> |Import Data| Parser[Data Parser]
    UI --> |Generate| Scheduler[Scheduling Engine]
    UI --> |View| Dashboard[Dashboard & Views]
    
    Parser --> Store[State Store / DB]
    Scheduler --> Store
    Store --> UI
    
    subgraph Electron App
        subgraph Renderer Process
            UI
            Parser
            Scheduler
            Store
        end
        subgraph Main Process
            WindowMgmt[Window Management]
            FileSystem[File System Access]
        end
    end
```

## Components

### 1. Frontend (Renderer Process)
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Routing**: React Router (for view switching)
- **State Management**: React Context / Hooks (Local state for MVP)

### 2. Backend (Main Process)
- **Runtime**: Electron
- **Responsibilities**:
    - Application Lifecycle Management
    - Native Window Management
    - File System Access (reading/writing files)
    - IPC (Inter-Process Communication) if needed for heavy computation (optional for MVP)

### 3. Data Layer
- **Input**: CSV/Excel files.
- **Internal Representation**: JSON objects (TypeScript Interfaces).
- **Persistence**: Local Storage / SQLite (Planned).

## Data Flow
1.  **Import**: User selects files -> Parser reads and validates -> Updates State.
2.  **Scheduling**: User triggers generation -> Scheduler reads State -> Runs Algorithm -> Updates Schedule State.
3.  **Export**: User clicks export -> State converted to CSV/PDF -> Saved to disk.
