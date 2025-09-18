class AIRobotAgent extends Entity {
    constructor(x, y) {
        super(x, y);
        this.entityType = 'ai-robot';
        this.size = { width: 60, height: 70 };
        this.color = '#c0c0c0';
        this.currentTask = 'Patrolling data center';
        this.currentLocation = 'loading-bay';
        this.decisionLog = [];
        this.isMoving = false;
        this.movementSpeed = 3;
        this.targetLocation = null;
        this.targetPosition = null;
        this.lastDecisionTime = 0;
        this.decisionInterval = 8000;
        this.patrolCycle = 0;
        
        this.basicTasks = [
            'Checking inventory levels',
            'Monitoring hardware status', 
            'Analyzing storage efficiency',
            'Planning maintenance routes',
            'Updating system logs',
            'Scanning for anomalies'
        ];
        
        this.addDecision('AI Robot initialized');
        setTimeout(() => this.startPatrol(), 2000);
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        this.handleMovement(deltaTime);
        
        if (Date.now() - this.lastDecisionTime > this.decisionInterval) {
            this.makeDecision();
            this.lastDecisionTime = Date.now();
        }
    }
    
    handleMovement(deltaTime) {
        if (this.targetPosition && this.isMoving) {
            const dx = this.targetPosition.x - this.position.x;
            const dy = this.targetPosition.y - this.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                const moveX = (dx / distance) * this.movementSpeed;
                const moveY = (dy / distance) * this.movementSpeed;
                this.position.x += moveX;
                this.position.y += moveY;
            } else {
                this.position.x = this.targetPosition.x;
                this.position.y = this.targetPosition.y;
                this.isMoving = false;
                this.targetPosition = null;
                this.addDecision('Arrived at ' + this.targetLocation.replace('-', ' '));
                this.currentTask = 'Analyzing ' + this.targetLocation.replace('-', ' ');
                this.currentLocation = this.targetLocation;
                this.targetLocation = null;
            }
        }
    }
    
    makeDecision() {
        const task = this.basicTasks[Math.floor(Math.random() * this.basicTasks.length)];
        this.addDecision('Decision: ' + task);
        this.currentTask = task;
    }
    
    startPatrol() {
        const locations = ['loading-bay', 'storage-room', 'server-floor'];
        const nextLocation = locations[this.patrolCycle % locations.length];
        this.patrolCycle++;
        
        this.moveToLocation(nextLocation);
        this.addDecision('Moving to ' + nextLocation);
        setTimeout(() => this.startPatrol(), 15000);
    }
    
    addDecision(decision) {
        this.decisionLog.unshift({
            timestamp: new Date().toLocaleTimeString(),
            decision: decision
        });
        
        if (this.decisionLog.length > 10) {
            this.decisionLog.pop();
        }
    }
    
    moveToLocation(locationName) {
        const locations = {
            'loading-bay': { x: 120, y: 280 },
            'storage-room': { x: 480, y: 320 },  
            'server-floor': { x: 750, y: 320 }
        };
        
        if (locations[locationName]) {
            this.targetLocation = locationName;
            this.targetPosition = locations[locationName];
            this.isMoving = true;
            this.currentTask = 'Moving to ' + locationName.replace('-', ' ');
        }
    }
    
    getCurrentDecision() {
        return this.decisionLog.length > 0 ? this.decisionLog[0].decision : 'Initializing...';
    }
    
    getDecisionHistory() {
        return this.decisionLog;
    }
    
    render(ctx, debugMode = false) {
        ctx.save();
        
        // Robot shadow for depth
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.position.x + 3, this.position.y + 45, 25, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Quantum Core Bot - Robot 9 Design
        const time = Date.now() * 0.003;
        
        // Crystalline body structure
        ctx.fillStyle = 'rgba(147, 197, 253, 0.3)';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        
        // Main body - crystal facets
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y - 15);
        ctx.lineTo(this.position.x - 20, this.position.y);
        ctx.lineTo(this.position.x - 15, this.position.y + 25);
        ctx.lineTo(this.position.x + 15, this.position.y + 25);
        ctx.lineTo(this.position.x + 20, this.position.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Secondary crystal layers for depth
        ctx.fillStyle = 'rgba(196, 181, 253, 0.2)';
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y - 10);
        ctx.lineTo(this.position.x - 15, this.position.y + 5);
        ctx.lineTo(this.position.x - 10, this.position.y + 20);
        ctx.lineTo(this.position.x + 10, this.position.y + 20);
        ctx.lineTo(this.position.x + 15, this.position.y + 5);
        ctx.closePath();
        ctx.fill();
        
        // Quantum core - pulsing energy center
        const coreGlow = 0.5 + 0.5 * Math.sin(time * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${coreGlow})`;
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y + 5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner quantum core
        ctx.fillStyle = `rgba(255, 255, 255, ${coreGlow * 0.8})`;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y + 5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Particle effects around core
        for (let i = 0; i < 8; i++) {
            const angle = time + (i * Math.PI) / 4;
            const radius = 15 + 3 * Math.sin(time * 3 + i);
            const px = this.position.x + Math.cos(angle) * radius;
            const py = this.position.y + 5 + Math.sin(angle) * radius;
            
            const particleGlow = 0.3 + 0.4 * Math.sin(time * 2 + i);
            ctx.fillStyle = `rgba(236, 72, 153, ${particleGlow})`;
            ctx.shadowColor = '#ec4899';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Energy field lines
        ctx.strokeStyle = `rgba(167, 243, 208, ${0.4 + coreGlow * 0.3})`;
        ctx.lineWidth = 1;
        ctx.shadowColor = '#a7f3d0';
        ctx.shadowBlur = 8;
        
        for (let i = 0; i < 4; i++) {
            const fieldAngle = time * 0.5 + (i * Math.PI) / 2;
            const fieldRadius = 25 + 5 * Math.sin(time * 2 + i);
            const startX = this.position.x + Math.cos(fieldAngle) * 12;
            const startY = this.position.y + 5 + Math.sin(fieldAngle) * 12;
            const endX = this.position.x + Math.cos(fieldAngle) * fieldRadius;
            const endY = this.position.y + 5 + Math.sin(fieldAngle) * fieldRadius;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
        
        // Crystal head
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(196, 181, 253, 0.4)';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y - 35);
        ctx.lineTo(this.position.x - 12, this.position.y - 20);
        ctx.lineTo(this.position.x - 8, this.position.y - 15);
        ctx.lineTo(this.position.x + 8, this.position.y - 15);
        ctx.lineTo(this.position.x + 12, this.position.y - 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Crystal head inner glow
        ctx.fillStyle = `rgba(147, 197, 253, ${0.2 + coreGlow * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y - 32);
        ctx.lineTo(this.position.x - 8, this.position.y - 22);
        ctx.lineTo(this.position.x - 5, this.position.y - 18);
        ctx.lineTo(this.position.x + 5, this.position.y - 18);
        ctx.lineTo(this.position.x + 8, this.position.y - 22);
        ctx.closePath();
        ctx.fill();
        
        // Quantum eyes
        ctx.fillStyle = `rgba(167, 243, 208, ${coreGlow})`;
        ctx.shadowColor = '#a7f3d0';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.position.x - 4, this.position.y - 22, 2, 0, Math.PI * 2);
        ctx.arc(this.position.x + 4, this.position.y - 22, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Movement trail (only in debug mode)
        if (debugMode && this.isMoving && this.targetPosition) {
            ctx.strokeStyle = '#00e676';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(this.targetPosition.x, this.targetPosition.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Thought bubble
        this.renderThoughtBubble(ctx);
        
        ctx.restore();
    }
    
    renderThoughtBubble(ctx) {
        if (!this.currentTask) return;
        
        const bubbleX = this.position.x + 40;
        const bubbleY = this.position.y - 60;
        const bubbleWidth = 140;
        const bubbleHeight = 40;
        
        // Main bubble
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        this.roundRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, 15);
        ctx.fill();
        ctx.stroke();
        
        // Bubble tail
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.moveTo(bubbleX - 5, bubbleY + 25);
        ctx.lineTo(this.position.x + 15, this.position.y - 30);
        ctx.lineTo(bubbleX + 10, bubbleY + 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Smaller thought bubbles
        for (let i = 0; i < 3; i++) {
            const smallX = this.position.x + 20 + i * 8;
            const smallY = this.position.y - 35 - i * 3;
            const radius = 3 - i * 0.5;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(smallX, smallY, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        
        // Bubble text
        ctx.fillStyle = '#333';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        const text = this.currentTask.length > 20 ? this.currentTask.substring(0, 17) + '...' : this.currentTask;
        ctx.fillText(text, bubbleX + 8, bubbleY + bubbleHeight/2 - 5);
        
        // Status icon and action text
        const icon = this.isMoving ? '🚶' : '🔍';
        const action = this.isMoving ? 'Moving...' : 'Analyzing...';
        ctx.font = '9px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText(action, bubbleX + 8, bubbleY + bubbleHeight/2 + 8);
        
        ctx.font = '14px Arial';
        ctx.fillText(icon, bubbleX + bubbleWidth - 25, bubbleY + bubbleHeight/2);
    }
    
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}