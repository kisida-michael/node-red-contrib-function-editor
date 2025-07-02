import React, { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import FileTree from './components/FileTree'
import MonacoEditor from './components/MonacoEditor'
import Header from './components/Header'
import StatusBar from './components/StatusBar'
import StatusMessage from './components/StatusMessage'
import TestingPanel from './components/TestingPanel'
import './index.css'

function App() {
  const [files, setFiles] = useState({ flows: [], subflows: [], orphanedFiles: [] })
  const [currentNode, setCurrentNode] = useState(null)
  const [currentContent, setCurrentContent] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [socket, setSocket] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState({ connected: false, message: 'Connecting...' })
  const [statusMessage, setStatusMessage] = useState(null)

  // Helper to find node info by filename
  const findNodeByFilename = (filename) => {
    const allNodes = [
      ...(files.flows || []).flatMap(flow => flow.nodes),
      ...(files.subflows || []).flatMap(subflow => subflow.nodes)
    ]
    return allNodes.find(node => node.filename === filename)
  }

  // Initialize Socket.IO connection
  useEffect(() => {
    const socketInstance = io()
    setSocket(socketInstance)

    socketInstance.on('connect', () => {
      setConnectionStatus({ connected: true, message: 'Connected to Node-RED' })
    })

    socketInstance.on('disconnect', () => {
      setConnectionStatus({ connected: false, message: 'Disconnected from Node-RED' })
    })

    socketInstance.on('files-extracted', () => {
      loadFileTree()
    })

    socketInstance.on('file-updated', (data) => {
      // Real-time sync: update editor if the file is currently open
      if (currentNode && currentNode.filename === data.filename && currentContent !== data.content) {
        setCurrentContent(data.content)
        setHasUnsavedChanges(false)
      }
      // Refresh file tree to show any new files
      loadFileTree()
    })

    return () => {
      socketInstance.close()
    }
  }, [currentNode, currentContent])

  // Load file tree from API
  const loadFileTree = async () => {
    try {
      const response = await fetch('/api/files')
      const data = await response.json()
      setFiles(data)
    } catch (error) {
      console.error('Error loading file tree:', error)
      showStatusMessage('Error loading file tree: ' + error.message, 'error')
    }
  }

  // Load file tree on component mount
  useEffect(() => {
    loadFileTree()
  }, [])

  // Select and load a file
  const selectFile = async (filename) => {
    try {
      const response = await fetch(`/api/file/${encodeURIComponent(filename)}`)
      const data = await response.json()
      
      const nodeInfo = findNodeByFilename(filename)
      setCurrentNode(nodeInfo || { filename, name: filename, id: filename })
      setCurrentContent(data.content)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error loading file:', error)
      showStatusMessage('Error loading file: ' + error.message, 'error')
    }
  }

  // Save current file (no deployment)
  const saveCurrentFile = async () => {
    if (!currentNode || !hasUnsavedChanges) {
      return
    }

    try {
      const response = await fetch(`/api/file/${encodeURIComponent(currentNode.filename)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: currentContent })
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
        
        console.log('File saved successfully (not deployed)')
        showStatusMessage(`${currentNode.name} saved (not deployed)`, 'success')
      } else {
        throw new Error('Failed to save file')
      }
    } catch (error) {
      console.error('Error saving file:', error)
      showStatusMessage('Error saving file: ' + error.message, 'error')
    }
  }

  // Save and deploy current file
  const saveAndDeployCurrentFile = async () => {
    if (!currentNode || !hasUnsavedChanges) {
      return
    }

    try {
      const response = await fetch(`/api/file/${encodeURIComponent(currentNode.filename)}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: currentContent })
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
        
        console.log('File saved and deployed successfully')
        showStatusMessage(`${currentNode.name} saved and deployed!`, 'success')
      } else {
        throw new Error('Failed to save and deploy file')
      }
    } catch (error) {
      console.error('Error saving and deploying file:', error)
      showStatusMessage('Error saving and deploying file: ' + error.message, 'error')
    }
  }

  // Pull functions from flows.json
  const pullFunctions = async () => {
    try {
      const response = await fetch('/api/pull-functions', {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          await loadFileTree()
          console.log('Functions pulled successfully')
          showStatusMessage('Functions pulled successfully', 'success')
        } else {
          throw new Error(result.error || 'Failed to pull functions')
        }
      } else {
        throw new Error('Failed to pull functions')
      }
    } catch (error) {
      console.error('Error pulling functions:', error)
      showStatusMessage('Error pulling functions: ' + error.message, 'error')
    }
  }

  // Collect changes and reload flows
  const collectChanges = async () => {
    try {
      const response = await fetch('/api/collect-changes', {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          console.log('Changes collected and flows reloaded successfully')
          showStatusMessage('Changes collected and flows reloaded!', 'success')
        } else {
          throw new Error(result.error || 'Failed to collect changes')
        }
      } else {
        throw new Error('Failed to collect changes')
      }
    } catch (error) {
      console.error('Error collecting changes:', error)
      showStatusMessage('Error collecting changes: ' + error.message, 'error')
    }
  }

  // Refresh files
  const refreshFiles = async () => {
    try {
      const response = await fetch('/api/refresh', {
        method: 'POST'
      })

      if (response.ok) {
        await loadFileTree()
        console.log('Files refreshed successfully')
        showStatusMessage('Files refreshed successfully', 'success')
      } else {
        throw new Error('Failed to refresh files')
      }
    } catch (error) {
      console.error('Error refreshing files:', error)
      showStatusMessage('Error refreshing files: ' + error.message, 'error')
    }
  }

  // Show status message
  const showStatusMessage = (message, type = 'info') => {
    setStatusMessage({ message, type })
    setTimeout(() => {
      setStatusMessage(null)
    }, 3000)
  }

  // Handle content change in editor
  const handleContentChange = (value) => {
    setCurrentContent(value)
    setHasUnsavedChanges(true)
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveCurrentFile()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentNode, hasUnsavedChanges, currentContent])

  return (
    <div className="flex h-screen bg-editor-bg text-editor-text">
      {/* Sidebar */}
      <div className="w-48 sm:w-56 lg:w-64 bg-editor-sidebar border-r border-editor-border flex flex-col">
        <div className="p-2 sm:p-3 lg:p-4 border-b border-editor-border">
          <h1 className="text-xs sm:text-sm font-semibold truncate">Node-RED Files</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <FileTree 
            files={files}
            currentFile={currentNode?.filename}
            onSelectFile={selectFile}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentNode={currentNode}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={saveCurrentFile}
          onSaveAndDeploy={saveAndDeployCurrentFile}
          onPullFunctions={pullFunctions}
          onCollectChanges={collectChanges}
          onRefresh={refreshFiles}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0">
            <MonacoEditor
              filename={currentNode?.filename}
              content={currentContent}
              onChange={handleContentChange}
            />
          </div>
          
          <div className="flex-shrink-0">
            <TestingPanel 
              currentNode={currentNode}
              socket={socket}
              showStatusMessage={showStatusMessage}
            />
          </div>
        </div>

        <StatusBar connectionStatus={connectionStatus} />
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <StatusMessage
          message={statusMessage.message}
          type={statusMessage.type}
          onClose={() => setStatusMessage(null)}
        />
      )}
    </div>
  )
}

export default App 