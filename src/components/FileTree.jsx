import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolder, faCubes, faCode, faFile } from '@fortawesome/free-solid-svg-icons'

const FileTree = ({ files, currentFile, onSelectFile }) => {
  // Initialize with all flows collapsed
  const [collapsedFlows, setCollapsedFlows] = useState(() => {
    if (!files.flows) return new Set()
    return new Set(files.flows.map(flow => flow.id))
  })
  // Initialize with all subflows collapsed  
  const [collapsedSubflows, setCollapsedSubflows] = useState(() => {
    if (!files.subflows) return new Set()
    return new Set(files.subflows.map(subflow => subflow.id))
  })
  const [flowsSectionCollapsed, setFlowsSectionCollapsed] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Update collapsed state when files change
  useEffect(() => {
    if (files.flows) {
      setCollapsedFlows(new Set(files.flows.map(flow => flow.id)))
    }
    if (files.subflows) {
      setCollapsedSubflows(new Set(files.subflows.map(subflow => subflow.id)))
    }
  }, [files])

  // Auto-expand when searching
  useEffect(() => {
    if (searchTerm.trim()) {
      setFlowsSectionCollapsed(false)
      setCollapsedFlows(new Set()) // Expand all flows when searching
      setCollapsedSubflows(new Set()) // Expand all subflows when searching
    }
  }, [searchTerm])

  const toggleFlow = (flowId) => {
    const newCollapsed = new Set(collapsedFlows)
    if (newCollapsed.has(flowId)) {
      newCollapsed.delete(flowId)
    } else {
      newCollapsed.add(flowId)
    }
    setCollapsedFlows(newCollapsed)
  }

  const toggleSubflow = (subflowId) => {
    const newCollapsed = new Set(collapsedSubflows)
    if (newCollapsed.has(subflowId)) {
      newCollapsed.delete(subflowId)
    } else {
      newCollapsed.add(subflowId)
    }
    setCollapsedSubflows(newCollapsed)
  }

  // Filter files based on search term
  const filterFiles = (files) => {
    if (!searchTerm.trim()) return files
    
    const searchLower = searchTerm.toLowerCase()
    
    const filteredFlows = files.flows?.map(flow => ({
      ...flow,
      nodes: flow.nodes.filter(node => 
        node.name.toLowerCase().includes(searchLower) ||
        node.type.toLowerCase().includes(searchLower)
      )
    })).filter(flow => flow.nodes.length > 0) || []

    const filteredSubflows = files.subflows?.map(subflow => ({
      ...subflow,
      nodes: subflow.nodes.filter(node => 
        node.name.toLowerCase().includes(searchLower) ||
        node.type.toLowerCase().includes(searchLower)
      )
    })).filter(subflow => subflow.nodes.length > 0) || []

    return {
      ...files,
      flows: filteredFlows,
      subflows: filteredSubflows
    }
  }

  const filteredFiles = filterFiles(files)

  const NodeIcon = ({ type }) => {
    if (type === 'function') {
      return (
        <span className="text-yellow-400 mr-2">
          <FontAwesomeIcon icon={faCode} />
        </span>
      )
    } else if (type === 'ui_template') {
      return (
        <span className="text-blue-300 mr-2">
          <FontAwesomeIcon icon={faCode} />
        </span>
      )
    }
    return null
  }

  const NodeItem = ({ node }) => {
    const isActive = currentFile === node.filename
    return (
      <div
        className={`
          flex items-center pl-6 sm:pl-8 lg:pl-10 pr-2 sm:pr-3 lg:pr-4 py-1.5 cursor-pointer text-xs sm:text-sm transition-colors
          border-l-2 border-transparent
          ${isActive 
            ? 'bg-editor-active border-l-yellow-400' 
            : 'hover:bg-editor-hover'
          }
        `}
        onClick={() => onSelectFile(node.filename)}
      >
        <NodeIcon type={node.type} />
        <span className="ml-1 sm:ml-2 truncate min-w-0">{node.name}</span>
      </div>
    )
  }

  const FlowHeader = ({ flow, isCollapsed, onToggle }) => (
    <div
      className="flex items-center px-2 sm:px-3 lg:px-4 py-1.5 cursor-pointer text-xs sm:text-sm font-semibold bg-editor-header border-t border-b border-editor-border hover:bg-editor-hover transition-colors text-white"
      onClick={onToggle}
    >
      <span className={`mr-1 sm:mr-2 text-xs transition-transform ${isCollapsed ? '-rotate-90' : ''}`}>▼</span>
      <span className="text-yellow-300 mr-1 sm:mr-2"><FontAwesomeIcon icon={faFolder} /></span>
      <span className="truncate min-w-0">{flow.name}</span>
    </div>
  )

  const SubflowHeader = ({ subflow, isCollapsed, onToggle }) => (
    <div
      className="flex items-center px-2 sm:px-3 lg:px-4 py-1.5 cursor-pointer text-xs sm:text-sm font-semibold bg-editor-header border-t border-b border-editor-border hover:bg-editor-hover transition-colors text-blue-400"
      onClick={onToggle}
    >
      <span className={`mr-1 sm:mr-2 text-xs transition-transform ${isCollapsed ? '-rotate-90' : ''}`}>▼</span>
      <span className="text-blue-400 mr-1 sm:mr-2"><FontAwesomeIcon icon={faCubes} /></span>
      <span className="truncate min-w-0">{subflow.name} <span className="text-blue-300 font-normal hidden sm:inline"></span></span>
    </div>
  )

  if (!files.flows && !files.subflows && (!files.orphanedFiles || files.orphanedFiles.length === 0)) {
    return (
      <div className="p-4 text-gray-500 italic text-sm">
        No files found
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-2 border-b border-editor-border">
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
                {/* Flows Section */}
          {filteredFiles.flows && filteredFiles.flows.length > 0 && (
            <>
              <div
                className="flex items-center px-2 sm:px-3 lg:px-4 py-1.5 cursor-pointer text-xs sm:text-sm font-semibold bg-editor-header border-t-0 border-b border-editor-border hover:bg-editor-hover transition-colors text-gray-200"
                onClick={() => setFlowsSectionCollapsed(!flowsSectionCollapsed)}
              >
                <span className={`mr-1 sm:mr-2 text-xs transition-transform ${flowsSectionCollapsed ? '-rotate-90' : ''}`}>▼</span>
                <span>Flows</span>
              </div>
              {!flowsSectionCollapsed && (
                <div className="bg-editor-sidebar">
                  {filteredFiles.flows.map(flow => {
                    const isCollapsed = collapsedFlows.has(flow.id)
                    return (
                      <div key={flow.id} className="mb-1">
                        <FlowHeader
                          flow={flow}
                          isCollapsed={isCollapsed}
                          onToggle={() => toggleFlow(flow.id)}
                        />
                        {!isCollapsed && (
                          <div className="bg-editor-sidebar">
                            {flow.nodes.map(node => (
                              <NodeItem key={node.id} node={node} />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Subflows Section */}
          {filteredFiles.subflows && filteredFiles.subflows.length > 0 && (
            <div className="mt-2">
              {filteredFiles.subflows.map(subflow => {
                const isCollapsed = collapsedSubflows.has(subflow.id)
                return (
                  <div key={subflow.id} className="mb-1">
                    <SubflowHeader
                      subflow={subflow}
                      isCollapsed={isCollapsed}
                      onToggle={() => toggleSubflow(subflow.id)}
                    />
                    {!isCollapsed && (
                      <div className="bg-editor-sidebar">
                        {subflow.nodes.map(node => (
                          <NodeItem key={node.id} node={node} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* No results message */}
          {searchTerm && filteredFiles.flows?.length === 0 && filteredFiles.subflows?.length === 0 && (
            <div className="p-4 text-gray-500 italic text-sm">
              No files match "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    )
  }

export default FileTree 