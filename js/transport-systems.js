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



// Make classes available globally for browser environment
window.PathfindingSystem = PathfindingSystem;
window.EnhancedMovement = EnhancedMovement;
window.DeliveryTruck = DeliveryTruck;