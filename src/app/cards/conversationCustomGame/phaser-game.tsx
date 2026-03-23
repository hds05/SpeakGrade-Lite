'use client';

import { useEffect, useRef, useState } from 'react';

// Simple game configuration
const GAME_CONFIG = {
  width: (typeof window !== 'undefined' ? window.innerWidth : 1200) || 1200,   // Full viewport width
  height: (typeof window !== 'undefined' ? window.innerHeight : 800) || 800,  // Full viewport height  
  worldWidth: 3600,  // Reduced map size for better organization
  worldHeight: 2700, // Reduced map size for better organization
  playerSpeed: 220,
  treePositions: [
    // Horizontal tree paths creating organized walkways
    
    // Central area cleared - no trees in the middle for open gameplay
    
    // Two-row tree border closer to map limits
    // Top border trees with open path to airport
    { id: 1, x: 200, y: 150, type: 'green-tree' },
    { id: 2, x: 400, y: 150, type: 'dark-green' },
    { id: 3, x: 600, y: 150, type: 'green-tree' },
    { id: 4, x: 800, y: 150, type: 'dark-green' },
    { id: 5, x: 1000, y: 150, type: 'green-tree' },
    { id: 6, x: 1200, y: 150, type: 'dark-green' },
    { id: 7, x: 1400, y: 150, type: 'green-tree' },
    { id: 8, x: 1600, y: 150, type: 'dark-green' },
    { id: 9, x: 1800, y: 150, type: 'green-tree' },
    { id: 10, x: 2000, y: 150, type: 'dark-green' },
    { id: 11, x: 2200, y: 150, type: 'green-tree' },
    { id: 12, x: 2400, y: 150, type: 'dark-green' },
    { id: 13, x: 2600, y: 150, type: 'green-tree' },
    
    // Trees removed from airport area for better visibility
    
    // Inner row with gap for airport access
    { id: 18, x: 300, y: 250, type: 'dark-green' },
    { id: 19, x: 500, y: 250, type: 'green-tree' },
    { id: 20, x: 700, y: 250, type: 'dark-green' },
    { id: 21, x: 900, y: 250, type: 'green-tree' },
    { id: 22, x: 1100, y: 250, type: 'dark-green' },
    { id: 23, x: 1300, y: 250, type: 'green-tree' },
    { id: 24, x: 1500, y: 250, type: 'dark-green' },
    { id: 25, x: 1700, y: 250, type: 'green-tree' },
    { id: 26, x: 1900, y: 250, type: 'dark-green' },
    { id: 27, x: 2100, y: 250, type: 'green-tree' },
    { id: 28, x: 2300, y: 250, type: 'dark-green' },
    { id: 29, x: 2500, y: 250, type: 'green-tree' },
    { id: 30, x: 2700, y: 250, type: 'dark-green' },
    
    // Outer row - Bottom border (evenly spaced at 200 units)
    { id: 34, x: 200, y: 2450, type: 'green-tree' },
    { id: 35, x: 400, y: 2450, type: 'dark-green' },
    { id: 36, x: 600, y: 2450, type: 'green-tree' },
    { id: 37, x: 800, y: 2450, type: 'dark-green' },
    { id: 38, x: 1000, y: 2450, type: 'green-tree' },
    { id: 39, x: 1200, y: 2450, type: 'dark-green' },
    { id: 40, x: 1400, y: 2450, type: 'green-tree' },
    { id: 41, x: 1600, y: 2450, type: 'dark-green' },
    { id: 42, x: 1800, y: 2450, type: 'green-tree' },
    { id: 43, x: 2000, y: 2450, type: 'dark-green' },
    { id: 44, x: 2200, y: 2450, type: 'green-tree' },
    { id: 45, x: 2400, y: 2450, type: 'dark-green' },
    { id: 46, x: 2600, y: 2450, type: 'green-tree' },
    { id: 47, x: 2800, y: 2450, type: 'dark-green' },
    { id: 48, x: 3000, y: 2450, type: 'green-tree' },
    { id: 49, x: 3200, y: 2450, type: 'dark-green' },
    { id: 50, x: 3400, y: 2450, type: 'green-tree' },
    
    // Inner row - Bottom border (offset by 100 units for staggered effect)
    { id: 51, x: 300, y: 2350, type: 'dark-green' },
    { id: 52, x: 500, y: 2350, type: 'green-tree' },
    { id: 53, x: 700, y: 2350, type: 'dark-green' },
    { id: 54, x: 900, y: 2350, type: 'green-tree' },
    { id: 55, x: 1100, y: 2350, type: 'dark-green' },
    { id: 56, x: 1300, y: 2350, type: 'green-tree' },
    { id: 57, x: 1500, y: 2350, type: 'dark-green' },
    { id: 58, x: 1700, y: 2350, type: 'green-tree' },
    { id: 59, x: 1900, y: 2350, type: 'dark-green' },
    { id: 60, x: 2100, y: 2350, type: 'green-tree' },
    { id: 61, x: 2300, y: 2350, type: 'dark-green' },
    { id: 62, x: 2500, y: 2350, type: 'green-tree' },
    { id: 63, x: 2700, y: 2350, type: 'dark-green' },
    { id: 64, x: 2900, y: 2350, type: 'green-tree' },
    { id: 65, x: 3100, y: 2350, type: 'dark-green' },
    { id: 66, x: 3300, y: 2350, type: 'green-tree' },
    
    // Outer row - Left border (evenly spaced at 200 units)
    { id: 67, x: 150, y: 400, type: 'green-tree' },
    { id: 68, x: 150, y: 600, type: 'dark-green' },
    { id: 69, x: 150, y: 800, type: 'green-tree' },
    { id: 70, x: 150, y: 1000, type: 'dark-green' },
    { id: 71, x: 150, y: 1200, type: 'green-tree' },
    { id: 72, x: 150, y: 1400, type: 'dark-green' },
    { id: 73, x: 150, y: 1600, type: 'green-tree' },
    { id: 74, x: 150, y: 1800, type: 'dark-green' },
    { id: 75, x: 150, y: 2000, type: 'green-tree' },
    { id: 76, x: 150, y: 2200, type: 'dark-green' },
    
    // Inner row - Left border (offset by 100 units for staggered effect)
    { id: 77, x: 250, y: 500, type: 'dark-green' },
    { id: 78, x: 250, y: 700, type: 'green-tree' },
    { id: 79, x: 250, y: 900, type: 'dark-green' },
    { id: 80, x: 250, y: 1100, type: 'green-tree' },
    { id: 81, x: 250, y: 1300, type: 'dark-green' },
    { id: 82, x: 250, y: 1500, type: 'green-tree' },
    { id: 83, x: 250, y: 1700, type: 'dark-green' },
    { id: 84, x: 250, y: 1900, type: 'green-tree' },
    { id: 85, x: 250, y: 2100, type: 'dark-green' },
    { id: 86, x: 250, y: 2300, type: 'green-tree' },
    
    // Outer row - Right border (evenly spaced at 200 units, with gap for airport)
    { id: 89, x: 3450, y: 800, type: 'dark-green' },
    { id: 90, x: 3450, y: 1000, type: 'green-tree' },
    { id: 91, x: 3450, y: 1200, type: 'dark-green' },
    { id: 92, x: 3450, y: 1400, type: 'green-tree' },
    { id: 93, x: 3450, y: 1600, type: 'dark-green' },
    { id: 94, x: 3450, y: 1800, type: 'green-tree' },
    { id: 95, x: 3450, y: 2000, type: 'dark-green' },
    { id: 96, x: 3450, y: 2200, type: 'green-tree' },
    
    // Inner row - Right border (offset by 100 units for staggered effect, with gap for airport)
    { id: 98, x: 3350, y: 700, type: 'dark-green' },
    { id: 99, x: 3350, y: 900, type: 'green-tree' },
    { id: 100, x: 3350, y: 1100, type: 'dark-green' },
    { id: 101, x: 3350, y: 1300, type: 'green-tree' },
    { id: 102, x: 3350, y: 1500, type: 'dark-green' },
    { id: 103, x: 3350, y: 1700, type: 'green-tree' },
    { id: 104, x: 3350, y: 1900, type: 'dark-green' },
    { id: 105, x: 3350, y: 2100, type: 'green-tree' },
    { id: 106, x: 3350, y: 2300, type: 'dark-green' },
    
    // Center area kept clear for better navigation
    
  ],
  mapElements: [
    // Airport in the corner with cabin as closest building
    { id: 1, x: 3300, y: 300, type: 'airport', name: 'City Airport', scale: 8.0 },
    { id: 2, x: 2600, y: 800, type: 'cabin', name: 'Forest Cabin' },
    
    // Hexagonal pattern around the central fountain
    { id: 3, x: 1600, y: 1350, type: 'fountain', name: 'Town Fountain' }, // Central fountain
    
    // Buildings arranged in a hexagonal pattern around the fountain
    { id: 4, x: 1200, y: 1000, type: 'bank', name: 'Central Bank' },          // Top-left
    { id: 5, x: 2000, y: 1000, type: 'museum', name: 'Art Museum' },          // Top-right
    { id: 6, x: 600, y: 2000, type: 'apartment', name: 'Residential Complex' }, // Bottom-left corner
    { id: 7, x: 900, y: 2000, type: 'apartment-3', name: 'Apartment Block 3' }, // Next to other apartment
    { id: 8, x: 1200, y: 1700, type: 'green-corp', name: 'Green Corporation' },  // Bottom-left
    { id: 9, x: 2000, y: 1700, type: 'main-tower', name: 'Main Tower' },         // Bottom-right
    
    // Additional buildings in an outer ring
    { id: 10, x: 1600, y: 800, type: 'offices-building', name: 'Business Center' },  // Top
    { id: 11, x: 800, y: 1350, type: 'central-building', name: 'City Hall' },        // Left
    { id: 12, x: 2400, y: 1350, type: 'fast-food', name: 'Fast Food Restaurant' },   // Right
    { id: 13, x: 2800, y: 1800, type: 'stadium', name: 'City Stadium' },             // Bottom-right area
    
    // Decorative elements - Ancient tree moved away from fountain
    { id: 14, x: 2200, y: 1200, type: 'teal-tree', name: 'Ancient Teal Tree', scale: 0.35 }, // Special tree moved to a new location
  ]
};

