# Ralph's 3D Adventure

An immersive 3D interactive game featuring Ralph, a realistic cream long-haired miniature dachshund, built with React, Three.js, and modern web technologies.

## 🐕 Features

### **Realistic 3D Ralph**
- **Authentic Dachshund Design**: Long body, short legs, floppy ears, and cream-colored long hair
- **Realistic Physics**: Full physics simulation with gravity, friction, and collision detection
- **Dynamic Animations**: Walking, jumping, tail wagging, and mood-based expressions
- **Interactive Elements**: Collar with tag, detailed facial features, and realistic proportions

### **3D Environment**
- **Expansive World**: Large 3D environment with house, fence, trees, bushes, and flowers
- **Physics Objects**: Interactive ball for play, realistic physics on all objects
- **Dynamic Lighting**: Realistic shadows, ambient lighting, and sky simulation
- **Responsive Camera**: Orbit controls for full 360° exploration

### **Multi-Platform Controls**
- **Desktop Controls**: WASD movement, SPACE to bark/jump
- **Mobile Touch Controls**: Intuitive touch interface with movement and action buttons
- **Special Interactions**: Pet, treat, play, and belly rub options when close to Ralph

### **Advanced Features**
- **Mood System**: Ralph's mood changes based on interactions (happy, excited, curious)
- **Sound Effects**: Different audio feedback for each interaction type
- **Statistics Tracking**: Real-time tracking of pets, treats, play sessions, and barks
- **Interaction History**: Log of all interactions with timestamps

## 🎮 How to Play

### **Getting Started**
1. **Desktop**: Use WASD keys to move Ralph around the 3D world
2. **Mobile**: Use the touch controls at the bottom of the screen
3. **Interactions**: Get close to Ralph to see special interaction buttons
4. **Exploration**: Use mouse/touch to rotate the camera and explore the environment

### **Controls**

#### **Desktop Controls**
- **W/↑**: Move forward
- **S/↓**: Move backward  
- **A/←**: Move left
- **D/→**: Move right
- **SPACE**: Bark and jump
- **Mouse**: Rotate camera view

#### **Mobile Controls**
- **Arrow Buttons**: Movement controls
- **Bark Button**: Make Ralph bark
- **Jump Button**: Make Ralph jump
- **Ball Button**: Play with the ball

#### **Special Interactions** (when close to Ralph)
- **🖐️ Pet**: Gentle petting interaction
- **🦴 Treat**: Give Ralph a treat
- **🎾 Play**: Play with Ralph
- **🤗 Belly Rub**: Give Ralph a belly rub

## 🛠️ Technical Details

### **Technologies Used**
- **React 18** with TypeScript for the UI framework
- **Three.js** for 3D graphics and rendering
- **React Three Fiber** for React integration with Three.js
- **React Three Cannon** for physics simulation
- **React Three Drei** for 3D utilities and helpers
- **Tailwind CSS** for styling and responsive design
- **Vite** for fast development and building

### **3D Features**
- **Realistic Physics**: Full physics engine with gravity, collision detection
- **Dynamic Lighting**: Ambient, directional, and environmental lighting
- **Shadow Mapping**: Realistic shadows cast by all objects
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Performance Optimized**: Efficient rendering and physics calculations

## 📱 Mobile Experience

### **Touch Optimizations**
- **Large Touch Targets**: All buttons sized for comfortable touch interaction
- **Responsive Layout**: Adapts to different screen sizes and orientations
- **Touch Feedback**: Visual feedback for all touch interactions
- **Accessibility**: Designed with accessibility in mind

### **Performance**
- **Optimized Rendering**: Efficient 3D rendering for mobile devices
- **Touch Controls**: Smooth and responsive touch input handling
- **Battery Efficient**: Optimized for mobile battery life

## 🎨 Visual Design

### **Ralph's Design**
- **Cream Long Hair**: Realistic fur texture and coloring
- **Dachshund Proportions**: Authentic long body and short legs
- **Expressive Features**: Detailed eyes, nose, and facial expressions
- **Dynamic Animations**: Smooth walking, jumping, and tail wagging

### **Environment Design**
- **Cozy House**: Detailed 3D house with windows, door, and chimney
- **Natural Elements**: Trees, bushes, flowers, and grass
- **Fence Boundary**: Wooden fence surrounding the play area
- **Atmospheric Lighting**: Warm, inviting lighting setup

## 🚀 Getting Started

### **Prerequisites**
- Node.js (version 16 or higher)
- npm or yarn

### **Installation**
1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Fetch a CC0/royalty‑free rigged dachshund model to vendor into the repo:
   - Provide a direct .glb URL via env var and run the fetcher:
     ```bash
     DACHSHUND_URL="<direct_cc0_dachshund_glb_url>" npm run fetch:dachshund
     ```
   - This saves the file to `public/models/dachshund.glb`. Add attribution text to `public/models/LICENSE-dachshund.txt` (or set `DACHSHUND_LICENSE` env var when running the fetch command).
   - Alternatively, you can drop your own `public/models/dachshund.glb` manually.

### **Running the Game**
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:5173`

3. Start exploring Ralph's 3D world!

If you didn’t vendor a model, the app falls back to a small, rigged Fox sample (CC0) until a dachshund model is added.

### **Building for Production**
```bash
npm run build
npm run preview
```

## 🎯 Game Objectives

### **Interaction Goals**
- **Build Relationship**: Interact with Ralph to build a bond
- **Explore Environment**: Discover all areas of the 3D world
- **Collect Statistics**: Track your interactions and see your progress
- **Enjoy the Experience**: Relax and enjoy spending time with Ralph

### **Achievements**
- **Pet Master**: Give Ralph lots of pets
- **Treat Giver**: Provide treats to keep Ralph happy
- **Play Partner**: Engage in play sessions
- **Bark Buddy**: Encourage Ralph's vocal expressions

## 🔧 Customization

### **Modifying Ralph**
- Adjust colors, proportions, and animations in `src/components/Ralph.tsx`
- Add new interaction types and animations
- Modify physics properties for different behaviors

### **Environment Changes**
- Add new 3D objects and structures
- Modify lighting and atmosphere
- Create new interactive elements

### **Adding Features**
- Implement new interaction types
- Add sound effects and music
- Create new game modes or challenges

## 🌟 Future Enhancements

### **Planned Features**
- **More Environments**: Different locations and settings
- **Advanced AI**: Ralph's autonomous behavior and personality
- **Multiplayer**: Play with friends and their virtual pets
- **Customization**: Dress up Ralph with accessories
- **Mini-games**: Interactive games and challenges
- **Story Mode**: Narrative-driven gameplay

### **Technical Improvements**
- **Enhanced Graphics**: More detailed textures and effects
- **Advanced Physics**: More realistic movement and interactions
- **Audio Enhancement**: Spatial audio and environmental sounds
- **VR Support**: Virtual reality compatibility

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues, feature requests, or pull requests to improve Ralph's 3D adventure.

---

**Enjoy your time with Ralph in his 3D world! 🐕✨**
