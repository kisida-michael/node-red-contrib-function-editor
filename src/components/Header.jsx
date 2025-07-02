import React from 'react'

const Header = ({ 
  currentNode, 
  hasUnsavedChanges, 
  onSave, 
  onSaveAndDeploy,
  onPullFunctions, 
  onCollectChanges, 
  onRefresh 
}) => {
  return (
    <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-editor-header border-b border-editor-border">
      {/* Mobile Layout */}
      <div className="flex lg:hidden flex-col gap-1.5">
        {/* File info row - more compact */}
        <div className="text-xs sm:text-sm text-editor-text truncate">
          {currentNode ? (
            <span>
              {currentNode.name}
              {hasUnsavedChanges && <span className="ml-1 text-yellow-400">●</span>}
            </span>
          ) : (
            <span className="text-gray-400">Select a file to edit</span>
          )}
        </div>
        
        {/* Buttons row - more compact grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1">
          <button
            onClick={onRefresh}
            className="px-1.5 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors text-center"
            title="Refresh file tree"
          >
            ↻
          </button>
          
          <button
            onClick={onPullFunctions}
            className="px-1.5 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors text-center"
            title="Extract functions from flows.json"
          >
            Pull
          </button>
          
          <button
            onClick={onCollectChanges}
            className="px-1.5 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors text-center"
            title="Deploy all changed files to Node-RED"
          >
            Push
          </button>
          
          <button
            onClick={onSave}
            disabled={!currentNode || !hasUnsavedChanges}
            className={`
              px-1.5 py-1 text-xs rounded transition-colors text-center
              ${currentNode && hasUnsavedChanges
                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }
            `}
            title="Save current file only (Ctrl+S)"
          >
            Save
          </button>
          
          <button
            onClick={onSaveAndDeploy}
            disabled={!currentNode || !hasUnsavedChanges}
            className={`
              px-1.5 py-1 text-xs rounded transition-colors text-center col-span-2 sm:col-span-1
              ${currentNode && hasUnsavedChanges
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }
            `}
            title="Save and deploy this file immediately"
          >
            S&D
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex justify-between items-center">
        <div className="text-sm text-editor-text flex-1 min-w-0">
          {currentNode ? (
            <span className="truncate block">
              {currentNode.name}
              {hasUnsavedChanges && <span className="ml-1 text-yellow-400">●</span>}
            </span>
          ) : (
            <span className="text-gray-400">Select a file to edit</span>
          )}
        </div>
        
        <div className="flex gap-2 ml-4 flex-shrink-0">
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors whitespace-nowrap"
            title="Refresh file tree"
          >
            Refresh
          </button>
          
          <button
            onClick={onPullFunctions}
            className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors whitespace-nowrap"
            title="Extract functions from flows.json"
          >
            Pull Functions
          </button>
          
          <button
            onClick={onCollectChanges}
            className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors whitespace-nowrap"
            title="Deploy all changed files to Node-RED"
          >
            Push All Changes
          </button>
          
          <button
            onClick={onSave}
            disabled={!currentNode || !hasUnsavedChanges}
            className={`
              px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap
              ${currentNode && hasUnsavedChanges
                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }
            `}
            title="Save current file only (Ctrl+S)"
          >
            Save
          </button>
          
          <button
            onClick={onSaveAndDeploy}
            disabled={!currentNode || !hasUnsavedChanges}
            className={`
              px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap
              ${currentNode && hasUnsavedChanges
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }
            `}
            title="Save and deploy this file immediately"
          >
            Save & Deploy
          </button>
        </div>
      </div>
    </div>
  )
}

export default Header 