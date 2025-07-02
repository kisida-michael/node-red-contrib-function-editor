import React from 'react'

const StatusBar = ({ connectionStatus }) => {
  return (
    <div className="px-2 sm:px-4 py-1 bg-editor-accent text-white text-xs flex justify-between items-center">
      <div className="flex items-center">
        <div 
          className={`
            w-1.5 h-1.5 rounded-full mr-1.5
            ${connectionStatus.connected ? 'bg-green-400' : 'bg-red-400'}
          `}
        />
        <span className="truncate">{connectionStatus.message}</span>
      </div>
      
      <div className="hidden sm:block text-right">
        Node-RED Monaco Editor
      </div>
    </div>
  )
}

export default StatusBar 