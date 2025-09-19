/**
 * Main Application Logic
 * Core simulation engine and application management
 * Phase 2 Hour 3 scope: Basic hardware entities and movement system
 * 
 * Uses hardware classes and interaction zones from separate modules
 */
class DataCenterSimulation {
    constructor() {
        console.log('🚀 Initializing Data Center Simulation...');
        
        this.canvases = {};
        this.contexts = {};
        this.entities = [];
        this.hardwareItems = [];
        this.currentLocation = 'overview';
        this.isRunning = true;
        this.simulationSpeed = 1;
        this.simulationTime = 0;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 60;
        
        // Random truck arrival scheduling
        this.nextTruckArrival = this.getRandomTruckInterval();
        
        this.inventoryManager = new InventoryManager();
        this.zoneManager = new ZoneManager();
        this.aiRobot = new AIRobotAgent(600, 120); // Start in center-top area
        this.pathfindingSystem = new PathfindingSystem(1200, 800);
        this.eventGenerator = new EventGenerator();
        
        // Initialize AI intelligence system with movement hierarchy
        this.aiAgent = new AIAgent();
        this.movementSystem = new MovementManagementSystem(this.aiAgent);
        this.debugMode = false;
        this.selectedItem = null;
        
        this.camera = {
            x: 0, y: 0, zoom: 1,
            minZoom: 0.5, maxZoom: 3,
            targetZoom: 1, smoothing: 0.1
        };
        
        this.mouse = {
            x: 0, y: 0, isDown: false,
            lastX: 0, lastY: 0, isPanning: false
        };
        
        this.initializeCanvases();
        this.initializeEventListeners();
        this.initializeGameLoop();
        this.setupDemoHardware();
        this.setupDemoZones();
        this.showLoadingScreen();
    }