// React component wrapper
export default function SimplePhaserGame() {
  const gameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameCreated, setGameCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createGame = async () => {
      try {
        console.log('Starting game creation...');
        console.log('Container ref:', containerRef.current);
        
        if (!containerRef.current) {
          setError('Container not found');
          return;
        }

        // Dynamic Phaser import
        const Phaser = (await import('phaser')).default;
        console.log('Phaser loaded:', Phaser.VERSION);
        
        class TreeExplorerScene extends Phaser.Scene {
          private player!: any;
          private cursors!: any;
          private wasdKeys!: any;
          private background!: any;
          private trees!: any;
          private discoveredTrees: Set<number> = new Set();
          private mapElements!: any;
          private visitedElements: Set<number> = new Set();
          private uiText!: any;
          private currentSpriteIndex: number = 0;
          private spriteChangeTimer: number = 0;
          private isMoving: boolean = false;
          private lastPosition: { x: number; y: number } = { x: 0, y: 0 };
          private lastDirection: 'left' | 'right' = 'right'; // Track last movement direction
          // Text box properties for building interactions
          private gameProgress = this.loadGameProgress();
          private currentTextBox: any = null;
          private currentTextBoxText: any = null;
          private buildingProximityRadius: number = 250;

          private currentNearbyBuilding: string | null = null;
          private enterKey: any;

          constructor() {
            super({ key: 'TreeExplorerScene' });
          }

          private handleBuildingEnter() {
            if (!this.currentNearbyBuilding) return;

            // Navigate based on building type
            switch (this.currentNearbyBuilding) {
              case 'fast-food':
                window.location.href = '/cards/easyFastFood';
                break;
              case 'green-corp':
                window.location.href = '/cards/easyInterview';
                break;
              default:
                // For buildings without conversations yet
                console.log('No conversation available for:', this.currentNearbyBuilding);
            }
          }

          preload() {
            console.log('Preload started');
            
            // Load the background image
            this.load.image('gameBg', '/game/game-bg.png');
            
            // Load player sprite animation frames
            this.load.image('playerSprite', '/game/player-sprite.png');
            this.load.image('sprite1', '/game/sprite1.png');
            this.load.image('sprite2', '/game/sprite2.png');
            this.load.image('sprite3', '/game/sprite3.png');
            this.load.image('sprite4', '/game/sprite4.png');
            this.load.image('sprite5', '/game/sprite5.png');
            this.load.image('sprite6', '/game/sprite6.png');
            
            // Load tree images
            this.load.image('darkGreenTree', '/game/dark-green-tree.png');
            this.load.image('teal-tree', '/game/teal-tree.png');  // Fixed teal tree image key
            this.load.image('greenTree', '/game/green-tree.png');
            
            // Load map element images
            this.load.image('lake', '/game/lake-sm.png');
            this.load.image('bank', '/game/bank.png');
            this.load.image('cabin', '/game/cabin.png');
            this.load.image('apartment', '/game/apartment.png');
            this.load.image('central-building', '/game/central-building.png');
            this.load.image('museum', '/game/museum.png');
            this.load.image('offices-building', '/game/offices-building.png');
            
            // Load new sprite images
            this.load.image('green-corp', '/game/green-corp.png');
            this.load.image('fountain', '/game/fountain.png');
            this.load.image('apartment-2', '/game/apartment-2.png');
            this.load.image('apartment-3', '/game/apartment-3.png');
            this.load.image('main-tower', '/game/main-tower.png');
            this.load.image('stadium', '/game/stadium.png');
            this.load.image('street-lamp', '/game/street-lamp.png');
            this.load.image('fast-food', '/game/fast-food.png');
            this.load.image('airport', '/game/airport.png');
            
            // Load tiling assets for center town decoration
            this.load.image('stone-tile', '/game/stoneTile.png');
            
            // Create a circular floor texture programmatically
            const floorTexture = this.add.graphics();
            floorTexture.fillStyle(0xf5e6d3, 0.7); // Beige color with some transparency
            floorTexture.fillCircle(50, 50, 50);
            floorTexture.generateTexture('building-floor', 100, 100);
            floorTexture.destroy();
            
            this.load.on('complete', () => {
              console.log('Assets loaded');
            });
            
            this.load.on('loaderror', (file: any) => {
              console.error('Failed to load:', file.key);
            });
          }

          create() {
            console.log('Create started');
            
            // Create tiled background to cover entire world
            try {
              // Get the texture to find its dimensions
              const bgTexture = this.textures.get('gameBg');
              const bgWidth = bgTexture.getSourceImage().width;
              const bgHeight = bgTexture.getSourceImage().height;
              
              console.log(`Background image size: ${bgWidth} x ${bgHeight}`);
              
              // Calculate how many tiles we need to cover the entire world
              const tilesX = Math.ceil(GAME_CONFIG.worldWidth / bgWidth);
              const tilesY = Math.ceil(GAME_CONFIG.worldHeight / bgHeight);
              
              console.log(`Creating ${tilesX} x ${tilesY} background tiles`);
              
              // Create a container for all background tiles
              const backgroundContainer = this.add.container(0, 0);
              backgroundContainer.setDepth(0); // Ensure it's behind everything
              
              // Create tiled background
              for (let x = 0; x < tilesX; x++) {
                for (let y = 0; y < tilesY; y++) {
                  const bgTile = this.add.image(x * bgWidth, y * bgHeight, 'gameBg');
                  bgTile.setOrigin(0, 0);
                  backgroundContainer.add(bgTile);
                }
              }
              
              console.log(`Created tiled background covering ${tilesX * bgWidth} x ${tilesY * bgHeight}`);
              
            } catch (err) {
              console.error('Failed to create tiled background:', err);
              // Create a colored background as fallback with full bounds
            const graphics = this.add.graphics();
              graphics.fillStyle(0x228B22);
              graphics.fillRect(0, 0, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight);
              graphics.setDepth(0);
              console.log('Created fallback colored background');
            }
            
            // Set world bounds to the full game config size
            this.physics.world.setBounds(0, 0, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight);
            
            // Update camera bounds to match full world
            this.cameras.main.setBounds(0, 0, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight);
            
            console.log(`World bounds set to full size: ${GAME_CONFIG.worldWidth} x ${GAME_CONFIG.worldHeight}`);

            // Create trees group and add trees
            this.trees = this.physics.add.group();
            this.createTrees();

            // Create map elements group and add elements
            this.mapElements = this.physics.add.group();
            // Buildings without roads - clean open space design
            this.createMapElements();
            
            // Create decorative tiles in center area
            this.createCenterTiles();
            
            // Create stone flooring around buildings
            this.createStoneFlooring();

            // Define positions for airport and player spawn
            const airportPosition = { x: 3400, y: 200 }; // Airport position
            const spawnOffset = { x: -200, y: 150 }; // Offset to place player in front of airport
            
            // Create GBA-style text box
            const textBoxWidth = 400;
            const textBoxHeight = 100;
            const padding = 10;
            const playerOffset = { x: 50, y: -50 }; // Position above and to the right of player
            
            // Create text box background
            const textBox = this.add.graphics();
            textBox.setDepth(1000); // Ensure it's above everything
            textBox.fillStyle(0x000000, 0.8);
            const boxX = airportPosition.x + spawnOffset.x + playerOffset.x;
            const boxY = airportPosition.y + spawnOffset.y + playerOffset.y;
            textBox.fillRect(boxX, boxY, textBoxWidth, textBoxHeight);
            textBox.lineStyle(4, 0xffffff);
            textBox.strokeRect(boxX, boxY, textBoxWidth, textBoxHeight);
            
            // Add welcome text with GBA-style font
            const welcomeText = this.add.text(boxX + padding, boxY + padding, 'You arrived to\nNew Hamonduh York', {
                font: '24px monospace',
                color: '#ffffff',
                align: 'left',
                wordWrap: { width: textBoxWidth - (padding * 2) }
            });
            welcomeText.setDepth(1001); // Ensure text is above the box
            
            // Make text box and text disappear after 5 seconds
            this.time.delayedCall(5000, () => {
                textBox.destroy();
                welcomeText.destroy();
            });
            this.player = this.physics.add.sprite(
              airportPosition.x + spawnOffset.x,
              airportPosition.y + spawnOffset.y,
              'sprite1'
            );
            this.player.setCollideWorldBounds(true);
            this.player.setDepth(10); // Ensure player is above background and trees
            this.player.setScale(0.126); // Scale player 20% smaller (was 0.1575, now 0.126 = 20% reduction)
            
            // Set player collision body size and offset for more precise collisions
            this.player.body!.setSize(this.player.width * 0.4, this.player.height * 0.3);
            this.player.body!.setOffset(this.player.width * 0.3, this.player.height * 0.5);
            
            // Initialize sprite cycling variables
            this.lastPosition = { 
              x: airportPosition.x + spawnOffset.x, 
              y: airportPosition.y + spawnOffset.y 
            };

            // Set up camera with initial zoom
            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
            
            // Start with zoomed in camera
            this.cameras.main.setZoom(2);  // Start at 2x zoom
            
            // Animate zoom out over 2 seconds
            this.tweens.add({
                targets: this.cameras.main,
                zoom: 1,  // End at normal zoom
                duration: 2000,  // 2 seconds
                ease: 'Quad.easeOut'  // Smooth easing function
            });

            // Create input controls
            this.cursors = this.input.keyboard!.createCursorKeys();
            this.wasdKeys = this.input.keyboard!.addKeys('W,S,A,D');
            this.enterKey = this.input.keyboard!.addKey('ENTER');
            
            // Add Enter key handler
            this.enterKey.on('down', () => {
              this.handleBuildingEnter();
            });

            // Add mouse/cursor controls
            this.input.on('pointerdown', this.moveToPointer, this);

            // Add tree collision system (prevents passing through)
            this.physics.add.overlap(this.player, this.trees, this.handleTreeCollision, undefined, this);
            
            // Add tree discovery system (proximity detection)
            this.physics.add.overlap(this.player, this.trees, this.discoverTree, undefined, this);

            // Add building collision system (prevents walking through buildings)
            this.physics.add.collider(this.player, this.mapElements);
            
            // Add map element interaction system (shows modals on collision)
            this.physics.add.overlap(this.player, this.mapElements, this.visitMapElement, undefined, this);
            
            // Ensure all map elements are properly configured for collision
            this.mapElements.children.iterate((element: any) => {
              if (element && element.body) {
                element.body.moves = false;
                element.setPushable(false);
              }
            });

            // Add some simple UI
            this.createUI();
          }

          private createTrees() {
            GAME_CONFIG.treePositions.forEach(treeData => {
              let sprite: string;
              switch (treeData.type) {
                case 'dark-green':
                  sprite = 'darkGreenTree';
                  break;
                case 'teal-tree':
                  sprite = 'teal-tree';  // Fixed teal tree sprite key
                  break;
                case 'green-tree':
                  sprite = 'greenTree';
                  break;
                default:
                  sprite = 'greenTree'; // fallback to new green tree
              }
              
              const tree = this.physics.add.sprite(treeData.x, treeData.y, sprite);
              
              // Set tree properties
              tree.setData('id', treeData.id);
              tree.setData('type', treeData.type);
              tree.setData('discovered', false);
              tree.setDepth(5); // Trees are above background but below player
              
              // Scale trees down by 70% (30% of original size)
              tree.setScale(0.15);
              
              // Set collision body size for overlap detection only
              tree.body!.setSize(tree.width * 0.6, tree.height * 0.6);
              tree.body!.setOffset(tree.width * 0.2, tree.height * 0.2);
              
              // Make trees static (no physics movement)
              tree.body!.setImmovable(true);
              tree.body!.moves = false;
              
              this.trees.add(tree);
            });
            
            console.log(`Created ${GAME_CONFIG.treePositions.length} trees with collision`);
          }

          private findSafeSpawnPosition() {
            // Spawn in the center of the organized grid map
            const safeX = 1800; // Center of the map horizontally
            const safeY = 1350; // Center of the map vertically (middle horizontal path)
            
            console.log(`Spawning in center of organized map at: (${safeX}, ${safeY})`);
            return { x: safeX, y: safeY };
          }

          private handleTreeCollision = (player: any, tree: any) => {
            // Stop player movement when touching trees
            player.setVelocity(0);
            
            // Calculate distance between player and tree center
            const distance = Phaser.Math.Distance.Between(player.x, player.y, tree.x, tree.y);
            const minDistance = 80; // Increased minimum distance from tree center (was 40, now 80)
            
            // Only push back if too close
            if (distance < minDistance) {
              const angle = Phaser.Math.Angle.Between(tree.x, tree.y, player.x, player.y);
              player.x = tree.x + Math.cos(angle) * minDistance;
              player.y = tree.y + Math.sin(angle) * minDistance;
            }
          }


          private moveToPointer = (pointer: any) => {
            // Get world coordinates from pointer
            const worldX = pointer.worldX;
            const worldY = pointer.worldY;
            
            // Move player towards clicked position smoothly
            this.physics.moveToObject(this.player, { x: worldX, y: worldY }, GAME_CONFIG.playerSpeed);
            
            // Stop movement when close to target
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, worldX, worldY);
            if (distance < 20) {
              this.player.setVelocity(0);
            }
          }


          private createCenterTiles() {
            // Create a grid of decorative tiles in the center town area
            const tileSize = 120; // Size of each tile
            const centerStartX = 600; // Start position for tiling
            const centerEndX = 2800; // End position for tiling
            const centerStartY = 600; // Start position for tiling
            const centerEndY = 2200; // End position for tiling
            
            const tiles = this.add.group();
            
            // Create two large decorative lakes in center
            const tilePositions = [
              // Large lake tiles (decorative water features only - twice as big)
              { x: 1200, y: 1200, type: 'tile-lake', scale: 0.4 },
              { x: 2000, y: 1700, type: 'tile-lake', scale: 0.4 },
            ];
            
            tilePositions.forEach(tileData => {
              const tile = this.add.image(tileData.x, tileData.y, tileData.type);
              tile.setScale(tileData.scale);
              tile.setDepth(1); // Above background, below trees and buildings
              tile.setAlpha(0.6); // Semi-transparent for subtle effect
              tiles.add(tile);
            });
            
            console.log(`Created ${tilePositions.length} decorative tiles in center area`);
          }

          private createStoneFlooring() {
            // Create stone tile flooring around each building
            const stoneFloorGroup = this.add.group();
            
            GAME_CONFIG.mapElements.forEach(elementData => {
              // Skip elements that don't need stone flooring
              if (elementData.type === 'lake' || elementData.type === 'fountain' || 
                  elementData.type === 'green-tree') return;
              
              // Create a chessboard pattern of tiles around each building
              const tileSize = 60; // Base tile size
              const tileScale = 0.2; // Smaller scale for tiles
              const scaledTileSize = tileSize * tileScale; // Actual size after scaling
              const tilesPerSide = 7; // 7x7 grid for wider coverage
              const totalWidth = tileSize * tilesPerSide;
              const startX = elementData.x - totalWidth / 2;
              const startY = elementData.y - totalWidth / 2;
              
              // Create a larger grid with chessboard pattern
              for (let row = 0; row < tilesPerSide; row++) {
                for (let col = 0; col < tilesPerSide; col++) {
                  // Create chessboard pattern - place tile only if row + col is even
                  if ((row + col) % 2 === 0) {
                    const stoneX = startX + (col * tileSize) + (tileSize / 2);
                    const stoneY = startY + (row * tileSize) + (tileSize / 2);
                    
                    const stoneTile = this.add.image(stoneX, stoneY, 'stone-tile');
                    stoneTile.setScale(tileScale); // Smaller scale for more tiles
                    stoneTile.setDepth(0.5); // Below buildings but above background
                    stoneTile.setAlpha(0.55); // More transparent for subtler effect
                    stoneFloorGroup.add(stoneTile);
                  }
                }
              }
            });
            
            console.log(`Created stone flooring around ${GAME_CONFIG.mapElements.length - 1} buildings`);
          }

          private loadGameProgress() {
            try {
              const savedProgress = localStorage.getItem('gameProgress');
              if (savedProgress) {
                const parsed = JSON.parse(savedProgress);
                return {
                  discoveredBuildings: new Set(parsed.discoveredBuildings),
                  lastVisited: parsed.lastVisited,
                  totalProgress: parsed.totalProgress,
                  achievements: new Set(parsed.achievements)
                };
              }
            } catch (error) {
              console.warn('Failed to load game progress:', error);
            }
            return {
              discoveredBuildings: new Set<string>(),
              lastVisited: '',
              totalProgress: 0,
              achievements: new Set<string>()
            };
          }

          private saveGameProgress() {
            try {
              const progressToSave = {
                discoveredBuildings: Array.from(this.gameProgress.discoveredBuildings),
                lastVisited: this.gameProgress.lastVisited,
                totalProgress: this.gameProgress.totalProgress,
                achievements: Array.from(this.gameProgress.achievements)
              };
              localStorage.setItem('gameProgress', JSON.stringify(progressToSave));
              console.log('Game progress saved:', progressToSave);
            } catch (error) {
              console.warn('Failed to save game progress:', error);
            }
          }

          private updateProgress(buildingType: string) {
            // Add building to discovered set
            this.gameProgress.discoveredBuildings.add(buildingType);
            this.gameProgress.lastVisited = buildingType;
            
            // Calculate total progress (percentage of buildings discovered)
            const totalBuildings = GAME_CONFIG.mapElements.length;
            this.gameProgress.totalProgress = (this.gameProgress.discoveredBuildings.size / totalBuildings) * 100;

            // Check for achievements
            if (this.gameProgress.totalProgress >= 50) {
              this.gameProgress.achievements.add('Explorer');
            }
            if (this.gameProgress.totalProgress >= 100) {
              this.gameProgress.achievements.add('Master Explorer');
            }
            if (buildingType === 'airport') {
              this.gameProgress.achievements.add('First Flight');
            }

            // Save progress
            this.saveGameProgress();

            // Update UI with progress
            if (this.uiText) {
              this.uiText.setText(`Progress: ${Math.round(this.gameProgress.totalProgress)}%`);
            }
          }

          private showBuildingModal(buildingName: string, buildingType: string) {
            if (this.isModalOpen) return; // Prevent multiple modals
            
            // Update progress when discovering a new building
            if (!this.gameProgress.discoveredBuildings.has(buildingType)) {
              this.updateProgress(buildingType);
            }
            
            this.isModalOpen = true;
            
            // Use screen center for modal positioning (fixed to camera view)
            const camera = this.cameras.main;
            const modalX = camera.width / 2;
            const modalY = camera.height / 2;
            
            console.log(`Showing modal for ${buildingName} at camera center:`, modalX, modalY);
            
            // Create modal background (semi-transparent overlay)
            this.modalBackground = this.add.rectangle(
              modalX, 
              modalY, 
              camera.width, 
              camera.height, 
              0x000000, 
              0.7
            );
            this.modalBackground.setDepth(50); // High depth to appear above everything
            this.modalBackground.setScrollFactor(0); // Fixed to camera
            
            // Create modal container
            const modalWidth = 400;
            const modalHeight = 250;
            
            // Modal background (white rectangle with border)
            this.modal = this.add.rectangle(modalX, modalY, modalWidth, modalHeight, 0xffffff, 1);
            this.modal.setStrokeStyle(4, 0x333333);
            this.modal.setDepth(51);
            this.modal.setScrollFactor(0);
            
            console.log('Modal rectangle created at:', modalX, modalY, 'size:', modalWidth, modalHeight);
            
            // Congratulations title
            const titleText = this.add.text(modalX, modalY - 60, 'Congratulations!', {
              fontSize: '24px',
              color: '#333333',
              fontStyle: 'bold'
            });
            titleText.setOrigin(0.5);
            titleText.setDepth(52);
            titleText.setScrollFactor(0);
            
            // Building visit message
            const messageText = this.add.text(modalX, modalY - 10, `You visited the ${buildingName}!`, {
              fontSize: '18px',
              color: '#666666',
              align: 'center',
              wordWrap: { width: modalWidth - 40 }
            });
            messageText.setOrigin(0.5);
            messageText.setDepth(52);
            messageText.setScrollFactor(0);
            
            // Building type info
            const typeText = this.add.text(modalX, modalY + 20, `Type: ${buildingType}`, {
              fontSize: '14px',
              color: '#888888',
              align: 'center'
            });
            typeText.setOrigin(0.5);
            typeText.setDepth(52);
            typeText.setScrollFactor(0);
            
            // Close button
            const closeButton = this.add.rectangle(modalX, modalY + 70, 120, 40, 0x007bff, 1);
            closeButton.setStrokeStyle(2, 0x0056b3);
            closeButton.setDepth(52);
            closeButton.setScrollFactor(0);
            closeButton.setInteractive({ useHandCursor: true });
            
            const closeButtonText = this.add.text(modalX, modalY + 70, 'Close', {
              fontSize: '16px',
              color: '#ffffff',
              fontStyle: 'bold'
            });
            closeButtonText.setOrigin(0.5);
            closeButtonText.setDepth(53);
            closeButtonText.setScrollFactor(0);
            
            console.log('Close button created at:', modalX, modalY + 70);
            
            // Store modal elements for cleanup
            const modalElements = [
              this.modalBackground,
              this.modal,
              titleText,
              messageText,
              typeText,
              closeButton,
              closeButtonText
            ];
            
            // Close button click handler
            closeButton.on('pointerdown', () => {
              this.closeBuildingModal(modalElements);
            });
            
            // ESC key to close modal
            const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
            if (escKey) {
              escKey.once('down', () => {
                this.closeBuildingModal(modalElements);
              });
            }
          }
          
          private closeBuildingModal(modalElements: any[]) {
            // Remove all modal elements
            modalElements.forEach(element => {
              if (element) {
                element.destroy();
              }
            });
            
            this.modal = null;
            this.modalBackground = null;
            this.isModalOpen = false;
          }

          private createMapElements() {
            // Airport no longer has lamps

            GAME_CONFIG.mapElements.forEach(elementData => {
              // Create and scale the building sprite
              const element = this.physics.add.sprite(elementData.x, elementData.y, elementData.type);
              
              // Set element properties
              element.setData('type', elementData.type);
              element.setData('id', elementData.id);
              element.setData('name', elementData.name);
              element.setData('visited', false);
              element.setDepth(7); // Map elements are above trees but below player
              
              // Make buildings completely immovable and solid
              element.setImmovable(true);
              element.body.moves = false; // Ensure physics body doesn't move
              element.setPushable(false); // Prevent pushing
              element.setDepth(7); // Map elements are above trees but below player
              
              // Scale elements - all buildings appropriately sized
              if (elementData.type === 'lake') {
                element.setScale(0.21); // Lake 30% smaller (was 0.3, now 0.21)
              } else if (elementData.type === 'bank') {
                element.setScale(0.235); // Bank 50% bigger (was 0.157)
              } else if (elementData.type === 'cabin') {
                element.setScale(0.18); // Made cabin smaller
              } else if (elementData.type === 'museum') {
                element.setScale(0.315); // Museum 30% smaller (was 0.45, now 0.315)
              } else if (elementData.type === 'offices-building') {
                element.setScale(0.45); // Made office building bigger
              } else if (elementData.type === 'airport') {
                element.setScale(0.5); // Adjusted airport size
              } else if (elementData.type === 'apartment') {
                element.setScale(0.315); // Apartment 30% smaller (was 0.45, now 0.315)
              } else if (elementData.type === 'central-building') {
                element.setScale(0.45); // Made central building bigger
              } else if (elementData.type === 'main-tower') {
                element.setScale(0.45); // Main tower - prominent size
              } else if (elementData.type === 'stadium') {
                element.setScale(0.45); // Made stadium bigger
              } else if (elementData.type === 'fast-food') {
                element.setScale(0.25); // Made fast food place smaller
              } else if (elementData.type === 'green-corp') {
                element.setScale(0.35); // Green corp building
              } else if (elementData.type === 'apartment-2') {
                element.setScale(0.3); // Apartment block 2
              } else if (elementData.type === 'apartment-3') {
                element.setScale(0.3); // Apartment block 3
              } else if (elementData.type === 'fountain') {
                element.setScale(0.125); // Town fountain - 50% smaller than before (was 0.25)
              } else if (elementData.type === 'stadium') {
                element.setScale(0.4); // Stadium - prominent size
              } else if (elementData.type === 'green-tree' && elementData.scale) {
                element.setScale(elementData.scale); // Use custom scale for special trees
              } else {
                element.setScale(0.28); // Default size
              }
              
              // Set collision body size based on building type
              if (elementData.type === 'stadium') {
                element.body!.setSize(element.width * 0.7, element.height * 0.7);
                // Offset collision box to better match visual
                element.body!.setOffset(element.width * 0.15, element.height * 0.15);
              } else if (['main-tower', 'central-building', 'offices-building'].includes(elementData.type)) {
                element.body!.setSize(element.width * 0.6, element.height * 0.6);
                element.body!.setOffset(element.width * 0.2, element.height * 0.2);
              } else if (['apartment', 'apartment-3'].includes(elementData.type)) {
                element.body!.setSize(element.width * 0.5, element.height * 0.5);
                element.body!.setOffset(element.width * 0.25, element.height * 0.25);
              } else {
                element.body!.setSize(element.width * 0.45, element.height * 0.45);
                element.body!.setOffset(element.width * 0.275, element.height * 0.275);
              }
              
              this.mapElements.add(element);
            });
            
            console.log(`Created ${GAME_CONFIG.mapElements.length} map elements`);
          }

          private discoverTree = (player: any, tree: any) => {
            const treeId = tree.getData('id');
            
            if (!tree.getData('discovered')) {
              tree.setData('discovered', true);
              this.discoveredTrees.add(treeId);
              
              // Visual feedback - just tint, no particles that cause green copies
              tree.setTint(0x10b981); // Green tint for discovered
              
              console.log(`🌲 Discovered ${tree.getData('type')} tree #${treeId}! (${this.discoveredTrees.size}/${GAME_CONFIG.treePositions.length})`);
              
              // Just log tree discovery
              console.log(`Tree discovered (${this.discoveredTrees.size}/${GAME_CONFIG.treePositions.length})`);
            }
          }

          private visitMapElement = (player: any, element: any) => {
            const elementId = element.getData('id');
            const elementName = element.getData('name');
            const elementType = element.getData('type');
            
            if (!element.getData('visited')) {
              element.setData('visited', true);
              this.visitedElements.add(elementId);
              
              // Visual feedback
              element.setTint(0x00ffff); // Cyan tint for visited elements
              
              // Create visit effect with appropriate color
              let effectColor = 0x00ffff;
              if (elementType === 'lake') effectColor = 0x0099ff;
              else if (elementType === 'bank') effectColor = 0xffd700; // Gold for bank
              else if (elementType === 'cabin') effectColor = 0x8b4513; // Brown for cabin
              else if (elementType === 'apartment') effectColor = 0xdc143c; // Brick red
              else if (elementType === 'central-building') effectColor = 0x4169e1; // Royal blue
              
              // Just log the visit without showing modals
              console.log(`Visited ${elementName} (${elementType})`);
            }
          }

          private celebrateTreeCompletion() {
            const centerX = this.cameras.main.centerX;
            const centerY = this.cameras.main.centerY;
            
            const celebrationText = this.add.text(centerX, centerY, '🌲 ALL TREES DISCOVERED! 🌲', {
              fontSize: '24px',
              color: '#10b981',
              fontFamily: 'Arial',
              stroke: '#000000',
              strokeThickness: 3
            });
            celebrationText.setOrigin(0.5);
            celebrationText.setScrollFactor(0);
            
            // Celebration animation
            this.tweens.add({
              targets: celebrationText,
              scaleX: 1.1,
              scaleY: 1.1,
              yoyo: true,
              repeat: 2,
              duration: 400,
              ease: 'Bounce.easeOut'
            });

            // Remove after 3 seconds
            this.time.delayedCall(3000, () => {
              celebrationText.destroy();
            });
          }

          private celebrateFullCompletion() {
            const centerX = this.cameras.main.centerX;
            const centerY = this.cameras.main.centerY;
            
            const celebrationText = this.add.text(centerX, centerY, '🎊 WORLD FULLY EXPLORED! 🎊\n🌲 All Trees + 🏛️ All Locations', {
              fontSize: '26px',
              color: '#ffd700',
              fontFamily: 'Arial',
              stroke: '#000000',
              strokeThickness: 4,
              align: 'center'
            });
            celebrationText.setOrigin(0.5);
            celebrationText.setScrollFactor(0);
            
            // Epic celebration animation
            this.tweens.add({
              targets: celebrationText,
              scaleX: 1.3,
              scaleY: 1.3,
              yoyo: true,
              repeat: 4,
              duration: 600,
              ease: 'Bounce.easeOut'
            });

            // Remove after 5 seconds
            this.time.delayedCall(5000, () => {
              celebrationText.destroy();
            });
          }

          private createUI() {
            // Create a simple UI overlay
            const uiBackground = this.add.graphics();
            uiBackground.fillStyle(0x000000, 0.7);
            uiBackground.fillRoundedRect(10, 10, 250, 100, 10);
            uiBackground.setScrollFactor(0); // UI doesn't move with camera

            this.uiText = this.add.text(20, 20, '', {
              fontSize: '12px',
              color: '#ffffff',
              fontFamily: 'Arial'
            });
            this.uiText.setScrollFactor(0);
            
            this.updateUI();
          }

          private updateUI() {
            const playerX = Math.floor(this.player.x);
            const playerY = Math.floor(this.player.y);
            const treeProgress = Math.floor((this.discoveredTrees.size / GAME_CONFIG.treePositions.length) * 100);
            const locationProgress = Math.floor((this.visitedElements.size / GAME_CONFIG.mapElements.length) * 100);
            
            this.uiText.setText([
              '🗺️ World Explorer',
              `Position: (${playerX}, ${playerY})`,
              `🌲 Trees: ${this.discoveredTrees.size}/${GAME_CONFIG.treePositions.length} (${treeProgress}%)`,
              `🏛️ Locations: ${this.visitedElements.size}/${GAME_CONFIG.mapElements.length} (${locationProgress}%)`,
              'WASD/Arrows or Click to move!'
            ]);
          }

          private updatePlayerSprite() {
            // Check directional movement keys
            const isLeftPressed = this.cursors.left.isDown || this.wasdKeys.A.isDown;
            const isRightPressed = this.cursors.right.isDown || this.wasdKeys.D.isDown;
            const isUpPressed = this.cursors.up.isDown || this.wasdKeys.W.isDown;
            const isDownPressed = this.cursors.down.isDown || this.wasdKeys.S.isDown;
            
            const isKeyPressed = isLeftPressed || isRightPressed || isUpPressed || isDownPressed;

            // Update sprite based on direction and key presses
            if (isKeyPressed) {
              // Determine direction and sprite set
              let spriteKeys: string[];
              
              if (isRightPressed) {
                // Moving right: use sprite1, sprite2, and sprite6 (3-frame animation)
                spriteKeys = ['sprite1', 'sprite2', 'sprite6'];
                this.lastDirection = 'right';
              } else if (isLeftPressed) {
                // Moving left: use sprite3, sprite4, and sprite5 (3-frame animation)
                spriteKeys = ['sprite3', 'sprite4', 'sprite5'];
                this.lastDirection = 'left';
              } else {
                // Moving up/down only: use sprites based on last direction
                if (this.lastDirection === 'left') {
                  spriteKeys = ['sprite3', 'sprite4', 'sprite5'];
                } else {
                  spriteKeys = ['sprite1', 'sprite2', 'sprite6'];
                }
              }
              
              // Cycle through appropriate sprites
              this.spriteChangeTimer += 1;
              if (this.spriteChangeTimer >= 8) { // Change sprite every 8 frames for smooth animation
                this.spriteChangeTimer = 0;
                this.currentSpriteIndex = (this.currentSpriteIndex + 1) % 3; // Now cycling between 3 sprites
                this.player.setTexture(spriteKeys[this.currentSpriteIndex]);
              }
              this.isMoving = true;
            } else {
              // When no movement keys are pressed, use frame 1 of last direction
              this.spriteChangeTimer = 0;
              this.currentSpriteIndex = 0;
              if (this.lastDirection === 'left') {
                this.player.setTexture('sprite3'); // Left-facing idle
              } else {
                this.player.setTexture('sprite1'); // Right-facing idle
              }
              this.isMoving = false;
            }

            // Update last position for reference
            this.lastPosition = { x: this.player.x, y: this.player.y };
          }

          private showBuildingText(buildingName: string, buildingType: string) {
            // Update progress when discovering a new building
            if (!this.gameProgress.discoveredBuildings.has(buildingType)) {
              this.updateProgress(buildingType);
            }

            // If text box already exists, just update the text
            if (this.currentTextBox && this.currentTextBoxText) {
              this.currentTextBoxText.setText(buildingName);
              return;
            }

            // Create GBA-style text box
            const textBoxWidth = 300;
            const textBoxHeight = 80;
            const padding = 10;

            // Create text box background
            this.currentTextBox = this.add.graphics();
            this.currentTextBox.setScrollFactor(0);
            this.currentTextBox.fillStyle(0x000000, 0.8);
            this.currentTextBox.fillRect(20, 20, textBoxWidth, textBoxHeight);
            this.currentTextBox.lineStyle(4, 0xffffff);
            this.currentTextBox.strokeRect(20, 20, textBoxWidth, textBoxHeight);
            this.currentTextBox.setDepth(999);

            // Add text
            this.currentTextBoxText = this.add.text(20 + padding, 20 + padding, `${buildingName}\nPress Enter`, {
              font: '20px monospace',
              color: '#ffffff',
              align: 'left',
              wordWrap: { width: textBoxWidth - (padding * 2) }
            });
            this.currentTextBoxText.setScrollFactor(0);
            this.currentTextBoxText.setDepth(1000);
          }

          private closeTextBox() {
            if (this.currentTextBox) {
              this.currentTextBox.destroy();
              this.currentTextBox = null;
            }
            if (this.currentTextBoxText) {
              this.currentTextBoxText.destroy();
              this.currentTextBoxText = null;
            }
          }

          private checkBuildingProximity() {
            let nearBuilding = false;
            this.currentNearbyBuilding = null;

            GAME_CONFIG.mapElements.forEach(building => {
              const distance = Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                building.x,
                building.y
              );

              if (distance <= this.buildingProximityRadius) {
                nearBuilding = true;
                this.currentNearbyBuilding = building.type;
                this.showBuildingText(building.name, building.type);
                return;
              }
            });

            if (!nearBuilding && this.currentTextBox) {
              this.closeTextBox();
            }
          }

          update() {
            if (!this.player) return;
            
            // Check for nearby buildings
            this.checkBuildingProximity();
            
            // Handle player movement
            const speed = GAME_CONFIG.playerSpeed;

            // Reset velocity
            this.player.setVelocity(0);

            // Check input and set velocity
            if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
              this.player.setVelocityX(-speed);
            } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
              this.player.setVelocityX(speed);
            }

            if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
              this.player.setVelocityY(-speed);
            } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
              this.player.setVelocityY(speed);
            }

            // Stop movement if close to mouse target
            if (this.input.activePointer.isDown) {
              const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, 
                this.input.activePointer.worldX, this.input.activePointer.worldY
              );
              if (distance < 15) {
                this.player.setVelocity(0);
              }
            }

            // Ensure buildings stay in their original positions
            this.mapElements.children.iterate((element: any) => {
              if (element && element.body) {
                // Force buildings to be immovable
                element.body.moves = false;
                element.setPushable(false);
                element.setImmovable(true);
                
                // Store original position if not already stored
                if (!element.getData('originalX')) {
                  element.setData('originalX', element.x);
                  element.setData('originalY', element.y);
                }
                
                // Reset any accidental movement
                const originalX = element.getData('originalX');
                const originalY = element.getData('originalY');
                if (element.x !== originalX || element.y !== originalY) {
                  element.setPosition(originalX, originalY);
                  element.body.reset(originalX, originalY);
                }
              }
            });

            // Update UI
              this.updateUI();
            
            // Update player sprite animation
            this.updatePlayerSprite();
          }
        }

        const config = {
          type: Phaser.AUTO,
          width: GAME_CONFIG.width,
          height: GAME_CONFIG.height,
          parent: containerRef.current,
          backgroundColor: '#2d3748',
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { x: 0, y: 0 },
              debug: false
            }
          },
          scene: TreeExplorerScene,
          scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH
          }
        };

        const gameInstance = new Phaser.Game(config);
        gameRef.current = gameInstance;
        setGameCreated(true);
        console.log('Game created successfully!');
      } catch (err) {
        console.error('Error creating game:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    // Delay to ensure DOM is ready
    setTimeout(createGame, 100);
  }, []);


  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-400 mb-4">❌ Game Loading Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors duration-200 w-full"
            >
              🔄 Retry Loading Game
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors duration-200 w-full"
            >
              ← Back to Game Options
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-900 overflow-hidden">
      {/* Game Title Overlay */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 text-center">
        <h1 className="text-2xl font-bold text-white mb-1">🚀 World Explorer</h1>
        <p className="text-gray-300 text-sm">WASD/Arrows or Click to move!</p>
      </div>

      {/* Phaser Game Container - Full Viewport */}
      <div className="w-full h-screen overflow-hidden bg-gray-800">
        <div 
          ref={containerRef}
          className="w-full h-full"
          style={{ 
            backgroundColor: '#2d3748'
          }}
        />
        </div>
        
      {/* Navigation Overlay */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors duration-200 shadow-lg text-sm"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
