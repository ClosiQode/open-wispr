# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.23] - 2025-12-21

### Added
- **Transcription Statistics**: Dashboard with global statistics
  - Total transcriptions count
  - Total words transcribed
  - Number of active days
  - Average words per minute (calculated from recordings with duration)
  - Total dictation time
- **Per-Transcription Stats**: Each transcription now shows
  - Word count
  - Words per minute (for new transcriptions with duration tracking)
- **Recording Duration Tracking**: Recording duration is now saved with each transcription

### Technical Details
- Database migration adds `duration_seconds` column
- New `getStatistics()` API for aggregate statistics
- `saveTranscription()` now accepts optional duration parameter
- Recording duration tracked in App.jsx and passed to database

## [1.0.22] - 2025-12-21

### Added
- **GPU Status UI**: Visual GPU/CUDA status display in Local Whisper settings
  - Shows real-time GPU detection status
  - Displays GPU name and CUDA version when available
  - One-click CUDA installation for NVIDIA users
  - Automatic numpy compatibility fix after CUDA install

### UI States
- ✅ **GPU activé** (green) - CUDA is working, transcription will use GPU
- ⚡ **GPU disponible** (orange) - NVIDIA detected, click to enable CUDA
- 💻 **Mode CPU** (gray) - No NVIDIA GPU, using CPU

### Technical Details
- New IPC handlers: `check-gpu-status`, `check-nvidia-gpu`, `install-cuda-torch`
- WhisperManager methods for GPU detection and CUDA installation
- Automatic numpy<2.0 downgrade for numba compatibility

## [1.0.21] - 2025-12-21

### Added
- **CUDA/GPU Acceleration**: Automatic GPU detection and acceleration for faster transcription
  - Auto-detects NVIDIA CUDA-compatible GPUs
  - Enables fp16 (half-precision) for 2-3x speedup when GPU available
  - Falls back to CPU gracefully if GPU fails
  - New `check-gpu` mode in whisper_bridge.py to verify GPU status
  - Returns device info (cuda/cpu) and fp16 status in transcription results

### Technical Details
- `whisper_bridge.py` now imports torch for GPU detection
- Model loading uses detected device (CUDA or CPU)
- GPU memory is properly cleared when switching models

## [1.0.20] - 2025-12-21

### Fixed
- **Python Path Resolution**: Now resolves `python.exe` to absolute path
  - When Python is found via PATH, uses `where python.exe` to get full path
  - Fixes "spawn python.exe ENOENT" error during transcription
  - The issue was that `runWhisperProcess` modified PATH environment, breaking relative path resolution

## [1.0.19] - 2025-12-21

### Fixed
- **Python Detection Order**: Restored `python.exe` to first position in search list
  - In v1.0.16, PATH-based search was moved to last position, breaking detection
  - Now checks PATH first (fastest when Python is properly installed)
  - Falls back to absolute paths if PATH doesn't work

## [1.0.18] - 2025-12-21

### Fixed
- **Infinite Loop Bug**: Fixed critical bug causing infinite re-renders in Settings page
  - Removed `whisperHook` from useEffect dependencies (caused loop on every state change)
  - Reverted to simple Local Whisper UI (just the model picker)
  - useWhisper hook already checks installation on mount, no need for duplicate check

## [1.0.17] - 2025-12-21

### Fixed (reverted in 1.0.18)
- Local Whisper UI changes (reverted due to causing issues)

## [1.0.16] - 2025-12-21

### Fixed
- **Python Detection**: Improved Python detection on Windows for GUI-launched apps
  - Now uses `os.homedir()` which is more reliable than environment variables
  - Environment variables like `LOCALAPPDATA` may be empty when app is launched from Start Menu
  - Added support for Python 3.13
  - Prioritized user installations over PATH-based detection for reliability

### Technical Details
- `findPythonExecutable()` now builds paths using `os.homedir()` as the base
- Falls back to environment variables only as backup
- PATH-based detection moved to last resort

## [1.0.15] - 2025-12-18

