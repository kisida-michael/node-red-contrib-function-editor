# @mkisida/node-red-contrib-function-editor

A Node-RED custom node that provides an advanced function editor with Monaco editor integration, inject node testing, 

## Features

- **Monaco Editor Integration**: Full-featured code editor with syntax highlighting, IntelliSense, and error detection
- **Inject Node Testing**: Directly trigger connected inject nodes for testing
- **File Management**: Extract and organize function code into separate files
- **Multi-deployment Options**: HTTP partial and full deployment modes
- **Function Extraction**: Pull functions from flows.json into organized file structure

## Installation

### Via npm

```bash
npm install @mkisida/node-red-contrib-function-editor
```

### Via Node-RED Palette Manager

1. Open Node-RED in your browser
2. Go to Menu → Manage palette
3. Click the "Install" tab
4. Search for `@mkisida/node-red-contrib-function-editor`
5. Click "Install"

### Manual Installation

1. Navigate to your Node-RED user directory (typically `~/.node-red`)
2. Run: `npm install @mkisida/node-red-contrib-function-editor`
3. Restart Node-RED

## Quick Start

1. **Add the Function Editor Node**: Drag the "Function Editor" node from the palette into your flow
2. **Configure**: Double-click the node to set your preferences:
   - **Port**: Editor server port (default: 3001)
   - **Flows File**: Path to your flows.json file (default: `./flows.json`)
3. **Deploy**: Deploy your flow
4. **Access Editor**: Open `http://localhost:3001/function-editor` in your browser

## Usage

### Basic Workflow

1. **Extract Functions**: Click "Pull Functions" to extract all function nodes from your flows
2. **Edit Code**: Select any function file from the tree and edit in the Monaco editor
4. **Test Functions**: Use the inject node panel to trigger connected inject nodes
5. **Deploy Changes**: Use "Deloy Changes" to update flows.json and deploy modified node

### Advanced Features

#### File Management
- **File Tree**: Browse and organize your function files
- **Auto-extraction**: Functions are automatically extracted with sanitized filenames


#### Testing & Debugging
- **Inject Panel**: View and trigger inject nodes connected to your functions
- **Real-time Feedback**: See inject node payloads and configurations
- **Status Messages**: Get feedback on deployment and testing operations

## Configuration Options

### Node Configuration

| Option | Default | Description |
|--------|---------|-------------|
| Port | 3001 | Port for the editor web server |
| Functions Directory | `./functions` | Directory to store function files |
| Flows File | `./flows.json` | Path to Node-RED flows file |

### Deployment Methods

- **HTTP Partial**: Updates only modified nodes (recommended)
- **HTTP Full**: Replaces entire flow configuration



## Requirements

- Node-RED version 3.0 or higher
- Node.js version 14 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)


This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.


### 1.0.0
- Initial release
- Monaco editor integration
- Inject node testing
- File management system
- HTTP deployment methods
---

