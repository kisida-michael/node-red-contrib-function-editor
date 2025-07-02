#!/bin/bash

echo "🚀 Node-RED Function Editor Development Script"
echo "==============================================="

# Build the frontend
echo "📦 Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🔄 To apply changes:"
    echo "1. Restart Node-RED (if it's running)"
    echo "2. Or restart just the node in Node-RED admin interface"
    echo ""
    echo "💡 Development directory is linked to Node-RED at:"
    echo "   ~/.node-red/node_modules/node-red-contrib-function-editor"
    echo ""
    echo "📝 Next time you make changes:"
    echo "   - Just run: ./dev.sh"
    echo "   - Then restart Node-RED"
    echo ""
    echo "🔗 Symlink status:"
    ls -la ~/.node-red/node_modules/node-red-contrib-function-editor
else
    echo "❌ Build failed!"
    exit 1
fi 