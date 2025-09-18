/**
 * Transport Systems Module
 * Handles pathfinding, vehicle movement, and transport logistics
 * Phase 3 Hour 5: Advanced movement systems and vehicle behaviors
 */

/**
 * Pathfinding System
 * A* algorithm implementation for optimal routing
 */
class PathfindingSystem {
    constructor(width, height, gridSize = 50) {
        this.width = width;
        this.height = height;
        this.gridSize = gridSize;
        this.gridWidth = Math.ceil(width / gridSize);
        this.gridHeight = Math.ceil(height / gridSize);
        this.obstacles = new Set();
        
        // Predefined waypoints for major locations
        this.waypoints = {
            'loading-bay': { x: 150, y: 200 },
            'storage-room': { x: 500, y: 300 },
            'server-floor': { x: 850, y: 250 },
            'center': { x: 600, y: 300 },
            'loading-exit': { x: 300, y: 200 },
            'storage-entrance': { x: 400, y: 300 },
            'storage-exit': { x: 600, y: 300 },
            'server-entrance': { x: 750, y: 250 }
        };
        
        this.initializeGrid();
    }

    initializeGrid() {
        // Create basic grid with some obstacles for realism
        this.addObstacle(400, 150, 50, 100); // Central pillar
        this.addObstacle(700, 350, 100, 50); // Server room obstacle
        this.addObstacle(200, 350, 80, 40);  // Loading bay obstacle
    }

    addObstacle(x, y, width, height) {
        const startGridX = Math.floor(x / this.gridSize);
        const startGridY = Math.floor(y / this.gridSize);
        const endGridX = Math.floor((x + width) / this.gridSize);
        const endGridY = Math.floor((y + height) / this.gridSize);

        for (let gx = startGridX; gx <= endGridX; gx++) {
            for (let gy = startGridY; gy <= endGridY; gy++) {
                this.obstacles.add(`${gx},${gy}`);
            }
        }
    }

    isObstacle(gridX, gridY) {
        return this.obstacles.has(`${gridX},${gridY}`) ||
               gridX < 0 || gridY < 0 || 
               gridX >= this.gridWidth || gridY >= this.gridHeight;
    }

    findPath(startX, startY, endX, endY) {
        const startGridX = Math.floor(startX / this.gridSize);
        const startGridY = Math.floor(startY / this.gridSize);
        const endGridX = Math.floor(endX / this.gridSize);
        const endGridY = Math.floor(endY / this.gridSize);

        // Use A* algorithm
        const openSet = new Set();
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const start = `${startGridX},${startGridY}`;
        const end = `${endGridX},${endGridY}`;

        openSet.add(start);
        gScore.set(start, 0);
        fScore.set(start, this.heuristic(startGridX, startGridY, endGridX, endGridY));

        while (openSet.size > 0) {
            let current = this.getLowestFScore(openSet, fScore);
            
            if (current === end) {
                return this.reconstructPath(cameFrom, current, startX, startY, endX, endY);
            }

            openSet.delete(current);
            closedSet.add(current);

            const [currentX, currentY] = current.split(',').map(Number);
            const neighbors = this.getNeighbors(currentX, currentY);

            for (const neighbor of neighbors) {
                if (closedSet.has(neighbor) || this.isObstacle(...neighbor.split(',').map(Number))) {
                    continue;
                }

                const tentativeGScore = gScore.get(current) + 1;

                if (!openSet.has(neighbor)) {
                    openSet.add(neighbor);
                } else if (tentativeGScore >= gScore.get(neighbor)) {
                    continue;
                }

                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeGScore);
                const [nx, ny] = neighbor.split(',').map(Number);
                fScore.set(neighbor, gScore.get(neighbor) + this.heuristic(nx, ny, endGridX, endGridY));
            }
        }

