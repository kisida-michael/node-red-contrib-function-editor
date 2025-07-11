const path = require('path');
const fs = require('fs-extra');
const chokidar = require('chokidar');
const { Server } = require('socket.io');

module.exports = function(RED) {
    "use strict";

    // Add HTTP Admin plugin for partial deployments
    RED.httpAdmin.post("/flows/partial", RED.auth.needsPermission("flows.write"), 
        require('express').json(), async function (req, res) {
            try {
                console.log('Partial deployment request:', JSON.stringify(req.body, null, 2));
                
                if (!req.body.nodes || !Array.isArray(req.body.nodes)) {
                    throw new Error('Invalid nodes array');
                }
                
                if (req.body.nodes.length === 0) {
                    console.log('No nodes to deploy');
                    res.sendStatus(204);
                    return;
                }
                
                const fs = require('fs');
                const path = require('path');
                
                // Use the flows file path from the request if provided, otherwise default
                let flowsPath;
                if (req.body.flowsFile) {
                    const userDir = RED.settings.userDir || path.join(process.env.HOME || process.env.USERPROFILE, '.node-red');
                    
                    // Handle Docker environment - check if userDir is /data
                    const isDockerEnv = userDir.includes('/data') || userDir === '/data';
                    console.log(`User directory: ${userDir} (Docker: ${isDockerEnv})`);
                    
                    if (path.isAbsolute(req.body.flowsFile)) {
                        flowsPath = req.body.flowsFile;
                    } else {
                        flowsPath = path.join(userDir, req.body.flowsFile);
                    }
                    
                    console.log(`Using configured flows file: ${req.body.flowsFile}`);
                    console.log(`Resolved flows path: ${flowsPath}`);
                } else {
                    // Fallback to default
                    const userDir = RED.settings.userDir || path.join(process.env.HOME || process.env.USERPROFILE, '.node-red');
                    const flowsFileName = RED.settings.flowFile || 'flows.json';
                    flowsPath = path.join(userDir, flowsFileName);
                    console.log(`Using default flows path: ${flowsPath}`);
                }
                
                if (!fs.existsSync(flowsPath)) {
                    throw new Error(`Flows file not found: ${flowsPath}`);
                }
                
                // Check file permissions before attempting to write
                try {
                    fs.accessSync(flowsPath, fs.constants.R_OK | fs.constants.W_OK);
                    console.log(`Flows file permissions OK: ${flowsPath}`);
                } catch (permError) {
                    console.error(`Permission error for flows file: ${flowsPath}`, permError);
                    throw new Error(`Permission denied accessing flows file: ${flowsPath}. ${permError.message}`);
                }
                
                const flows = JSON.parse(fs.readFileSync(flowsPath, 'utf8'));
                console.log('Read flows file with', flows.length, 'items');
                
                // Update only the specified nodes
                let updatedCount = 0;
                const updatedFlows = flows.map(flow => {
                    const updatedNode = req.body.nodes.find(node => node.id === flow.id);
                    if (updatedNode) {
                        console.log('Updating node:', updatedNode.id, updatedNode.name || 'unnamed');
                        updatedCount++;
                        return updatedNode;
                    }
                    return flow;
                });
                
                console.log('Updated', updatedCount, 'nodes');
                
                // Write back the updated flows
                fs.writeFileSync(flowsPath, JSON.stringify(updatedFlows, null, 4), 'utf8');
                console.log('Updated flows file written');
                
                // Trigger Node-RED to reload flows
                const http = require('http');
                const postData = JSON.stringify(updatedFlows);
                
                const options = {
                    hostname: 'localhost',
                    port: RED.settings.uiPort || 1880,
                    path: '/flows',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Node-RED-Deployment-Type': 'nodes'
                    }
                };
                
                const flowReq = http.request(options, (flowRes) => {
                    if (flowRes.statusCode === 200 || flowRes.statusCode === 204) {
                        console.log('Flows reloaded successfully');
                        res.sendStatus(204);
                    } else {
                        console.log('Flow reload failed with status:', flowRes.statusCode);
                        res.status(500).send('Flow reload failed');
                    }
                });
                
                flowReq.on('error', (err) => {
                    console.error('Flow reload request failed:', err.message);
                    res.status(500).send('Flow reload request failed');
                });
                
                flowReq.write(postData);
                flowReq.end();
                
            } catch (err) {
                console.error('Partial deployment error:', err);
                res.status(500).send(err.toString());
            }
        }
    );

    function FunctionEditorNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        // Use Node-RED's configured flows file path
        const userDir = RED.settings.userDir || path.join(process.env.HOME || process.env.USERPROFILE, '.node-red');
        const flowsFileName = RED.settings.flowFile || 'flows.json';
        
        // Handle custom flows file path
        if (config.flowsFile && config.flowsFile !== './flows.json') {
            // If it's an absolute path, use it as-is
            if (path.isAbsolute(config.flowsFile)) {
                node.flowsFile = config.flowsFile;
            } else {
                // If it's relative, resolve it relative to userDir
                node.flowsFile = path.join(userDir, config.flowsFile);
            }
        } else {
            // Default behavior
            node.flowsFile = path.join(userDir, flowsFileName);
        }
        
        // Detect Docker environment and log additional info
        const isDockerEnv = userDir.includes('/data') || userDir === '/data' || process.env.NODE_RED_HOME;
        if (isDockerEnv) {
            node.log(`Docker environment detected. UserDir: ${userDir}`);
            
            // Docker-specific diagnostics
            try {
                const stats = fs.statSync(userDir);
                node.log(`UserDir permissions - UID: ${stats.uid}, GID: ${stats.gid}, Mode: ${stats.mode.toString(8)}`);
                node.log(`Current process - UID: ${process.getuid()}, GID: ${process.getgid()}`);
                
                // Check if we can write to userDir
                const testFile = path.join(userDir, '.function-editor-test');
                try {
                    fs.writeFileSync(testFile, 'test');
                    fs.unlinkSync(testFile);
                    node.log(`✅ UserDir write test successful`);
                } catch (writeError) {
                    node.error(`❌ UserDir write test failed: ${writeError.message}`);
                }
                
                // Check projects directory if it exists
                const projectsDir = path.join(userDir, 'projects');
                if (fs.existsSync(projectsDir)) {
                    const projectStats = fs.statSync(projectsDir);
                    node.log(`Projects dir permissions - UID: ${projectStats.uid}, GID: ${projectStats.gid}, Mode: ${projectStats.mode.toString(8)}`);
                }
                
            } catch (diagError) {
                node.error(`Docker diagnostics failed: ${diagError.message}`);
            }
        }
        
        node.functionsDir = path.join(__dirname, 'functions');
        node.port = config.port;
        node.watchEnabled = config.watchEnabled;
        
        // Debug logging
        node.log(`User directory: ${userDir}`);
        node.log(`Configured flowsFile: ${config.flowsFile || 'not set'}`);
        node.log(`Resolved flows file path: ${node.flowsFile}`);
        node.log(`Flows file exists: ${fs.existsSync(node.flowsFile)}`);
        
        // Check flows file permissions at startup
        if (fs.existsSync(node.flowsFile)) {
            try {
                fs.accessSync(node.flowsFile, fs.constants.R_OK | fs.constants.W_OK);
                node.log(`✅ Flows file permissions OK`);
            } catch (permError) {
                node.error(`❌ Flows file permission error: ${permError.message}`);
                node.error(`File stats: ${JSON.stringify(fs.statSync(node.flowsFile))}`);
            }
        } else {
            node.warn(`⚠️ Flows file does not exist yet: ${node.flowsFile}`);
        }
        
        // Deployment method preference: 'partial-http', 'full-http'
        node.deployMethod = config.deployMethod;
        
        // Ensure functions directory exists
        fs.ensureDirSync(node.functionsDir);
        
        // Socket.IO server for real-time communication
        let io = null;
        let watcher = null;
        let functionsWatcher = null;


        // Initialize the editor server
        function initEditorServer() {
            const express = require('express');
            const app = express();
            const server = require('http').createServer(app);
            
            io = new Server(server, {
                cors: {
                    origin: "*",
                    methods: ["GET", "POST"]
                }
            });
            
            // Serve static files
            app.use('/function-editor', express.static(path.join(__dirname, 'dist')));
            app.use('/', express.static(path.join(__dirname, 'dist')));
            
            // Serve the main HTML file for the function-editor route
            app.get('/function-editor', (req, res) => {
                const htmlPath = path.join(__dirname, 'dist', 'src', 'index.html');
                if (fs.existsSync(htmlPath)) {
                    res.sendFile(htmlPath);
                } else {
                    res.status(404).send('Function Editor not found');
                }
            });
            
            // API endpoints
            app.get('/api/files', (req, res) => {
                try {
                    const files = getFileTreeWithFlows(node.functionsDir, node.flowsFile);
                    res.json(files);
                } catch (error) {
                    res.status(500).json({ error: error.message });
                }
            });
            
            app.get('/api/file/:filename', (req, res) => {
                try {
                    const filePath = path.join(node.functionsDir, req.params.filename);
                    if (fs.existsSync(filePath)) {
                        const content = fs.readFileSync(filePath, 'utf8');
                        res.json({ content });
                    } else {
                        res.status(404).json({ error: 'File not found' });
                    }
                } catch (error) {
                    res.status(500).json({ error: error.message });
                }
            });
            
            // Save individual file (no auto-deployment)
            app.post('/api/file/:filename', express.json(), (req, res) => {
                try {
                    const filePath = path.join(node.functionsDir, req.params.filename);
                    fs.writeFileSync(filePath, req.body.content, 'utf8');
                    
                    node.log(`File saved: ${req.params.filename}`);
                    
                    // Emit real-time sync event to all connected clients
                    if (io) {
                        io.emit('file-updated', {
                            filename: req.params.filename,
                            content: req.body.content
                        });
                    }
                    
                    // No auto-deployment for individual saves
                    res.json({ success: true, message: 'File saved (not deployed)' });
                } catch (error) {
                    node.error(`Error saving file: ${error.message}`);
                    res.status(500).json({ error: error.message });
                }
            });
            
            // Save and deploy individual file
            app.post('/api/file/:filename/deploy', express.json(), (req, res) => {
                try {
                    const filePath = path.join(node.functionsDir, req.params.filename);
                    fs.writeFileSync(filePath, req.body.content, 'utf8');
                    
                    node.log(`File saved and deploying: ${req.params.filename}`);
                    
                    // Emit real-time sync event to all connected clients
                    if (io) {
                        io.emit('file-updated', {
                            filename: req.params.filename,
                            content: req.body.content
                        });
                    }
                    
                    // Deploy only this specific file
                    setTimeout(async () => {
                        await deploySingleFile(req.params.filename);
                    }, 100);
                    
                    res.json({ success: true, message: 'File saved and deployed' });
                } catch (error) {
                    node.error(`Error saving and deploying file: ${error.message}`);
                    res.status(500).json({ error: error.message });
                }
            });
            
            // Pull functions endpoint - extracts functions from flows.json without file watching
            app.post('/api/pull-functions', (req, res) => {
                try {
                    node.log('Pulling functions from flows.json');
                    extractFromFlows();
                    res.json({ success: true, message: 'Functions extracted successfully' });
                } catch (error) {
                    node.error(`Error pulling functions: ${error.message}`);
                    res.status(500).json({ error: error.message });
                }
            });
            
            // Collect changes endpoint - updates flows.json and reloads Node-RED
            app.post('/api/collect-changes', (req, res) => {
                try {
                    node.log('Manually collecting changes from files to flows.json');
                    collectChanges(false); // false = show logs for manual collection
                    res.json({ success: true, message: 'Changes collected and flows reloaded successfully' });
                } catch (error) {
                    node.error(`Error collecting changes: ${error.message}`);
                    res.status(500).json({ error: error.message });
                }
            });
            
            // Manual refresh endpoint
            app.post('/api/refresh', (req, res) => {
                try {
                    extractFromFlows();
                    res.json({ success: true, message: 'Files refreshed' });
                } catch (error) {
                    res.status(500).json({ error: error.message });
                }
            });

            // Get connected inject nodes for a specific function node
            app.get('/api/inject-nodes/:functionNodeId', (req, res) => {
                try {
                    const functionNodeId = req.params.functionNodeId;
                    const connectedInjectNodes = findConnectedInjectNodes(functionNodeId);
                    res.json({ 
                        functionNodeId,
                        injectNodes: connectedInjectNodes 
                    });
                } catch (error) {
                    node.error(`Error finding inject nodes: ${error.message}`);
                    res.status(500).json({ error: error.message });
                }
            });

            // Trigger an inject node
            app.post('/api/trigger-inject/:injectNodeId', (req, res) => {
                try {
                    const injectNodeId = req.params.injectNodeId;
                    
                    triggerInjectNode(injectNodeId)
                        .then(() => {
                            res.json({ success: true, message: 'Inject node triggered successfully' });
                        })
                        .catch((error) => {
                            node.error(`Error triggering inject node: ${error.message}`);
                            res.status(500).json({ error: error.message });
                        });
                } catch (error) {
                    node.error(`Error triggering inject node: ${error.message}`);
                    res.status(500).json({ error: error.message });
                }
            });

            // Debug endpoint to dump flows data
            app.get('/api/debug/flows', (req, res) => {
                try {
                    if (!fs.existsSync(node.flowsFile)) {
                        return res.status(404).json({ error: 'Flows file not found' });
                    }
                    
                    const flows = JSON.parse(fs.readFileSync(node.flowsFile, 'utf8'));
                    
                    // Return structured info about flows
                    const flowsInfo = {
                        totalItems: flows.length,
                        nodeTypes: {},
                        injectNodes: [],
                        functionNodes: [],
                        debugNodes: [],
                        connections: []
                    };
                    
                    flows.forEach(item => {
                        // Count node types
                        if (!flowsInfo.nodeTypes[item.type]) {
                            flowsInfo.nodeTypes[item.type] = 0;
                        }
                        flowsInfo.nodeTypes[item.type]++;
                        
                        // Collect specific node types
                        if (item.type === 'inject') {
                            flowsInfo.injectNodes.push({
                                id: item.id,
                                name: item.name || 'unnamed',
                                wires: item.wires
                            });
                        } else if (item.type === 'function') {
                            flowsInfo.functionNodes.push({
                                id: item.id,
                                name: item.name || 'unnamed',
                                wires: item.wires
                            });
                        } else if (item.type === 'debug') {
                            flowsInfo.debugNodes.push({
                                id: item.id,
                                name: item.name || 'unnamed'
                            });
                        }
                        
                        // Track connections
                        if (item.wires && item.wires.length > 0) {
                            item.wires.forEach((wireGroup, outputIndex) => {
                                if (Array.isArray(wireGroup)) {
                                    wireGroup.forEach(targetId => {
                                        flowsInfo.connections.push({
                                            from: item.id,
                                            fromName: item.name || item.type,
                                            fromType: item.type,
                                            to: targetId,
                                            output: outputIndex
                                        });
                                    });
                                }
                            });
                        }
                    });
                    
                    res.json(flowsInfo);
                } catch (error) {
                    node.error(`Error dumping flows: ${error.message}`);
                    res.status(500).json({ error: error.message });
                }
            });

            // Remove test debug message endpoint
            app.post('/api/test-debug/:debugNodeId', (req, res) => {
                res.status(404).json({ error: 'Debug functionality has been removed' });
            });
            
            // Socket.IO events
            io.on('connection', (socket) => {
                node.log('Editor client connected');
                
                socket.on('file-changed', (data) => {
                    // Skip if we're currently saving (to prevent race conditions)
                    if (node.isSaving) {
                        node.log('Skipping Socket.IO file change during save operation');
                        return;
                    }
                    
                    node.log(`File changed: ${data.filename}`);
                    // Trigger collection back to flows.json
                    collectChanges();
                });
                
                socket.on('disconnect', () => {
                    node.log('Editor client disconnected');
                });
            });
            
            server.listen(node.port, () => {
                node.log(`Function Editor server running on port ${node.port}`);
                node.log(`Access editor at: http://localhost:${node.port}/function-editor`);
                node.log(`For Docker/remote access, use: http://<host-ip>:${node.port}/function-editor`);
            });
        }
        

        
        // Deploy individual nodes using HTTP Admin API
        function deployNodesViaHTTP(updatedNodes) {
            return new Promise((resolve, reject) => {
                const http = require('http');
                const nodeIds = updatedNodes.map(n => n.id);
                
                const postData = JSON.stringify({
                    nodes: updatedNodes,
                    flowsFile: config.flowsFile || null, // Send the configured flows file path
                    deploy: {
                        type: 'nodes',
                        nodes: nodeIds
                    }
                });
                
                const options = {
                    hostname: 'localhost',
                    port: RED.settings.uiPort || 1880,
                    path: '/flows/partial',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData)
                    }
                };
                
                const req = http.request(options, (res) => {
                    let responseBody = '';
                    res.on('data', (chunk) => {
                        responseBody += chunk;
                    });
                    res.on('end', () => {
                        if (res.statusCode === 204) {
                            resolve();
                        } else {
                            reject(new Error(`HTTP partial deploy failed with status: ${res.statusCode}, body: ${responseBody}`));
                        }
                    });
                });
                
                req.on('error', (err) => {
                    reject(new Error(`HTTP partial deploy request failed: ${err.message}`));
                });
                
                req.write(postData);
                req.end();
            });
        }
        
        // Deploy using full flow replacement (fallback method)
        function deployFullFlows(flows) {
            return new Promise((resolve, reject) => {
                const http = require('http');
                const options = {
                    hostname: 'localhost',
                    port: RED.settings.uiPort || 1880,
                    path: '/flows',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Node-RED-Deployment-Type': 'reload'
                    }
                };
                
                const req = http.request(options, (res) => {
                    if (res.statusCode === 200 || res.statusCode === 204) {
                        resolve();
                    } else {
                        reject(new Error(`Full flow deploy failed with status: ${res.statusCode}`));
                    }
                });
                
                req.on('error', (err) => {
                    reject(new Error(`Full flow deploy request failed: ${err.message}`));
                });
                
                req.write(JSON.stringify(flows));
                req.end();
            });
        }

        // Deploy a single file
        async function deploySingleFile(filename) {
            try {
                node.log(`Deploying single file: ${filename}`);
                
                // Read the flows to find the node for this file
                const flows = JSON.parse(fs.readFileSync(node.flowsFile, 'utf8'));
                const nodeId = filename.replace(/\.(js|vue)$/, ''); // Remove extension to get node ID
                
                // Find the node in flows
                let targetNode = null;
                flows.forEach(item => {
                    if (item.id === nodeId) {
                        targetNode = item;
                    } else if (item.nodes) {
                        // Check nested nodes (older flow format)
                        const foundNode = item.nodes.find(node => node.id === nodeId);
                        if (foundNode) targetNode = foundNode;
                    }
                });
                
                if (!targetNode) {
                    node.warn(`Node not found for file: ${filename}`);
                    return;
                }
                
                // Read the file content
                const filePath = path.join(node.functionsDir, filename);
                if (!fs.existsSync(filePath)) {
                    node.warn(`File not found: ${filename}`);
                    return;
                }
                
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Update the node with new content
                if (targetNode.type === 'function') {
                    targetNode.func = content;
                } else if (targetNode.type === 'ui_template') {
                    targetNode.template = content;
                }
                
                node.log(`Updated node ${targetNode.name || targetNode.id} with new content`);
                
                // Write back to flows.json
                fs.writeFileSync(node.flowsFile, JSON.stringify(flows, null, 4), 'utf8');
                
                // Deploy only this node using partial deployment
                try {
                    await deployNodesViaHTTP([targetNode]);
                    node.log(`Successfully deployed single node: ${targetNode.name || targetNode.id}`);
                } catch (error) {
                    node.warn(`Partial deployment failed for single node, using full deployment: ${error.message}`);
                    await deployFullFlows(flows);
                }
                
            } catch (error) {
                node.error(`Error deploying single file ${filename}: ${error.message}`);
            }
        }

        // Helper to check if a string is only comments or whitespace
        function isCommentOnly(str) {
            if (!str || !str.trim()) return true;
            // Remove all JS single and multi-line comments
            const noComments = str.replace(/\/\*[^]*?\*\//g, '').replace(/\/\/.*$/gm, '').trim();
            return noComments === '';
        }
        
        // Extract function nodes and templates from flows.json
        function extractFromFlows() {
            try {
                if (!fs.existsSync(node.flowsFile)) {
                    node.warn(`Flows file not found: ${node.flowsFile}`);
                    return;
                }
                
                const flows = JSON.parse(fs.readFileSync(node.flowsFile, 'utf8'));
                const extractedFiles = [];
                
                flows.forEach(flow => {
                    // Handle both nested nodes (flow.nodes) and root-level nodes
                    const nodesToProcess = flow.nodes || (flow.type && flow.type !== 'tab' ? [flow] : []);
                    
                    nodesToProcess.forEach(nodeData => {
                        if (nodeData.type === 'function') {
                            const filename = nodeData.id + '.js';
                            const filePath = path.join(node.functionsDir, filename);
                            let content = nodeData.func;
                            if (isCommentOnly(content) && nodeData.initialize && nodeData.initialize.trim()) {
                                content = nodeData.initialize;
                            }
                            fs.writeFileSync(filePath, content, 'utf8');
                            extractedFiles.push(filename);
                        }
                        // Handle dashboard templates
                        if (nodeData.type === 'ui_template' && nodeData.template) {
                            const filename = nodeData.id + '.vue';
                            const filePath = path.join(node.functionsDir, filename);
                            fs.writeFileSync(filePath, nodeData.template, 'utf8');
                            extractedFiles.push(filename);
                        }
                    });
                });
                
                node.log(`Extracted ${extractedFiles.length} function files to /functions directory`);
                if (io) {
                    io.emit('files-extracted', { files: extractedFiles });
                }
                
            } catch (error) {
                node.error(`Error extracting from flows: ${error.message}`);
            }
        }
        
        // Collect changes back to flows.json
        async function collectChanges(silent = false) {
            try {
                if (!fs.existsSync(node.flowsFile)) {
                    node.warn(`Flows file not found: ${node.flowsFile}`);
                    return;
                }
                
                if (!silent) {
                    node.log(`Collecting changes from ${node.functionsDir} using ${node.deployMethod} deployment`);
                }
                
                const flows = JSON.parse(fs.readFileSync(node.flowsFile, 'utf8'));
                const updatedNodes = [];
                let changesMade = false;
                
                // Helper function to process a node and check for changes
                function processNode(nodeData) {
                    if (nodeData.type === 'function') {
                        const filename = nodeData.id + '.js';
                        const filePath = path.join(node.functionsDir, filename);
                        if (fs.existsSync(filePath)) {
                            const content = fs.readFileSync(filePath, 'utf8');
                            if (nodeData.func !== content) {
                                if (!silent) {
                                    node.log(`Updating function node: ${nodeData.name || nodeData.id}`);
                                }
                                nodeData.func = content;
                                updatedNodes.push(nodeData);
                                changesMade = true;
                            }
                        }
                    } else if (nodeData.type === 'ui_template') {
                        const filename = nodeData.id + '.vue';
                        const filePath = path.join(node.functionsDir, filename);
                        if (fs.existsSync(filePath)) {
                            const content = fs.readFileSync(filePath, 'utf8');
                            if (nodeData.template !== content) {
                                if (!silent) {
                                    node.log(`Updating template node: ${nodeData.name || nodeData.id}`);
                                }
                                nodeData.template = content;
                                updatedNodes.push(nodeData);
                                changesMade = true;
                            }
                        }
                    }
                }
                
                // Process each item in the flows array
                flows.forEach((item) => {
                    // If this is a tab, process its nodes
                    if (item.type === 'tab' && item.nodes) {
                        item.nodes.forEach(processNode);
                    }
                    // If this is a node at root level (not a tab)
                    else if (item.type === 'function' || item.type === 'ui_template') {
                        processNode(item);
                    }
                });
                
                if (changesMade && updatedNodes.length > 0) {
                    // Always update the flows.json file first
                    fs.writeFileSync(node.flowsFile, JSON.stringify(flows, null, 4), 'utf8');
                    node.log('Changes collected back to flows.json successfully');
                    
                    // Try deployment methods in order of preference
                    let deploySuccess = false;
                    
                    // Method 1: HTTP partial deployment
                    if (node.deployMethod === 'partial-http' && !deploySuccess) {
                        try {
                            await deployNodesViaHTTP(updatedNodes);
                            node.log(`Successfully deployed ${updatedNodes.length} nodes via HTTP partial API`);
                            deploySuccess = true;
                        } catch (error) {
                            node.warn(`HTTP partial deployment failed: ${error.message}`);
                            node.warn('Falling back to full flow deployment');
                            node.deployMethod = 'full-http';
                        }
                    }
                    
                    // Method 2: Full flow deployment (fallback)
                    if (node.deployMethod === 'full-http' && !deploySuccess) {
                        try {
                            await deployFullFlows(flows);
                            node.log(`Successfully deployed full flows via HTTP API (fallback method)`);
                            deploySuccess = true;
                        } catch (error) {
                            node.error(`All deployment methods failed. Last error: ${error.message}`);
                            // Final fallback to events
                            if (RED.events) {
                                RED.events.emit('flows:reload');
                                node.log('Flows reload triggered via events (final fallback)');
                            }
                        }
                    }
                    
                } else {
                    if (!silent) {
                        node.log('No changes detected to collect');
                    }
                }
                
            } catch (error) {
                node.error(`Error collecting changes: ${error.message}`);
            }
        }
        
        // Watch for changes in flows.json
        function watchFlowsFile() {
            watcher = chokidar.watch(node.flowsFile, {
                persistent: true,
                awaitWriteFinish: {
                    stabilityThreshold: 500, // Increased to prevent conflicts
                    pollInterval: 100
                },
                ignoreInitial: false
            });
            
            watcher.on('change', (filePath) => {
                // Skip if we're currently saving (to prevent race conditions)
                if (node.isSaving) {
                    node.log('Skipping file watcher during save operation');
                    return;
                }
                
                node.log(`Flows file changed: ${filePath}`);
                setTimeout(() => {
                    extractFromFlows();
                }, 100);
            });
        }
        
        // Watch for changes in functions directory
        function watchFunctionsDirectory() {
            if (!node.watchEnabled) {
                node.log('File watching disabled by configuration');
                return;
            }
            
            // Create functions directory if it doesn't exist
            if (!fs.existsSync(node.functionsDir)) {
                fs.mkdirSync(node.functionsDir, { recursive: true });
                node.log(`Created functions directory: ${node.functionsDir}`);
            }
            
            functionsWatcher = chokidar.watch(node.functionsDir, {
                persistent: true,
                ignoreInitial: true,
                awaitWriteFinish: {
                    stabilityThreshold: 200,
                    pollInterval: 100
                }
            });
            
            functionsWatcher.on('all', (event, filePath) => {
                // Skip if we're currently saving flows (to prevent race conditions)
                if (node.isSaving) {
                    node.log('Skipping functions watcher during save operation');
                    return;
                }
                
                // Only process .js and .vue files
                if (filePath.endsWith('.js') || filePath.endsWith('.vue')) {
                    node.log(`Detected change (${event}) in function file: ${path.basename(filePath)}`);
                    
                    // Small delay to ensure file write is complete
                    setTimeout(() => {
                        collectChanges(true); // true = silent mode for auto-collection
                    }, 300);
                }
            });
            
            node.log(`Started watching functions directory: ${node.functionsDir}`);
        }
        
        // Utility functions
        function sanitizeFilename(name) {
            return name.replace(/[\/\\]/g, '-').replace(/[^a-zA-Z0-9\-_]/g, '_');
        }
        
        function getFileTree(dir) {
            const files = [];
            if (fs.existsSync(dir)) {
                const items = fs.readdirSync(dir);
                items.forEach(item => {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.vue'))) {
                        files.push({
                            name: item,
                            path: fullPath,
                            size: stat.size,
                            modified: stat.mtime
                        });
                    }
                });
            }
            return files;
        }
        
        function getFileTreeWithFlows(dir, flowsFile) {
            const files = getFileTree(dir);
            
            if (!fs.existsSync(flowsFile)) {
                return { flows: [], subflows: [], orphanedFiles: files };
            }
            
            const flows = JSON.parse(fs.readFileSync(flowsFile, 'utf8'));
            const flowStructure = new Map();
            const subflowStructure = new Map();
            const fileToNodeMap = new Map();
            
            // First pass: Build flow and subflow structure
            flows.forEach(item => {
                if (item.type === 'tab') {
                    // This is a flow tab
                    flowStructure.set(item.id, {
                        id: item.id,
                        name: item.label || item.name || 'Unnamed Flow',
                        nodes: []
                    });
                } else if (item.type === 'subflow') {
                    // This is a subflow definition
                    subflowStructure.set(item.id, {
                        id: item.id,
                        name: item.name || 'Unnamed Subflow',
                        nodes: []
                    });
                }
            });
            
            // Second pass: Map nodes to their flows/subflows and create file mappings
            flows.forEach(item => {
                if (item.type === 'function' || item.type === 'ui_template') {
                    const filename = item.id + (item.type === 'function' ? '.js' : '.vue');
                    const nodeInfo = {
                        id: item.id,
                        name: item.name || item.id,
                        type: item.type,
                        filename: filename,
                        flowId: item.z // z property indicates which flow/subflow this node belongs to
                    };
                    fileToNodeMap.set(filename, nodeInfo);
                    // Add to appropriate flow or subflow
                    if (item.z && flowStructure.has(item.z)) {
                        flowStructure.get(item.z).nodes.push(nodeInfo);
                    } else if (item.z && subflowStructure.has(item.z)) {
                        subflowStructure.get(item.z).nodes.push(nodeInfo);
                    } else {
                        // This is a global/orphaned node
                        if (!flowStructure.has('global')) {
                            flowStructure.set('global', {
                                id: 'global',
                                name: 'Global',
                                nodes: []
                            });
                        }
                        flowStructure.get('global').nodes.push(nodeInfo);
                    }
                }
            });
            // Third pass: Handle nested nodes in tabs (for older flow formats)
            flows.forEach(item => {
                if (item.type === 'tab' && item.nodes) {
                    item.nodes.forEach(node => {
                        if (node.type === 'function' || node.type === 'ui_template') {
                            const filename = node.id + (node.type === 'function' ? '.js' : '.vue');
                            const nodeInfo = {
                                id: node.id,
                                name: node.name || node.id,
                                type: node.type,
                                filename: filename,
                                flowId: item.id
                            };
                            fileToNodeMap.set(filename, nodeInfo);
                            if (flowStructure.has(item.id)) {
                                flowStructure.get(item.id).nodes.push(nodeInfo);
                            }
                        }
                    });
                }
            });
            // Find orphaned files (files that exist but don't match any node)
            const mappedFiles = new Set(Array.from(fileToNodeMap.keys()));
            const orphanedFiles = files.filter(file => !mappedFiles.has(file.name));
            // Convert to result format
            const result = {
                flows: Array.from(flowStructure.values())
                    .filter(flow => flow.nodes.length > 0)
                    .map(flow => ({
                        id: flow.id,
                        name: flow.name,
                        type: 'flow',
                        nodes: flow.nodes.sort((a, b) => a.name.localeCompare(b.name))
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name)),
                subflows: Array.from(subflowStructure.values())
                    .filter(subflow => subflow.nodes.length > 0)
                    .map(subflow => ({
                        id: subflow.id,
                        name: subflow.name,
                        type: 'subflow',
                        nodes: subflow.nodes.sort((a, b) => a.name.localeCompare(b.name))
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name)),
                orphanedFiles: orphanedFiles.sort((a, b) => a.name.localeCompare(b.name))
            };
            return result;
        }

        // Find inject nodes connected to a specific function node
        function findConnectedInjectNodes(functionNodeId) {
            try {
                if (!fs.existsSync(node.flowsFile)) {
                    node.warn(`Flows file not found: ${node.flowsFile}`);
                    return [];
                }

                const flows = JSON.parse(fs.readFileSync(node.flowsFile, 'utf8'));
                const connectedInjectNodes = [];

                node.log(`Searching for inject nodes connected to function node: ${functionNodeId}`);
                node.log(`Total flows/nodes to check: ${flows.length}`);
                
                // Debug: Show first few flows to understand structure
                node.log('Sample of flows structure:');
                flows.slice(0, 5).forEach((item, index) => {
                    node.log(`Flow ${index}: type=${item.type}, id=${item.id}, name=${item.name || 'unnamed'}`);
                    if (item.wires) {
                        node.log(`  wires: ${JSON.stringify(item.wires)}`);
                    }
                });

                flows.forEach(flowItem => {
                    // Check if this is an inject node
                    if (flowItem.type === 'inject') {
                        node.log(`Found inject node: ${flowItem.id} (${flowItem.name || 'unnamed'})`);
                        
                        if (flowItem.wires && flowItem.wires.length > 0) {
                            node.log(`Inject node ${flowItem.id} has wires:`, flowItem.wires);
                            
                            // Check all wire connections from this inject node
                            flowItem.wires.forEach((wireGroup, groupIndex) => {
                                if (Array.isArray(wireGroup)) {
                                    node.log(`Checking wire group ${groupIndex}:`, wireGroup);
                                    
                                    if (wireGroup.includes(functionNodeId)) {
                                        node.log(`✅ MATCH! Inject node ${flowItem.id} is connected to function ${functionNodeId}`);
                                        
                                        // This inject node is directly connected to our function node
                                        connectedInjectNodes.push({
                                            id: flowItem.id,
                                            name: flowItem.name || `Inject (${flowItem.id})`,
                                            topic: flowItem.topic || '',
                                            payload: flowItem.payload || '',
                                            payloadType: flowItem.payloadType || 'str',
                                            repeat: flowItem.repeat || '',
                                            crontab: flowItem.crontab || '',
                                            once: flowItem.once || false
                                        });
                                    } else {
                                        node.log(`No match in wire group ${groupIndex} for function ${functionNodeId}`);
                                    }
                                }
                            });
                        } else {
                            node.log(`Inject node ${flowItem.id} has no wires`);
                        }
                    }
                });

                node.log(`Found ${connectedInjectNodes.length} inject nodes connected to function node ${functionNodeId}`);
                if (connectedInjectNodes.length > 0) {
                    node.log('Connected inject nodes:', connectedInjectNodes.map(n => `${n.id} (${n.name})`));
                }
                
                return connectedInjectNodes;

            } catch (error) {
                node.error(`Error finding connected inject nodes: ${error.message}`);
                return [];
            }
        }

        // Trigger an inject node via Node-RED admin API
        function triggerInjectNode(injectNodeId) {
            return new Promise((resolve, reject) => {
                const http = require('http');
                
                const options = {
                    hostname: 'localhost',
                    port: RED.settings.uiPort || 1880,
                    path: `/inject/${injectNodeId}`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };

                const req = http.request(options, (res) => {
                    let responseBody = '';
                    res.on('data', (chunk) => {
                        responseBody += chunk;
                    });
                    res.on('end', () => {
                        if (res.statusCode === 200 || res.statusCode === 204) {
                            resolve(responseBody);
                        } else {
                            reject(new Error(`Inject trigger failed with status: ${res.statusCode}, body: ${responseBody}`));
                        }
                    });
                });

                req.on('error', (err) => {
                    reject(new Error(`Inject trigger request failed: ${err.message}`));
                });

                req.end();
            });
        }
        
        // Initialize everything
        initEditorServer();
        extractFromFlows();
        
        // Start file watchers based on configuration
        if (node.watchEnabled) {
            watchFlowsFile(); // Watch flows.json for extracting changes
            watchFunctionsDirectory(); // Watch functions directory for collecting changes
            node.log('File watching enabled - live sync is active');
        } else {
            node.log('File watching disabled - using manual sync only');
        }
        
        // Cleanup on close
        node.on('close', () => {
            if (watcher) {
                watcher.close();
            }
            if (functionsWatcher) {
                functionsWatcher.close();
            }
            if (io) {
                io.close();
            }
        });
    }
    
    RED.nodes.registerType("function-editor", FunctionEditorNode);
}; 