/**
 * AI Robot Agent Module (Simple Version)
 * Visual representation and decision-making logic for the AI agent
 * Phase 2 Hour 4: Robot character with decision display system
 */

/**
 * AI Robot Agent Class
 * Represents the thinking AI agent that manages the data center
 */
class AIRobotAgent extends Entity {
    constructor(x, y) {
        super(x, y);
        
        this.type = 'ai-robot';
        this.size = { width: 40, height: 50 };
        this.color = '#00d4ff';
        
        // AI-specific properties
        this.currentTask = null;
        this.taskQueue = [];
        this.decisionHistory = [];
        this.analysisState = 'idle'; // idle, analyzing, moving, implementing
        this.thoughtBubble = null;
        this.movementSpeed = 80; // Slightly slower than hardware for realism
        
        // Animation properties
        this.animationFrame = 0;
        this.animationType = 'idle'; // idle, thinking, moving, working
        this.facingDirection = 'right'; // left, right
        
        // Decision-making properties
        this.decisionCooldown = 0;
        this.decisionInterval = 5; // seconds between decisions
        this.confidence = 0.8;
        this.learningData = new Map();
        
        // Performance tracking
        this.tasksCompleted = 0;
        this.totalDecisionTime = 0;
        this.averageDecisionTime = 0;
        
        console.log('🤖 AI Robot Agent initialized');
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        this.animationFrame += deltaTime;
        this.decisionCooldown -= deltaTime;
        
        // Update animation type based on current activity
        this.updateAnimationType();
        
        // Process task queue
        this.processTaskQueue(deltaTime);
        
        // Make decisions periodically
        if (this.decisionCooldown <= 0) {
            this.makeDecision();
            this.decisionCooldown = this.decisionInterval;
        }
    }

    updateAnimationType() {
        if (this.taskQueue.length > 0) {
            this.animationType = 'thinking';
        } else if (this.isMoving()) {
            this.animationType = 'moving';
        } else if (this.currentTask) {
            this.animationType = 'working';
        } else {
            this.animationType = 'idle';
        }
    }

    processTaskQueue(deltaTime) {
        if (this.taskQueue.length === 0) return;
        
        const currentTask = this.taskQueue[0];
        
        // Process the current task
        this.currentTask = currentTask;
        
        // Simulate task processing time
        currentTask.timeRemaining -= deltaTime;
        
        if (currentTask.timeRemaining <= 0) {
            this.completeTask(currentTask);
        }
    }

    completeTask(task) {
        console.log(`✅ AI Robot completed task: ${task.type}`);
        
        this.taskQueue.shift();
        this.currentTask = null;
        this.tasksCompleted++;
        
        // Add to decision history
        this.decisionHistory.push({
            timestamp: Date.now(),
            type: task.type,
            decision: `Completed ${task.type}`,
            confidence: this.confidence,
            duration: task.originalDuration - task.timeRemaining
        });
        
        // Update learning data
        this.updateLearningData(task);
    }

    makeDecision() {
        const decisionStart = performance.now();
        
        // Simple decision logic for demonstration
        const decisions = [
            'monitor_systems',
            'optimize_storage', 
            'analyze_performance',
            'plan_maintenance',
            'coordinate_resources'
        ];
        
        const decision = decisions[Math.floor(Math.random() * decisions.length)];
        
        // Add task to queue
        this.addTask({
            type: decision,
            priority: Math.random() > 0.7 ? 'high' : 'medium',
            timeRemaining: 2 + Math.random() * 3, // 2-5 seconds
            originalDuration: 2 + Math.random() * 3
        });
        
        const decisionTime = performance.now() - decisionStart;
        this.totalDecisionTime += decisionTime;
        this.averageDecisionTime = this.totalDecisionTime / (this.decisionHistory.length + 1);
        
        console.log(`🧠 AI Decision: ${decision}`);
    }

    addTask(task) {
        // Insert task based on priority
        if (task.priority === 'high') {
            this.taskQueue.unshift(task);
        } else {
            this.taskQueue.push(task);
        }
        
        this.thoughtBubble = `Processing: ${task.type.replace('_', ' ')}`;
    }

    updateLearningData(completedTask) {
        const taskType = completedTask.type;
        const currentData = this.learningData.get(taskType) || { count: 0, totalTime: 0, successRate: 0.8 };
        
        currentData.count++;
        currentData.totalTime += completedTask.originalDuration;
        currentData.averageTime = currentData.totalTime / currentData.count;
        
        // Improve success rate slightly with experience
        currentData.successRate = Math.min(currentData.successRate + 0.01, 0.95);
        
        this.learningData.set(taskType, currentData);
        
        // Update overall confidence
        const avgSuccessRate = Array.from(this.learningData.values())
            .reduce((sum, data) => sum + data.successRate, 0) / this.learningData.size;
        this.confidence = avgSuccessRate;
    }

