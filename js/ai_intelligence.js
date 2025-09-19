/**
 * AI Intelligence Module
 * Advanced AI decision-making system for data center hardware management
 * Based on datacenter_simulation_plan.md - AI Decision System architecture
 * 
 * Handles:
 * - Intelligent dock assignment for trucks
 * - Capacity management and optimization
 * - Grid-based item placement algorithms  
 * - Predictive planning and decision-making
 * - Learning behaviors and pattern recognition
 */

/**
 * Main AI Agent Class
 * The "thinking robot" that makes intelligent decisions for the data center
 */
class AIAgent {
    constructor() {
        this.currentTask = null;
        this.decisionHistory = [];
        this.learningData = new Map();
        this.analysisState = 'idle'; // idle, analyzing, planning, executing
        
        // Decision-making parameters
        this.dockCapacityThreshold = 0.9; // 90% capacity threshold
        this.truckQueue = [];
        
        // Performance tracking
        this.metrics = {
            trucksProcessed: 0,
            averageWaitTime: 0,
            capacityUtilization: 0,
            placementEfficiency: 0
        };
        
        console.log('🤖 AI Agent initialized - Ready for intelligent decision-making');
    }

    /**
     * Core decision-making method
     * Analyzes current situation and determines best course of action
     */
    makeDecision(gameState) {
        this.analysisState = 'analyzing';
        
        const analysis = this.analyzeCurrentSituation(gameState);
        const options = this.generateOptions(analysis);
        const bestOption = this.evaluateOptions(options);
        
        this.logDecision(bestOption, analysis);
        this.analysisState = 'executing';
        
        return bestOption;
    }

    /**
     * Analyze current data center state
     */
    analyzeCurrentSituation(gameState) {
        const { zoneManager, hardwareItems, entities } = gameState;
        
        const analysis = {
            timestamp: Date.now(),
            loadingDocks: this.analyzeDocks(zoneManager),
            truckActivity: this.analyzeTrucks(entities),
            inventoryStatus: this.analyzeInventory(hardwareItems, zoneManager),
            systemLoad: this.calculateSystemLoad(gameState)
        };
        
        return analysis;
    }

    /**
     * Analyze all loading docks - capacity, availability, efficiency
     */
    analyzeDocks(zoneManager) {
        const loadingDocks = zoneManager.zones.filter(zone => zone.type === 'loading-dock');
        
        return loadingDocks.map(dock => ({
            dockId: dock.dockNumber,
            occupied: dock.truckPresent || false,
            capacity: this.calculateDockCapacity(dock, zoneManager),
            efficiency: this.calculateDockEfficiency(dock),
            lastUsed: dock.lastUsed || 0,
            itemCount: this.getItemsInDock(dock, zoneManager).length
        }));
    }

    /**
     * Calculate what percentage of dock area is occupied
     */
    calculateDockCapacity(dock, zoneManager) {
        const dockArea = dock.size.width * dock.size.height;
        const itemsInDock = this.getItemsInDock(dock, zoneManager);
        
        // Each item takes approximately 30x20 pixels
        const occupiedArea = itemsInDock.length * (30 * 20);
        
        return Math.min(occupiedArea / dockArea, 1.0);
    }

    /**
     * Get all hardware items currently in a specific dock
     */
    getItemsInDock(dock, zoneManager) {
        // This will need to access the main simulation's hardwareItems
        // For now, return empty array - will be connected to main simulation
        return [];
    }

    /**
     * Calculate dock efficiency based on usage patterns
     */
    calculateDockEfficiency(dock) {
        // Placeholder for efficiency calculation
        // Will consider factors like: throughput, wait times, space utilization
        return Math.random() * 0.3 + 0.7; // 70-100% efficiency
    }

    /**
     * Analyze current truck activity
     */
    analyzeTrucks(entities) {
        const trucks = entities.filter(entity => entity.entityType === 'truck');
        
        return {
            activeTrucks: trucks.filter(t => !t.hasFinishedTask).length,
            queuedTrucks: this.truckQueue.length,
            averageUnloadTime: this.calculateAverageUnloadTime(trucks),
            totalTrucksToday: this.metrics.trucksProcessed
        };
    }

    /**
     * Calculate average truck unloading time
     */
    calculateAverageUnloadTime(trucks) {
        const completedTrucks = trucks.filter(t => t.hasFinishedTask);
        if (completedTrucks.length === 0) return 0;
        
        // Placeholder calculation
        return 180; // 3 minutes average
    }

    /**
     * Analyze inventory status across all locations
     */
    analyzeInventory(hardwareItems, zoneManager) {
        return {
            totalItems: hardwareItems.length,
            loadingBayItems: this.getItemsByLocation(hardwareItems, 'loading-bay').length,
            storageItems: this.getItemsByLocation(hardwareItems, 'storage-room').length,
            serverFloorItems: this.getItemsByLocation(hardwareItems, 'server-floor').length,
            criticalLowStock: this.identifyCriticalLowStock(hardwareItems)
        };
    }