### Added
- **GPT-5 Mini Support**: Full support for OpenAI's GPT-5 Mini model
  - Uses the new Responses API (`/v1/responses`) instead of Chat Completions
  - Automatic API detection based on model selection
  - Reasoning effort parameter for enhanced responses
- **Updated AI Models**:
  - OpenAI: GPT-5 Mini (Responses API), GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo
  - Anthropic: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus

### Changed
- **Static Model List**: Removed dynamic model fetching for simplicity and reliability
- **Improved Installer**: Added elevation support and auto-run after install

### Technical Details
- ReasoningService now supports both Chat Completions and Responses API
- `getModelApiType()` helper to determine correct API endpoint
- Simplified `useAIModels` hook with static model list

## [1.0.14] - 2025-12-18

### Added
- **Dynamic AI Models**: AI models are now fetched dynamically from APIs
  - OpenAI models fetched via `/v1/models` endpoint
  - 24-hour cache to minimize API calls
  - Refresh button to force update
  - Fallback to static list if no API key or error
- **Updated AI Models**:
  - OpenAI: GPT-5 Mini, GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo
  - Anthropic: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus

### Technical Details
- New `useAIModels` hook for dynamic model fetching
- Models cached in localStorage with TTL
- Automatic refresh when API key changes

## [1.0.13] - 2025-12-18

### Added
- **Push-to-Talk Mode**: New recording mode where you hold the key to record
  - Hold the hotkey to start recording, release to stop and transcribe
  - Toggle mode still available (press once to start, press again to stop)
  - Mode selector in settings with intuitive UI
  - Uses native keyboard hooks via `uiohook-napi` for reliable key detection
- **Extended Function Keys Support (F13-F24)**: Full support for extended function keys
  - Useful for dedicated macro keyboards and Stream Deck
  - Works with both Toggle and Push-to-Talk modes
- **Groq Transcription Provider**: Ultra-fast cloud transcription option
  - 216x real-time transcription speed
  - Two models available: Whisper Large v3 Turbo (fast) and Whisper Large v3 (precise)
  - Requires Groq API key (free tier available)
- **Custom Dictionary**: Automatic word replacement for better transcription
  - Define custom replacements (e.g., "open AI" -> "OpenAI")
  - Supports case-insensitive matching
  - Easy-to-use interface in settings
- **Three Transcription Providers**: Choose between Local, OpenAI, or Groq
  - Local: Privacy-focused, runs on your machine
  - OpenAI: Cloud-based, reliable
  - Groq: Ultra-fast cloud transcription

### Changed
- **Transcription Settings UI**: Redesigned provider selector with 3-button layout
- **Hotkey System**: Improved architecture to support both toggle and push-to-talk modes

### Technical Details
- Added `uiohook-napi` for native keyboard hook support (push-to-talk)
- Implemented keycode mapping for extended function keys (F13-F24)
- Added Groq API integration in AudioManager
- Settings migration for backward compatibility with `useLocalWhisper`
- New `hotkeyMode` setting with "toggle" and "push-to-talk" options

## [1.0.2] - 2024-12-19

### Added
- **Automatic Python Installation**: The app now detects and offers to install Python automatically
  - macOS: Uses Homebrew if available, falls back to official installer
  - Windows: Downloads and installs official Python with proper PATH configuration
  - Linux: Uses system package manager (apt, yum, or pacman)
- **Enhanced Developer Experience**: 
  - Added MIT LICENSE file
  - Improved documentation for personal vs distribution builds
  - Added FAQ section to README
  - Added security information section
  - Clearer prerequisites and setup instructions
  - Added comprehensive CLAUDE.md technical reference
- **Dock Icon Support**: App now appears in the dock with activity indicator
  - Changed LSUIElement from true to false in electron-builder.json
  - App shows in dock on macOS with the standard dot indicator when running

### Changed
- Updated supported language count from 90+ to 58 (actual count in codebase)
- Improved README structure for better open source experience

## [1.0.1] - 2024-XX-XX

