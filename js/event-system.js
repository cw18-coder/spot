/**
 * Event System Module
 * Handles random event generation, commissioning requests, failures, and emergency scenarios
 */

/**
 * Event Types and Priorities
 */
const EVENT_TYPES = {
    HARDWARE_FAILURE: 'hardware-failure',
    COMMISSIONING_REQUEST: 'commissioning-request',
    EMERGENCY_REPLACEMENT: 'emergency-replacement',
    CAPACITY_EXPANSION: 'capacity-expansion',
    MAINTENANCE_SCHEDULED: 'maintenance-scheduled',
    SUPPLY_CHAIN_DELAY: 'supply-chain-delay',
    RUSH_ORDER: 'rush-order',
    CASCADE_FAILURE: 'cascade-failure'
};

const EVENT_PRIORITIES = {
    LOW: { name: 'Low', color: '#95a5a6', urgency: 1 },
    MEDIUM: { name: 'Medium', color: '#f39c12', urgency: 2 },
    HIGH: { name: 'High', color: '#e67e22', urgency: 3 },
    CRITICAL: { name: 'Critical', color: '#e74c3c', urgency: 4 },
    EMERGENCY: { name: 'Emergency', color: '#c0392b', urgency: 5 }
};

/**
 * Event Generator
 * Creates realistic datacenter events with proper timing and dependencies
 */
class EventGenerator {
    constructor() {
        this.activeEvents = [];
        this.eventHistory = [];
        this.nextEventTime = 0;
        this.eventProbabilities = {
            [EVENT_TYPES.HARDWARE_FAILURE]: 0.12,      // 12% chance per check
            [EVENT_TYPES.COMMISSIONING_REQUEST]: 0.08,  // 8% chance per check
            [EVENT_TYPES.EMERGENCY_REPLACEMENT]: 0.05,  // 5% chance per check
            [EVENT_TYPES.CAPACITY_EXPANSION]: 0.03,     // 3% chance per check
            [EVENT_TYPES.MAINTENANCE_SCHEDULED]: 0.10,  // 10% chance per check
            [EVENT_TYPES.SUPPLY_CHAIN_DELAY]: 0.04,     // 4% chance per check
            [EVENT_TYPES.RUSH_ORDER]: 0.06,             // 6% chance per check
            [EVENT_TYPES.CASCADE_FAILURE]: 0.02         // 2% chance per check - rare but impactful
        };
        
        this.eventCheckInterval = 30; // Check for new events every 30 seconds - increased for demo
        this.lastEventCheck = 0;
        
        console.log('📅 Event Generator initialized');
    }

    update(simulationTime, entities) {
        // Check for new events periodically
        if (simulationTime - this.lastEventCheck >= this.eventCheckInterval) {
            this.generateRandomEvent(simulationTime, entities);
            this.lastEventCheck = simulationTime;
        }

        // Update active events
        this.updateActiveEvents(simulationTime, entities);

        // Clean up completed events
        this.cleanupExpiredEvents(simulationTime);
    }

    generateRandomEvent(simulationTime, entities) {
        // Skip event generation if we have too many active events
        if (this.activeEvents.length >= 10) {
            return;
        }
        
        // Roll for each event type
        for (const [eventType, probability] of Object.entries(this.eventProbabilities)) {
            if (Math.random() < probability) {
                const event = this.createEvent(eventType, simulationTime, entities);
                if (event) {
                    this.activeEvents.push(event);
                    this.eventHistory.push(event);
                    
                    if (window.simulation) {
                        window.simulation.handleEvent(event);
                    }
                    
                    console.log(`📅 Generated event: ${event.type} - ${event.title}`);
                }
                
                // Only generate one event per check to avoid spam
                break;
            }
        }
    }

