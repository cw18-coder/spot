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
        
        // Movement hierarchy rules - STRICT PATHS ONLY
        this.movementRules = {
            'loading-dock': ['loading-dock', 'qc-station'], // dock>dock, dock>qc only
            'qc-station': ['storage-bin', 'recycle-bin'], // qc>bin, qc>recycle only  
            'storage-bin': ['rack-slot'], // bin>rr only (storage-bin to storage-bin removed)
            'rack-slot': ['recycle-bin'], // rr>recycle only
            'recycle-bin': ['remove-offscreen'] // recycle>remove only
        };
        
        // QC Station decision parameters
        this.qcPassRate = 0.85; // 85% of parts pass QC
        this.qcProcessingTime = 30; // 30 seconds per item
        
        // Performance tracking
        this.metrics = {
            trucksProcessed: 0,
            averageWaitTime: 0,
            capacityUtilization: 0,
            placementEfficiency: 0,
            qcProcessed: 0,
            qcPassedRate: 0,
            failuresDetected: 0,
            recycledParts: 0
        };
        
        console.log('🤖 AI Agent initialized - Ready for intelligent decision-making with movement hierarchy');
    }

    /**
     * Validate if a movement is allowed according to hierarchy rules
     */
    isMovementAllowed(fromZoneType, toZoneType) {
        const allowedDestinations = this.movementRules[fromZoneType];
        return allowedDestinations && allowedDestinations.includes(toZoneType);
    }

    /**
     * Get next valid destinations for a part in a specific zone
     */
    getValidDestinations(currentZoneType) {
        return this.movementRules[currentZoneType] || [];
    }

    /**
     * Validate if parts can move between zones of the same type
     */
    canMoveBetweenSameType(zoneType, hardwareType) {
        // Only allow dock-to-dock movement based on strict rules
        const allowedSameTypeMovement = ['loading-dock'];
        return allowedSameTypeMovement.includes(zoneType);
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
        const allZones = zoneManager.getAllZones();
        const loadingDocks = allZones.filter(zone => zone.type === 'loading-dock');
        
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
        
        // Movement hierarchy optimization options
        options.push(...this.generateMovementOptions(analysis));
        
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
        
        // QC Station processing options
        options.push(...this.generateQCOptions(analysis));
        
        // RR failure response options
        options.push(...this.generateFailureResponseOptions(analysis));
        
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
     * Generate movement-specific options based on hierarchy rules
     */
    generateMovementOptions(analysis) {
        const options = [];
        
        // Check for items that need to move through hierarchy
        if (analysis.inventoryStatus.loadingBayItems > 0) {
            options.push({
                type: 'process_loading_bay_items',
                priority: 0.7,
                action: 'move_items_to_qc',
                itemCount: analysis.inventoryStatus.loadingBayItems
            });
        }
        
        // Storage optimization - move items to server racks
        if (analysis.inventoryStatus.storageItems > 5) {
            options.push({
                type: 'optimize_storage',
                priority: 0.6,
                action: 'install_items_in_server_racks',
                itemCount: Math.min(analysis.inventoryStatus.storageItems, 3)
            });
        }
        
        return options;
    }

    /**
     * Generate QC Station specific options
     */
    generateQCOptions(analysis) {
        const options = [];
        
        // If QC station is available and there are items to process
        if (analysis.inventoryStatus.loadingBayItems > 0) {
            options.push({
                type: 'schedule_qc_processing',
                priority: 0.8,
                estimatedTime: this.qcProcessingTime,
                expectedPassRate: this.qcPassRate
            });
        }
        
        return options;
    }

    /**
     * Generate failure response options
     */
    generateFailureResponseOptions(analysis) {
        const options = [];
        
        // Check server floor items for potential failures
        if (analysis.inventoryStatus.serverFloorItems > 0) {
            options.push({
                type: 'monitor_server_failures',
                priority: 0.5,
                action: 'continuous_monitoring',
                itemCount: analysis.inventoryStatus.serverFloorItems
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
                systemLoad: analysis.systemLoad || 0,
                dockStatus: analysis.loadingDocks?.length || 0,
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
                const dock = analysis.loadingDocks?.find(d => d.dockId === decision.dockId);
                const capacity = dock?.capacity ? Math.round(dock.capacity * 100) : 'unknown';
                return `Assigned truck to Dock ${decision.dockId} based on ${Math.round((decision.priority || 0) * 100)}% priority score considering capacity (${capacity}%) and efficiency.`;
                
            case 'optimize_dock_layout':
                return `Optimizing layout for ${decision.targetDocks.length} dock(s) exceeding ${Math.round(this.dockCapacityThreshold * 100)}% capacity threshold.`;
                
            case 'emergency_capacity_management':
                return `All docks at capacity - implementing queue management to prevent system overload.`;
                
            case 'process_loading_bay_items':
                return `Processing ${decision.itemCount} items from loading bay through QC Station - implementing movement hierarchy.`;
                
            case 'optimize_storage':
                return `Installing ${decision.itemCount} items from storage into server racks for optimal utilization.`;
                
            case 'schedule_qc_processing':
                return `Scheduling QC processing with ${Math.round(decision.expectedPassRate * 100)}% expected pass rate - ${decision.estimatedTime}s per item.`;
                
            case 'monitor_server_failures':
                return `Monitoring ${decision.itemCount} server rack items for potential failures - proactive maintenance mode.`;
                
            case 'no_action':
                return decision.reason || 'No action required at this time.';
            
            case 'system_status_check':
            case 'performance_analysis':
            case 'capacity_monitoring':
            case 'efficiency_assessment':
            case 'predictive_modeling':
                return decision.details || 'Routine system monitoring and analysis.';
                
            default:
                return 'Decision made based on movement hierarchy and current analysis parameters.';
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
     * Perform periodic monitoring and log monitoring decisions
     */
    performPeriodicMonitoring(simulation) {
        const monitoringActions = [
            'system_status_check',
            'performance_analysis', 
            'capacity_monitoring',
            'efficiency_assessment',
            'predictive_modeling'
        ];
        
        const actionType = monitoringActions[Math.floor(Math.random() * monitoringActions.length)];
        
        const decision = {
            type: actionType,
            timestamp: Date.now(),
            priority: 'low',
            details: this.generateMonitoringDetails(actionType, simulation)
        };
        
        const analysis = {
            systemLoad: simulation?.entities?.length || 0,
            queueStatus: simulation?.movementSystem?.qcQueue?.length || 0,
            entityCount: simulation?.hardwareItems?.length || 0
        };
        
        this.logDecision(decision, analysis);
        
        return decision;
    }

    /**
     * Generate specific monitoring details based on action type
     */
    generateMonitoringDetails(actionType, simulation) {
        const entityCount = simulation?.entities?.length || 0;
        const queueLength = simulation?.movementSystem?.qcQueue?.length || 0;
        const recycleQueue = simulation?.movementSystem?.recyclingQueue?.length || 0;
        
        switch (actionType) {
            case 'system_status_check':
                return `Monitoring ${entityCount} active entities, system operating normally`;
            case 'performance_analysis':
                return `Analyzing throughput: ${this.metrics.qcProcessed} items processed, ${(this.metrics.qcPassedRate * 100).toFixed(1)}% pass rate`;
            case 'capacity_monitoring':
                return `Capacity assessment: QC queue ${queueLength} items, recycle queue ${recycleQueue} items`;
            case 'efficiency_assessment':
                return `Efficiency metrics: ${this.metrics.placementEfficiency.toFixed(1)}% placement efficiency`;
            case 'predictive_modeling':
                return `Predictive analysis: forecasting optimal resource allocation patterns`;
            default:
                return 'Routine monitoring operations';
        }
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

    /**
     * QC Station Decision Logic
     * Determines whether a part passes QC and should go to storage or be recycled
     */
    makeQCDecision(hardwareItem) {
        // Simulate quality control process
        const qcResult = {
            itemId: hardwareItem.id,
            hardwareType: hardwareItem.hardwareType,
            timestamp: Date.now(),
            passed: Math.random() < this.qcPassRate,
            processingTime: this.qcProcessingTime,
            issues: []
        };

        // Add potential issues for failed items
        if (!qcResult.passed) {
            const possibleIssues = [
                'Physical damage detected',
                'Component failure',
                'Specification mismatch',
                'Manufacturing defect',
                'Compatibility issue'
            ];
            qcResult.issues.push(possibleIssues[Math.floor(Math.random() * possibleIssues.length)]);
        }

        // Update metrics
        this.metrics.qcProcessed++;
        this.metrics.qcPassedRate = this.calculateNewAverage(
            this.metrics.qcPassedRate,
            qcResult.passed ? 1 : 0,
            this.metrics.qcProcessed
        );

        if (!qcResult.passed) {
            this.metrics.failuresDetected++;
        }

        // Log QC decision
        console.log(`🔍 QC Decision for ${hardwareItem.hardwareType}: ${qcResult.passed ? 'PASS' : 'FAIL'}`, qcResult);

        return qcResult;
    }

    /**
     * RR Failure Detection
     * Simulates server rack failure and triggers movement to recycle bin
     */
    checkRRFailure(serverRackItem, gameState) {
        // Base failure rate: 0.1% per hour of operation
        const hoursSinceInstall = (Date.now() - (serverRackItem.installTime || Date.now())) / (1000 * 60 * 60);
        const failureRate = 0.001 * hoursSinceInstall;
        
        // Higher failure rate for certain hardware types
        const riskFactors = {
            'PSU': 1.5,
            'HDD': 2.0,
            'SSD': 0.5,
            'RAM': 0.8,
            'CPU': 0.7,
            'GPU': 1.2
        };
        
        const adjustedFailureRate = failureRate * (riskFactors[serverRackItem.hardwareType] || 1.0);
        
        const hasFailed = Math.random() < adjustedFailureRate;
        
        if (hasFailed) {
            const failureReport = {
                itemId: serverRackItem.id,
                hardwareType: serverRackItem.hardwareType,
                timestamp: Date.now(),
                failureReason: this.generateFailureReason(serverRackItem.hardwareType),
                severity: this.calculateFailureSeverity(),
                recommendedAction: 'immediate_recycling'
            };
            
            // Update metrics
            this.metrics.failuresDetected++;
            
            // Log failure
            console.log(`⚠️ RR Failure detected for ${serverRackItem.hardwareType}:`, failureReport);
            
            return failureReport;
        }
        
        return null;
    }

    /**
     * Generate realistic failure reason based on hardware type
     */
    generateFailureReason(hardwareType) {
        const failureReasons = {
            'PSU': ['Power output instability', 'Capacitor failure', 'Overheating'],
            'HDD': ['Bad sectors detected', 'Mechanical failure', 'Read/write errors'],
            'SSD': ['Flash memory degradation', 'Controller failure', 'Wear leveling issues'],
            'RAM': ['Memory corruption', 'Timing errors', 'Physical damage'],
            'CPU': ['Thermal shutdown', 'Cache errors', 'Instruction pipeline failure'],
            'GPU': ['VRAM failure', 'Shader unit malfunction', 'Thermal throttling'],
            'Motherboard': ['Trace damage', 'Component failure', 'BIOS corruption']
        };
        
        const reasons = failureReasons[hardwareType] || ['General hardware failure'];
        return reasons[Math.floor(Math.random() * reasons.length)];
    }

    /**
     * Calculate failure severity (low, medium, high, critical)
     */
    calculateFailureSeverity() {
        const rand = Math.random();
        if (rand < 0.4) return 'low';
        if (rand < 0.7) return 'medium';
        if (rand < 0.9) return 'high';
        return 'critical';
    }

    /**
     * Plan optimal movement path for hardware item
     */
    planMovementPath(item, targetZoneType, gameState) {
        const currentZone = this.findItemCurrentZone(item, gameState);
        if (!currentZone) {
            console.warn(`Cannot find current zone for item ${item.id}`);
            return null;
        }

        const currentZoneType = this.getZoneTypeFromZone(currentZone);
        
        // Check if direct movement is allowed
        if (this.isMovementAllowed(currentZoneType, targetZoneType)) {
            return {
                path: [currentZoneType, targetZoneType],
                direct: true,
                estimatedTime: this.estimateMovementTime(currentZoneType, targetZoneType)
            };
        }

        // Check if movement between same types is allowed (e.g., dock to dock)
        if (currentZoneType === targetZoneType && this.canMoveBetweenSameType(currentZoneType, item.hardwareType)) {
            return {
                path: [currentZoneType, targetZoneType],
                direct: true,
                sameType: true,
                estimatedTime: this.estimateMovementTime(currentZoneType, targetZoneType)
            };
        }

        // Find indirect path through hierarchy
        return this.findIndirectPath(currentZoneType, targetZoneType, item);
    }

    /**
     * Find item's current zone in the game state
     */
    findItemCurrentZone(item, gameState) {
        const allZones = gameState.zoneManager.getAllZones();
        return allZones.find(zone => 
            zone.occupants && zone.occupants.includes(item)
        );
    }

    /**
     * Get zone type from zone object
     */
    getZoneTypeFromZone(zone) {
        const zoneTypeMap = {
            'loading-dock': 'loading-dock',
            'storage-bin': 'storage-bin',
            'rack-slot': 'rack-slot',
            'qc-station': 'qc-station',
            'recycle-bin': 'recycle-bin'
        };
        return zoneTypeMap[zone.type] || zone.type;
    }

    /**
     * Find indirect path through movement hierarchy
     */
    findIndirectPath(fromZone, toZone, item) {
        // Simple BFS to find path through hierarchy
        const queue = [{ zone: fromZone, path: [fromZone], time: 0 }];
        const visited = new Set([fromZone]);

        while (queue.length > 0) {
            const current = queue.shift();
            const validDestinations = this.getValidDestinations(current.zone);

            for (const nextZone of validDestinations) {
                if (nextZone === toZone) {
                    return {
                        path: [...current.path, nextZone],
                        direct: false,
                        estimatedTime: current.time + this.estimateMovementTime(current.zone, nextZone)
                    };
                }

                if (!visited.has(nextZone)) {
                    visited.add(nextZone);
                    queue.push({
                        zone: nextZone,
                        path: [...current.path, nextZone],
                        time: current.time + this.estimateMovementTime(current.zone, nextZone)
                    });
                }
            }
        }

        return null; // No valid path found
    }

    /**
     * Estimate movement time between zones
     */
    estimateMovementTime(fromZone, toZone) {
        const baseTimes = {
            'loading-dock': { 'qc-station': 45 },
            'qc-station': { 'storage-bin': 30, 'recycle-bin': 20 },
            'storage-bin': { 'rack-slot': 60, 'storage-bin': 25 },
            'rack-slot': { 'recycle-bin': 40 }
        };

        return baseTimes[fromZone]?.[toZone] || 60; // Default 60 seconds
    }
}

/**
 * Movement Management System
 * Handles intelligent movement of parts through the hierarchy system
 */
class MovementManagementSystem {
    constructor(aiAgent) {
        this.aiAgent = aiAgent;
        this.gridSize = { width: 30, height: 20 }; // Item dimensions
        this.margin = 5; // Grid spacing
        this.pendingMovements = new Map(); // Track items in transit
        this.qcQueue = []; // Queue for QC processing
        this.recyclingQueue = []; // Queue for recycling
    }

    /**
     * Execute movement of hardware item based on hierarchy rules
     */
    executeMovement(item, targetZoneType, gameState) {
        const movementPlan = this.aiAgent.planMovementPath(item, targetZoneType, gameState);
        
        if (!movementPlan) {
            console.warn(`❌ Cannot move ${item.hardwareType} to ${targetZoneType} - no valid path`);
            return false;
        }

        // Validate movement is allowed
        if (!movementPlan.direct && !movementPlan.sameType) {
            console.warn(`❌ Complex movement path required for ${item.hardwareType}:`, movementPlan.path);
            // For now, only allow direct movements
            return false;
        }

        // Execute the movement
        return this.performMovement(item, targetZoneType, gameState, movementPlan);
    }

    /**
     * Perform the actual movement operation
     */
    performMovement(item, targetZoneType, gameState, movementPlan) {
        try {
            // Handle special case: remove-offscreen
            if (targetZoneType === 'remove-offscreen') {
                return this.removeItemOffScreen(item, gameState);
            }

            // Validate movement is allowed by hierarchy rules
            const currentZone = this.aiAgent.findItemCurrentZone(item, gameState);
            const currentZoneType = currentZone ? this.aiAgent.getZoneTypeFromZone(currentZone) : 'unknown';
            
            if (!this.aiAgent.isMovementAllowed(currentZoneType, targetZoneType)) {
                console.warn(`❌ Movement not allowed: ${currentZoneType} → ${targetZoneType} for ${item.hardwareType}`);
                return false;
            }

            // Find available target zone
            const targetZone = this.findAvailableZone(targetZoneType, gameState, item);
            
            if (!targetZone) {
                console.warn(`❌ No available ${targetZoneType} for ${item.hardwareType}`);
                return false;
            }

            // Remove from current zone
            if (currentZone) {
                this.removeFromZone(item, currentZone);
            }

            // Add to target zone and ensure position is within bounds
            this.addToZone(item, targetZone);
            this.validateItemPosition(item, gameState);

            // Update item properties
            item.location = this.getLocationFromZoneType(targetZoneType);
            
            // Log movement
            console.log(`✅ Moved ${item.hardwareType} from ${currentZoneType} to ${targetZone.type}`);
            
            return true;

        } catch (error) {
            console.error(`❌ Movement failed for ${item.hardwareType}:`, error);
            return false;
        }
    }

    /**
     * Remove item from simulation (offscreen)
     */
    removeItemOffScreen(item, gameState) {
        try {
            // Remove from current zone
            const currentZone = this.aiAgent.findItemCurrentZone(item, gameState);
            if (currentZone) {
                this.removeFromZone(item, currentZone);
            }

            // Remove from entities array in main simulation
            if (gameState.entities) {
                const entityIndex = gameState.entities.findIndex(entity => entity.id === item.id);
                if (entityIndex !== -1) {
                    gameState.entities.splice(entityIndex, 1);
                }
            }

            // Remove from hardware items array
            if (gameState.hardwareItems) {
                const itemIndex = gameState.hardwareItems.findIndex(hwItem => hwItem.id === item.id);
                if (itemIndex !== -1) {
                    gameState.hardwareItems.splice(itemIndex, 1);
                }
            }

            console.log(`🗑️ Removed ${item.hardwareType} from simulation (off-screen)`);
            return true;

        } catch (error) {
            console.error(`❌ Failed to remove ${item.hardwareType} from simulation:`, error);
            return false;
        }
    }

    /**
     * Validate and correct item position to prevent flying off screen
     */
    validateItemPosition(item, gameState) {
        const canvas = document.getElementById('entity-canvas');
        if (!canvas) return;

        // Clamp position to canvas boundaries
        const margin = 10;
        item.position.x = Math.max(margin, Math.min(canvas.width - item.size.width - margin, item.position.x));
        item.position.y = Math.max(margin, Math.min(canvas.height - item.size.height - margin, item.position.y));
        
        // Stop any velocity that might cause movement
        if (item.velocity) {
            item.velocity.x = 0;
            item.velocity.y = 0;
        }
        
        // Clear any target position
        if (item.targetPosition) {
            item.targetPosition = null;
        }
    }

    /**
     * Process items through QC Station
     */
    processQCQueue(gameState) {
        if (this.qcQueue.length === 0) return;

        const allZones = gameState.zoneManager.getAllZones();
        const qcStation = allZones.find(zone => zone.type === 'qc-station');
        if (!qcStation) {
            console.warn('QC Station not found');
            return;
        }

        // Check if QC station has capacity for more items
        if (qcStation.occupants.length >= qcStation.capacity) {
            console.log('🔍 QC Station at capacity, waiting...');
            return;
        }

        // Move item from queue to QC station
        const item = this.qcQueue.shift();
        
        // Remove item from current location
        const currentZone = this.aiAgent.findItemCurrentZone(item, gameState);
        if (currentZone) {
            this.removeFromZone(item, currentZone);
        }
        
        // Add item to QC station
        this.addToZone(item, qcStation);
        item.location = 'quality-control';
        
        console.log(`🔍 ${item.hardwareType} moved to QC Station for inspection`);

        // The QC station will handle the inspection process
        // We'll check for completed inspections in another method
    }

    /**
     * Process completed QC inspections and route items to destinations
     */
    processQCCompletions(gameState) {
        const allZones = gameState.zoneManager.getAllZones();
        const qcStation = allZones.find(zone => zone.type === 'qc-station');
        
        if (!qcStation || !qcStation.occupants) return;

        // Check for items that have completed inspection
        const completedItems = qcStation.occupants.filter(item => 
            item.condition && (item.condition === 'verified' || item.condition === 'defective')
        );

        completedItems.forEach(item => {
            // Remove from QC station
            this.removeFromZone(item, qcStation);
            
            // Determine destination
            const destination = item.condition === 'verified' ? 'storage-bin' : 'recycle-bin';
            
            // Execute movement to final destination
            if (this.executeMovement(item, destination, gameState)) {
                console.log(`🔍 QC Complete: ${item.hardwareType} ${item.condition} → ${destination}`);
                
                // Update AI metrics
                this.aiAgent.metrics.qcProcessed++;
                if (item.condition === 'verified') {
                    this.aiAgent.metrics.qcPassedRate = this.aiAgent.calculateNewAverage(
                        this.aiAgent.metrics.qcPassedRate, 1, this.aiAgent.metrics.qcProcessed
                    );
                } else {
                    this.aiAgent.metrics.qcPassedRate = this.aiAgent.calculateNewAverage(
                        this.aiAgent.metrics.qcPassedRate, 0, this.aiAgent.metrics.qcProcessed
                    );
                    this.aiAgent.metrics.failuresDetected++;
                }
            }
        });
    }

    /**
     * Handle RR failure and automatic recycling
     */
    checkAndHandleRRFailures(gameState) {
        const allZones = gameState.zoneManager.getAllZones();
        const serverRacks = allZones.filter(zone => zone.type === 'rack-slot');
        
        serverRacks.forEach(rack => {
            rack.occupants.forEach(item => {
                const failureReport = this.aiAgent.checkRRFailure(item, gameState);
                
                if (failureReport) {
                    console.log(`⚠️ RR Failure detected - moving ${item.hardwareType} to recycle bin`);
                    
                    // Add to recycling queue for immediate processing
                    this.recyclingQueue.push({
                        item: item,
                        failureReport: failureReport,
                        timestamp: Date.now()
                    });
                }
            });
        });
    }

    /**
     * Process recycling queue
     */
    processRecyclingQueue(gameState) {
        while (this.recyclingQueue.length > 0) {
            const recyclingItem = this.recyclingQueue.shift();
            
            if (this.executeMovement(recyclingItem.item, 'recycle-bin', gameState)) {
                this.aiAgent.metrics.recycledParts++;
                console.log(`♻️ Successfully recycled failed ${recyclingItem.item.hardwareType}`);
                
                // After a delay, remove recycled items from simulation
                setTimeout(() => {
                    this.executeMovement(recyclingItem.item, 'remove-offscreen', gameState);
                }, 5000); // 5 second delay before removal
            }
        }
    }

    /**
     * Find available zone of specified type
     */
    findAvailableZone(zoneType, gameState, item) {
        const allZones = gameState.zoneManager.getAllZones();
        const zones = allZones.filter(zone => {
            const mappedType = this.aiAgent.getZoneTypeFromZone(zone);
            return mappedType === zoneType;
        });

        // Find zone with available capacity
        return zones.find(zone => {
            if (!zone.occupants) zone.occupants = [];
            return zone.occupants.length < (zone.capacity || 1);
        });
    }

    /**
     * Remove item from zone
     */
    removeFromZone(item, zone) {
        if (!zone.occupants) zone.occupants = [];
        const index = zone.occupants.findIndex(occupant => occupant.id === item.id);
        if (index !== -1) {
            zone.occupants.splice(index, 1);
        }
    }

    /**
     * Add item to zone
     */
    addToZone(item, zone) {
        if (!zone.occupants) zone.occupants = [];
        zone.occupants.push(item);
        
        // Position item within zone
        const position = this.calculateZonePosition(zone, zone.occupants.length - 1);
        item.position = position;
    }

    /**
     * Calculate position within zone for item
     */
    calculateZonePosition(zone, itemIndex) {
        const itemsPerRow = Math.floor(zone.size.width / (this.gridSize.width + this.margin));
        const row = Math.floor(itemIndex / itemsPerRow);
        const col = itemIndex % itemsPerRow;
        
        return {
            x: zone.position.x + this.margin + col * (this.gridSize.width + this.margin),
            y: zone.position.y + this.margin + row * (this.gridSize.height + this.margin)
        };
    }

    /**
     * Get location string from zone type
     */
    getLocationFromZoneType(zoneType) {
        const locationMap = {
            'loading-dock': 'loading-bay',
            'qc-station': 'quality-control',
            'storage-bin': 'storage-room',
            'rack-slot': 'server-floor',
            'recycle-bin': 'recycle-area'
        };
        return locationMap[zoneType] || 'unknown';
    }

    /**
     * Find optimal dock for incoming truck
     */
    findOptimalDock(gameState) {
        const analysis = this.aiAgent.analyzeCurrentSituation(gameState);
        const decision = this.aiAgent.makeDecision(gameState);
        
        if (decision.type === 'assign_truck_to_dock') {
            const allZones = gameState.zoneManager.getAllZones();
            const dock = allZones.find(zone => 
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

/**
 * Recycle Bin Entity
 * Large rectangular bin spanning storage room and server floor
 */
class RecycleBin {
    constructor(gameState) {
        // Calculate position to span storage room and server floor
        const allZones = gameState.zoneManager.getAllZones();
        const storageZones = allZones.filter(z => z.type === 'storage-bin');
        const serverZones = allZones.filter(z => z.type === 'rack-slot');
        
        if (storageZones.length === 0 || serverZones.length === 0) {
            console.warn('Cannot create recycle bin - missing storage or server zones');
            return null;
        }

        // Calculate bounding box for all storage and server zones
        const combinedZones = [...storageZones, ...serverZones];
        const minX = Math.min(...combinedZones.map(z => z.position.x));
        const maxX = Math.max(...combinedZones.map(z => z.position.x + z.size.width));
        const minY = Math.max(...combinedZones.map(z => z.position.y + z.size.height)) + 20;
        
        this.id = 'recycle-bin-main';
        this.position = { x: minX, y: minY };
        this.size = { width: maxX - minX, height: 80 };
        this.type = 'recycle-bin';
        this.capacity = 100; // Large capacity
        this.occupants = [];
        
        // Visual properties
        this.color = '#ff6b6b';
        this.borderColor = '#cc0000';
        this.icon = '♻️';
        
        console.log('♻️ Recycle Bin created spanning storage and server areas');
    }

    update(deltaTime) {
        // Animate recycling process
        this.animationFrame = (this.animationFrame || 0) + deltaTime;
    }

    render(ctx) {
        ctx.save();
        
        // Draw bin background
        ctx.fillStyle = this.color + '40'; // Semi-transparent
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
        
        // Draw bin border
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(this.position.x, this.position.y, this.size.width, this.size.height);
        ctx.setLineDash([]);
        
        // Draw recycle icon and label
        ctx.fillStyle = this.borderColor;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            '♻️ RECYCLE BIN', 
            this.position.x + this.size.width / 2, 
            this.position.y + this.size.height / 2 + 8
        );
        
        // Draw capacity indicator
        ctx.font = '12px Arial';
        ctx.fillText(
            `${this.occupants.length}/${this.capacity}`, 
            this.position.x + this.size.width - 40, 
            this.position.y + 20
        );
        
        ctx.restore();
    }

    addItem(item) {
        if (this.occupants.length < this.capacity) {
            this.occupants.push(item);
            item.location = 'recycle-area';
            item.status = 'recycled';
            console.log(`♻️ Added ${item.hardwareType} to recycle bin`);
            return true;
        }
        return false;
    }

    contains(item) {
        return this.occupants.includes(item);
    }
}

// Make classes available globally for browser environment
window.AIAgent = AIAgent;
window.MovementManagementSystem = MovementManagementSystem;
window.RecycleBin = RecycleBin;

// Backward compatibility
window.DockManagementSystem = MovementManagementSystem;

console.log('✅ AI Intelligence Module loaded successfully with movement hierarchy system');