### Added
- **Agent Naming System**: Personalize your AI assistant with a custom name for more natural interactions
  - Name your agent during onboarding (step 6 of 8)
  - Address your agent directly: "Hey [AgentName], make this more professional"
  - Update agent name anytime through settings
  - Smart AI processing distinguishes between commands and regular dictation
  - Clean output automatically removes agent name references
- **Draggable Interface**: Click and drag the dictation panel to any position on screen
- **Dynamic Hotkey Display**: Tooltip shows your actual hotkey setting instead of generic text
- **Flexible Hotkey System**: Fixed hardcoded hotkey limitation - now fully respects user settings

### Changed
- **[BREAKING]** Removed click-to-record functionality to prevent conflicts with dragging
- **UI Behavior**: Recording is now exclusively controlled via hotkey (no accidental triggering)
- **Tooltip Text**: Shows "Press {your-hotkey} to speak" with actual configured hotkey
- **Cursor Styles**: Changed to grab/grabbing cursors to indicate draggable interface

### Fixed
- **Hotkey Bug**: Fixed issue where hotkey setting was stored but not actually used by global shortcut
- **Documentation**: Updated all docs to reflect current UI behavior and hotkey system
- **User Experience**: Eliminated confusion between drag and click actions

### Technical Details
- **Agent Naming Implementation**:
  - Added centralized agent name utility (`src/utils/agentName.ts`)
  - Enhanced onboarding flow with agent naming step
  - Updated ReasoningService with context-aware AI processing
  - Added agent name settings section with comprehensive UI
  - Implemented smart prompt generation for agent-addressed vs regular text
- Added IPC handlers for dynamic hotkey updates (`update-hotkey`)
- Implemented window-level dragging using screen cursor tracking
- Added real-time hotkey loading from localStorage in main dictation component
- Updated WindowManager to support runtime hotkey changes
- Added proper drag state management with smooth 60fps window positioning
- **Code Organization**: Extracted functionality into dedicated managers and React hooks:
  - HotkeyManager, DragManager, AudioManager, MenuManager, DevServerManager
  - useAudioRecording, useWindowDrag, useHotkey React hooks
  - WindowConfig utility for centralized window configuration
  - Reduced WindowManager from 465 to 190 lines through composition pattern

## [0.1.0] - 2024-XX-XX

### Added
- Initial release of OpenWispr (formerly OpenWispr)
- Desktop dictation application using OpenAI Whisper
- Local and cloud-based speech-to-text transcription
- Real-time audio recording and processing
- Automatic text pasting via accessibility features
- SQLite database for transcription history
- macOS tray icon integration
- Global hotkey support (backtick key)
- Control panel for settings and configuration
- Local Whisper model management
- OpenAI API integration
- Cross-platform support (macOS, Windows, Linux)

### Features
- **Speech-to-Text**: Convert voice to text using OpenAI Whisper
- **Dual Processing**: Choose between local processing (private) or cloud processing (fast)
- **Model Management**: Download and manage local Whisper models (tiny, base, small, medium, large)
- **Transcription History**: View, copy, and delete past transcriptions
- **Accessibility Integration**: Automatic text pasting with proper permission handling
- **API Key Management**: Secure storage and management of OpenAI API keys
- **Real-time UI**: Live feedback during recording and processing
- **Global Hotkey**: Quick access via customizable keyboard shortcut
- **Database Storage**: Persistent storage of transcriptions with SQLite
- **Permission Management**: Streamlined macOS accessibility permission setup

### Technical Stack
- **Frontend**: React 19, Vite, TailwindCSS, Shadcn/UI components
- **Backend**: Electron 36, Node.js
- **Database**: better-sqlite3 for local storage
- **AI Processing**: OpenAI Whisper (local and API)
- **Build System**: Electron Builder for cross-platform packaging

### Security
- Local-first approach with optional cloud processing
- Secure API key storage and management
- Sandboxed renderer processes with context isolation
- Proper clipboard and accessibility permission handling