    initializeCanvases() {
        const canvasIds = ['background-canvas', 'entity-canvas', 'ui-canvas', 'effect-canvas'];
        
        // Fixed canvas dimensions to ensure all locations are visible
        const canvasWidth = 1200;
        const canvasHeight = 800;
        
        canvasIds.forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                this.canvases[id] = canvas;
                this.contexts[id] = canvas.getContext('2d');
                
                const dpr = window.devicePixelRatio || 1;
                
                // Set canvas to fixed size for proper content display
                canvas.width = canvasWidth * dpr;
                canvas.height = canvasHeight * dpr;
                canvas.style.width = canvasWidth + 'px';
                canvas.style.height = canvasHeight + 'px';
                
                this.contexts[id].scale(dpr, dpr);
                
                console.log(`✅ Canvas initialized: ${id} (${canvasWidth}x${canvasHeight})`);
            }
        });
    }

    initializeEventListeners() {
        const playPauseBtn = document.getElementById('play-pause-btn');
        const speedBtn = document.getElementById('speed-btn');
        const resetBtn = document.getElementById('reset-btn');
        const resetViewBtn = document.getElementById('reset-view-btn');
        const truckArrivalBtn = document.getElementById('truck-arrival-btn');
        const debugModeBtn = document.getElementById('debug-mode-btn');

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.toggleSimulation());
        }

        if (speedBtn) {
            speedBtn.addEventListener('click', () => this.cycleSpeed());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSimulation());
        }

        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => this.resetView());
        }

        if (truckArrivalBtn) {
            truckArrivalBtn.addEventListener('click', () => this.simulateTruckArrival());
        }

        if (debugModeBtn) {
            debugModeBtn.addEventListener('click', () => this.toggleDebugMode());
        }

        // Location tab buttons commented out - can be revisited later
        /*
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const location = e.target.getAttribute('data-location');
                this.switchLocation(location);
            });
        });
        */

        const entityCanvas = this.canvases['entity-canvas'];
        if (entityCanvas) {
            entityCanvas.addEventListener('click', (e) => this.handleCanvasClick(e));
            entityCanvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
            entityCanvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e));
            entityCanvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
            entityCanvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
            entityCanvas.addEventListener('mouseleave', (e) => this.handleCanvasMouseLeave(e));
        }

        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));

        console.log('✅ Event listeners initialized');
    }

    initializeGameLoop() {
        const gameLoop = (currentTime) => {
            const deltaTime = (currentTime - this.lastFrameTime) / 1000;
            this.lastFrameTime = currentTime;
            
            this.frameCount++;
            if (this.frameCount % 60 === 0) {
                this.fps = Math.round(1 / deltaTime);
                this.updateFPSDisplay();
            }
            
            if (this.isRunning) {
                this.update(deltaTime);
            }
            
            this.render();
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
        console.log('✅ Game loop started');
    }

    setupDemoHardware() {
        const demoItems = [
            { type: 'GPU', x: 100, y: 150, location: 'loading-bay' },
            { type: 'GPU', x: 140, y: 150, location: 'loading-bay' },
            { type: 'SSD', x: 200, y: 180, location: 'loading-bay' },
            { type: 'SSD', x: 220, y: 180, location: 'loading-bay' },
            { type: 'CPU', x: 280, y: 200, location: 'loading-bay' },
            { type: 'RAM', x: 320, y: 200, location: 'loading-bay' },
            { type: 'PSU', x: 500, y: 250, location: 'storage-room' },
            { type: 'Motherboard', x: 550, y: 280, location: 'storage-room' },
            { type: 'GPU', x: 600, y: 250, location: 'storage-room' },
            { type: 'CPU', x: 800, y: 300, location: 'server-floor', status: 'installed' },
            { type: 'RAM', x: 850, y: 320, location: 'server-floor', status: 'installed' }
        ];

        demoItems.forEach(item => {
            const hardware = HardwareFactory.createHardware(item.type, item.x, item.y);
            hardware.location = item.location;
            if (item.status) hardware.status = item.status;
            
            this.hardwareItems.push(hardware);
            this.entities.push(hardware);
            this.inventoryManager.addItem(hardware);
        });

        // Add AI robot to entities
        this.entities.push(this.aiRobot);
        
        console.log(`✅ Created ${demoItems.length} demo hardware items`);
        this.updateEntityCount();
    }

    setupDemoZones() {
        // Create demo interaction zones
        
        // Loading Bay - 3x1 layout (3 docks VERTICALLY - moved down to clear title)
        // Available area: approximately 315px wide x 600px height (minus margins)
        const loadingDock1 = new LoadingDock(60, 170, 200, 150, 1);
        const loadingDock2 = new LoadingDock(60, 350, 200, 150, 2);
        const loadingDock3 = new LoadingDock(60, 530, 200, 150, 3);
        
        // Storage Room - 3x2 layout (3 rows, 2 columns) - moved down to clear title
        // Available area: approximately 300px wide x 550px height
        const storageBin1 = new StorageBin(420, 180, 120, 100, 'A1');
        const storageBin2 = new StorageBin(580, 180, 120, 100, 'A2');
        const storageBin3 = new StorageBin(420, 310, 120, 100, 'B1');
        const storageBin4 = new StorageBin(580, 310, 120, 100, 'B2');
        const storageBin5 = new StorageBin(420, 440, 120, 100, 'C1');
        const storageBin6 = new StorageBin(580, 440, 120, 100, 'C2');
        
        // Server Floor - 3x2 layout (3 rows, 2 columns) - optimally distributed
        // Available area: approximately 300px wide x 550px height
        const serverRack1 = new ServerRackSlot(820, 140, 120, 110, 'R1', 1);
        const serverRack2 = new ServerRackSlot(960, 140, 120, 110, 'R1', 2);
        const serverRack3 = new ServerRackSlot(820, 290, 120, 110, 'R2', 1);
        const serverRack4 = new ServerRackSlot(960, 290, 120, 110, 'R2', 2);
        const serverRack5 = new ServerRackSlot(820, 440, 120, 110, 'R3', 1);
        const serverRack6 = new ServerRackSlot(960, 440, 120, 110, 'R3', 2);
        
        const qualityControl = new QualityControlStation(280, 570, 480, 80);

        // Add Loading Bay zones
        this.zoneManager.addZone(loadingDock1);
        this.zoneManager.addZone(loadingDock2);
        this.zoneManager.addZone(loadingDock3);
        
        // Add Storage Room zones
        this.zoneManager.addZone(storageBin1);
        this.zoneManager.addZone(storageBin2);
        this.zoneManager.addZone(storageBin3);
        this.zoneManager.addZone(storageBin4);
        this.zoneManager.addZone(storageBin5);
        this.zoneManager.addZone(storageBin6);
        
        // Add Server Floor zones
        this.zoneManager.addZone(serverRack1);
        this.zoneManager.addZone(serverRack2);
        this.zoneManager.addZone(serverRack3);
        this.zoneManager.addZone(serverRack4);
        this.zoneManager.addZone(serverRack5);
        this.zoneManager.addZone(serverRack6);
        
        this.zoneManager.addZone(qualityControl);

        // Create and position recycle bin
        const recycleBin = new RecycleBinZone();
        recycleBin.autoPosition(this.zoneManager);
        this.zoneManager.addZone(recycleBin);

        console.log('✅ Created demo interaction zones with corrected layouts and recycle bin');
        
        // Associate existing hardware items with appropriate zones
        this.associateItemsWithZones();
        
        // Initialize movement demonstration after zones are created
        this.setupMovementDemonstration();
    }

    /**
     * Associate existing hardware items with their appropriate zones
     */
    associateItemsWithZones() {
        this.hardwareItems.forEach(item => {
            // Find the zone that contains this item based on position
            const containingZone = this.zoneManager.getAllZones().find(zone => {
                return item.position.x >= zone.position.x && 
                       item.position.x <= zone.position.x + zone.size.width &&
                       item.position.y >= zone.position.y && 
                       item.position.y <= zone.position.y + zone.size.height;
            });
            
            if (containingZone) {
                if (!containingZone.occupants) {
                    containingZone.occupants = [];
                }
                
                // Only add if not already present
                if (!containingZone.occupants.includes(item)) {
                    containingZone.occupants.push(item);
                    console.log(`📦 Associated ${item.hardwareType} with ${containingZone.type} zone`);
                }
            }
        });
        
        console.log('✅ Hardware items associated with zones');
    }

    /**
     * Setup demonstration of the movement hierarchy system
     */
    setupMovementDemonstration() {
        if (!this.movementSystem) return;

        // Simulate some items going through QC process
        setTimeout(() => {
            // Find items in loading dock zones and queue them for QC
            const loadingDockZones = this.zoneManager.getAllZones().filter(zone => zone.type === 'loading-dock');
            let itemsToQC = [];
            
            loadingDockZones.forEach(dock => {
                if (dock.occupants && dock.occupants.length > 0) {
                    // Take first item from each dock
                    itemsToQC.push(dock.occupants[0]);
                }
            });
            
            if (itemsToQC.length > 0) {
                // Add items to QC queue
                itemsToQC.forEach(item => {
                    this.movementSystem.qcQueue.push(item);
                    console.log(`📝 Added ${item.hardwareType} to QC queue for processing`);
                });
                
                this.addNotification(`${itemsToQC.length} items automatically queued for QC inspection`, 'info');
            } else {
                console.log('No items found in loading docks for QC processing');
            }
        }, 3000); // Start demo after 3 seconds

        // Simulate some RR failures periodically
        setInterval(() => {
            if (this.movementSystem) {
                this.movementSystem.checkAndHandleRRFailures(this);
            }
        }, 30000); // Check every 30 seconds
    }

    update(deltaTime) {
        const updateStart = performance.now();
        const adjustedDelta = deltaTime * this.simulationSpeed;
        
        // Performance monitoring - log every 5 seconds
        if (this.frameCount % 300 === 0) {
            console.log(`📊 Performance Check - Entities: ${this.entities.length}, Events: ${this.eventGenerator?.activeEvents?.length || 0}, FPS: ${this.fps}`);
            
            // Entity type breakdown
            const entityTypes = {};
            this.entities.forEach(entity => {
                const type = entity.constructor.name || 'Unknown';
                entityTypes[type] = (entityTypes[type] || 0) + 1;
            });
            console.log(`📊 Entity Types:`, entityTypes);
        }
        
        this.simulationTime += adjustedDelta;
        this.updateTimeDisplay();
        
        // Entity updates with performance tracking
        const entityUpdateStart = performance.now();
        let entityUpdateCount = 0;
        this.entities.forEach(entity => {
            if (entity.update) {
                entity.update(adjustedDelta);
                entityUpdateCount++;
            }
        });
        const entityUpdateTime = performance.now() - entityUpdateStart;
        
        // Log if entity updates are taking too long (>10ms)
        if (entityUpdateTime > 10) {
            console.warn(`⚠️ Entity updates slow: ${entityUpdateTime.toFixed(2)}ms for ${entityUpdateCount} entities`);
        }
        
        // Process AI movement system
        if (this.movementSystem) {
            // Process QC queue every 2 seconds
            if (this.frameCount % 120 === 0) {
                this.movementSystem.processQCQueue(this);
            }
            
            // Process QC completions every second
            if (this.frameCount % 60 === 0) {
                this.movementSystem.processQCCompletions(this);
            }
            
            // Check for RR failures every 10 seconds
            if (this.frameCount % 600 === 0) {
                this.movementSystem.checkAndHandleRRFailures(this);
            }
            
            // Process recycling queue every second
            if (this.frameCount % 60 === 0) {
                this.movementSystem.processRecyclingQueue(this);
            }
        }
        
        this.updateCamera(adjustedDelta);
        
        if (Math.floor(this.simulationTime) % 3 === 0 && this.frameCount % 180 === 0) {
            this.updateAIStatus();
        }
        
        // Schedule random truck arrivals (between 60-120 seconds)
        if (this.simulationTime >= this.nextTruckArrival) {
            // Only create new truck if no active trucks exist
            const activeTrucks = this.entities.filter(e => e.entityType === 'truck' && !e.hasFinishedTask);
            if (activeTrucks.length === 0) {
                this.simulateTruckArrival();
            }
            this.nextTruckArrival = this.simulationTime + this.getRandomTruckInterval();
        }
        
        // Update event system with performance tracking
        if (this.eventGenerator) {
            const eventUpdateStart = performance.now();
            this.eventGenerator.update(this.simulationTime, this.entities);
            const eventUpdateTime = performance.now() - eventUpdateStart;
            
            // Log if event updates are taking too long (>5ms)
            if (eventUpdateTime > 5) {
                console.warn(`⚠️ Event updates slow: ${eventUpdateTime.toFixed(2)}ms`);
            }
        }
        
        this.processEvents(adjustedDelta);
        
        // Clean up expired entities (trucks, temporary objects)
        this.cleanupExpiredEntities();
        
        const totalUpdateTime = performance.now() - updateStart;
        // Log if total update is taking too long (>16ms = 60fps threshold)
        if (totalUpdateTime > 16) {
            console.warn(`⚠️ Frame update slow: ${totalUpdateTime.toFixed(2)}ms (target: <16ms)`);
        }
    }
    
    cleanupExpiredEntities() {
        const initialCount = this.entities.length;
        
        // Remove completed trucks and other expired entities
        this.entities = this.entities.filter(entity => {
            // Keep essential entities (AI robot, hardware items)
            if (entity === this.aiRobot || entity.hardwareType) {
                return true;
            }
            
            // Remove trucks that have finished their tasks and are off-screen
            if (entity.entityType === 'truck' && entity.hasFinishedTask && entity.position.x < -200) {
                console.log('🚛 Removing expired truck at position:', entity.position.x);
                return false;
            }
            
            // Remove trucks that have been around too long (fallback cleanup)
            if (entity.entityType === 'truck' && entity.arrivalTime) {
                const timeSinceArrival = Date.now() - entity.arrivalTime;
                if (timeSinceArrival > 30000) { // 30 seconds max lifetime
                    console.log('🚛 Removing truck due to timeout');
                    return false;
                }
            }
            
            // Remove other temporary entities that are marked for deletion
            if (entity.markForDeletion) {
                return false;
            }
            
            return true;
        });
        
        // Log cleanup if entities were removed
        if (this.entities.length < initialCount) {
            console.log(`🧹 Cleaned up ${initialCount - this.entities.length} expired entities`);
        }
        
        // Force cleanup if we have too many entities (memory leak prevention)
        if (this.entities.length > 100) {
            console.warn('⚠️ Too many entities detected, forcing cleanup...');
            this.forceEntityCleanup();
        }
    }
    
    forceEntityCleanup() {
        const essentialEntities = this.entities.filter(entity => 
            entity === this.aiRobot || 
            entity.hardwareType || 
            (entity.entityType === 'truck' && !entity.hasFinishedTask)
        );
        
        const removedCount = this.entities.length - essentialEntities.length;
        this.entities = essentialEntities;
        
        console.log(`🧹 Force cleanup removed ${removedCount} non-essential entities`);
    }

    render() {
        Object.keys(this.contexts).forEach(canvasId => {
            const ctx = this.contexts[canvasId];
            const canvas = this.canvases[canvasId];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        this.applyCameraTransform('background-canvas');
        this.applyCameraTransform('entity-canvas');

        this.renderBackground();
        this.renderEntities();
        
        this.restoreCameraTransform('background-canvas');
        this.restoreCameraTransform('entity-canvas');
        
        this.renderUI();
        this.renderEffects();
    }

    renderBackground() {
        const ctx = this.contexts['background-canvas'];
        if (!ctx) return;

        ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
        ctx.lineWidth = 1;

        const canvas = this.canvases['background-canvas'];
        const gridSize = Math.max(25, 50 / this.camera.zoom);
        
        if (this.camera.zoom > 0.5) {
            for (let x = 0; x < canvas.width / this.camera.zoom + Math.abs(this.camera.x / this.camera.zoom); x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x - Math.abs(this.camera.x / this.camera.zoom), 0);
                ctx.lineTo(x - Math.abs(this.camera.x / this.camera.zoom), canvas.height / this.camera.zoom);
                ctx.stroke();
            }
            
            for (let y = 0; y < canvas.height / this.camera.zoom + Math.abs(this.camera.y / this.camera.zoom); y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y - Math.abs(this.camera.y / this.camera.zoom));
                ctx.lineTo(canvas.width / this.camera.zoom, y - Math.abs(this.camera.y / this.camera.zoom));
                ctx.stroke();
            }
        }

        this.renderLocationLayout(ctx);
        
        // Render interaction zones
        this.zoneManager.getAllZones().forEach(zone => {
            if (zone.render) {
                zone.render(ctx);
            }
        });
        
        // Render pathfinding grid (only in overview mode and when debug enabled)
        if (this.currentLocation === 'overview' && this.debugMode) {
            this.pathfindingSystem.renderGrid(ctx);
        }
    }

    renderLocationLayout(ctx) {
        const canvas = this.canvases['background-canvas'];
        const width = canvas.width;
        const height = canvas.height;

        switch (this.currentLocation) {
            case 'overview':
                this.renderOverviewLayout(ctx, width, height);
                break;
            case 'loading-bay':
                this.renderLoadingBayLayout(ctx, width, height);
                break;
            case 'storage-room':
                this.renderStorageRoomLayout(ctx, width, height);
                break;
            case 'server-floor':
                this.renderServerFloorLayout(ctx, width, height);
                break;
        }
    }

    renderOverviewLayout(ctx, width, height) {
        // Better utilize the 1200x800 space - make zones larger and more spaced out
        const zoneWidth = 360;  // Fixed width for better visibility
        const zoneHeight = height - 180;  // Use more vertical space
        const startY = 90;
        const spacing = 20;  // Space between zones

        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        
        // Calculate the center position over the three location zones
        const totalZonesWidth = (zoneWidth * 3) + (spacing * 2);
        const zonesStartX = 30;
        const zonesCenterX = zonesStartX + (totalZonesWidth / 2);
        
        // Ensure text fits within the zones area
        const titleText = 'Data Center Management Overview';
        const textWidth = ctx.measureText(titleText).width;
        const availableWidth = totalZonesWidth;
        
        // If text is too wide, use a smaller font or shorter text
        if (textWidth > availableWidth) {
            ctx.font = 'bold 24px Arial';
        }
        
        ctx.fillText(titleText, zonesCenterX, 60);

        this.drawLocationZone(ctx, 30, startY, zoneWidth, zoneHeight, 'Loading Bay', '#ff6b6b', []);

        this.drawLocationZone(ctx, 30 + zoneWidth + spacing, startY, zoneWidth, zoneHeight, 'Storage Room', '#4ecdc4', []);

        this.drawLocationZone(ctx, 30 + (zoneWidth + spacing) * 2, startY, zoneWidth, zoneHeight, 'Server Floor', '#45b7d1', []);

        this.drawWorkflowArrows(ctx, width, height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🖱️ Click hardware to select • Shift+G/S/C/R to create items • Shift+M to move selected • Del to delete', width / 2, height - 50);
        
        ctx.font = '14px Arial';
        ctx.fillStyle = '#00d4ff';
        ctx.fillText('🤖 AI Robot: Shift+1/2/3 to move between locations', width / 2, height - 30);
        
        ctx.font = '12px Arial';
        ctx.fillStyle = '#ffaa00';
        ctx.fillText('🔧 Debug: Shift+D to toggle pathfinding grid and movement paths', width / 2, height - 15);
    }

    renderLoadingBayLayout(ctx, width, height) {
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🚛 Loading Bay Operations', width / 2, 50);
    }

    renderStorageRoomLayout(ctx, width, height) {
        ctx.fillStyle = '#4ecdc4';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏪 AI-Optimized Storage Room', width / 2, 50);
    }

    renderServerFloorLayout(ctx, width, height) {
        ctx.fillStyle = '#45b7d1';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🖥️ Server Floor Operations', width / 2, 50);
    }

    drawLocationZone(ctx, x, y, width, height, title, color, features) {
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, color + '10');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, width, height);

        // Larger title font
        ctx.fillStyle = color;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, x + width / 2, y + 40);

        // Larger feature text
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        features.forEach((feature, index) => {
            ctx.fillText(`• ${feature}`, x + 25, y + 85 + (index * 35));
        });

        // Larger icon
        ctx.font = '64px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = color + '80';
        const icons = { 'Loading Bay': '🚛', 'Storage Room': '📦', 'Server Floor': '🖥️' };
        ctx.fillText(icons[title] || '📊', x + width / 2, y + height - 60);
    }

    drawWorkflowArrows(ctx, width, height) {
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 5;
        ctx.setLineDash([15, 8]);

        const zoneWidth = 360;
        const spacing = 20;
        const arrowY = height - 60;

        // Arrow from Loading Bay to Storage Room
        this.drawArrow(ctx, 30 + zoneWidth + 5, arrowY, 30 + zoneWidth + spacing - 5, arrowY);
        // Arrow from Storage Room to Server Floor
        this.drawArrow(ctx, 30 + (zoneWidth + spacing) + zoneWidth + 5, arrowY, 30 + (zoneWidth + spacing) * 2 - 5, arrowY);

        ctx.setLineDash([]);
    }

    drawArrow(ctx, fromX, fromY, toX, toY) {
        const headLength = 15;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }

    renderEntities() {
        const ctx = this.contexts['entity-canvas'];
        if (!ctx) return;

        // Render movement paths first (behind entities)
        if (this.debugMode) {
            this.entities.forEach(entity => {
                if (entity.enhancedMovement && entity.enhancedMovement.renderPath) {
                    entity.enhancedMovement.renderPath(ctx);
                }
            });
        }

        // Render entities
        this.entities.forEach(entity => {
            if (entity.render && entity.visible) {
                // Pass debug mode to AI robot for path visualization
                if (entity === this.aiRobot) {
                    entity.render(ctx, this.debugMode);
                } else {
                    entity.render(ctx);
                }
            }
        });
    }

    renderUI() {
        // Canvas-based UI elements
    }

    renderEffects() {
        // Particle effects and animations
    }

    // Control Methods
    toggleSimulation() {
        this.isRunning = !this.isRunning;
        const btn = document.getElementById('play-pause-btn');
        if (btn) {
            btn.textContent = this.isRunning ? '⏸️ Pause' : '▶️ Play';
        }
        this.addNotification(`Simulation ${this.isRunning ? 'resumed' : 'paused'}`, 'info');
    }

    cycleSpeed() {
        const speeds = [0.5, 1, 2, 4];
        const currentIndex = speeds.indexOf(this.simulationSpeed);
        this.simulationSpeed = speeds[(currentIndex + 1) % speeds.length];
        
        const btn = document.getElementById('speed-btn');
        if (btn) {
            btn.textContent = `${this.simulationSpeed}x Speed`;
        }
        this.addNotification(`Speed changed to ${this.simulationSpeed}x`, 'info');
    }

    resetSimulation() {
        this.simulationTime = 0;
        this.entities = [];
        this.hardwareItems = [];
        this.selectedItem = null;
        
        this.inventoryManager = new InventoryManager();
        this.setupDemoHardware();
        
        this.addNotification('Simulation reset', 'info');
        this.hideHardwareDetails();
        console.log('🔄 Simulation reset');
    }

    resetView() {
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.zoom = 1;
        this.camera.targetZoom = 1;
        this.addNotification('View reset to default', 'info');
    }

    /**
     * Show movement options for selected hardware item
     */
    showMovementOptions(item) {
        if (!this.aiAgent || !this.movementSystem) return;

        const currentZone = this.aiAgent.findItemCurrentZone(item, this);
        if (!currentZone) {
            console.log(`Item ${item.hardwareType} not in any zone`);
            return;
        }

        const currentZoneType = this.aiAgent.getZoneTypeFromZone(currentZone);
        const validDestinations = this.aiAgent.getValidDestinations(currentZoneType);

        console.log(`🔄 Movement Options for ${item.hardwareType}:`);
        console.log(`  Current: ${currentZoneType}`);
        console.log(`  Valid destinations:`, validDestinations);

        // Demo: Auto-move item through QC process if it's in loading dock
        if (currentZoneType === 'loading-dock') {
            console.log(`🏭 Demonstrating: Moving ${item.hardwareType} to QC Station`);
            
            // Check if item is already in QC queue
            const alreadyQueued = this.movementSystem.qcQueue.find(qItem => qItem.id === item.id);
            if (!alreadyQueued) {
                this.movementSystem.qcQueue.push(item);
                this.addNotification(`${item.hardwareType} added to QC processing queue`, 'info');
            } else {
                this.addNotification(`${item.hardwareType} already in QC queue`, 'warning');
            }
        } else if (currentZoneType === 'storage-bin') {
            // Demo: Move to server rack
            console.log(`🖥️ Demonstrating: Installing ${item.hardwareType} in server rack`);
            setTimeout(() => {
                if (this.movementSystem.executeMovement(item, 'rack-slot', this)) {
                    this.addNotification(`${item.hardwareType} installed in server rack`, 'success');
                }
            }, 2000);
        }
    }

    // switchLocation method commented out - can be revisited later
    /*
    switchLocation(location) {
        this.currentLocation = location;
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-location="${location}"]`).classList.add('active');
        
        const statusElement = document.getElementById('current-view');
        if (statusElement) {
            statusElement.textContent = `Current View: ${location.charAt(0).toUpperCase() + location.slice(1).replace('-', ' ')}`;
        }
        
        this.addNotification(`Switched to ${location}`, 'info');
    }
    */

    // Event Handlers
    handleCanvasClick(event) {
        if (!this.mouse.isPanning) {
            const rect = event.target.getBoundingClientRect();
            const x = (event.clientX - rect.left - this.camera.x) / this.camera.zoom;
            const y = (event.clientY - rect.top - this.camera.y) / this.camera.zoom;
            
            let clickedItem = null;
            for (let i = this.hardwareItems.length - 1; i >= 0; i--) {
                const item = this.hardwareItems[i];
                if (item.isPointInside && item.isPointInside(x, y)) {
                    clickedItem = item;
                    break;
                } else if (x >= item.position.x && x <= item.position.x + item.size.width &&
                          y >= item.position.y && y <= item.position.y + item.size.height) {
                    clickedItem = item;
                    break;
                }
            }
            
            if (clickedItem) {
                this.selectHardwareItem(clickedItem);
                this.addNotification(`Selected ${clickedItem.hardwareType} (${clickedItem.serialNumber})`, 'info');
                
                // Demonstrate movement options based on current location
                this.showMovementOptions(clickedItem);
            } else {
                // Check if AI robot was clicked
                if (this.aiRobot && 
                    x >= this.aiRobot.position.x && x <= this.aiRobot.position.x + this.aiRobot.size.width &&
                    y >= this.aiRobot.position.y && y <= this.aiRobot.position.y + this.aiRobot.size.height) {
                    this.showAIRobotDetails();
                } else {
                    this.deselectAll();
                    console.log(`Canvas clicked at world position (${x.toFixed(1)}, ${y.toFixed(1)})`);
                    this.addNotification(`Clicked at (${x.toFixed(0)}, ${y.toFixed(0)})`, 'info');
                }
            }
        }
    }

    handleCanvasMouseMove(event) {
        const rect = event.target.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
        
        if (this.mouse.isDown) {
            const deltaX = this.mouse.x - this.mouse.lastX;
            const deltaY = this.mouse.y - this.mouse.lastY;
            
            this.camera.x += deltaX;
            this.camera.y += deltaY;
            
            this.mouse.lastX = this.mouse.x;
            this.mouse.lastY = this.mouse.y;
            
            this.mouse.isPanning = true;
        }
    }

    handleCanvasWheel(event) {
        event.preventDefault();
        
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(this.camera.minZoom, 
                        Math.min(this.camera.maxZoom, this.camera.zoom * zoomFactor));
        
        if (newZoom !== this.camera.zoom) {
            const mouseX = this.mouse.x;
            const mouseY = this.mouse.y;
            
            const worldX = (mouseX - this.camera.x) / this.camera.zoom;
            const worldY = (mouseY - this.camera.y) / this.camera.zoom;
            
            this.camera.zoom = newZoom;
            
            this.camera.x = mouseX - worldX * this.camera.zoom;
            this.camera.y = mouseY - worldY * this.camera.zoom;
            
            this.addNotification(`Zoom: ${(this.camera.zoom * 100).toFixed(0)}%`, 'info');
        }
    }

    handleCanvasMouseDown(event) {
        this.mouse.isDown = true;
        this.mouse.isPanning = false;
        this.mouse.lastX = this.mouse.x;
        this.mouse.lastY = this.mouse.y;
        
        event.target.style.cursor = 'grabbing';
    }

    handleCanvasMouseUp(event) {
        this.mouse.isDown = false;
        event.target.style.cursor = 'grab';
        
        setTimeout(() => {
            this.mouse.isPanning = false;
        }, 100);
    }

    handleCanvasMouseLeave(event) {
        this.mouse.isDown = false;
        this.mouse.isPanning = false;
        event.target.style.cursor = 'grab';
    }

    handleResize() {
        this.initializeCanvases();
        console.log('📐 Canvas resized');
    }

    handleKeyDown(event) {
        switch(event.key.toLowerCase()) {
            case 'g':
                if (event.shiftKey) {
                    this.createRandomHardware('GPU');
                }
                break;
            case 's':
                if (event.shiftKey) {
                    this.createRandomHardware('SSD');
                }
                break;
            case 'c':
                if (event.shiftKey) {
                    this.createRandomHardware('CPU');
                }
                break;
            case 'r':
                if (event.shiftKey) {
                    this.createRandomHardware('RAM');
                }
                break;
            case 'm':
                if (event.shiftKey && this.selectedItem) {
                    this.demonstrateMovement();
                }
                break;
            case 'delete':
                if (this.selectedItem) {
                    this.deleteSelectedItem();
                }
                break;
            case 'escape':
                this.deselectAll();
                break;
            case '1':
                if (event.shiftKey && this.aiRobot) {
                    this.aiRobot.moveToLocation('loading-bay');
                    this.addNotification('AI Robot moving to Loading Bay', 'info');
                }
                break;
            case '2':
                if (event.shiftKey && this.aiRobot) {
                    this.aiRobot.moveToLocation('storage-room');
                    this.addNotification('AI Robot moving to Storage Room', 'info');
                }
                break;
            case '3':
                if (event.shiftKey && this.aiRobot) {
                    this.aiRobot.moveToLocation('server-floor');
                    this.addNotification('AI Robot moving to Server Floor', 'info');
                }
                break;
            case 'd':
                if (event.shiftKey) {
                    this.debugMode = !this.debugMode;
                    this.addNotification(`Debug mode ${this.debugMode ? 'enabled' : 'disabled'}`, 'info');
                }
                break;

        }
    }

    // Utility Methods
    updateTimeDisplay() {
        const minutes = Math.floor(this.simulationTime / 60);
        const seconds = Math.floor(this.simulationTime % 60);
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const timeElement = document.getElementById('simulation-time');
        if (timeElement) {
            timeElement.textContent = `Time: ${timeString}`;
        }
    }

    updateFPSDisplay() {
        const fpsElement = document.getElementById('fps-counter');
        if (fpsElement) {
            fpsElement.textContent = `FPS: ${this.fps}`;
        }
    }

    updateEntityCount() {
        const entityElement = document.getElementById('entity-count');
        if (entityElement) {
            entityElement.textContent = `Entities: ${this.entities.length}`;
        }
    }

    updateAIStatus() {
        const aiTaskElement = document.getElementById('ai-current-task');
        
        // Update with new AI Agent system if available
        if (this.aiAgent && aiTaskElement) {
            const status = this.aiAgent.getStatus();
            const metrics = this.aiAgent.metrics;
            
            if (status.currentTask) {
                aiTaskElement.textContent = `${status.state}: ${status.currentTask}`;
            } else {
                aiTaskElement.textContent = `AI Agent ${status.state} - Movement System Active`;
            }
            
            // Update the thought bubble with movement system status
            const thoughtBubble = document.getElementById('ai-thought-bubble');
            const bubbleContent = document.querySelector('.bubble-content');
            
            if (thoughtBubble && bubbleContent) {
                let content = `<strong>🤖 AI Movement Intelligence</strong><br>`;
                content += `State: ${status.state}<br>`;
                content += `Queue Length: ${status.queueLength}<br><br>`;
                
                content += `<strong>📊 Performance Metrics:</strong><br>`;
                content += `Trucks Processed: ${metrics.trucksProcessed}<br>`;
                content += `QC Processed: ${metrics.qcProcessed}<br>`;
                content += `QC Pass Rate: ${Math.round(metrics.qcPassedRate * 100)}%<br>`;
                content += `Failures Detected: ${metrics.failuresDetected}<br>`;
                content += `Parts Recycled: ${metrics.recycledParts}<br><br>`;
                
                if (status.lastDecision) {
                    content += `<strong>🧠 Last Decision:</strong><br>`;
                    content += `${status.lastDecision.reasoning || 'Processing...'}<br>`;
                }
                
                // Show movement system queues
                if (this.movementSystem) {
                    content += `<br><strong>🔄 System Queues:</strong><br>`;
                    content += `QC Queue: ${this.movementSystem.qcQueue.length}<br>`;
                    content += `Recycle Queue: ${this.movementSystem.recyclingQueue.length}<br>`;
                }
                
                bubbleContent.innerHTML = content;
                thoughtBubble.classList.remove('hidden');
            }
        } else if (aiTaskElement && this.aiRobot) {
            // Fallback to original robot system
            const robotDecision = this.aiRobot.getCurrentDecision();
            
            if (robotDecision.currentTask) {
                aiTaskElement.textContent = robotDecision.currentTask.description;
            } else {
                aiTaskElement.textContent = 'AI Agent idle - waiting for next task...';
            }
        }
    }



    updateMetricsDisplay() {
        const stats = this.inventoryManager.getItemsByType('GPU').length > 0 ? 
            this.calculateEfficiencyMetrics() : this.getDefaultMetrics();

        const efficiencyElement = document.getElementById('inventory-efficiency');
        const responseTimeElement = document.getElementById('response-time');
        const utilizationElement = document.getElementById('storage-utilization');

        if (efficiencyElement) efficiencyElement.textContent = `${stats.efficiency}%`;
        if (responseTimeElement) responseTimeElement.textContent = `${stats.responseTime} min`;
        if (utilizationElement) utilizationElement.textContent = `${stats.utilization}%`;
    }

    calculateEfficiencyMetrics() {
        const totalItems = this.hardwareItems.length;
        const installedItems = this.inventoryManager.getItemsByStatus('installed').length;
        
        return {
            efficiency: (Math.max(85, Math.min(99, 90 + Math.random() * 9))).toFixed(2),
            responseTime: (2.0 + Math.random() * 1.5).toFixed(2),
            utilization: Math.floor(65 + (installedItems / totalItems) * 35)
        };
    }

    getDefaultMetrics() {
        return {
            efficiency: '95.00',
            responseTime: '2.30',
            utilization: 78
        };
    }

    updateCamera(deltaTime) {
        if (Math.abs(this.camera.targetZoom - this.camera.zoom) > 0.01) {
            this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * this.camera.smoothing;
        }
        
        const canvas = this.canvases['background-canvas'];
        if (canvas) {
            const maxPanX = canvas.width * 0.5;
            const maxPanY = canvas.height * 0.5;
            
            this.camera.x = Math.max(-maxPanX * this.camera.zoom, 
                           Math.min(maxPanX * this.camera.zoom, this.camera.x));
            this.camera.y = Math.max(-maxPanY * this.camera.zoom, 
                           Math.min(maxPanY * this.camera.zoom, this.camera.y));
        }
        
        const zoomElement = document.getElementById('zoom-level');
        if (zoomElement) {
            zoomElement.textContent = `Zoom: ${(this.camera.zoom * 100).toFixed(0)}%`;
        }
    }

    applyCameraTransform(canvasId) {
        const ctx = this.contexts[canvasId];
        if (ctx) {
            ctx.save();
            ctx.translate(this.camera.x, this.camera.y);
            ctx.scale(this.camera.zoom, this.camera.zoom);
        }
    }

    restoreCameraTransform(canvasId) {
        const ctx = this.contexts[canvasId];
        if (ctx) {
            ctx.restore();
        }
    }

    processEvents(deltaTime) {
        if (this.frameCount % 600 === 0) {
            this.triggerRandomMovement();
        }
        
        if (this.frameCount % 1800 === 0) {
            this.simulateTruckArrival();
        }
    }

    triggerRandomMovement() {
        const availableItems = this.inventoryManager.getItemsByStatus('available');
        if (availableItems.length > 0) {
            const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
            const canvas = this.canvases['entity-canvas'];
            
            if (canvas && randomItem) {
                const targetX = Math.random() * (canvas.width / this.camera.zoom - 100) + 50;
                const targetY = Math.random() * (canvas.height / this.camera.zoom - 100) + 100;
                
                randomItem.startMovement(targetX, targetY);
                this.addNotification(`AI: Optimizing ${randomItem.hardwareType} placement`, 'info');
            }
        }
    }

    simulateTruckArrival() {
        // Check if there are already active trucks
        const activeTrucks = this.entities.filter(e => e.entityType === 'truck' && !e.hasFinishedTask);
        if (activeTrucks.length > 0) {
            this.addNotification('🚛 Truck already at loading dock', 'warning');
            return;
        }

        // Create delivery truck arriving from off-screen
        const truck = new DeliveryTruck(-100, 180); // Start off-screen left
        
        // Add truck to simulation
        this.entities.push(truck);
        
        // Move truck to loading dock using enhanced movement
        if (truck.enhancedMovement && this.pathfindingSystem) {
            truck.enhancedMovement.startMovement(120, 180, this.pathfindingSystem);
        } else {
            // Fallback to basic movement with stopping mechanism
            truck.targetPosition = { x: 120, y: 180 };
            truck.moveTo(120, 180, truck.movementSpeed);
        }
        
        // Start unloading after arrival (enhanced movement will handle arrival detection)
        setTimeout(() => {
            if (!truck.isUnloading && !truck.hasFinishedTask) {
                truck.startUnloading();
            }
        }, 3000); // Give extra time for enhanced movement
        
        this.addNotification(`🚛 Delivery truck arriving with ${truck.manifest.length} items`, 'success');
    }

    getRandomTruckInterval() {
        // Random interval between 60 and 120 seconds
        return Math.random() * 60 + 60;
    }

    handleEvent(event) {
        // Add all events to planning visualization
        this.addPlanToVisualization(event);
        
        // Process different types of events
        switch (event.type) {
            case EVENT_TYPES.HARDWARE_FAILURE:
                this.handleHardwareFailure(event);
                break;
            case EVENT_TYPES.COMMISSIONING_REQUEST:
                this.handleCommissioningRequest(event);
                break;
            case EVENT_TYPES.EMERGENCY_REPLACEMENT:
                this.handleEmergencyReplacement(event);
                break;
            case EVENT_TYPES.CASCADE_FAILURE:
                this.handleCascadeFailure(event);
                break;
            default:
                // Generic event handling with priority
                this.addNotification(
                    `📅 ${event.title}`,
                    this.getNotificationTypeFromPriority(event.priority),
                    event.priority
                );
        }
    }

    handleHardwareFailure(event) {
        if (event.targetEntity) {
            event.targetEntity.status = 'failed';
            event.targetEntity.color = '#e74c3c'; // Red color for failed hardware
        }
        
        this.addNotification(
            `⚠️ FAILURE: ${event.title}`,
            'error'
        );

        // AI robot should respond to failures
        if (this.aiRobot) {
            this.aiRobot.addDecision({
                type: 'failure-response',
                target: event.targetEntity,
                action: 'Initiating replacement procedure',
                reasoning: `Critical hardware failure detected - scheduling immediate replacement`
            });
        }
    }

    handleCommissioningRequest(event) {
        this.addNotification(
            `🏗️ NEW PROJECT: ${event.title}`,
            'info'
        );

        // AI robot should start planning
        if (this.aiRobot) {
            this.aiRobot.addDecision({
                type: 'commissioning-planning',
                action: 'Analyzing parts requirements',
                reasoning: `Planning optimal parts allocation for ${event.title}`
            });
        }
    }

    handleEmergencyReplacement(event) {
        // Mark multiple systems as failed
        event.affectedSystems.forEach(system => {
            system.status = 'failed';
            system.color = '#c0392b'; // Dark red for emergency failures
        });

        this.addNotification(
            `🚨 EMERGENCY: ${event.title}`,
            'error'
        );

        // AI robot emergency response
        if (this.aiRobot) {
            this.aiRobot.addDecision({
                type: 'emergency-response',
                action: 'Activating emergency protocols',
                reasoning: `Cascade failure detected - ${event.affectedSystems.length} systems affected`
            });
        }
    }

    handleCascadeFailure(event) {
        // Mark all failed items with emergency status
        event.failedItems.forEach(item => {
            item.status = 'cascade-failed';
            item.color = '#8b0000'; // Dark red for cascade failures
            item.blinking = true; // Add visual indicator
        });

        // Emergency notification with special formatting
        this.addNotification(
            `🚨 CASCADE FAILURE! ${event.failedItems.length} systems down! ${event.cascadeReason}`,
            'emergency'
        );

        // Display cost impact
        this.addNotification(
            `💰 Estimated replacement cost: ${event.estimatedCost}`,
            'warning'
        );

        // AI robot emergency cascade response
        if (this.aiRobot) {
            this.aiRobot.addDecision({
                type: 'cascade-emergency',
                action: `Emergency stock allocation for ${event.failedItems.length} units`,
                reasoning: `${event.impactLevel} impact cascade failure - activating all emergency protocols`
            });

            // Add multiple emergency actions
            event.emergencyContacts.forEach(contact => {
                this.aiRobot.addDecision({
                    type: 'emergency-contact',
                    action: `Contacting ${contact}`,
                    reasoning: `Cascade failure requires immediate escalation`
                });
            });
        }

        // Trigger emergency stock depletion simulation
        this.triggerEmergencyStockAllocation(event);
    }

    triggerEmergencyStockAllocation(cascadeEvent) {
        // Simulate emergency stock usage
        const emergencyItems = cascadeEvent.failedItems.map(item => ({
            type: item.hardwareType,
            serialNumber: 'EMR-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
            status: 'emergency-deployment',
            deploymentTime: Date.now() + (Math.random() * 300000) // 0-5 minutes
        }));

        // Add visual indicators for emergency replacements
        emergencyItems.forEach((item, index) => {
            setTimeout(() => {
                this.addNotification(
                    `🔧 Emergency replacement ${item.serialNumber} deployed for ${item.type}`,
                    'success'
                );
            }, item.deploymentTime - Date.now());
        });

        console.log('🚨 Emergency stock allocation triggered:', emergencyItems);
    }

    getNotificationTypeFromPriority(priority) {
        switch (priority.urgency) {
            case 1: return 'info';      // Low priority
            case 2: return 'info';      // Medium priority  
            case 3: return 'warning';   // High priority
            case 4: return 'error';     // Critical priority
            case 5: return 'emergency'; // Emergency priority
            default: return 'info';
        }
    }

    playNotificationSound(type) {
        // Create audio context for notification sounds
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Different frequencies for different notification types
            switch (type) {
                case 'info':
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                    break;
                case 'success':
                    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
                    break;
                case 'warning':
                    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
                    break;
                case 'error':
                    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.15);
                    break;
                case 'emergency':
                    // Urgent alarm sound
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            const emergencyOsc = audioContext.createOscillator();
                            const emergencyGain = audioContext.createGain();
                            
                            emergencyOsc.connect(emergencyGain);
                            emergencyGain.connect(audioContext.destination);
                            
                            emergencyOsc.frequency.setValueAtTime(1000, audioContext.currentTime);
                            emergencyOsc.frequency.setValueAtTime(500, audioContext.currentTime + 0.1);
                            
                            emergencyGain.gain.setValueAtTime(0.3, audioContext.currentTime);
                            emergencyGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                            
                            emergencyOsc.start(audioContext.currentTime);
                            emergencyOsc.stop(audioContext.currentTime + 0.2);
                        }, i * 200);
                    }
                    return; // Exit early for emergency to prevent regular sound
            }
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            
        } catch (error) {
            console.warn('Audio notification failed:', error);
        }
    }

    addPlanToVisualization(event) {
        const activePlansContainer = document.getElementById('active-plans');
        if (!activePlansContainer) return;

        // Clear "No active plans" message
        if (activePlansContainer.children.length === 1 && 
            activePlansContainer.firstElementChild.textContent === 'No active plans') {
            activePlansContainer.innerHTML = '';
        }

        const planElement = document.createElement('div');
        planElement.className = `plan-item ${event.type.replace(/-/g, '')}`;
        planElement.id = `plan-${event.id}`;

        let planContent = '';

        if (event.type === EVENT_TYPES.COMMISSIONING_REQUEST) {
            const partsList = event.partsList.map(part => 
                `${part.quantity}x ${part.item}`
            ).slice(0, 3).join(', ') + (event.partsList.length > 3 ? '...' : '');

            planContent = `
                <div class="plan-title">🏗️ ${event.title}</div>
                <div class="plan-priority" style="color: ${event.priority.color}; font-size: 11px;">Priority: ${event.priority.name}</div>
                <div class="plan-status">Status: ${event.status.toUpperCase()}</div>
                <div class="plan-parts-list">Parts: ${partsList}</div>
                <div class="plan-cost">Cost: ${event.estimatedCost}</div>
                <div class="plan-action">AI Planning: Optimizing parts allocation...</div>
            `;
        } else if (event.type === EVENT_TYPES.HARDWARE_FAILURE) {
            planContent = `
                <div class="plan-title">⚠️ ${event.title}</div>
                <div class="plan-priority" style="color: ${event.priority.color}; font-size: 11px;">Priority: ${event.priority.name}</div>
                <div class="plan-status">Status: ${event.status.toUpperCase()}</div>
                <div class="plan-impact">Impact: ${event.impactLevel || 'Service degradation'}</div>
                <div class="plan-action">AI Response: Locating replacement hardware...</div>
            `;
        } else if (event.type === EVENT_TYPES.EMERGENCY_REPLACEMENT) {
            const affectedCount = event.affectedSystems ? event.affectedSystems.length : 1;
            planContent = `
                <div class="plan-title" style="color: #ff6b6b;">🚨 ${event.title}</div>
                <div class="plan-priority" style="color: ${event.priority.color}; font-size: 11px; font-weight: bold;">EMERGENCY PRIORITY</div>
                <div class="plan-status" style="color: #ff6b6b;">EMERGENCY - ${affectedCount} systems affected</div>
                <div class="plan-eta">ETA: ${event.estimatedCompletionTime || '15 minutes'}</div>
                <div class="plan-action">AI Protocol: Emergency stock allocation in progress...</div>
            `;
        } else {
            planContent = `
                <div class="plan-title">📅 ${event.title}</div>
                <div class="plan-status">Status: ${event.status.toUpperCase()}</div>
                <div class="plan-action">AI Analysis: Evaluating optimal response...</div>
            `;
        }

        planElement.innerHTML = planContent;
        activePlansContainer.appendChild(planElement);

        // Auto-remove completed plans after some time
        setTimeout(() => {
            this.removePlanFromVisualization(event.id);
        }, 30000); // Remove after 30 seconds
    }

    removePlanFromVisualization(eventId) {
        const planElement = document.getElementById(`plan-${eventId}`);
        if (planElement) {
            planElement.style.opacity = '0';
            planElement.style.transform = 'translateX(-100%)';
            
            setTimeout(() => {
                planElement.remove();
                
                // Show "No active plans" if container is empty
                const activePlansContainer = document.getElementById('active-plans');
                if (activePlansContainer && activePlansContainer.children.length === 0) {
                    activePlansContainer.innerHTML = '<div class="plan-item">No active plans</div>';
                }
            }, 500);
        }
    }

    updatePlanVisualization(eventId, newStatus) {
        const planElement = document.getElementById(`plan-${eventId}`);
        if (planElement) {
            const statusElement = planElement.querySelector('.plan-status');
            if (statusElement) {
                statusElement.textContent = `Status: ${newStatus.toUpperCase()}`;
            }
        }
    }



    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        const debugBtn = document.getElementById('debug-mode-btn');
        if (debugBtn) {
            debugBtn.textContent = this.debugMode ? '🔍 Debug (ON)' : '🔍 Debug';
        }
        this.addNotification(`Debug mode ${this.debugMode ? 'enabled' : 'disabled'}`, 'info');
    }

    selectHardwareItem(item) {
        this.hardwareItems.forEach(hw => hw.deselect());
        item.select();
        this.selectedItem = item;
        this.showHardwareDetails(item);
    }

    deselectAll() {
        this.hardwareItems.forEach(hw => hw.deselect());
        this.selectedItem = null;
        this.hideHardwareDetails();
    }

    showHardwareDetails(item) {
        const thoughtBubble = document.getElementById('ai-thought-bubble');
        const bubbleContent = document.querySelector('.bubble-content');
        
        if (thoughtBubble && bubbleContent) {
            bubbleContent.innerHTML = `
                <strong>${item.hardwareType}</strong><br>
                Serial: ${item.serialNumber}<br>
                Status: ${item.status}<br>
                Location: ${item.location}<br>
                Value: $${item.value}
            `;
            thoughtBubble.classList.remove('hidden');
        }
    }

    hideHardwareDetails() {
        const thoughtBubble = document.getElementById('ai-thought-bubble');
        if (thoughtBubble) {
            thoughtBubble.classList.add('hidden');
        }
    }

    showAIRobotDetails() {
        if (!this.aiRobot) return;
        
        const robotDecision = this.aiRobot.getCurrentDecision();
        const totalItems = this.hardwareItems.length;
        
        const thoughtBubble = document.getElementById('ai-thought-bubble');
        const bubbleContent = document.querySelector('.bubble-content');
        
        if (thoughtBubble && bubbleContent) {
            bubbleContent.innerHTML = `
                <strong>🤖 AI Robot Status</strong><br>
                <strong>Current Task:</strong> ${this.aiRobot.currentTask}<br>
                <strong>Location:</strong> ${this.aiRobot.targetLocation || 'Patrolling'}<br>
                <strong>Status:</strong> ${this.aiRobot.isMoving ? 'Moving' : 'Analyzing'}<br>
                <strong>Last Decision:</strong> ${robotDecision}<br>
                <strong>Inventory Count:</strong> ${totalItems} items<br>
            `;
            thoughtBubble.classList.remove('hidden');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                thoughtBubble.classList.add('hidden');
            }, 5000);
        }
        
        this.addNotification('Clicked AI Robot - showing detailed analysis', 'info');
    }

    showDecisionExplanation(decision) {
        const thoughtBubble = document.getElementById('ai-thought-bubble');
        const bubbleContent = document.querySelector('.bubble-content');
        
        if (thoughtBubble && bubbleContent) {
            const impact = decision.impact || { efficiency: 0, reliability: 0, cost: 0 };
            
            bubbleContent.innerHTML = `
                <strong>🧠 Decision Analysis</strong><br>
                <strong>Task:</strong> ${decision.type}<br>
                <strong>Result:</strong> ${decision.result}<br>
                <strong>Duration:</strong> ${((decision.duration || 0) / 1000).toFixed(1)}s<br>
                <strong>Reasoning:</strong><br>
                <span style="font-style: italic; font-size: 0.9em;">
                    ${decision.reasoning || 'No reasoning recorded'}
                </span><br>
                <strong>Impact:</strong><br>
                <span style="font-size: 0.85em;">
                    Efficiency: ${impact.efficiency > 0 ? '+' : ''}${impact.efficiency}% |
                    Reliability: ${impact.reliability > 0 ? '+' : ''}${impact.reliability}% |
                    Cost: ${impact.cost > 0 ? '+' : ''}${impact.cost}%
                </span>
            `;
            thoughtBubble.classList.remove('hidden');
            
            // Auto-hide after 8 seconds
            setTimeout(() => {
                thoughtBubble.classList.add('hidden');
            }, 8000);
        }
        
        this.addNotification(`Showing explanation for: ${decision.type}`, 'info');
    }

    createRandomHardware(type = null) {
        const canvas = this.canvases['entity-canvas'];
        if (!canvas) return;

        const x = Math.random() * (canvas.width / this.camera.zoom - 100) + 50;
        const y = Math.random() * (canvas.height / this.camera.zoom - 100) + 100;

        const hardware = type ? 
            HardwareFactory.createHardware(type, x, y) : 
            HardwareFactory.generateRandomHardware(x, y);
        
        this.hardwareItems.push(hardware);
        this.entities.push(hardware);
        this.inventoryManager.addItem(hardware);
        
        this.addNotification(`Created ${hardware.hardwareType} (${hardware.serialNumber})`, 'success');
        this.updateEntityCount();
    }

    demonstrateMovement() {
        if (!this.selectedItem) return;

        const canvas = this.canvases['entity-canvas'];
        if (!canvas) return;

        const targetX = Math.random() * (canvas.width / this.camera.zoom - 100) + 50;
        const targetY = Math.random() * (canvas.height / this.camera.zoom - 100) + 100;

        this.selectedItem.startMovement(targetX, targetY);
        this.addNotification(`Moving ${this.selectedItem.hardwareType} to new location`, 'info');
    }

    deleteSelectedItem() {
        if (!this.selectedItem) return;

        const item = this.selectedItem;
        
        const entityIndex = this.entities.indexOf(item);
        if (entityIndex >= 0) {
            this.entities.splice(entityIndex, 1);
        }
        
        const hardwareIndex = this.hardwareItems.indexOf(item);
        if (hardwareIndex >= 0) {
            this.hardwareItems.splice(hardwareIndex, 1);
        }
        
        this.inventoryManager.removeItem(item.id);
        
        this.addNotification(`Deleted ${item.hardwareType} (${item.serialNumber})`, 'warning');
        this.deselectAll();
        this.updateEntityCount();
    }

    addNotification(message, type = 'info', priority = null) {
        const notificationList = document.getElementById('notification-list');
        if (!notificationList) return;

        // Play notification sound based on type
        this.playNotificationSound(type);

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Add priority indicator
        const priorityIcon = this.getPriorityIcon(type);
        const timestamp = new Date().toLocaleTimeString();
        
        // Create notification content with better structure
        notification.innerHTML = `
            <div class="notification-header">
                <span class="priority-icon">${priorityIcon}</span>
                <span class="timestamp">${timestamp}</span>
                ${type === 'emergency' ? '<span class="emergency-badge">EMERGENCY</span>' : ''}
            </div>
            <div class="notification-content">${message}</div>
        `;
        
        // Add special effects for critical notifications
        if (type === 'emergency' || type === 'error') {
            notification.style.animation = 'notificationSlideIn 0.5s ease-out, notificationHighlight 2s ease-in-out';
        } else {
            notification.style.animation = 'notificationSlideIn 0.3s ease-out';
        }
        
        notificationList.insertBefore(notification, notificationList.firstChild);
        
        // Keep only last 15 notifications (increased for better history)
        while (notificationList.children.length > 15) {
            notificationList.removeChild(notificationList.lastChild);
        }

        // Auto-remove non-critical notifications after 10 seconds
        if (type !== 'emergency' && type !== 'error') {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            }, 10000);
        }
    }

    getPriorityIcon(type) {
        switch (type) {
            case 'emergency': return '🚨';
            case 'error': return '⚠️';
            case 'warning': return '⚡';
            case 'success': return '✅';
            case 'info':
            default: return 'ℹ️';
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const progressBar = document.getElementById('loading-progress');
        const statusElement = document.getElementById('loading-status');
        
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }

        let progress = 0;
        const loadingSteps = [
            'Initializing canvas layers...',
            'Setting up hardware entities...',
            'Loading inventory management...',
            'Preparing interaction systems...',
            'Finalizing demo setup...'
        ];

        const loadingInterval = setInterval(() => {
            progress += 20;
            
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            
            if (statusElement && loadingSteps[progress / 20 - 1]) {
                statusElement.textContent = loadingSteps[progress / 20 - 1];
            }
            
            if (progress >= 100) {
                clearInterval(loadingInterval);
                setTimeout(() => {
                    if (loadingScreen) {
                        loadingScreen.classList.add('hidden');
                    }
                    this.addNotification('Simulation ready!', 'success');
                    console.log('✅ Simulation fully initialized');
                }, 500);
            }
        }, 300);
    }

}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM loaded, starting simulation...');
    window.simulation = new DataCenterSimulation();
});