    createEvent(eventType, simulationTime, entities) {
        switch (eventType) {
            case EVENT_TYPES.HARDWARE_FAILURE:
                return this.createHardwareFailureEvent(simulationTime, entities);
                
            case EVENT_TYPES.COMMISSIONING_REQUEST:
                return this.createCommissioningEvent(simulationTime);
                
            case EVENT_TYPES.EMERGENCY_REPLACEMENT:
                return this.createEmergencyReplacementEvent(simulationTime, entities);
                
            case EVENT_TYPES.CAPACITY_EXPANSION:
                return this.createCapacityExpansionEvent(simulationTime);
                
            case EVENT_TYPES.MAINTENANCE_SCHEDULED:
                return this.createMaintenanceEvent(simulationTime, entities);
                
            case EVENT_TYPES.SUPPLY_CHAIN_DELAY:
                return this.createSupplyChainDelayEvent(simulationTime);
                
            case EVENT_TYPES.RUSH_ORDER:
                return this.createRushOrderEvent(simulationTime);
                
            case EVENT_TYPES.CASCADE_FAILURE:
                return this.createCascadeFailureEvent(simulationTime, entities);
                
            default:
                return null;
        }
    }

    createHardwareFailureEvent(simulationTime, entities) {
        const hardwareItems = entities.filter(entity => entity.hardwareType && entity.status === 'installed');
        
        if (hardwareItems.length === 0) return null;

        const failedItem = hardwareItems[Math.floor(Math.random() * hardwareItems.length)];
        const severity = this.getRandomSeverity(['MEDIUM', 'HIGH', 'CRITICAL']);

        return {
            id: this.generateEventId(),
            type: EVENT_TYPES.HARDWARE_FAILURE,
            priority: EVENT_PRIORITIES[severity],
            title: `${failedItem.hardwareType} Failure Detected`,
            description: `${failedItem.hardwareType} (Serial: ${failedItem.serialNumber}) has failed and requires immediate replacement`,
            createdAt: simulationTime,
            expiresAt: simulationTime + (severity === 'CRITICAL' ? 300 : 600), // 5-10 minutes to resolve
            targetEntity: failedItem,
            requiredActions: [
                'Locate replacement hardware',
                'Schedule maintenance window',
                'Replace failed component',
                'Verify system functionality'
            ],
            status: 'pending'
        };
    }

    createCommissioningEvent(simulationTime) {
        const rackTypes = ['Standard Server Rack', 'High-Density Storage Rack', 'GPU Compute Rack', 'Network Infrastructure Rack'];
        const rackType = rackTypes[Math.floor(Math.random() * rackTypes.length)];
        
        const partsList = this.generatePartsList(rackType);

        return {
            id: this.generateEventId(),
            type: EVENT_TYPES.COMMISSIONING_REQUEST,
            priority: EVENT_PRIORITIES.MEDIUM,
            title: `New ${rackType} Commissioning`,
            description: `Request to commission new ${rackType} for capacity expansion`,
            createdAt: simulationTime,
            expiresAt: simulationTime + 1800, // 30 minutes to complete
            partsList: partsList,
            estimatedCost: this.calculateCommissioningCost(partsList),
            requiredActions: [
                'Verify parts availability',
                'Schedule installation team',
                'Prepare rack location',
                'Install and configure hardware'
            ],
            status: 'planning'
        };
    }

    createEmergencyReplacementEvent(simulationTime, entities) {
        const criticalSystems = entities.filter(entity => 
            entity.hardwareType && 
            (entity.hardwareType.includes('Server') || entity.hardwareType.includes('Storage')) &&
            entity.status === 'installed'
        );

        if (criticalSystems.length === 0) return null;

        const affectedSystems = [];
        const numAffected = Math.min(3, Math.max(1, Math.floor(Math.random() * 3) + 1));
        
        for (let i = 0; i < numAffected; i++) {
            const system = criticalSystems[Math.floor(Math.random() * criticalSystems.length)];
            if (!affectedSystems.includes(system)) {
                affectedSystems.push(system);
            }
        }

        return {
            id: this.generateEventId(),
            type: EVENT_TYPES.EMERGENCY_REPLACEMENT,
            priority: EVENT_PRIORITIES.EMERGENCY,
            title: `Cascade Failure - Multiple Systems Down`,
            description: `${affectedSystems.length} critical systems have failed simultaneously. Immediate replacement required.`,
            createdAt: simulationTime,
            expiresAt: simulationTime + 900, // 15 minutes critical response time
            affectedSystems: affectedSystems,
            estimatedDowntime: `${15 + (affectedSystems.length * 10)} minutes`,
            requiredActions: [
                'Emergency stock allocation',
                'Priority replacement ordering',
                'Immediate technician dispatch',
                'Failover system activation'
            ],
            status: 'critical'
        };
    }