    /**
     * Get items by location
     */
    getItemsByLocation(items, location) {
        return items.filter(item => item.location === location);
    }

    /**
     * Identify items with critically low stock levels
     */
    identifyCriticalLowStock(items) {
        // Group by hardware type and check quantities
        const inventory = {};
        items.forEach(item => {
            inventory[item.hardwareType] = (inventory[item.hardwareType] || 0) + 1;
        });
        
        // Return types with less than 3 items
        return Object.entries(inventory)
            .filter(([type, count]) => count < 3)
            .map(([type]) => type);
    }

    /**
     * Calculate overall system load and performance
     */
    calculateSystemLoad(gameState) {
        // Placeholder for system load calculation
        return {
            cpuUsage: Math.random() * 0.4 + 0.3, // 30-70%
            memoryUsage: Math.random() * 0.3 + 0.4, // 40-70%
            networkLoad: Math.random() * 0.2 + 0.1 // 10-30%
        };
    }

    /**
     * Generate possible action options based on analysis
     */
    generateOptions(analysis) {
        const options = [];
        
        // Truck routing options
        if (this.truckQueue.length > 0) {
            const availableDocks = analysis.loadingDocks.filter(dock => 
                !dock.occupied && dock.capacity < this.dockCapacityThreshold
            );
            
            availableDocks.forEach(dock => {
                options.push({
                    type: 'assign_truck_to_dock',
                    dockId: dock.dockId,
                    priority: this.calculateAssignmentPriority(dock, analysis),
                    estimatedTime: this.estimateUnloadTime(dock)
                });
            });
        }
        
        // Capacity optimization options
        const overCapacityDocks = analysis.loadingDocks.filter(dock => 
            dock.capacity > this.dockCapacityThreshold
        );
        
        if (overCapacityDocks.length > 0) {
            options.push({
                type: 'optimize_dock_layout',
                targetDocks: overCapacityDocks.map(d => d.dockId),
                priority: 0.8
            });
        }
        
        // Emergency scenarios
        if (analysis.loadingDocks.every(dock => dock.capacity > this.dockCapacityThreshold)) {
            options.push({
                type: 'emergency_capacity_management',
                priority: 1.0,
                action: 'queue_trucks_until_capacity_available'
            });
        }
        
        return options;
    }

    /**
     * Calculate priority for assigning truck to specific dock
     */
    calculateAssignmentPriority(dock, analysis) {
        let priority = 1.0;
        
        // Prefer docks with lower capacity
        priority -= dock.capacity * 0.3;
        
        // Prefer docks with higher efficiency
        priority += dock.efficiency * 0.2;
        
        // Prefer docks not used recently (load balancing)
        const timeSinceLastUse = Date.now() - (dock.lastUsed || 0);
        priority += Math.min(timeSinceLastUse / 300000, 0.2); // Max 0.2 bonus for 5+ min
        
        return Math.max(0, Math.min(1.0, priority));
    }

    /**
     * Estimate unloading time for a dock
     */
    estimateUnloadTime(dock) {
        // Base time + capacity factor + efficiency factor
        const baseTime = 180; // 3 minutes
        const capacityFactor = dock.capacity * 60; // Extra time for crowded dock
        const efficiencyFactor = (1 - dock.efficiency) * 120; // Inefficient docks take longer
        
        return baseTime + capacityFactor + efficiencyFactor;
    }

    /**
     * Evaluate options and select the best one
     */
    evaluateOptions(options) {
        if (options.length === 0) {
            return { type: 'no_action', reason: 'No viable options available' };
        }
        
        // Sort by priority (highest first)
        options.sort((a, b) => b.priority - a.priority);
        
        // Select the highest priority option
        const bestOption = options[0];
        
        // Add confidence score
        bestOption.confidence = this.calculateConfidence(bestOption, options);
        
        return bestOption;
    }

    /**
     * Calculate confidence in the selected decision
     */
    calculateConfidence(selectedOption, allOptions) {
        if (allOptions.length === 1) return 1.0;
        
        const priorityGap = selectedOption.priority - (allOptions[1]?.priority || 0);
        return Math.min(0.5 + priorityGap, 1.0);
    }

    /**
     * Log decision for learning and transparency
     */
    logDecision(decision, analysis) {
        const logEntry = {
            timestamp: Date.now(),
            decision: decision,
            context: {
                systemLoad: analysis.systemLoad,
                dockStatus: analysis.loadingDocks.length,
                queueLength: this.truckQueue.length
            },
            reasoning: this.generateReasoningExplanation(decision, analysis)
        };
        
        this.decisionHistory.unshift(logEntry);
        
        // Keep only last 50 decisions
        if (this.decisionHistory.length > 50) {
            this.decisionHistory = this.decisionHistory.slice(0, 50);
        }
        
        console.log(`🤖 AI Decision: ${decision.type}`, logEntry);
    }

