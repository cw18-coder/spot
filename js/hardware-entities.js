/**
 * Hardware Entities Module
 * Defines all hardware types with their properties, behaviors, and visual representations
 */

/**
 * Base Entity Class
 * Foundation for all moving objects in the simulation
 */
class Entity {
    constructor(x = 0, y = 0) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.position = { x, y };
        this.velocity = { x: 0, y: 0 };
        this.size = { width: 20, height: 20 };
        this.color = '#00ff88';
        this.visible = true;
        this.type = 'entity';
        this.targetPosition = null; // For movement completion detection
    }

    update(deltaTime) {
        // Update position first
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        
        // Check if we've reached our target position
        if (this.targetPosition && (this.velocity.x !== 0 || this.velocity.y !== 0)) {
            const distance = Math.sqrt(
                (this.targetPosition.x - this.position.x) ** 2 + 
                (this.targetPosition.y - this.position.y) ** 2
            );
            if (distance <= 5) {
                this.position.x = this.targetPosition.x;
                this.position.y = this.targetPosition.y;
                this.stop();
                this.targetPosition = null;
            }
        }
        
        // Strict boundary checking to prevent items from flying off screen
        const canvas = document.getElementById('entity-canvas');
        if (canvas) {
            const margin = 10;
            this.position.x = Math.max(margin, Math.min(canvas.width - this.size.width - margin, this.position.x));
            this.position.y = Math.max(margin, Math.min(canvas.height - this.size.height - margin, this.position.y));
            
            // If position was corrected, stop movement to prevent continuous boundary violations
            if (this.position.x <= margin || this.position.x >= canvas.width - this.size.width - margin ||
                this.position.y <= margin || this.position.y >= canvas.height - this.size.height - margin) {
                this.stop();
                this.targetPosition = null;
                console.warn(`⚠️ Item ${this.hardwareType || this.type} reached boundary, movement stopped`);
            }
        }
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.type, this.position.x + this.size.width / 2, this.position.y + this.size.height / 2 + 3);
    }

    moveTo(x, y, speed = 100) {
        const distance = Math.sqrt((x - this.position.x) ** 2 + (y - this.position.y) ** 2);
        if (distance > 5) { // Only move if not close enough
            this.velocity.x = ((x - this.position.x) / distance) * speed;
            this.velocity.y = ((y - this.position.y) / distance) * speed;
            this.targetPosition = { x, y }; // Store target for arrival detection
        } else {
            this.stop(); // Stop if close enough to target
        }
    }

    stop() {
        this.velocity.x = 0;
        this.velocity.y = 0;
    }
}

/**
 * Base Hardware Item Class
 * Foundation for all hardware types in the data center
 */
class HardwareItem extends Entity {
    constructor(x, y, type, specifications = {}) {
        super(x, y);
        
        // Hardware-specific properties
        this.hardwareType = type;
        this.specifications = specifications;
        this.serialNumber = this.generateSerialNumber();
        this.status = 'available'; // available, reserved, installed, maintenance, failed
        this.location = 'loading-bay'; // loading-bay, storage-room, server-floor, in-transit
        this.priority = specifications.priority || 'medium'; // low, medium, high, critical
        this.value = specifications.value || 1000;
        this.weight = specifications.weight || 1.0; // kg
        this.dimensions = specifications.dimensions || { width: 20, height: 15, depth: 5 };
        
        // Movement and positioning
        this.targetPosition = null;
        this.movementSpeed = this.calculateMovementSpeed();
        this.isMoving = false;
        this.movementQueue = [];
        
        // Inventory tracking
        this.dateReceived = new Date();
        this.expiryDate = specifications.expiryDate || null;
        this.warrantyUntil = specifications.warrantyUntil || null;
        this.condition = 'new'; // new, good, fair, poor
        
        // Visual properties
        this.sprite = null;
        this.glowEffect = false;
        this.selectionRadius = 25;
        this.isSelected = false;
        this.animationFrame = 0;
        
        // Set visual properties based on hardware type
        this.initializeVisualProperties();
        
        // Enhanced movement system
        this.enhancedMovement = new EnhancedMovement(this);
        
        console.log(`📦 Hardware created: ${this.hardwareType} (${this.serialNumber})`);
    }

    generateSerialNumber() {
        const prefix = this.hardwareType.substring(0, 3).toUpperCase();
        const number = Math.random().toString().substr(2, 6);
        return `${prefix}${number}`;
    }

