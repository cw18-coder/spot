# Data Center Hardware Management Simulation - User Guide

## 📁 Project Setup

### Quick Start (Single File)
1. **Download the HTML file** from the artifact
2. **Save as** `index.html` in any folder on your system
3. **Open** `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)
4. The simulation will automatically load and initialize

### Full Project Structure (Optional)
If you want to expand the project with separate modules:

```
data-center-simulation/
├── index.html                 # Main application file
├── css/
│   ├── styles.css            # Layout and visual styling
│   └── animations.css        # Movement and transition effects
└── js/
    ├── main.js               # Main application logic
    ├── hardware-entities.js  # Hardware classes and inventory
    ├── interaction-zones.js  # Zone management system
    └── ai-agent.js           # AI decision making (future)
```

### System Requirements
- **Modern web browser** with HTML5 Canvas support
- **JavaScript enabled**
- **Minimum 1200x800 screen resolution** (responsive design)
- No server required - runs entirely in the browser

---

## 🎮 Simulation Controls

### Main Control Bar
| Button | Action |
|--------|---------|
| **⏸️ Pause/▶️ Play** | Toggle simulation on/off |
| **1x Speed** | Cycle through speeds (0.5x, 1x, 2x, 4x) |
| **🔄 Reset** | Restart simulation with fresh demo data |
| **🏠 Reset View** | Return camera to default position and zoom |

### Location Tabs
- **Overview** - See all three locations at once
- **Loading Bay** - Detailed view of truck docks and staging
- **Storage Room** - AI-optimized storage with bins and aisles  
- **Server Floor** - Active server racks and installations

### Camera Controls
| Input | Action |
|-------|---------|
| **Mouse Wheel** | Zoom in/out (0.5x to 3x) |
| **Click + Drag** | Pan around the view |
| **Reset View Button** | Return to default zoom and position |

---

## 🖱️ Interactive Features

### Hardware Selection
- **Click** any hardware item to select it
- Selected items show **white dashed border** and **glow effect**
- Hardware details appear in **AI Thought Bubble** (top right)
- **ESC** key deselects all items

### Hardware Details Display
When selecting hardware, you'll see:
- **Type** (GPU, SSD, CPU, RAM, PSU, Motherboard)
- **Serial Number** (auto-generated)
- **Status** (available, reserved, installed, in-transit, etc.)
- **Location** (loading-bay, storage-room, server-floor)
- **Value** in USD

### Keyboard Shortcuts
| Key Combination | Action |
|-----------------|---------|
| **Shift + G** | Create new GPU |
| **Shift + S** | Create new SSD |
| **Shift + C** | Create new CPU |
| **Shift + R** | Create new RAM |
| **Shift + M** | Move selected item to random location |
| **Delete** | Remove selected item |
| **Escape** | Deselect all items |

---

## 📊 Understanding the Interface

### AI Agent Panel (Top Right)
- **Current Task** - What the AI is analyzing
- **Thought Bubble** - Hardware details or AI reasoning
- Shows real-time decision making process

### Performance Metrics (Top Left)
- **Inventory Efficiency** - How well storage is organized (85-99%)
- **Average Response Time** - Time to locate/move items (1.5-4.0 min)
- **Storage Utilization** - Percentage of capacity used (65-90%)

### Event Notifications (Bottom Right)
- Real-time log of simulation events
- Color-coded by importance:
  - 🔵 **Blue** - Information
  - 🟡 **Yellow** - Warnings  
  - 🟢 **Green** - Success
  - 🔴 **Red** - Errors

### Status Bar (Bottom)
- **Simulation Time** - Elapsed time in MM:SS format
- **Current View** - Active location tab
- **Zoom Level** - Current zoom percentage
- **FPS Counter** - Performance indicator
- **Entity Count** - Total hardware items

---

## 🤖 AI Behavior & Automation

### Automatic Events
The simulation runs several automated processes:

- **Every 10 seconds**: AI optimizes item placement by moving available hardware
- **Every 30 seconds**: Truck arrivals deliver 1-3 new random hardware items
- **Continuous**: Health monitoring, status updates, and metrics calculation

### Hardware Status Colors
Items display status via colored bars at the top:
- 🟢 **Green** - Available for use
- 🟡 **Yellow** - Reserved or in maintenance  
- 🔵 **Blue** - Successfully installed
- 🟠 **Orange** - In transit (being moved)
- 🔴 **Red** - Failed or needs attention

### Location-Specific Views

#### Loading Bay
- **Truck docks** with arrival/departure animations
- **Pallet staging area** with incoming inventory
- **Quality control station** for hardware inspection
- **Temporary storage** for overflow items

#### Storage Room  
- **AI-optimized aisles** with color-coded efficiency
- **Storage bins** showing capacity and contents
- **Climate control zones** with temperature monitoring
- **Replenishment queue** for low-stock items

#### Server Floor
- **Server racks** with health status indicators
- **Installation staging area** with tools and equipment
- **Monitoring station** with system dashboards
- **Emergency response station** for quick repairs

---

## 🎯 Demo Scenarios & Tips

### Getting Started
1. **Load the simulation** - Watch the loading screen initialize
2. **Explore locations** - Click through different view tabs
3. **Select hardware** - Click items to see their properties
4. **Create new items** - Use Shift+G/S/C/R shortcuts
5. **Watch AI behavior** - Observe automatic movements and optimizations

### Things to Try
- **Create multiple GPUs** (Shift+G) and watch them get organized
- **Switch between locations** to see different operational areas
- **Select items in different locations** to compare statuses
- **Watch truck arrivals** happen automatically every 30 seconds
- **Use different zoom levels** to see detailed vs. overview information

### Performance Tips
- The simulation targets **60 FPS** for smooth animations
- **Entity count** is displayed in status bar - more items = more processing
- Use **Reset** button if performance degrades with too many items
- **Pause** simulation when making lots of manual changes

---

## 🚀 Future Development

This simulation is designed for hackathon demonstration and proof-of-concept. Future enhancements could include:

- **Real inventory integration** via APIs
- **Advanced AI algorithms** for predictive analytics  
- **Multi-user collaboration** features
- **3D visualization** with WebGL
- **Mobile device support** with touch controls
- **Data export** capabilities for reporting

---

## 🐛 Troubleshooting

### Common Issues
- **Blank screen**: Ensure JavaScript is enabled in browser
- **Poor performance**: Try reducing entity count with Reset button
- **No interactions**: Check browser console for error messages
- **Layout issues**: Refresh page or try different browser

### Browser Compatibility
- ✅ **Chrome 90+** (Recommended)
- ✅ **Firefox 88+**
- ✅ **Safari 14+**  
- ✅ **Edge 90+**
- ❌ Internet Explorer (not supported)

### Debug Information
- Open **browser console** (F12) to see detailed logs
- **FPS counter** in status bar indicates performance
- **Entity count** shows simulation complexity
- All user actions are logged to notifications panel