    /**
     * Generate human-readable explanation of AI reasoning
     */
    generateReasoningExplanation(decision, analysis) {
        switch (decision.type) {
            case 'assign_truck_to_dock':
                return `Assigned truck to Dock ${decision.dockId} based on ${Math.round(decision.priority * 100)}% priority score considering capacity (${Math.round(analysis.loadingDocks.find(d => d.dockId === decision.dockId)?.capacity * 100)}%) and efficiency.`;
                
            case 'optimize_dock_layout':
                return `Optimizing layout for ${decision.targetDocks.length} dock(s) exceeding ${Math.round(this.dockCapacityThreshold * 100)}% capacity threshold.`;
                
            case 'emergency_capacity_management':
                return `All docks at capacity - implementing queue management to prevent system overload.`;
                
            case 'no_action':
                return decision.reason || 'No action required at this time.';
                
            default:
                return 'Decision made based on current analysis parameters.';
        }
    }

    /**
     * Get current AI status for UI display
     */
    getStatus() {
        return {
            state: this.analysisState,
            currentTask: this.currentTask,
            queueLength: this.truckQueue.length,
            lastDecision: this.decisionHistory[0] || null,
            metrics: this.metrics
        };
    }

    /**
     * Update AI metrics based on outcomes
     */
    updateMetrics(outcome) {
        switch (outcome.type) {
            case 'truck_completed':
                this.metrics.trucksProcessed++;
                this.metrics.averageWaitTime = this.calculateNewAverage(
                    this.metrics.averageWaitTime,
                    outcome.waitTime,
                    this.metrics.trucksProcessed
                );
                break;
                
            case 'capacity_optimized':
                this.metrics.placementEfficiency = outcome.efficiency;
                break;
        }
    }

    /**
     * Calculate new running average
     */
    calculateNewAverage(currentAvg, newValue, count) {
        return ((currentAvg * (count - 1)) + newValue) / count;
    }
}

/**
 * Dock Management System
 * Handles intelligent dock assignment and capacity management
 */
class DockManagementSystem {
    constructor(aiAgent) {
        this.aiAgent = aiAgent;
        this.gridSize = { width: 30, height: 20 }; // Item dimensions
        this.margin = 5; // Grid spacing
    }

    /**
     * Find optimal dock for incoming truck
     */
    findOptimalDock(gameState) {
        const analysis = this.aiAgent.analyzeCurrentSituation(gameState);
        const decision = this.aiAgent.makeDecision(gameState);
        
        if (decision.type === 'assign_truck_to_dock') {
            const dock = gameState.zoneManager.zones.find(zone => 
                zone.type === 'loading-dock' && zone.dockNumber === decision.dockId
            );
            return { dock, decision };
        }
        
        return { dock: null, decision };
    }

    /**
     * Calculate optimal grid position for item placement in dock
     */
    findOptimalGridPosition(dock, gameState) {
        const cols = Math.floor((dock.size.width - this.margin * 2) / (this.gridSize.width + this.margin));
        const rows = Math.floor((dock.size.height - this.margin * 2) / (this.gridSize.height + this.margin));
        
        // Find first available position (left-to-right, top-to-bottom)
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const position = {
                    x: dock.position.x + this.margin + col * (this.gridSize.width + this.margin),
                    y: dock.position.y + this.margin + row * (this.gridSize.height + this.margin)
                };
                
                if (this.isPositionFree(position, gameState.hardwareItems)) {
                    return position;
                }
            }
        }
        
        return null; // No free position
    }

    /**
     * Check if a grid position is free of items
     */
    isPositionFree(position, hardwareItems) {
        return !hardwareItems.some(item => {
            const distance = Math.sqrt(
                Math.pow(item.position.x - position.x, 2) + 
                Math.pow(item.position.y - position.y, 2)
            );
            return distance < this.gridSize.width;
        });
    }

    /**
     * Queue truck when all docks are at capacity
     */
    queueTruck(truck, reason = 'All docks at capacity') {
        this.aiAgent.truckQueue.push({
            truck: truck,
            queueTime: Date.now(),
            reason: reason
        });
        
        console.log(`🚛 Truck queued: ${reason}`);
        return true;
    }

    /**
     * Process queued trucks when capacity becomes available
     */
    processQueue(gameState) {
        if (this.aiAgent.truckQueue.length === 0) return;
        
        const { dock, decision } = this.findOptimalDock(gameState);
        
        if (dock && decision.type === 'assign_truck_to_dock') {
            const queuedTruckData = this.aiAgent.truckQueue.shift();
            const waitTime = Date.now() - queuedTruckData.queueTime;
            
            // Update metrics
            this.aiAgent.updateMetrics({
                type: 'truck_completed',
                waitTime: waitTime
            });
            
            return { truck: queuedTruckData.truck, dock, waitTime };
        }
        
        return null;
    }
}

// Make classes available globally for browser environment
window.AIAgent = AIAgent;
window.DockManagementSystem = DockManagementSystem;

console.log('✅ AI Intelligence Module loaded successfully');