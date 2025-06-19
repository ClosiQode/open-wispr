# Open Scribe

A desktop dictation application that uses OpenAI's Whisper model to transcribe speech and automatically paste it at your cursor location, similar to Wispr Flow.

## Features

- 🎤 **Voice Recording**: Click or press space to start/stop recording
- 🤖 **AI Transcription**: Uses OpenAI Whisper for accurate speech-to-text
- ⌨️ **Auto Paste**: Automatically pastes transcribed text at cursor location
- 🔥 **Global Shortcut**: Fn key (Mac) or Cmd+` to toggle the app from anywhere
- 🪟 **Floating Window**: Always-on-top transparent window with glass effect
- ⚡ **Fast & Lightweight**: Built with Electron for cross-platform support

## Installation

1. Clone or download this project
2. Run the setup script:
   ```bash
   npm run setup
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up your OpenAI API key:
   - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Edit the `.env` file and add your API key
5. Run the app:
   ```bash
   npm start
   ```

## Usage

1. **Activate**: Press `Fn key` (Mac) or `Cmd+`` (alternative)
2. **Record**: Click the microphone button or press `Space`
3. **Stop**: Click again or press `Space` to stop recording
4. **Auto-paste**: The transcribed text will automatically be pasted at your cursor
5. **Close**: Press `ESC` or click the X button

## System Requirements

- **macOS**: Requires accessibility permissions for text pasting
- **Windows**: May require PowerShell execution policy adjustment
- **Linux**: Requires `xdotool` for text pasting (`sudo apt install xdotool`)

## Building

To create a distributable app:

```bash
# Build for current platform
npm run build

# Build for specific platform
npm run build:mac
npm run build:win
npm run build:linux
```

This will create platform-specific installers in the `dist` folder.

## Permissions

The app requires:
- **Microphone access**: For voice recording
- **Accessibility permissions**: For automatic text pasting (macOS)
- **Input simulation**: For keyboard shortcuts (Windows/Linux)

## Troubleshooting

- **No microphone access**: Check system permissions
- **Text not pasting**: Ensure accessibility permissions are granted
- **API errors**: Verify your OpenAI API key is correct and has credits
- **Key binding not working**: Try the alternative Cmd+` shortcut

## Development

```bash
# Start in development mode
npm run dev

# Test setup
npm run test

# Package without distribution
npm run pack
```

## License

MIT License - feel free to modify and distribute!
