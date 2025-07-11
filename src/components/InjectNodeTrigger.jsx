import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faRefresh, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'

const InjectNodeTrigger = ({ currentNode, showStatusMessage }) => {
  const [injectNodes, setInjectNodes] = useState([])
  const [loading, setLoading] = useState(false)
  const [triggering, setTriggering] = useState(new Set())

  // Load connected inject nodes when currentNode changes
  useEffect(() => {
    if (currentNode && currentNode.id) {
      loadInjectNodes()
    } else {
      setInjectNodes([])
    }
  }, [currentNode])

  // Load inject nodes connected to the current function node
  const loadInjectNodes = async () => {
    if (!currentNode || !currentNode.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/inject-nodes/${encodeURIComponent(currentNode.id)}`)
      const data = await response.json()
      
      if (response.ok) {
        setInjectNodes(data.injectNodes || [])
      } else {
        console.error('Error loading inject nodes:', data.error)
        showStatusMessage?.('Error loading inject nodes: ' + data.error, 'error')
      }
    } catch (error) {
      console.error('Error loading inject nodes:', error)
      showStatusMessage?.('Error loading inject nodes: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Trigger a specific inject node
  const triggerInjectNode = async (injectNodeId, injectNodeName) => {
    setTriggering(prev => new Set(prev).add(injectNodeId))
    
    try {
      const response = await fetch(`/api/trigger-inject/${encodeURIComponent(injectNodeId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        showStatusMessage?.(`Triggered: ${injectNodeName}`, 'success')
      } else {
        console.error('Error triggering inject node:', data.error)
        showStatusMessage?.('Error triggering inject node: ' + data.error, 'error')
      }
    } catch (error) {
      console.error('Error triggering inject node:', error)
      showStatusMessage?.('Error triggering inject node: ' + error.message, 'error')
    } finally {
      setTriggering(prev => {
        const newSet = new Set(prev)
        newSet.delete(injectNodeId)
        return newSet
      })
    }
  }

  // Format payload for display
  const formatPayload = (payload, payloadType) => {
    if (!payload && payloadType !== 'date') return 'empty'
    
    switch (payloadType) {
      case 'date':
        return 'timestamp'
      case 'num':
        return `${payload} (number)`
      case 'bool':
        return `${payload} (boolean)`
      case 'json':
        return 'JSON object'
      case 'str':
      default:
        return `"${payload}"`
    }
  }

  // Don't render if no current node
  if (!currentNode || !currentNode.id) {
    return null
  }

  return (
    <div className="bg-editor-darker p-3 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={loadInjectNodes}
          disabled={loading}
          className="text-xs text-editor-text hover:text-white transition-colors disabled:opacity-50"
          title="Refresh inject nodes"
        >
          <FontAwesomeIcon 
            icon={faRefresh} 
            className={`${loading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {loading ? (
        <div className="text-xs text-editor-text">Loading inject nodes...</div>
      ) : injectNodes.length === 0 ? (
        <div className="text-xs text-editor-text flex items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-yellow-400" />
          No inject nodes connected to this function
        </div>
      ) : (
        <div className="space-y-2">
          {injectNodes.map((injectNode) => (
            <div
              key={injectNode.id}
              className="bg-editor-surface rounded border border-editor-border p-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-white truncate">
                      {injectNode.name}
                    </span>
                    {injectNode.topic && (
                      <span className="ml-2 text-xs text-blue-400">
                        topic: {injectNode.topic}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-editor-text mt-1">
                    payload: {formatPayload(injectNode.payload, injectNode.payloadType)}
                  </div>
                  {(injectNode.repeat || injectNode.crontab) && (
                    <div className="text-xs text-purple-400 mt-1">
                      {injectNode.repeat ? `every ${injectNode.repeat}s` : `cron: ${injectNode.crontab}`}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => triggerInjectNode(injectNode.id, injectNode.name)}
                  disabled={triggering.has(injectNode.id)}
                  className="ml-3 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white text-xs rounded transition-colors flex items-center"
                  title={`Trigger ${injectNode.name}`}
                >
                  <FontAwesomeIcon 
                    icon={faPlay} 
                    className={`mr-1 ${triggering.has(injectNode.id) ? 'animate-pulse' : ''}`}
                  />
                  {triggering.has(injectNode.id) ? 'Triggering...' : 'Trigger'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default InjectNodeTrigger 