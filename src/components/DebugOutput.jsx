import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBug, faTrash, faCopy, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'

const DebugOutput = ({ currentNode, socket, showStatusMessage }) => {
  const [debugNodes, setDebugNodes] = useState([])
  const [debugMessages, setDebugMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [maxMessages] = useState(100) // Limit message history
  const messagesEndRef = useRef(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [debugMessages])

  // Load connected debug nodes when currentNode changes
  useEffect(() => {
    if (currentNode && currentNode.id) {
      loadDebugNodes()
      setDebugMessages([]) // Clear previous messages
    } else {
      setDebugNodes([])
      setDebugMessages([])
    }
  }, [currentNode])

  // Set up socket listeners for debug messages
  useEffect(() => {
    if (!socket) return

    const handleDebugMessage = (debugData) => {
      // Only show messages from debug nodes connected to current function
      const connectedDebugNodeIds = debugNodes.map(node => node.id)
      
      if (debugData && connectedDebugNodeIds.includes(debugData.id)) {
        const newMessage = {
          id: Date.now() + Math.random(), // Unique ID for React key
          nodeId: debugData.id,
          nodeName: debugNodes.find(n => n.id === debugData.id)?.name || 'Debug',
          timestamp: debugData.timestamp || Date.now(),
          msg: debugData.msg || debugData.data || debugData,
          topic: debugData.topic,
          format: debugData.format || 'object'
        }

        setDebugMessages(prev => {
          const updated = [...prev, newMessage]
          // Keep only the last maxMessages
          return updated.slice(-maxMessages)
        })
      }
    }

    socket.on('debug-message', handleDebugMessage)
    socket.on('debug-notification', handleDebugMessage)

    return () => {
      socket.off('debug-message', handleDebugMessage)
      socket.off('debug-notification', handleDebugMessage)
    }
  }, [socket, debugNodes, maxMessages])

  // Load debug nodes connected to the current function node
  const loadDebugNodes = async () => {
    if (!currentNode || !currentNode.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/debug-nodes/${encodeURIComponent(currentNode.id)}`)
      const data = await response.json()
      
      if (response.ok) {
        setDebugNodes(data.debugNodes || [])
      } else {
        console.error('Error loading debug nodes:', data.error)
        showStatusMessage?.('Error loading debug nodes: ' + data.error, 'error')
      }
    } catch (error) {
      console.error('Error loading debug nodes:', error)
      showStatusMessage?.('Error loading debug nodes: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Clear all debug messages
  const clearMessages = () => {
    setDebugMessages([])
    showStatusMessage?.('Debug messages cleared', 'info')
  }

  // Test debug message (for development)
  const testDebugMessage = async () => {
    if (debugNodes.length === 0) {
      showStatusMessage?.('No debug nodes to test', 'warning')
      return
    }

    try {
      const testNodeId = debugNodes[0].id
      const response = await fetch(`/api/test-debug/${encodeURIComponent(testNodeId)}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        showStatusMessage?.('Test debug message sent', 'success')
      } else {
        const data = await response.json()
        showStatusMessage?.('Failed to send test message: ' + data.error, 'error')
      }
    } catch (error) {
      showStatusMessage?.('Error sending test message: ' + error.message, 'error')
    }
  }

  // Copy message to clipboard
  const copyMessage = async (message) => {
    try {
      const content = typeof message.msg === 'string' 
        ? message.msg 
        : JSON.stringify(message.msg, null, 2)
      await navigator.clipboard.writeText(content)
      showStatusMessage?.('Message copied to clipboard', 'success')
    } catch (error) {
      showStatusMessage?.('Failed to copy message', 'error')
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  // Format message content for display
  const formatMessage = (msg) => {
    if (msg === null) return 'null'
    if (msg === undefined) return 'undefined'
    if (typeof msg === 'string') return msg
    if (typeof msg === 'number' || typeof msg === 'boolean') return String(msg)
    
    try {
      return JSON.stringify(msg, null, 2)
    } catch (error) {
      return String(msg)
    }
  }

  // Get message type for styling
  const getMessageType = (msg) => {
    if (msg === null || msg === undefined) return 'null'
    if (typeof msg === 'string') return 'string'
    if (typeof msg === 'number') return 'number'
    if (typeof msg === 'boolean') return 'boolean'
    if (Array.isArray(msg)) return 'array'
    if (typeof msg === 'object') return 'object'
    return 'unknown'
  }

  // Get color class for message type
  const getTypeColor = (type) => {
    switch (type) {
      case 'string': return 'text-green-400'
      case 'number': return 'text-blue-400'
      case 'boolean': return 'text-purple-400'
      case 'null': return 'text-gray-500'
      case 'array': return 'text-yellow-400'
      case 'object': return 'text-orange-400'
      default: return 'text-white'
    }
  }

  // Don't render if no current node
  if (!currentNode || !currentNode.id) {
    return null
  }

  return (
    <div className="bg-editor-darker flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-editor-border">
        <h3 className="text-sm font-medium text-white flex items-center">
          <FontAwesomeIcon icon={faBug} className="mr-2 text-blue-400" />
          Debug Output ({debugNodes.length} nodes)
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={testDebugMessage}
            disabled={debugNodes.length === 0}
            className="text-xs text-editor-text hover:text-white transition-colors disabled:opacity-50"
            title="Send test debug message"
          >
            Test
          </button>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="text-xs text-editor-text hover:text-white transition-colors"
            title={isVisible ? "Hide messages" : "Show messages"}
          >
            <FontAwesomeIcon icon={isVisible ? faEyeSlash : faEye} />
          </button>
          <button
            onClick={clearMessages}
            disabled={debugMessages.length === 0}
            className="text-xs text-editor-text hover:text-white transition-colors disabled:opacity-50"
            title="Clear messages"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
          <span className="text-xs text-editor-text">
            {debugMessages.length}/{maxMessages}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-3 text-xs text-editor-text">Loading debug nodes...</div>
      ) : debugNodes.length === 0 ? (
        <div className="p-3 text-xs text-editor-text">
          No debug nodes connected to this function
        </div>
      ) : isVisible ? (
        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
          {debugMessages.length === 0 ? (
            <div className="text-xs text-editor-text p-2">
              Waiting for debug messages from: {debugNodes.map(n => n.name).join(', ')}
            </div>
          ) : (
            debugMessages.map((message) => {
              const messageType = getMessageType(message.msg)
              const typeColor = getTypeColor(messageType)
              
              return (
                <div
                  key={message.id}
                  className="bg-editor-surface rounded border border-editor-border p-2 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-400 font-medium">
                        {message.nodeName}
                      </span>
                      {message.topic && (
                        <span className="text-purple-400">
                          topic: {message.topic}
                        </span>
                      )}
                      <span className={`font-mono ${typeColor}`}>
                        {messageType}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-editor-text">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      <button
                        onClick={() => copyMessage(message)}
                        className="text-editor-text hover:text-white transition-colors"
                        title="Copy message"
                      >
                        <FontAwesomeIcon icon={faCopy} className="text-xs" />
                      </button>
                    </div>
                  </div>
                  <pre className="text-white font-mono text-xs whitespace-pre-wrap break-words">
                    {formatMessage(message.msg)}
                  </pre>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className="p-3 text-xs text-editor-text">
          Debug output hidden ({debugMessages.length} messages)
        </div>
      )}
    </div>
  )
}

export default DebugOutput 