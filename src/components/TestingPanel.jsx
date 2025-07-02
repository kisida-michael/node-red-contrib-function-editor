import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faBug } from '@fortawesome/free-solid-svg-icons'
import InjectNodeTrigger from './InjectNodeTrigger'
import DebugOutput from './DebugOutput'

const TestingPanel = ({ currentNode, socket, showStatusMessage }) => {
  const [activeTab, setActiveTab] = useState('inject')

  // Don't render if no current node
  if (!currentNode || !currentNode.id) {
    return null
  }

  const tabs = [
    {
      id: 'inject',
      label: 'Inject Nodes',
      icon: faPlay,
      color: 'text-green-400'
    },
    {
      id: 'debug',
      label: 'Debug Output', 
      icon: faBug,
      color: 'text-blue-400'
    }
  ]

  return (
    <div className="bg-editor-darker border-t border-editor-border flex flex-col h-64">
      {/* Tab Headers */}
      <div className="flex border-b border-editor-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center px-4 py-2 text-sm transition-colors border-b-2
              ${activeTab === tab.id 
                ? `${tab.color} border-current bg-editor-surface` 
                : 'text-editor-text border-transparent hover:text-white hover:bg-editor-surface'
              }
            `}
          >
            <FontAwesomeIcon icon={tab.icon} className="mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'inject' && (
          <InjectNodeTrigger 
            currentNode={currentNode}
            showStatusMessage={showStatusMessage}
          />
        )}
        
        {activeTab === 'debug' && (
          <DebugOutput 
            currentNode={currentNode}
            socket={socket}
            showStatusMessage={showStatusMessage}
          />
        )}
      </div>
    </div>
  )
}

export default TestingPanel 