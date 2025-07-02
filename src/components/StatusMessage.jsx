import React, { useEffect, useState } from 'react'

const StatusMessage = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Fade in
    setIsVisible(true)
    
    // Auto close after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for fade out animation
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 border-green-500'
      case 'error':
        return 'bg-red-600 border-red-500'
      default:
        return 'bg-editor-accent border-blue-500'
    }
  }

  return (
    <div
      className={`
        fixed top-20 right-5 z-50 max-w-sm p-3 rounded border-l-4 text-white shadow-lg
        transition-all duration-300 transform
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
        ${getTypeStyles()}
      `}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm">{message}</span>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className="ml-3 text-white hover:text-gray-200 transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default StatusMessage 