    createCapacityExpansionEvent(simulationTime) {
        const expansionTypes = [
            { type: 'Compute Capacity', reason: 'Increased workload demand' },
            { type: 'Storage Capacity', reason: 'Data growth projection' },
            { type: 'Network Capacity', reason: 'Bandwidth utilization threshold' },
            { type: 'Cooling Capacity', reason: 'Thermal management requirements' }
        ];
        
        const expansion = expansionTypes[Math.floor(Math.random() * expansionTypes.length)];

        return {
            id: this.generateEventId(),
            type: EVENT_TYPES.CAPACITY_EXPANSION,
            priority: EVENT_PRIORITIES.MEDIUM,
            title: `${expansion.type} Expansion Request`,
            description: `Expansion required due to: ${expansion.reason}`,
            createdAt: simulationTime,
            expiresAt: simulationTime + 3600, // 1 hour planning window
            expansionType: expansion.type,
            reason: expansion.reason,
            estimatedBudget: `$${(Math.random() * 100000 + 50000).toLocaleString()}`,
            requiredActions: [
                'Capacity planning analysis',
                'Budget approval process',
                'Equipment procurement',
                'Installation scheduling'
            ],
            status: 'planning'
        };
    }

    createMaintenanceEvent(simulationTime, entities) {
        const maintenanceTypes = [
            'Scheduled hardware refresh',
            'Preventive cooling system maintenance', 
            'Network infrastructure upgrade',
            'Security patch deployment',
            'Performance optimization review'
        ];

        const maintenanceType = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];

