import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import InjectNodeTrigger from './InjectNodeTrigger'

const TestingPanel = ({ currentNode, showStatusMessage }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Don't render if no current node
  if (!currentNode || !currentNode.id) {
    return null
  }

  return (
    <div className="bg-editor-darker border-t border-editor-border">
      {/* Header with collapse button */}
      <div 
        className="flex items-center justify-between px-4 py-2 bg-editor-header border-b border-editor-border cursor-pointer hover:bg-editor-surface transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center text-sm">
          <FontAwesomeIcon icon={faPlay} className="mr-2 text-green-400" />
          <span>Connected Inject Nodes</span>
        </div>
        <FontAwesomeIcon 
          icon={isCollapsed ? faChevronDown : faChevronUp} 
          className="text-sm text-editor-text"
        />
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="h-48">
          <InjectNodeTrigger 
            currentNode={currentNode}
            showStatusMessage={showStatusMessage}
          />
        </div>
      )}
    </div>
  )
}

export default TestingPanel 