    render(ctx, camera) {
        const screenX = this.position.x - camera.x;
        const screenY = this.position.y - camera.y;
        
        // Skip rendering if off-screen
        if (screenX < -100 || screenX > ctx.canvas.width + 100 || 
            screenY < -100 || screenY > ctx.canvas.height + 100) {
            return;
        }
        
        this.renderRobot(ctx, screenX, screenY);
        this.renderThoughtBubble(ctx, screenX, screenY);
        this.renderStatusIndicator(ctx, screenX, screenY);
    }

    renderRobot(ctx, x, y) {
        ctx.save();
        
        // Robot body
        ctx.fillStyle = this.color;
        ctx.fillRect(x - this.size.width/2, y - this.size.height/2, this.size.width, this.size.height);
        
        // Robot head
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 15, y - this.size.height/2 - 10, 30, 15);
        
        // Eyes
        ctx.fillStyle = this.analysisState === 'analyzing' ? '#ff6b35' : '#00ff88';
        ctx.fillRect(x - 10, y - this.size.height/2 - 7, 6, 6);
        ctx.fillRect(x + 4, y - this.size.height/2 - 7, 6, 6);
        
        // Animation effects
        if (this.animationType === 'thinking') {
            const pulse = Math.sin(this.animationFrame * 4) * 0.1 + 1;
            ctx.scale(pulse, pulse);
            
            // Thinking sparkles
            for (let i = 0; i < 3; i++) {
                const sparkleX = x + (Math.sin(this.animationFrame * 2 + i) * 20);
                const sparkleY = y - 30 + (Math.cos(this.animationFrame * 3 + i) * 10);
                
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(sparkleX - 2, sparkleY - 2, 4, 4);
            }
        }
        
        ctx.restore();
    }

    renderThoughtBubble(ctx, x, y) {
        if (!this.thoughtBubble) return;
        
        ctx.save();
        
        // Bubble background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        
        const bubbleWidth = 120;
        const bubbleHeight = 30;
        const bubbleX = x + 25;
        const bubbleY = y - 40;
        
        ctx.fillRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);
        ctx.strokeRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);
        
        // Bubble text
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.thoughtBubble, bubbleX + bubbleWidth/2, bubbleY + bubbleHeight/2 + 4);
        
        ctx.restore();
    }

    renderStatusIndicator(ctx, x, y) {
        // Status circle
        ctx.save();
        
        const radius = 8;
        const indicatorX = x + this.size.width/2 - 5;
        const indicatorY = y - this.size.height/2 + 5;
        
        // Status color based on activity
        let statusColor;
        switch (this.analysisState) {
            case 'analyzing': statusColor = '#ff6b35'; break;
            case 'moving': statusColor = '#ffff00'; break;
            case 'implementing': statusColor = '#00ff88'; break;
            default: statusColor = '#00d4ff'; break;
        }
        
        ctx.fillStyle = statusColor;
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Pulsing effect for active states
        if (this.analysisState !== 'idle') {
            const pulse = Math.sin(this.animationFrame * 6) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            ctx.strokeStyle = statusColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(indicatorX, indicatorY, radius + 5, 0, 2 * Math.PI);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    // Status and metrics methods
    getCurrentStatus() {
        return {
            task: this.currentTask?.type || 'monitoring',
            queueLength: this.taskQueue.length,
            analysisState: this.analysisState,
            confidence: this.confidence,
            tasksCompleted: this.tasksCompleted
        };
    }

    getPerformanceMetrics() {
        return {
            'task-completion-rate': {
                value: this.tasksCompleted / Math.max((Date.now() - this.startTime) / 60000, 1), // tasks per minute
                unit: 'tasks/min',
                status: 'good',
                trend: 'stable'
            },
            'decision-speed': {
                value: this.averageDecisionTime,
                unit: 'ms',
                status: this.averageDecisionTime < 50 ? 'good' : 'warning',
                trend: 'improving'
            },
            'confidence-level': {
                value: this.confidence,
                unit: '%',
                status: this.confidence > 0.8 ? 'good' : 'warning',
                trend: this.confidence > 0.8 ? 'stable' : 'improving'
            },
            'queue-efficiency': {
                value: Math.max(1 - (this.taskQueue.length / 10), 0),
                unit: '%',
                status: this.taskQueue.length < 5 ? 'good' : 'warning',
                trend: 'stable'
            }
        };
    }

    getDetailedStatus() {
        return {
            currentTask: this.currentTask,
            taskQueue: this.taskQueue.slice(0, 3), // Show first 3 tasks
            analysisState: this.analysisState,
            confidence: this.confidence,
            taskQueueLength: this.taskQueue.length,
            learningMetrics: Object.fromEntries(this.learningData),
            recentDecisions: this.decisionHistory.slice(-3)
        };
    }
}

// Make class available globally for browser environment
window.AIRobotAgent = AIRobotAgent;