        return {
            id: this.generateEventId(),
            type: EVENT_TYPES.MAINTENANCE_SCHEDULED,
            priority: EVENT_PRIORITIES.LOW,
            title: `Scheduled Maintenance: ${maintenanceType}`,
            description: `Routine maintenance window scheduled for system optimization`,
            createdAt: simulationTime,
            expiresAt: simulationTime + 7200, // 2 hours maintenance window
            maintenanceType: maintenanceType,
            estimatedDuration: `${Math.floor(Math.random() * 180 + 60)} minutes`,
            requiredActions: [
                'Maintenance team notification',
                'System backup verification',
                'Maintenance execution',
                'Post-maintenance validation'
            ],
            status: 'scheduled'
        };
    }

    createSupplyChainDelayEvent(simulationTime) {
        const delayReasons = [
            'Supplier manufacturing delay',
            'Transportation disruption',
            'Quality control issue',
            'Raw material shortage',
            'Customs processing delay'
        ];

        const reason = delayReasons[Math.floor(Math.random() * delayReasons.length)];

        return {
            id: this.generateEventId(),
            type: EVENT_TYPES.SUPPLY_CHAIN_DELAY,
            priority: EVENT_PRIORITIES.HIGH,
            title: `Supply Chain Disruption`,
            description: `Delivery delay due to: ${reason}`,
            createdAt: simulationTime,
            expiresAt: simulationTime + 1800, // 30 minutes to resolve
            delayReason: reason,
            estimatedDelay: `${Math.floor(Math.random() * 14 + 1)} days`,
            requiredActions: [
                'Alternative supplier evaluation',
                'Emergency stock assessment',
                'Customer impact analysis',
                'Contingency plan activation'
            ],
            status: 'investigating'
        };
    }

    createRushOrderEvent(simulationTime) {
        const urgentNeeds = [
            'Customer emergency deployment',
            'Critical system replacement',
            'Disaster recovery activation',
            'Compliance requirement deadline',
            'Revenue-critical infrastructure'
        ];

        const need = urgentNeeds[Math.floor(Math.random() * urgentNeeds.length)];

        return {
            id: this.generateEventId(),
            type: EVENT_TYPES.RUSH_ORDER,
            priority: EVENT_PRIORITIES.HIGH,
            title: `Rush Order Request`,
            description: `Urgent procurement needed for: ${need}`,
            createdAt: simulationTime,
            expiresAt: simulationTime + 1200, // 20 minutes to process
            urgentNeed: need,
            rushFee: `$${(Math.random() * 5000 + 1000).toLocaleString()}`,
            requiredActions: [
                'Expedited supplier contact',
                'Rush shipping arrangement',
                'Priority processing approval',
                'Express delivery coordination'
            ],
            status: 'urgent'
        };
    }

    createCascadeFailureEvent(simulationTime, entities) {
        const hardwareItems = entities.filter(entity => entity.hardwareType && entity.status === 'installed');
        
        if (hardwareItems.length < 3) return null; // Need at least 3 items for cascade

        // Select 2-5 items for cascade failure
        const failureCount = Math.min(hardwareItems.length, Math.floor(Math.random() * 4) + 2);
        const failedItems = [];
        
        // Randomly select items, but favor similar types for realistic cascade
        const shuffledItems = [...hardwareItems].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < failureCount && i < shuffledItems.length; i++) {
            failedItems.push(shuffledItems[i]);
            // Mark as failed in the entities
            shuffledItems[i].status = 'failed';
        }

        const cascadeReasons = [
            'Power surge affecting multiple systems',
            'Cooling system malfunction causing overheating',
            'Network fabric failure isolating rack cluster',
            'Firmware bug affecting identical hardware models',
            'Environmental contamination (dust/moisture)'
        ];

        const reason = cascadeReasons[Math.floor(Math.random() * cascadeReasons.length)];

        // Calculate total replacement cost
        const estimatedCost = failedItems.length * 8000; // Base cost per item

        return {
            id: this.generateEventId(),
            type: EVENT_TYPES.CASCADE_FAILURE,
            priority: EVENT_PRIORITIES.EMERGENCY,
            title: `CASCADE FAILURE: ${failedItems.length} Systems Down`,
            description: `Multiple system failure due to: ${reason}. ${failedItems.length} systems require immediate emergency replacement.`,
            createdAt: simulationTime,
            expiresAt: simulationTime + 900, // 15 minutes critical window
            failedItems: failedItems,
            cascadeReason: reason,
            estimatedCost: `$${estimatedCost.toLocaleString()}`,
            impactLevel: failedItems.length >= 4 ? 'SEVERE' : 'HIGH',
            requiredActions: [
                'EMERGENCY: Assess infrastructure damage',
                'Isolate affected systems to prevent spread',
                'Activate emergency stock allocation',
                'Deploy rapid response team',
                'Implement temporary failover systems',
                'Coordinate mass hardware replacement',
                'Post-incident analysis and prevention'
            ],
            status: 'emergency',
            emergencyContacts: [
                'Infrastructure Emergency Team',
                'Vendor Emergency Support',
                'Executive Leadership Team'
            ]
        };
    }

    generatePartsList(rackType) {
        const baseParts = {
            'Standard Server Rack': [
                { item: 'Server', quantity: Math.floor(Math.random() * 8 + 4) },
                { item: 'Network Switch', quantity: 2 },
                { item: 'Power Distribution Unit', quantity: 2 }
            ],
            'High-Density Storage Rack': [
                { item: 'Storage Array', quantity: Math.floor(Math.random() * 6 + 2) },
                { item: 'SSD', quantity: Math.floor(Math.random() * 24 + 12) },
                { item: 'Network Switch', quantity: 1 }
            ],
            'GPU Compute Rack': [
                { item: 'GPU Server', quantity: Math.floor(Math.random() * 4 + 2) },
                { item: 'GPU', quantity: Math.floor(Math.random() * 16 + 8) },
                { item: 'High-Performance Network Switch', quantity: 1 }
            ],
            'Network Infrastructure Rack': [
                { item: 'Core Network Switch', quantity: 2 },
                { item: 'Firewall Appliance', quantity: 1 },
                { item: 'Load Balancer', quantity: 1 }
            ]
        };

        return baseParts[rackType] || baseParts['Standard Server Rack'];
    }

    calculateCommissioningCost(partsList) {
        const costs = {
            'Server': 5000,
            'Storage Array': 8000,
            'GPU': 2000,
            'GPU Server': 15000,
            'Network Switch': 3000,
            'High-Performance Network Switch': 8000,
            'Core Network Switch': 12000,
            'SSD': 300,
            'Firewall Appliance': 10000,
            'Load Balancer': 7000,
            'Power Distribution Unit': 1500
        };

        let totalCost = 0;
        partsList.forEach(part => {
            const unitCost = costs[part.item] || 1000;
            totalCost += unitCost * part.quantity;
        });

        return `$${totalCost.toLocaleString()}`;
    }

    getRandomSeverity(severities) {
        return severities[Math.floor(Math.random() * severities.length)];
    }

    generateEventId() {
        return 'EVT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    updateActiveEvents(simulationTime, entities) {
        this.activeEvents.forEach(event => {
            // Update event status based on time and conditions
            if (event.status === 'pending' && simulationTime - event.createdAt > 60) {
                event.status = 'in-progress';
            }

            // Handle event-specific updates
            switch (event.type) {
                case EVENT_TYPES.HARDWARE_FAILURE:
                    this.updateHardwareFailureEvent(event, simulationTime, entities);
                    break;
                case EVENT_TYPES.COMMISSIONING_REQUEST:
                    this.updateCommissioningEvent(event, simulationTime);
                    break;
                // Add other event type handlers as needed
            }
        });
    }

    updateHardwareFailureEvent(event, simulationTime, entities) {
        if (event.targetEntity && event.targetEntity.status === 'failed') {
            // Simulate repair progress
            const timeElapsed = simulationTime - event.createdAt;
            const repairProgress = Math.min(1, timeElapsed / 180); // 3 minutes repair time
            
            if (repairProgress >= 1 && event.status !== 'resolved') {
                event.targetEntity.status = 'available';
                event.status = 'resolved';
                
                if (window.simulation) {
                    window.simulation.addNotification(
                        `✅ ${event.targetEntity.hardwareType} repair completed`,
                        'success'
                    );
                }
            }
        }
    }

    updateCommissioningEvent(event, simulationTime) {
        const timeElapsed = simulationTime - event.createdAt;
        
        if (timeElapsed > 300 && event.status === 'planning') { // 5 minutes
            event.status = 'parts-gathering';
        } else if (timeElapsed > 600 && event.status === 'parts-gathering') { // 10 minutes
            event.status = 'installation';
        } else if (timeElapsed > 900 && event.status === 'installation') { // 15 minutes
            event.status = 'completed';
            
            if (window.simulation) {
                window.simulation.addNotification(
                    `✅ ${event.title} completed successfully`,
                    'success'
                );
            }
        }
    }

    cleanupExpiredEvents(simulationTime) {
        const initialCount = this.activeEvents.length;
        
        this.activeEvents = this.activeEvents.filter(event => {
            return event.status !== 'completed' && 
                   event.status !== 'resolved' && 
                   simulationTime < event.expiresAt;
        });
        
        // Limit event history to prevent memory leaks
        if (this.eventHistory.length > 50) {
            this.eventHistory = this.eventHistory.slice(-30); // Keep last 30 events
            console.log('📅 Trimmed event history to prevent memory buildup');
        }
        
        // Force cleanup if too many active events (should never happen in normal operation)
        if (this.activeEvents.length > 20) {
            console.warn('⚠️ Too many active events, forcing cleanup...');
            this.activeEvents = this.activeEvents.slice(-10); // Keep only most recent 10
        }
        
        if (initialCount > this.activeEvents.length) {
            console.log(`📅 Cleaned up ${initialCount - this.activeEvents.length} expired events`);
        }
    }

    getActiveEvents() {
        return this.activeEvents;
    }

    getEventHistory() {
        return this.eventHistory;
    }

    getEventStatistics() {
        const stats = {};
        Object.values(EVENT_TYPES).forEach(type => {
            stats[type] = this.eventHistory.filter(event => event.type === type).length;
        });
        return stats;
    }
}

// Make class available globally for browser environment
window.EventGenerator = EventGenerator;
window.EVENT_TYPES = EVENT_TYPES;
window.EVENT_PRIORITIES = EVENT_PRIORITIES;