        // If no path found, return direct path
        return [{ x: startX, y: startY }, { x: endX, y: endY }];
    }

    findPathViaWaypoints(startLocation, endLocation) {
        const start = this.waypoints[startLocation];
        const end = this.waypoints[endLocation];
        
        if (!start || !end) {
            console.warn('Invalid waypoint locations:', startLocation, endLocation);
            return [];
        }

        // Define waypoint routes for efficiency
        const routes = {
            'loading-bay->storage-room': ['loading-bay', 'loading-exit', 'storage-entrance', 'storage-room'],
            'storage-room->loading-bay': ['storage-room', 'storage-entrance', 'loading-exit', 'loading-bay'],
            'storage-room->server-floor': ['storage-room', 'storage-exit', 'server-entrance', 'server-floor'],
            'server-floor->storage-room': ['server-floor', 'server-entrance', 'storage-exit', 'storage-room'],
            'loading-bay->server-floor': ['loading-bay', 'loading-exit', 'center', 'server-entrance', 'server-floor'],
            'server-floor->loading-bay': ['server-floor', 'server-entrance', 'center', 'loading-exit', 'loading-bay']
        };

        const routeKey = `${startLocation}->${endLocation}`;
        const waypointRoute = routes[routeKey];

        if (waypointRoute) {
            return waypointRoute.map(wp => this.waypoints[wp]);
        }

        // Direct path if no predefined route
        return [start, end];
    }

    getNeighbors(x, y) {
        return [
            `${x-1},${y}`, `${x+1},${y}`,
            `${x},${y-1}`, `${x},${y+1}`,
            `${x-1},${y-1}`, `${x+1},${y-1}`,
            `${x-1},${y+1}`, `${x+1},${y+1}`
        ];
    }

    heuristic(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    getLowestFScore(openSet, fScore) {
        let lowest = null;
        let lowestScore = Infinity;
        
        for (const node of openSet) {
            const score = fScore.get(node) || Infinity;
            if (score < lowestScore) {
                lowestScore = score;
                lowest = node;
            }
        }
        
        return lowest;
    }

    reconstructPath(cameFrom, current, startX, startY, endX, endY) {
        const path = [];
        
        while (current) {
            const [gx, gy] = current.split(',').map(Number);
            path.unshift({
                x: gx * this.gridSize + this.gridSize / 2,
                y: gy * this.gridSize + this.gridSize / 2
            });
            current = cameFrom.get(current);
        }

        // Smooth the path and add actual start/end points
        if (path.length > 0) {
            path[0] = { x: startX, y: startY };
            path[path.length - 1] = { x: endX, y: endY };
        }

        return this.smoothPath(path);
    }

    smoothPath(path) {
        if (path.length <= 2) return path;

        const smoothed = [path[0]];
        
        for (let i = 1; i < path.length - 1; i++) {
            const prev = path[i - 1];
            const curr = path[i];
            const next = path[i + 1];
            
            // Add curve points for smoother movement
            smoothed.push({
                x: curr.x + (prev.x - curr.x) * 0.1,
                y: curr.y + (prev.y - curr.y) * 0.1
            });
            smoothed.push(curr);
            smoothed.push({
                x: curr.x + (next.x - curr.x) * 0.1,
                y: curr.y + (next.y - curr.y) * 0.1
            });
        }
        
        smoothed.push(path[path.length - 1]);
        return smoothed;
    }

    renderGrid(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // Draw grid
        for (let x = 0; x <= this.width; x += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }

        for (let y = 0; y <= this.height; y += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }

        // Draw obstacles
        ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
        for (const obstacle of this.obstacles) {
            const [gx, gy] = obstacle.split(',').map(Number);
            ctx.fillRect(gx * this.gridSize, gy * this.gridSize, this.gridSize, this.gridSize);
        }

        // Draw waypoints
        ctx.fillStyle = 'rgba(0, 255, 136, 0.6)';
        Object.values(this.waypoints).forEach(wp => {
            ctx.beginPath();
            ctx.arc(wp.x, wp.y, 8, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }
}

/**
 * Enhanced Movement System
 * Smooth animations with easing and realistic physics
 */
class EnhancedMovement {
    constructor(entity) {
        this.entity = entity;
        this.path = [];
        this.currentPathIndex = 0;
        this.isMoving = false;
        this.movementSpeed = entity.movementSpeed || 100;
        this.acceleration = 200;
        this.deceleration = 150;
        this.currentVelocity = { x: 0, y: 0 };
        this.maxSpeed = this.movementSpeed;
        this.arrivalDistance = 5;
        
        // Easing parameters
        this.easeInDistance = 30;
        this.easeOutDistance = 40;
    }

    startMovement(targetX, targetY, pathfindingSystem) {
        if (pathfindingSystem) {
            this.path = pathfindingSystem.findPath(
                this.entity.position.x, this.entity.position.y,
                targetX, targetY
            );
        } else {
            this.path = [
                { x: this.entity.position.x, y: this.entity.position.y },
                { x: targetX, y: targetY }
            ];
        }
        
        this.currentPathIndex = 0;
        this.isMoving = true;
        this.entity.status = 'in-transit';
        
        console.log(`📦 Starting enhanced movement with ${this.path.length} waypoints`);
    }

    update(deltaTime) {
        if (!this.isMoving || this.path.length === 0) return;

        const currentTarget = this.path[this.currentPathIndex];
        if (!currentTarget) {
            this.stopMovement();
            return;
        }

        const dx = currentTarget.x - this.entity.position.x;
        const dy = currentTarget.y - this.entity.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.arrivalDistance) {
            // Arrived at current waypoint
            this.currentPathIndex++;
            if (this.currentPathIndex >= this.path.length) {
                // Arrived at final destination
                this.entity.position.x = this.path[this.path.length - 1].x;
                this.entity.position.y = this.path[this.path.length - 1].y;
                this.stopMovement();
                return;
            }
        } else {
            // Move towards current waypoint with smooth acceleration/deceleration
            const direction = { x: dx / distance, y: dy / distance };
            
            // Calculate target speed based on distance to destination
            const totalRemainingDistance = this.calculateRemainingDistance();
            let targetSpeed = this.maxSpeed;
            
            // Ease in at start of path
            if (this.currentPathIndex === 0 && distance < this.easeInDistance) {
                targetSpeed *= (this.easeInDistance - distance) / this.easeInDistance;
            }
            
            // Ease out near destination
            if (totalRemainingDistance < this.easeOutDistance) {
                targetSpeed *= totalRemainingDistance / this.easeOutDistance;
            }
            
            targetSpeed = Math.max(targetSpeed, this.maxSpeed * 0.2); // Minimum speed
            
            // Smooth acceleration/deceleration
            const currentSpeed = Math.sqrt(this.currentVelocity.x ** 2 + this.currentVelocity.y ** 2);
            let acceleration = this.acceleration;
            
            if (currentSpeed > targetSpeed) {
                acceleration = -this.deceleration;
            }
            
            // Apply acceleration
            const newSpeed = Math.max(0, currentSpeed + acceleration * deltaTime);
            const clampedSpeed = Math.min(newSpeed, this.maxSpeed);
            
            this.currentVelocity.x = direction.x * clampedSpeed;
            this.currentVelocity.y = direction.y * clampedSpeed;
            
            // Update position
            this.entity.position.x += this.currentVelocity.x * deltaTime;
            this.entity.position.y += this.currentVelocity.y * deltaTime;
        }
    }

    calculateRemainingDistance() {
        let totalDistance = 0;
        
        // Distance to current target
        if (this.currentPathIndex < this.path.length) {
            const current = this.path[this.currentPathIndex];
            const dx = current.x - this.entity.position.x;
            const dy = current.y - this.entity.position.y;
            totalDistance += Math.sqrt(dx * dx + dy * dy);
            
            // Distance between remaining waypoints
            for (let i = this.currentPathIndex; i < this.path.length - 1; i++) {
                const waypoint1 = this.path[i];
                const waypoint2 = this.path[i + 1];
                const dx = waypoint2.x - waypoint1.x;
                const dy = waypoint2.y - waypoint1.y;
                totalDistance += Math.sqrt(dx * dx + dy * dy);
            }
        }
        
        return totalDistance;
    }

    stopMovement() {
        this.isMoving = false;
        this.currentVelocity.x = 0;
        this.currentVelocity.y = 0;
        this.path = [];
        this.currentPathIndex = 0;
        this.entity.status = 'available';
        
        console.log(`📦 Movement completed for ${this.entity.type || 'entity'}`);
    }

    renderPath(ctx) {
        if (this.path.length < 2) return;

        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        
        ctx.stroke();

        // Draw waypoints
        ctx.fillStyle = 'rgba(0, 255, 136, 0.8)';
        this.path.forEach((waypoint, index) => {
            ctx.beginPath();
            ctx.arc(waypoint.x, waypoint.y, index === this.currentPathIndex ? 6 : 3, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }
}

/**
 * Delivery Truck Entity
 * Handles truck arrivals and cargo delivery
 */
class DeliveryTruck extends Entity {
    constructor(x, y) {
        super(x, y);
        
        this.type = 'delivery-truck';
        this.entityType = 'truck'; // For cleanup identification
        this.size = { width: 80, height: 40 };
        this.color = '#ff6b6b';
        this.movementSpeed = 60;
        
        // Truck-specific properties
        this.cargo = [];
        this.maxCargo = 8;
        this.arrivalTime = Date.now();
        this.unloadingProgress = 0;
        this.isUnloading = false;
        this.unloadDuration = 5000; // 5 seconds to unload
        this.hasFinishedTask = false; // For cleanup tracking
        this.isDeparting = false;
        
        // Animation properties
        this.animationFrame = 0;
        this.exhaustParticles = [];
        
        // Enhanced movement for proper pathfinding
        this.enhancedMovement = new EnhancedMovement(this);
        
        // Delivery manifest
        this.manifest = this.generateManifest();
        
        console.log(`🚚 Delivery truck arrived with ${this.manifest.length} items`);
    }

    generateManifest() {
        const items = [];
        const itemCount = Math.floor(Math.random() * this.maxCargo) + 2;
        const hardwareTypes = ['GPU', 'SSD', 'CPU', 'RAM', 'PSU', 'Motherboard'];
        
        for (let i = 0; i < itemCount; i++) {
            const type = hardwareTypes[Math.floor(Math.random() * hardwareTypes.length)];
            items.push({
                type: type,
                priority: Math.random() > 0.7 ? 'high' : 'medium',
                value: 1000 + Math.random() * 4000
            });
        }
        
        return items;
    }

    update(deltaTime) {
        this.animationFrame += deltaTime * 2;
        this.updateExhaustParticles(deltaTime);
        
        // Update enhanced movement
        if (this.enhancedMovement) {
            this.enhancedMovement.update(deltaTime);
        }
        
        if (this.isUnloading) {
            this.unloadingProgress += deltaTime * 1000;
            
            // Periodically unload items
            const itemsToUnload = Math.floor(this.unloadingProgress / (this.unloadDuration / this.manifest.length));
            if (itemsToUnload > this.cargo.length && this.cargo.length < this.manifest.length) {
                this.unloadNextItem();
            }
            
            // Complete unloading
            if (this.unloadingProgress >= this.unloadDuration) {
                this.completeUnloading();
            }
        }
        
        // Generate exhaust particles while moving
        const isMoving = this.enhancedMovement ? this.enhancedMovement.isMoving : 
                        (this.velocity.x !== 0 || this.velocity.y !== 0);
        if (isMoving && Math.random() < 0.3) {
            this.addExhaustParticle();
        }
    }

    startUnloading() {
        this.isUnloading = true;
        this.unloadingProgress = 0;
        
        // Stop movement using enhanced movement system
        if (this.enhancedMovement) {
            this.enhancedMovement.stopMovement();
        }
        this.velocity.x = 0;
        this.velocity.y = 0;
        
        console.log(`🚚 Starting to unload ${this.manifest.length} items`);
    }

    unloadNextItem() {
        if (this.cargo.length < this.manifest.length) {
            const itemData = this.manifest[this.cargo.length];
            
            // Create hardware item at truck position with slight offset
            const offsetX = 20 + Math.random() * 40;
            const offsetY = 50 + Math.random() * 20;
            
            const hardwareItem = HardwareFactory.createHardware(
                itemData.type,
                this.position.x + offsetX,
                this.position.y + offsetY,
                { priority: itemData.priority, value: itemData.value }
            );
            
            hardwareItem.location = 'loading-bay';
            hardwareItem.status = 'available';
            
            this.cargo.push(hardwareItem);
            
            // Add to simulation
            if (window.simulation) {
                window.simulation.hardwareItems.push(hardwareItem);
                window.simulation.entities.push(hardwareItem);
                window.simulation.inventoryManager.addItem(hardwareItem);
                window.simulation.addNotification(`Unloaded ${itemData.type}`, 'success');
            }
        }
    }

    completeUnloading() {
        this.isUnloading = false;
        console.log(`✅ Unloading complete: ${this.cargo.length} items delivered`);
        
        // Start departure sequence
        setTimeout(() => {
            this.startDeparture();
        }, 2000);
    }

    startDeparture() {
        this.isDeparting = true;
        
        // Move truck off-screen using enhanced movement
        if (this.enhancedMovement && window.simulation && window.simulation.pathfindingSystem) {
            this.enhancedMovement.startMovement(-150, this.position.y, window.simulation.pathfindingSystem);
        } else {
            // Fallback to basic movement
            this.moveTo(-150, this.position.y, this.movementSpeed);
        }
        
        if (window.simulation) {
            window.simulation.addNotification('Delivery truck departing', 'info');
        }
        
        // Mark task as finished after departure starts
        setTimeout(() => {
            this.hasFinishedTask = true;
        }, 1000);
    }

    addExhaustParticle() {
        this.exhaustParticles.push({
            x: this.position.x - 10 + Math.random() * 20,
            y: this.position.y + this.size.height,
            life: 1.0,
            size: 3 + Math.random() * 4,
            velocity: {
                x: -20 + Math.random() * 40,
                y: 10 + Math.random() * 20
            }
        });
    }

    updateExhaustParticles(deltaTime) {
        this.exhaustParticles = this.exhaustParticles.filter(particle => {
            particle.life -= deltaTime * 2;
            particle.x += particle.velocity.x * deltaTime;
            particle.y += particle.velocity.y * deltaTime;
            return particle.life > 0;
        });
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();

        // Render exhaust particles
        this.renderExhaustParticles(ctx);

        // Truck body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);

        // Truck cab
        ctx.fillStyle = '#d63031';
        ctx.fillRect(this.position.x, this.position.y + 5, 25, 30);

        // Cargo area
        ctx.strokeStyle = '#2d3436';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.position.x + 25, this.position.y, 55, this.size.height);

        // Wheels
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.arc(this.position.x + 15, this.position.y + this.size.height, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.position.x + 65, this.position.y + this.size.height, 8, 0, Math.PI * 2);
        ctx.fill();

        // Unloading indicator
        if (this.isUnloading) {
            const progress = this.unloadingProgress / this.unloadDuration;
            ctx.fillStyle = 'rgba(0, 255, 136, 0.8)';
            ctx.fillRect(this.position.x, this.position.y - 10, this.size.width * progress, 4);
            
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('UNLOADING', this.position.x + this.size.width / 2, this.position.y - 18);
        }

        ctx.restore();
    }

    renderExhaustParticles(ctx) {
        this.exhaustParticles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life * 0.6;
            ctx.fillStyle = '#95a5a6';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
}

/**
 * Forklift Entity
 * Handles material transport between locations
 */
class Forklift extends Entity {
    constructor(x, y) {
        super(x, y);
        
        this.type = 'forklift';
        this.size = { width: 40, height: 35 }; // Made larger for better visibility
        this.color = '#e67e22'; // Orange color
        this.movementSpeed = 80;
        
        // Forklift-specific properties
        this.carriedItems = [];
        this.maxCarryCapacity = 3;
        this.isCarrying = false;
        this.currentTask = null;
        
        // Enhanced movement for pathfinding
        this.enhancedMovement = new EnhancedMovement(this);
        
        // Animation
        this.animationFrame = 0;
        this.forkHeight = 0; // 0 = down, 1 = up
        
        console.log('🏗️ Forklift ready for service');
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        this.animationFrame += deltaTime * 3;
        
        if (this.enhancedMovement) {
            this.enhancedMovement.update(deltaTime);
        }
        
        // Update carried items positions
        this.updateCarriedItems();
        
        // Process current task
        this.processTask(deltaTime);
    }

    updateCarriedItems() {
        this.carriedItems.forEach((item, index) => {
            if (item && item.position) {
                item.position.x = this.position.x + 5;
                item.position.y = this.position.y - 15 - (index * 8);
                item.status = 'being-transported';
            }
        });
    }

    pickupItem(item) {
        if (this.carriedItems.length < this.maxCarryCapacity && item) {
            this.carriedItems.push(item);
            item.status = 'being-transported';
            item.visible = false; // Hide individual item, forklift will represent it
            this.isCarrying = true;
            this.forkHeight = 1; // Raise forks
            
            console.log(`🏗️ Forklift picked up ${item.hardwareType}`);
            
            if (window.simulation) {
                window.simulation.addNotification(`Forklift: Picked up ${item.hardwareType}`, 'info');
            }
        }
    }

    dropoffItems(x, y) {
        this.carriedItems.forEach((item, index) => {
            if (item) {
                item.position.x = x + (index * 25);
                item.position.y = y;
                item.visible = true;
                item.status = 'available';
                
                console.log(`🏗️ Forklift dropped off ${item.hardwareType}`);
            }
        });
        
        if (window.simulation) {
            window.simulation.addNotification(`Forklift: Dropped off ${this.carriedItems.length} items`, 'success');
        }
        
        this.carriedItems = [];
        this.isCarrying = false;
        this.forkHeight = 0; // Lower forks
    }

    assignTask(task) {
        this.currentTask = task;
        console.log(`🏗️ Forklift assigned task: ${task.type}`);
    }

    processTask(deltaTime) {
        // Simple task processing - can be expanded
        if (this.currentTask && !this.enhancedMovement.isMoving) {
            // Task completed when forklift stops moving
            this.currentTask = null;
        }
    }

    moveToLocation(targetX, targetY, pathfindingSystem) {
        if (this.enhancedMovement) {
            this.enhancedMovement.startMovement(targetX, targetY, pathfindingSystem);
        } else {
            this.moveTo(targetX, targetY, this.movementSpeed);
        }
    }

    pickupAndMove(item, targetX, targetY) {
        if (!item || this.isCarrying || this.enhancedMovement.isMoving) {
            return false;
        }

        // Create a task to pickup item and move it
        const task = {
            type: 'pickup-and-move',
            item: item,
            targetX: targetX,
            targetY: targetY,
            phase: 'moving-to-item' // phases: moving-to-item, picking-up, moving-to-target, dropping-off
        };

        this.assignTask(task);

        // Start movement to item location
        console.log(`🏗️ Forklift starting pickup task for ${item.hardwareType || item.constructor.name}`);
        
        // Get pathfindingSystem from simulation if available
        const pathfindingSystem = window.simulation?.pathfindingSystem;
        
        // Move to item first
        this.moveToLocation(item.position.x, item.position.y, pathfindingSystem);
        
        // Set up completion handler
        this.setupTaskCompletion(task);
        
        return true;
    }

    setupTaskCompletion(task) {
        // Check task progress periodically
        const checkInterval = setInterval(() => {
            if (!this.currentTask || this.currentTask !== task) {
                clearInterval(checkInterval);
                return;
            }

            const pathfindingSystem = window.simulation?.pathfindingSystem;

            if (task.phase === 'moving-to-item' && !this.enhancedMovement.isMoving) {
                // Arrived at item, pick it up
                this.pickupItem(task.item);
                task.phase = 'moving-to-target';
                this.moveToLocation(task.targetX, task.targetY, pathfindingSystem);
                
                if (window.simulation) {
                    window.simulation.addNotification(`🏗️ Forklift: Moving to drop-off location`, 'info');
                }
                
            } else if (task.phase === 'moving-to-target' && !this.enhancedMovement.isMoving) {
                // Arrived at target, drop off
                this.dropoffItems(task.targetX, task.targetY);
                task.phase = 'completed';
                this.currentTask = null;
                clearInterval(checkInterval);
                
                if (window.simulation) {
                    window.simulation.addNotification(`🏗️ Forklift: Task completed!`, 'success');
                }
            }
        }, 100); // Check every 100ms
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();

        // Forklift body (main chassis)
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
        
        // Border for better visibility
        ctx.strokeStyle = '#d35400';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.position.x, this.position.y, this.size.width, this.size.height);

        // Driver compartment
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(this.position.x + 8, this.position.y + 5, 24, 20);

        // Wheels
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.position.x + 2, this.position.y + this.size.height - 5, 8, 5);
        ctx.fillRect(this.position.x + this.size.width - 10, this.position.y + this.size.height - 5, 8, 5);

        // Forks
        const forkY = this.position.y + this.size.height - (this.forkHeight * 12);
        ctx.strokeStyle = '#7f8c8d';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.position.x - 8, forkY);
        ctx.lineTo(this.position.x - 20, forkY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.position.x - 8, forkY + 6);
        ctx.lineTo(this.position.x - 20, forkY + 6);
        ctx.stroke();

        // Mast
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.position.x - 5, this.position.y);
        ctx.lineTo(this.position.x - 5, forkY);
        ctx.stroke();

        // Wheels
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.arc(this.position.x + 8, this.position.y + this.size.height + 3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.position.x + 22, this.position.y + this.size.height + 3, 4, 0, Math.PI * 2);
        ctx.fill();

        // Cargo indicator
        if (this.isCarrying) {
            ctx.fillStyle = 'rgba(0, 255, 136, 0.6)';
            ctx.fillRect(this.position.x - 15, forkY - 5, 12, 8 * this.carriedItems.length);
            
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.carriedItems.length.toString(), this.position.x - 9, forkY + 2);
        }

        // Task indicator
        if (this.currentTask) {
            ctx.fillStyle = '#3498db';
            ctx.fillRect(this.position.x, this.position.y - 8, this.size.width, 3);
        }

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏗️', this.position.x + this.size.width / 2, this.position.y - 12);
        
        // Movement indicator
        if (this.enhancedMovement && this.enhancedMovement.isMoving) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('MOVING', this.position.x + this.size.width / 2, this.position.y + this.size.height + 18);
        }

        ctx.restore();
    }
}

// Make classes available globally for browser environment
window.PathfindingSystem = PathfindingSystem;
window.EnhancedMovement = EnhancedMovement;
window.DeliveryTruck = DeliveryTruck;
window.Forklift = Forklift;