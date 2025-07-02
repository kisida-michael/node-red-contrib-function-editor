# Node-RED Monaco Editor v2.0.0 - React + Tailwind

A modern React-based Monaco Editor for Node-RED with real-time synchronization and organized file tree.

## 🚀 Major Refactor (v2.0.0)


### 🎨 **Enhanced UI/UX**
- **Modern Tailwind Styling**: Clean, professional dark theme
- **Responsive Design**: Better layout and spacing
- **Smooth Animations**: Collapsible sections with transitions
- **Toast Notifications**: Non-intrusive status messages
- **Visual Indicators**: Color-coded nodes and connection status

### 📁 **Granular File Tree**
- **Flow-based Organization**: Files organized by Node-RED flows
- **Individual Node Display**: Each function/template node shown separately
- **Subflow Support**: Dedicated section for subflows
- **Collapsible Sections**: Flows and subflows can be collapsed/expanded
- **Visual Node Types**: 
  - `ƒ` for function nodes (gold)
  - `T` for template nodes (blue)

### ⚡ **Real-time Features**
- **Auto-sync on Save**: Changes automatically collected after 500ms
- **Smart Conflict Resolution**: Preserves cursor position during updates
- **Background Processing**: Silent sync to avoid UI interruption

## 🏗️ **Component Structure**

```
src/
├── App.jsx                 # Main application component
├── main.jsx               # React entry point
├── index.css              # Tailwind CSS with custom styles
├── index.html             # React HTML template
└── components/
    ├── FileTree.jsx       # Hierarchical file tree
    ├── MonacoEditor.jsx   # Monaco editor wrapper
    ├── Header.jsx         # Action buttons and file info
    ├── StatusBar.jsx      # Connection status
    └── StatusMessage.jsx  # Toast notifications
```

## 🎯 **Key Features**

### **File Tree Structure**
```
▼ Flows
  ▼ Flow 1
    ƒ function_node_1
    ƒ function_node_2
    T template_node
  ▼ Flow 2
    ƒ another_function
▼ My Subflow (subflow)
  ƒ subflow_function

```

### **Real-time Workflow**
1. **Edit** → Save (Ctrl+S)
2. **Auto-sync** → Collects changes after 500ms
3. **Flow Reload** → Node-RED updates automatically
4. **Live Updates** → Other editor instances sync in real-time

### **Status System**
- ✅ Green toasts for successful operations
- ❌ Red toasts for errors
- 🔵 Blue toasts for information
- 🟢 Connected indicator in status bar
- 🔴 Disconnected indicator when offline

## 🛠️ **Development**

### **Build Commands**
```bash
npm run build    # Production build
npm run dev      # Development server
npm run preview  # Preview production build
```

