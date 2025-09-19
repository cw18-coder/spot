/**
 * Interaction Zones Module
 * Defines areas where hardware can be placed, stored, and interacted with
 */

/**
 * Base Interaction Zone Class
 * Foundation for all interactive areas in the simulation
 */
class InteractionZone {
    constructor(x, y, width, height, type, properties = {}) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.position = { x, y };
        this.size = { width, height };
        this.type = type;
        this.properties = properties;
        
        // Zone state
        this.isActive = true;
        this.isHighlighted = false;
        this.isOccupied = false;
        this.capacity = properties.capacity || 1;
        this.occupants = [];
        
        // Visual properties
        this.color = properties.color || '#ffffff';
        this.borderColor = properties.borderColor || '#00ff88';
        this.highlightColor = '#ffff00';
        this.occupiedColor = '#ff6b6b';
        this.opacity = 0.3;
        this.borderWidth = 2;
        
        // Interaction properties
        this.acceptedTypes = properties.acceptedTypes || [];
        this.restrictions = properties.restrictions || {};
        
        // Animation
        this.animationFrame = 0;
        this.pulseSpeed = 2;
        
        console.log(`🎯 Interaction zone created: ${this.type} (${this.id})`);
    }

    update(deltaTime) {
        this.animationFrame += deltaTime * this.pulseSpeed;
        
        // Update occupied status
        this.isOccupied = this.occupants.length > 0;
        
        // Clean up occupants that might have moved away
        this.occupants = this.occupants.filter(item => this.contains(item));
    }

    render(ctx) {
        if (!this.isActive) return;

        ctx.save();
        
        // Calculate dynamic opacity for pulse effect
        let currentOpacity = this.opacity;
        if (this.isHighlighted) {
            currentOpacity += 0.2 * Math.sin(this.animationFrame);
        }
        
        // Zone background
        let fillColor = this.color;
        if (this.isHighlighted) {
            fillColor = this.highlightColor;
        } else if (this.isOccupied && this.capacity <= this.occupants.length) {
            fillColor = this.occupiedColor;
        }
        
        ctx.fillStyle = fillColor + Math.floor(currentOpacity * 255).toString(16).padStart(2, '0');
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
        
        // Zone border
        ctx.strokeStyle = this.isHighlighted ? this.highlightColor : this.borderColor;
        ctx.lineWidth = this.borderWidth;
        ctx.setLineDash(this.isHighlighted ? [5, 5] : []);
        ctx.strokeRect(this.position.x, this.position.y, this.size.width, this.size.height);
        ctx.setLineDash([]);
        
        // Capacity indicator
        this.renderCapacityIndicator(ctx);
        
        // Zone label
        this.renderLabel(ctx);
        
        ctx.restore();
    }

    renderCapacityIndicator(ctx) {
        if (this.capacity > 1) {
            const indicatorX = this.position.x + this.size.width - 25;
            const indicatorY = this.position.y + 5;
            
            // Background circle
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(indicatorX, indicatorY, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // Capacity text - increased size
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${this.occupants.length}/${this.capacity}`, indicatorX, indicatorY);
        }
    }

    renderLabel(ctx) {
        if (this.properties.label) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(
                this.properties.label,
                this.position.x + this.size.width / 2,
                this.position.y + 5
            );
        }
    }

    // Interaction methods
    contains(item) {
        const itemCenterX = item.position.x + item.size.width / 2;
        const itemCenterY = item.position.y + item.size.height / 2;
        
        return itemCenterX >= this.position.x &&
               itemCenterX <= this.position.x + this.size.width &&
               itemCenterY >= this.position.y &&
               itemCenterY <= this.position.y + this.size.height;
    }

    canAccept(item) {
        // Check capacity
        if (this.occupants.length >= this.capacity) {
            return false;
        }
        
        // Check accepted types
        if (this.acceptedTypes.length > 0 && !this.acceptedTypes.includes(item.hardwareType)) {
            return false;
        }
        
        // Check restrictions
        if (this.restrictions.minValue && item.value < this.restrictions.minValue) {
            return false;
        }
        
        if (this.restrictions.maxValue && item.value > this.restrictions.maxValue) {
            return false;
        }
        
        if (this.restrictions.requiredStatus && item.status !== this.restrictions.requiredStatus) {
            return false;
        }
        
        return true;
    }

    addItem(item) {
        if (this.canAccept(item) && !this.occupants.includes(item)) {
            this.occupants.push(item);
            this.onItemAdded(item);
            return true;
        }
        return false;
    }

    removeItem(item) {
        const index = this.occupants.indexOf(item);
        if (index >= 0) {
            this.occupants.splice(index, 1);
            this.onItemRemoved(item);
            return true;
        }
        return false;
    }

    // Event handlers (override in subclasses)
    onItemAdded(item) {
        console.log(`📦 Item added to ${this.type}: ${item.hardwareType}`);
    }

    onItemRemoved(item) {
        console.log(`📦 Item removed from ${this.type}: ${item.hardwareType}`);
    }

    highlight() {
        this.isHighlighted = true;
    }

    unhighlight() {
        this.isHighlighted = false;
    }

    activate() {
        this.isActive = true;
    }

    deactivate() {
        this.isActive = false;
    }

    isEmpty() {
        return this.occupants.length === 0;
    }

    isFull() {
        return this.occupants.length >= this.capacity;
    }

    getOccupancy() {
        return this.occupants.length / this.capacity;
    }
}

/**
 * Storage Bin Zone
 * Represents a storage bin in the storage room
 */
class StorageBin extends InteractionZone {
    constructor(x, y, width, height, binId, properties = {}) {
        const defaultProps = {
            label: `Bin ${binId}`,
            capacity: 20,
            color: '#4ecdc4',
            borderColor: '#2ba49c',
            acceptedTypes: []
        };
        
        super(x, y, width, height, 'storage-bin', { ...defaultProps, ...properties });
        
        this.binId = binId;
        this.optimizationLevel = 0; // 0-100, set by AI agent
        this.lastAccessed = new Date();
        this.accessFrequency = 0;
        this.recommendedTypes = [];
    }

    onItemAdded(item) {
        super.onItemAdded(item);
        this.lastAccessed = new Date();
        this.accessFrequency++;
        
        // Update item location
        item.location = 'storage-room';
        item.storageLocation = this.binId;
    }

    onItemRemoved(item) {
        super.onItemRemoved(item);
        this.lastAccessed = new Date();
        this.accessFrequency++;
    }

    setOptimizationLevel(level) {
        this.optimizationLevel = Math.max(0, Math.min(100, level));
        
        // Update visual properties based on optimization
        const efficiency = this.optimizationLevel / 100;
        this.borderColor = `rgb(${Math.floor(255 * (1 - efficiency))}, ${Math.floor(255 * efficiency)}, 100)`;
    }

    setRecommendedTypes(types) {
        this.recommendedTypes = types;
        this.acceptedTypes = types.length > 0 ? types : [];
    }

    getAccessRate() {
        const daysSinceCreation = (Date.now() - this.created) / (1000 * 60 * 60 * 24);
        return this.accessFrequency / Math.max(1, daysSinceCreation);
    }
}

/**
 * Loading Dock Zone
 * Represents a truck loading/unloading area
 */
class LoadingDock extends InteractionZone {
    constructor(x, y, width, height, dockNumber, properties = {}) {
        const defaultProps = {
            label: `Dock ${dockNumber}`,
            capacity: 50,
            color: '#ff6b6b',
            borderColor: '#e74c3c',
            acceptedTypes: []
        };
        
        super(x, y, width, height, 'loading-dock', { ...defaultProps, ...properties });
        
        this.dockNumber = dockNumber;
        this.truckPresent = false;
        this.operationInProgress = false;
        this.operationType = null; // 'loading' or 'unloading'
        this.manifest = null;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Simulate truck operations
        if (this.operationInProgress) {
            this.pulseSpeed = 4; // Faster pulse during operations
        } else {
            this.pulseSpeed = 2;
        }
    }

    startUnloading(manifest) {
        this.operationInProgress = true;
        this.operationType = 'unloading';
        this.manifest = manifest;
        this.truckPresent = true;
        
        console.log(`🚛 Started unloading at Dock ${this.dockNumber}`);
    }

    startLoading(manifest) {
        this.operationInProgress = true;
        this.operationType = 'loading';
        this.manifest = manifest;
        this.truckPresent = true;
        
        console.log(`🚛 Started loading at Dock ${this.dockNumber}`);
    }

    completeOperation() {
        this.operationInProgress = false;
        this.operationType = null;
        this.manifest = null;
        this.truckPresent = false;
        
        console.log(`✅ Operation completed at Dock ${this.dockNumber}`);
    }

    renderLabel(ctx) {
        super.renderLabel(ctx);
        
        // Operation status
        if (this.operationInProgress) {
            ctx.fillStyle = '#ffff00';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                this.operationType.toUpperCase(),
                this.position.x + this.size.width / 2,
                this.position.y + this.size.height - 15
            );
        }
    }
}

/**
 * Server Rack Slot Zone
 * Represents individual slots in server racks
 */
class ServerRackSlot extends InteractionZone {
    constructor(x, y, width, height, rackId, slotNumber, properties = {}) {
        const defaultProps = {
            label: `R${rackId}-${slotNumber}`,
            capacity: 1,
            color: '#45b7d1',
            borderColor: '#2980b9',
            acceptedTypes: []
        };
        
        super(x, y, width, height, 'rack-slot', { ...defaultProps, ...properties });
        
        this.rackId = rackId;
        this.slotNumber = slotNumber;
        this.powerStatus = 'off'; // off, on, maintenance
        this.healthStatus = 'healthy'; // healthy, warning, critical, failed
        this.temperature = 22; // Celsius
        this.utilization = 0; // 0-100%
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Simulate hardware health monitoring
        if (this.occupants.length > 0) {
            this.updateHealthStatus();
            this.updateTemperature();
        }
    }

    updateHealthStatus() {
        // Simulate occasional health issues
        if (Math.random() < 0.001) { // 0.1% chance per update
            const statuses = ['healthy', 'warning', 'critical'];
            this.healthStatus = statuses[Math.floor(Math.random() * statuses.length)];
        }
    }

    updateTemperature() {
        // Simulate temperature fluctuations
        const baseTemp = 22;
        const variation = (Math.random() - 0.5) * 4;
        this.temperature = baseTemp + variation + (this.utilization * 0.3);
    }

    render(ctx) {
        super.render(ctx);
        
        // Health status indicator
        if (this.occupants.length > 0) {
            const healthColors = {
                'healthy': '#00ff88',
                'warning': '#ffaa00',
                'critical': '#ff6b6b',
                'failed': '#ff0000'
            };
            
            ctx.fillStyle = healthColors[this.healthStatus];
            ctx.fillRect(
                this.position.x + this.size.width - 8,
                this.position.y + 2,
                6,
                6
            );
        }
    }

    onItemAdded(item) {
        super.onItemAdded(item);
        item.install(`R${this.rackId}-${this.slotNumber}`);
        this.powerStatus = 'on';
        this.utilization = 75 + Math.random() * 25; // 75-100%
    }

    onItemRemoved(item) {
        super.onItemRemoved(item);
        item.uninstall();
        this.powerStatus = 'off';
        this.utilization = 0;
        this.healthStatus = 'healthy';
    }
}

/**
 * Quality Control Station
 * Special zone for hardware inspection
 */
class QualityControlStation extends InteractionZone {
    constructor(x, y, width, height, properties = {}) {
        const defaultProps = {
            label: 'QC Station',
            capacity: 5,
            color: '#ffc107',
            borderColor: '#f39c12',
            acceptedTypes: []
        };
        
        super(x, y, width, height, 'qc-station', { ...defaultProps, ...properties });
        
        this.isInspecting = false;
        this.inspectionQueue = [];
        this.inspectionTime = 5; // seconds per item
        this.currentInspection = null;
        this.inspectionTimer = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Process inspection queue
        if (!this.isInspecting && this.inspectionQueue.length > 0) {
            this.startInspection(this.inspectionQueue.shift());
        }
        
        if (this.isInspecting) {
            this.inspectionTimer -= deltaTime;
            if (this.inspectionTimer <= 0) {
                this.completeInspection();
            }
        }
    }

    onItemAdded(item) {
        super.onItemAdded(item);
        this.inspectionQueue.push(item);
    }

    startInspection(item) {
        this.isInspecting = true;
        this.currentInspection = item;
        this.inspectionTimer = this.inspectionTime;
        
        console.log(`🔍 Started inspecting ${item.hardwareType} (${item.serialNumber})`);
    }

    completeInspection() {
        if (this.currentInspection) {
            // Simulate inspection result
            const passRate = 0.95;
            const passed = Math.random() < passRate;
            
            if (passed) {
                this.currentInspection.condition = 'verified';
                console.log(`✅ Inspection passed: ${this.currentInspection.serialNumber}`);
            } else {
                this.currentInspection.condition = 'defective';
                console.log(`❌ Inspection failed: ${this.currentInspection.serialNumber}`);
            }
        }
        
        this.isInspecting = false;
        this.currentInspection = null;
        this.inspectionTimer = 0;
    }

    render(ctx) {
        if (!this.isActive) return;

        ctx.save();
        
        // Calculate dynamic opacity for pulse effect
        let currentOpacity = this.opacity;
        if (this.isHighlighted) {
            currentOpacity += 0.2 * Math.sin(this.animationFrame);
        }
        
        // Zone background
        let fillColor = this.color;
        if (this.isHighlighted) {
            fillColor = this.highlightColor;
        } else if (this.isOccupied && this.capacity <= this.occupants.length) {
            fillColor = this.occupiedColor;
        }
        
        ctx.fillStyle = fillColor + Math.floor(currentOpacity * 255).toString(16).padStart(2, '0');
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
        
        // Zone border
        ctx.strokeStyle = this.isHighlighted ? this.highlightColor : this.borderColor;
        ctx.lineWidth = this.borderWidth;
        ctx.setLineDash(this.isHighlighted ? [5, 5] : []);
        ctx.strokeRect(this.position.x, this.position.y, this.size.width, this.size.height);
        ctx.setLineDash([]);
        
        // Capacity indicator
        this.renderCapacityIndicator(ctx);
        
        // Centered QC Station label
        ctx.fillStyle = this.borderColor;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            'QC STATION',
            this.position.x + this.size.width / 2,
            this.position.y + this.size.height / 2 + 5
        );
        
        // Inspection status
        if (this.isInspecting) {
            ctx.fillStyle = '#ffff00';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                'INSPECTING',
                this.position.x + this.size.width / 2,
                this.position.y + this.size.height - 25
            );
            
            // Progress bar
            const progressWidth = this.size.width - 40;
            const progress = 1 - (this.inspectionTimer / this.inspectionTime);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(this.position.x + 20, this.position.y + this.size.height - 15, progressWidth, 4);
            
            ctx.fillStyle = '#00ff88';
            ctx.fillRect(this.position.x + 20, this.position.y + this.size.height - 15, progressWidth * progress, 4);
        }
        
        // Queue indicator
        if (this.inspectionQueue.length > 0) {
            ctx.fillStyle = '#ff6b6b';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(
                `Queue: ${this.inspectionQueue.length}`,
                this.position.x + this.size.width - 10,
                this.position.y + 20
            );
        }
        
        ctx.restore();
    }

    renderLabel(ctx) {
        // Custom render method above handles the label
        // Keep this method for compatibility but don't call super
    }
}

/**
 * Zone Manager
 * Manages all interaction zones in the simulation
 */
class ZoneManager {
    constructor() {
        this.zones = new Map();
        this.zonesByType = new Map();
        this.activeDropZone = null;
        this.draggedItem = null;
    }

    addZone(zone) {
        this.zones.set(zone.id, zone);
        
        if (!this.zonesByType.has(zone.type)) {
            this.zonesByType.set(zone.type, []);
        }
        this.zonesByType.get(zone.type).push(zone);
        
        console.log(`🎯 Zone added: ${zone.type} (${zone.id})`);
    }

    removeZone(zoneId) {
        const zone = this.zones.get(zoneId);
        if (zone) {
            const typeZones = this.zonesByType.get(zone.type);
            if (typeZones) {
                const index = typeZones.indexOf(zone);
                if (index >= 0) {
                    typeZones.splice(index, 1);
                }
            }
            this.zones.delete(zoneId);
            console.log(`🎯 Zone removed: ${zone.type} (${zoneId})`);
        }
    }

    update(deltaTime) {
        this.zones.forEach(zone => zone.update(deltaTime));
    }

    render(ctx) {
        this.zones.forEach(zone => zone.render(ctx));
    }

    getZonesByType(type) {
        return this.zonesByType.get(type) || [];
    }

    getZoneAt(x, y) {
        for (const zone of this.zones.values()) {
            if (x >= zone.position.x &&
                x <= zone.position.x + zone.size.width &&
                y >= zone.position.y &&
                y <= zone.position.y + zone.size.height) {
                return zone;
            }
        }
        return null;
    }

    findCompatibleZones(item) {
        return Array.from(this.zones.values()).filter(zone => zone.canAccept(item));
    }

    startItemDrag(item) {
        this.draggedItem = item;
        
        // Highlight compatible zones
        this.findCompatibleZones(item).forEach(zone => {
            zone.highlight();
        });
    }

    updateItemDrag(x, y) {
        if (!this.draggedItem) return;
        
        const zone = this.getZoneAt(x, y);
        
        if (this.activeDropZone && this.activeDropZone !== zone) {
            this.activeDropZone.unhighlight();
        }
        
        if (zone && zone.canAccept(this.draggedItem)) {
            this.activeDropZone = zone;
            zone.highlight();
        } else {
            this.activeDropZone = null;
        }
    }

    endItemDrag() {
        if (!this.draggedItem) return;
        
        let success = false;
        
        if (this.activeDropZone) {
            success = this.activeDropZone.addItem(this.draggedItem);
            if (success) {
                console.log(`📦 Item dropped in ${this.activeDropZone.type}`);
            }
        }
        
        // Clear highlights
        this.zones.forEach(zone => zone.unhighlight());
        
        this.draggedItem = null;
        this.activeDropZone = null;
        
        return success;
    }

    getZoneStats() {
        const stats = {
            totalZones: this.zones.size,
            byType: {},
            occupancy: {
                total: 0,
                occupied: 0,
                full: 0
            }
        };
        
        this.zones.forEach(zone => {
            // By type
            stats.byType[zone.type] = (stats.byType[zone.type] || 0) + 1;
            
            // Occupancy
            stats.occupancy.total++;
            if (zone.occupants.length > 0) {
                stats.occupancy.occupied++;
            }
            if (zone.isFull()) {
                stats.occupancy.full++;
            }
        });
        
        return stats;
    }

    getAllZones() {
        return Array.from(this.zones.values());
    }

    getZone(id) {
        return this.zones.get(id);
    }
}

/**
 * Recycle Bin Zone
 * Large rectangular bin for recycled and failed hardware
 * Spans across storage room and server floor areas
 */
class RecycleBinZone extends InteractionZone {
    constructor() {
        // Position will be calculated based on existing zones
        super(0, 0, 0, 0, 'recycle-bin', {
            capacity: 100,
            color: '#ff6b6b',
            borderColor: '#cc0000',
            label: '♻️ RECYCLE BIN',
            acceptedTypes: ['all'] // Accepts all hardware types
        });
        
        this.icon = '♻️';
        this.isAutoPositioned = true;
        
        console.log('♻️ Recycle Bin Zone created');
    }

    /**
     * Position the recycle bin based on existing storage and server zones
     */
    autoPosition(zoneManager) {
        const allZones = zoneManager.getAllZones();
        console.log('♻️ AutoPosition: Found', allZones.length, 'total zones');
        console.log('♻️ AutoPosition: All zone types:', allZones.map(z => `${z.type} (${z.id})`));
        
        const storageZones = allZones.filter(z => z.type === 'storage-bin');
        const serverZones = allZones.filter(z => z.type === 'rack-slot');
        
        console.log('♻️ AutoPosition: Storage zones:', storageZones.length, 'Server zones:', serverZones.length);
        
        if (storageZones.length === 0 || serverZones.length === 0) {
            console.warn('♻️ Cannot position recycle bin - missing storage or server zones');
            console.warn('♻️ Available zone types:', allZones.map(z => z.type));
            // Try to position anyway at bottom of canvas
            this.position = { x: 50, y: 700 };
            this.size = { width: 600, height: 80 };
            console.log('♻️ Fallback positioning at (50, 700)');
            return;
        }

        // Calculate bounding box for all storage and server zones
        const combinedZones = [...storageZones, ...serverZones];
        const minX = Math.min(...combinedZones.map(z => z.position.x));
        const maxX = Math.max(...combinedZones.map(z => z.position.x + z.size.width));
        const maxY = Math.max(...combinedZones.map(z => z.position.y + z.size.height));
        
        // Position below the zones with larger margin to avoid QC station
        this.position = { x: minX, y: maxY + 180 };
        this.size = { width: maxX - minX, height: 80 };
        
        console.log(`♻️ Recycle Bin positioned at (${this.position.x}, ${this.position.y}) with size ${this.size.width}x${this.size.height}`);
    }

    render(ctx) {
        if (!this.isActive) {
            console.warn('♻️ Recycle bin not rendering - not active');
            return;
        }
        
        if (this.size.width === 0) {
            console.warn('♻️ Recycle bin not rendering - size is 0. Position:', this.position, 'Size:', this.size);
            return;
        }
        
        console.log('♻️ Rendering recycle bin at', this.position, 'with size', this.size);

        ctx.save();
        
        // Calculate dynamic opacity for pulse effect if highlighted
        let currentOpacity = this.opacity;
        if (this.isHighlighted) {
            currentOpacity += 0.2 * Math.sin(this.animationFrame);
        }
        
        // Draw bin background with semi-transparency
        ctx.fillStyle = this.color + Math.floor(currentOpacity * 255).toString(16).padStart(2, '0');
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
        
        // Draw dashed border for recycle bin
        ctx.strokeStyle = this.isHighlighted ? this.highlightColor : this.borderColor;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(this.position.x, this.position.y, this.size.width, this.size.height);
        ctx.setLineDash([]);
        
        // Draw recycle icon and label in center
        ctx.fillStyle = this.borderColor;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            this.properties.label, 
            this.position.x + this.size.width / 2, 
            this.position.y + this.size.height / 2 + 6
        );
        
        // Draw capacity indicator in corner
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(
            `${this.occupants.length}/${this.capacity}`, 
            this.position.x + this.size.width - 10, 
            this.position.y + 20
        );
        
        // Draw warning stripes if nearly full
        if (this.occupants.length / this.capacity > 0.8) {
            this.drawWarningStripes(ctx);
        }
        
        ctx.restore();
    }

    /**
     * Draw warning stripes when bin is nearly full
     */
    drawWarningStripes(ctx) {
        ctx.save();
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        // Draw diagonal warning lines
        for (let i = 0; i < 3; i++) {
            const offset = i * 20;
            ctx.beginPath();
            ctx.moveTo(this.position.x + offset, this.position.y);
            ctx.lineTo(this.position.x + offset + 20, this.position.y + 20);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    /**
     * Override canAccept to accept all hardware types for recycling
     */
    canAccept(item) {
        return this.occupants.length < this.capacity;
    }

    /**
     * Override onItemAdded for recycling-specific behavior
     */
    onItemAdded(item) {
        super.onItemAdded(item);
        
        // Mark item as recycled
        item.location = 'recycle-area';
        item.status = 'recycled';
        item.recycleTime = Date.now();
        
        console.log(`♻️ ${item.hardwareType} added to recycle bin - Status: recycled`);
        
        // Trigger recycling process animation or effects here if needed
        this.triggerRecyclingEffect(item);
    }

    /**
     * Trigger visual effects for recycling process
     */
    triggerRecyclingEffect(item) {
        // Add sparkle effect or animation to show item being recycled
        // This could integrate with a particle system if available
        console.log(`✨ Recycling effect triggered for ${item.hardwareType}`);
    }
}

// Make classes available globally for browser environment
window.InteractionZone = InteractionZone;
window.StorageBin = StorageBin;
window.LoadingDock = LoadingDock;
window.ServerRackSlot = ServerRackSlot;
window.QualityControlStation = QualityControlStation;
window.RecycleBinZone = RecycleBinZone;
window.ZoneManager = ZoneManager;