    calculateMovementSpeed() {
        // Movement speed based on size, weight, and handling requirements
        const baseSpeed = 50; // pixels per second
        const weightFactor = Math.max(0.3, 1.0 - (this.weight / 10));
        const valueFactor = this.value > 5000 ? 0.7 : 1.0; // Expensive items move more carefully
        
        return baseSpeed * weightFactor * valueFactor;
    }

    initializeVisualProperties() {
        // Set size and color based on hardware type
        switch (this.hardwareType) {
            case 'GPU':
                this.size = { width: 35, height: 20 };
                this.color = '#ff6b6b';
                break;
            case 'SSD':
                this.size = { width: 15, height: 12 };
                this.color = '#4ecdc4';
                break;
            case 'CPU':
                this.size = { width: 20, height: 20 };
                this.color = '#45b7d1';
                break;
            case 'RAM':
                this.size = { width: 25, height: 8 };
                this.color = '#96ceb4';
                break;
            case 'PSU':
                this.size = { width: 30, height: 25 };
                this.color = '#feca57';
                break;
            case 'Motherboard':
                this.size = { width: 40, height: 30 };
                this.color = '#48dbfb';
                break;
            default:
                this.size = { width: 20, height: 20 };
                this.color = '#ffffff';
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Update animation frame
        this.animationFrame += deltaTime * 2;
        
        // Use enhanced movement system if available
        if (this.enhancedMovement) {
            this.enhancedMovement.update(deltaTime);
        }
        
        // Process movement queue
        this.processMovementQueue(deltaTime);
        
        // Update status based on age and condition
        this.updateStatus(deltaTime);
        
        // Handle special effects
        this.updateVisualEffects(deltaTime);
    }

    processMovementQueue(deltaTime) {
        if (!this.isMoving && this.movementQueue.length > 0) {
            const nextMove = this.movementQueue.shift();
            this.startMovement(nextMove.x, nextMove.y, nextMove.location);
        }
        
        if (this.isMoving && this.targetPosition) {
            const distance = Math.sqrt(
                Math.pow(this.targetPosition.x - this.position.x, 2) +
                Math.pow(this.targetPosition.y - this.position.y, 2)
            );
            
            if (distance < 2) {
                // Arrived at destination
                this.position.x = this.targetPosition.x;
                this.position.y = this.targetPosition.y;
                this.stop();
                this.isMoving = false;
                this.targetPosition = null;
                
                // Update location if specified
                if (this.pendingLocationUpdate) {
                    this.location = this.pendingLocationUpdate;
                    this.pendingLocationUpdate = null;
                }
            }
        }
    }

    startMovement(x, y, newLocation = null) {
        this.targetPosition = { x, y };
        this.isMoving = true;
        this.pendingLocationUpdate = newLocation;
        this.status = 'in-transit';
        
        // Use enhanced movement if available
        if (this.enhancedMovement && window.simulation && window.simulation.pathfindingSystem) {
            this.enhancedMovement.startMovement(x, y, window.simulation.pathfindingSystem);
        } else {
            // Fallback to simple movement
            this.moveTo(x, y, this.movementSpeed);
        }
        
        console.log(`📦 ${this.hardwareType} moving to (${x}, ${y})`);
    }

    queueMovement(x, y, location = null) {
        this.movementQueue.push({ x, y, location });
    }

    updateStatus(deltaTime) {
        // Age-based condition degradation (very slow for demo purposes)
        const ageInDays = (Date.now() - this.dateReceived.getTime()) / (1000 * 60 * 60 * 24);
        
        if (ageInDays > 365 * 3 && this.condition === 'new') {
            this.condition = 'good';
        } else if (ageInDays > 365 * 5 && this.condition === 'good') {
            this.condition = 'fair';
        } else if (ageInDays > 365 * 7 && this.condition === 'fair') {
            this.condition = 'poor';
        }
        
        // Check warranty status
        if (this.warrantyUntil && new Date() > this.warrantyUntil) {
            this.warrantyStatus = 'expired';
        }
    }

    updateVisualEffects(deltaTime) {
        // Glow effect for high-priority or selected items
        if (this.priority === 'critical' || this.isSelected) {
            this.glowEffect = true;
        } else {
            this.glowEffect = false;
        }
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        
        // Draw glow effect if enabled
        if (this.glowEffect) {
            const glowIntensity = 0.5 + 0.3 * Math.sin(this.animationFrame);
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15 * glowIntensity;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        // Draw main hardware body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
        
        // Draw hardware type indicator
        this.drawHardwareIcon(ctx);
        
        // Draw status indicators
        this.drawStatusIndicators(ctx);
        
        // Draw selection highlight
        if (this.isSelected) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(
                this.position.x - 3,
                this.position.y - 3,
                this.size.width + 6,
                this.size.height + 6
            );
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    }

    drawHardwareIcon(ctx) {
        const centerX = this.position.x + this.size.width / 2;
        const centerY = this.position.y + this.size.height / 2;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Hardware type abbreviation
        const abbreviations = {
            'GPU': 'GPU',
            'SSD': 'SSD',
            'CPU': 'CPU',
            'RAM': 'RAM',
            'PSU': 'PSU',
            'Motherboard': 'MB'
        };
        
        ctx.fillText(
            abbreviations[this.hardwareType] || this.hardwareType.substr(0, 3),
            centerX,
            centerY
        );
    }

    drawStatusIndicators(ctx) {
        // Priority indicator
        if (this.priority === 'high' || this.priority === 'critical') {
            const indicatorX = this.position.x + this.size.width - 6;
            const indicatorY = this.position.y + 2;
            
            ctx.fillStyle = this.priority === 'critical' ? '#ff0000' : '#ffaa00';
            ctx.beginPath();
            ctx.arc(indicatorX, indicatorY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Status indicator
        const statusColors = {
            'available': '#00ff88',
            'reserved': '#ffaa00',
            'installed': '#45b7d1',
            'maintenance': '#ff6b6b',
            'failed': '#ff0000',
            'in-transit': '#feca57'
        };
        
        ctx.fillStyle = statusColors[this.status] || '#ffffff';
        ctx.fillRect(this.position.x, this.position.y - 3, this.size.width, 2);
    }

    // Interaction methods
    select() {
        this.isSelected = true;
    }

    deselect() {
        this.isSelected = false;
    }

    isPointInside(x, y) {
        return x >= this.position.x &&
               x <= this.position.x + this.size.width &&
               y >= this.position.y &&
               y <= this.position.y + this.size.height;
    }

    // Inventory management methods
    reserve(reason = '') {
        if (this.status === 'available') {
            this.status = 'reserved';
            this.reservationReason = reason;
            return true;
        }
        return false;
    }

    unreserve() {
        if (this.status === 'reserved') {
            this.status = 'available';
            this.reservationReason = null;
            return true;
        }
        return false;
    }

    install(location) {
        if (this.status === 'reserved' || this.status === 'available') {
            this.status = 'installed';
            this.installedLocation = location;
            this.installationDate = new Date();
            return true;
        }
        return false;
    }

    uninstall() {
        if (this.status === 'installed') {
            this.status = 'available';
            this.installedLocation = null;
            this.uninstallationDate = new Date();
            return true;
        }
        return false;
    }

    // Utility methods
    getInfo() {
        return {
            serialNumber: this.serialNumber,
            type: this.hardwareType,
            status: this.status,
            location: this.location,
            priority: this.priority,
            condition: this.condition,
            value: this.value,
            specifications: this.specifications
        };
    }

    clone() {
        return new HardwareItem(
            this.position.x + 30,
            this.position.y + 30,
            this.hardwareType,
            { ...this.specifications }
        );
    }
}

/**
 * Specialized Hardware Classes
 */

class GPU extends HardwareItem {
    constructor(x, y, specifications = {}) {
        const defaultSpecs = {
            memory: specifications.memory || '8GB',
            memoryType: specifications.memoryType || 'GDDR6',
            coreClock: specifications.coreClock || '1500MHz',
            powerConsumption: specifications.powerConsumption || '250W',
            coolingRequired: true,
            value: 1200,
            weight: 1.5,
            priority: 'high'
        };
        
        super(x, y, 'GPU', { ...defaultSpecs, ...specifications });
        this.temperatureSensitive = true;
        this.requiresSpecialHandling = true;
    }

    calculateMovementSpeed() {
        // GPUs move slower due to careful handling requirements
        return super.calculateMovementSpeed() * 0.7;
    }
}

class SSD extends HardwareItem {
    constructor(x, y, specifications = {}) {
        const defaultSpecs = {
            capacity: specifications.capacity || '1TB',
            interface: specifications.interface || 'NVMe',
            formFactor: specifications.formFactor || 'M.2',
            readSpeed: specifications.readSpeed || '3500MB/s',
            writeSpeed: specifications.writeSpeed || '3000MB/s',
            value: 200,
            weight: 0.1,
            priority: 'medium'
        };
        
        super(x, y, 'SSD', { ...defaultSpecs, ...specifications });
        this.batchProcessing = true; // Can be processed in groups
    }
}

class CPU extends HardwareItem {
    constructor(x, y, specifications = {}) {
        const defaultSpecs = {
            cores: specifications.cores || 8,
            threads: specifications.threads || 16,
            baseClock: specifications.baseClock || '3.2GHz',
            socket: specifications.socket || 'LGA1200',
            tdp: specifications.tdp || '95W',
            value: 400,
            weight: 0.2,
            priority: 'high'
        };
        
        super(x, y, 'CPU', { ...defaultSpecs, ...specifications });
        this.criticalPath = true; // Essential for new builds
    }
}

class RAM extends HardwareItem {
    constructor(x, y, specifications = {}) {
        const defaultSpecs = {
            capacity: specifications.capacity || '16GB',
            speed: specifications.speed || 'DDR4-3200',
            formFactor: specifications.formFactor || 'DIMM',
            voltage: specifications.voltage || '1.35V',
            value: 150,
            weight: 0.15,
            priority: 'medium'
        };
        
        super(x, y, 'RAM', { ...defaultSpecs, ...specifications });
        this.stackable = true; // Can be stacked for storage efficiency
    }
}

class PowerSupply extends HardwareItem {
    constructor(x, y, specifications = {}) {
        const defaultSpecs = {
            wattage: specifications.wattage || '750W',
            efficiency: specifications.efficiency || '80+ Gold',
            modular: specifications.modular || true,
            connectors: specifications.connectors || ['24-pin', '8-pin', '6+2-pin'],
            value: 180,
            weight: 2.5,
            priority: 'medium'
        };
        
        super(x, y, 'PSU', { ...defaultSpecs, ...specifications });
        this.bulky = true;
    }

    calculateMovementSpeed() {
        // PSUs move slower due to weight
        return super.calculateMovementSpeed() * 0.8;
    }
}

class Motherboard extends HardwareItem {
    constructor(x, y, specifications = {}) {
        const defaultSpecs = {
            socket: specifications.socket || 'LGA1200',
            chipset: specifications.chipset || 'Z490',
            formFactor: specifications.formFactor || 'ATX',
            ramSlots: specifications.ramSlots || 4,
            expansionSlots: specifications.expansionSlots || ['PCIe x16', 'PCIe x8', 'PCIe x1'],
            value: 250,
            weight: 1.2,
            priority: 'high'
        };
        
        super(x, y, 'Motherboard', { ...defaultSpecs, ...specifications });
        this.fragile = true;
        this.criticalPath = true;
    }

    calculateMovementSpeed() {
        // Motherboards move slowly due to fragility
        return super.calculateMovementSpeed() * 0.6;
    }
}

/**
 * Hardware Factory
 * Creates hardware instances based on type and specifications
 */
class HardwareFactory {
    static createHardware(type, x, y, specifications = {}) {
        switch (type) {
            case 'GPU':
                return new GPU(x, y, specifications);
            case 'SSD':
                return new SSD(x, y, specifications);
            case 'CPU':
                return new CPU(x, y, specifications);
            case 'RAM':
                return new RAM(x, y, specifications);
            case 'PSU':
                return new PowerSupply(x, y, specifications);
            case 'Motherboard':
                return new Motherboard(x, y, specifications);
            default:
                return new HardwareItem(x, y, type, specifications);
        }
    }

    static getAvailableTypes() {
        return ['GPU', 'SSD', 'CPU', 'RAM', 'PSU', 'Motherboard'];
    }

    static generateRandomHardware(x, y) {
        const types = this.getAvailableTypes();
        const randomType = types[Math.floor(Math.random() * types.length)];
        return this.createHardware(randomType, x, y);
    }

    static createBulkOrder(type, count, startX, startY, specifications = {}) {
        const items = [];
        const spacing = 30;
        const itemsPerRow = Math.ceil(Math.sqrt(count));
        
        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / itemsPerRow);
            const col = i % itemsPerRow;
            const x = startX + (col * spacing);
            const y = startY + (row * spacing);
            
            items.push(this.createHardware(type, x, y, specifications));
        }
        
        return items;
    }
}

/**
 * Inventory Manager
 * Tracks and manages all hardware items in the system
 */
class InventoryManager {
    constructor() {
        this.items = new Map();
        this.locationIndex = new Map();
        this.statusIndex = new Map();
        this.typeIndex = new Map();
        
        // Initialize indices
        this.initializeIndices();
    }

    initializeIndices() {
        const locations = ['loading-bay', 'storage-room', 'server-floor', 'in-transit'];
        const statuses = ['available', 'reserved', 'installed', 'maintenance', 'failed'];
        const types = HardwareFactory.getAvailableTypes();
        
        locations.forEach(location => {
            this.locationIndex.set(location, new Set());
        });
        
        statuses.forEach(status => {
            this.statusIndex.set(status, new Set());
        });
        
        types.forEach(type => {
            this.typeIndex.set(type, new Set());
        });
    }

    addItem(item) {
        this.items.set(item.id, item);
        this.updateIndices(item);
        
        console.log(`📝 Inventory: Added ${item.hardwareType} (${item.serialNumber})`);
    }

    removeItem(itemId) {
        const item = this.items.get(itemId);
        if (item) {
            this.removeFromIndices(item);
            this.items.delete(itemId);
            
            console.log(`📝 Inventory: Removed ${item.hardwareType} (${item.serialNumber})`);
            return true;
        }
        return false;
    }

    updateItem(item) {
        this.removeFromIndices(item);
        this.updateIndices(item);
    }

    updateIndices(item) {
        this.locationIndex.get(item.location).add(item.id);
        this.statusIndex.get(item.status).add(item.id);
        this.typeIndex.get(item.hardwareType).add(item.id);
    }

    removeFromIndices(item) {
        this.locationIndex.get(item.location).delete(item.id);
        this.statusIndex.get(item.status).delete(item.id);
        this.typeIndex.get(item.hardwareType).delete(item.id);
    }

    // Query methods
    getItemsByLocation(location) {
        const itemIds = this.locationIndex.get(location) || new Set();
        return Array.from(itemIds).map(id => this.items.get(id)).filter(Boolean);
    }

    getItemsByStatus(status) {
        const itemIds = this.statusIndex.get(status) || new Set();
        return Array.from(itemIds).map(id => this.items.get(id)).filter(Boolean);
    }

    getItemsByType(type) {
        const itemIds = this.typeIndex.get(type) || new Set();
        return Array.from(itemIds).map(id => this.items.get(id)).filter(Boolean);
    }

    getAvailableItems(type = null) {
        let available = this.getItemsByStatus('available');
        if (type) {
            available = available.filter(item => item.hardwareType === type);
        }
        return available;
    }

    // Statistics
    getInventoryStats() {
        const stats = {
            total: this.items.size,
            byLocation: {},
            byStatus: {},
            byType: {},
            totalValue: 0
        };

        this.items.forEach(item => {
            // By location
            stats.byLocation[item.location] = (stats.byLocation[item.location] || 0) + 1;
            
            // By status
            stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
            
            // By type
            stats.byType[item.hardwareType] = (stats.byType[item.hardwareType] || 0) + 1;
            
            // Total value
            stats.totalValue += item.value;
        });

        return stats;
    }

    // Search and filter
    findItems(criteria) {
        return Array.from(this.items.values()).filter(item => {
            return Object.keys(criteria).every(key => {
                if (key === 'minValue') return item.value >= criteria[key];
                if (key === 'maxValue') return item.value <= criteria[key];
                if (key === 'specifications') {
                    return Object.keys(criteria[key]).every(specKey => 
                        item.specifications[specKey] === criteria[key][specKey]
                    );
                }
                return item[key] === criteria[key];
            });
        });
    }

    // Bulk operations
    reserveItems(type, count, reason = '') {
        const available = this.getAvailableItems(type);
        const toReserve = available.slice(0, count);
        
        toReserve.forEach(item => {
            item.reserve(reason);
            this.updateItem(item);
        });
        
        return toReserve;
    }

    moveItems(itemIds, newLocation) {
        const movedItems = [];
        
        itemIds.forEach(id => {
            const item = this.items.get(id);
            if (item) {
                const oldLocation = item.location;
                item.location = newLocation;
                this.updateItem(item);
                movedItems.push(item);
                
                console.log(`📦 Moved ${item.hardwareType} from ${oldLocation} to ${newLocation}`);
            }
        });
        
        return movedItems;
    }

    getAllItems() {
        return Array.from(this.items.values());
    }

    getItem(id) {
        return this.items.get(id);
    }
}

// Make classes available globally for browser environment
window.Entity = Entity;
window.HardwareItem = HardwareItem;
window.GPU = GPU;
window.SSD = SSD;
window.CPU = CPU;
window.RAM = RAM;
window.PowerSupply = PowerSupply;
window.Motherboard = Motherboard;
window.HardwareFactory = HardwareFactory;
window.InventoryManager = InventoryManager;