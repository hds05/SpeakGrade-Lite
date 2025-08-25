'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { useSpeechRecognition } from 'react-speech-recognition';

// TypeScript declarations for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface MissionObjective {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  type: 'navigation' | 'exploration' | 'communication' | 'maintenance';
}

const missionObjectives: MissionObjective[] = [
  {
    id: '1',
    title: 'Navigate to Mars',
    description: 'Set course for the Red Planet and establish orbit',
    completed: false,
    type: 'navigation'
  },
  {
    id: '2',
    title: 'Scan Asteroid Belt',
    description: 'Analyze composition of nearby asteroids',
    completed: false,
    type: 'exploration'
  },
  {
    id: '3',
    title: 'Contact Space Station',
    description: 'Establish communication with ISS',
    completed: false,
    type: 'communication'
  },
  {
    id: '4',
    title: 'Check Life Support',
    description: 'Verify all systems are operational',
    completed: false,
    type: 'maintenance'
  }
];

export default function SpacecraftSimulation() {
  const [currentMission, setCurrentMission] = useState<MissionObjective | null>(null);
  const [gameMode, setGameMode] = useState<'menu' | 'mission'>('menu');
  
  // Jarvis AI Companion States
  const [jarvisMessage, setJarvisMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // 3D Scene Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const spaceshipRef = useRef<THREE.Group | null>(null);
  const recognitionRef = useRef<any>(null);

  // Speech Recognition Setup
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Check if browser supports speech recognition
  const isSpeechSupported = () => {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  };

  // Jarvis AI Companion Functions
  const speakWithJarvis = async (text: string) => {
    if (isMuted) return;
    
    try {
      const response = await fetch('/api/SpacecraftSimulation/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      }
    } catch (error) {
      console.error('TTS Error:', error);
      // Fallback: use browser's built-in speech synthesis if available
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        speechSynthesis.speak(utterance);
      }
    }
  };

  const startListening = () => {
    try {
      // Stop any existing recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          console.log('Speech recognition started');
          setIsListening(true);
        };
        
        recognition.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setJarvisMessage("Please allow microphone access to use voice commands.");
          } else {
            setJarvisMessage("Speech recognition error. Please try again.");
          }
        };
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          console.log('Transcript received:', transcript);
          if (transcript) {
            handleVoiceCommand(transcript);
          }
        };
        
        recognitionRef.current = recognition;
        recognition.start();
      } else {
        setJarvisMessage("Speech recognition is not supported in this browser.");
      }
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setJarvisMessage("Failed to start speech recognition. Please try again.");
    }
  };

  const stopListening = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
      resetTranscript();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  };

  const handleVoiceCommand = async (command: string) => {
    if (!command.trim()) return;
    
    const commandLower = command.toLowerCase();
    let response = '';

    // Navigation commands
    if (commandLower.includes('go to') || commandLower.includes('navigate to') || commandLower.includes('set course')) {
      if (commandLower.includes('mars')) {
        response = "Setting course for Mars. Engaging navigation systems and calculating optimal trajectory.";
        setCurrentMission(missionObjectives[0]);
        setGameMode('mission');
      } else if (commandLower.includes('asteroid')) {
        response = "Navigating to the asteroid belt. This will be an excellent opportunity for resource analysis.";
        setCurrentMission(missionObjectives[1]);
        setGameMode('mission');
      } else if (commandLower.includes('station') || commandLower.includes('iss')) {
        response = "Establishing course for the International Space Station. Preparing communication protocols.";
        setCurrentMission(missionObjectives[2]);
        setGameMode('mission');
      } else {
        response = "I didn't recognize that destination. Available targets are: Mars, Asteroid Belt, and Space Station.";
      }
    }
    // General conversation
    else if (commandLower.includes('hello') || commandLower.includes('hi') || commandLower.includes('hey')) {
      response = "Hello! I'm Jarvis, your AI companion for this space mission. How can I assist you today?";
    }
    else if (commandLower.includes('how are you')) {
      response = "I'm functioning perfectly! All my systems are operational and ready to help you navigate the cosmos.";
    }
    else {
      response = "I heard your command but I'm not sure how to respond. Try asking about navigation or mission objectives.";
    }

    setJarvisMessage(response);
    
    try {
      await speakWithJarvis(response);
    } catch (error) {
      console.log('TTS not available, continuing without audio');
    }
  };

  // Handle transcript changes
  useEffect(() => {
    if (transcript) {
      handleVoiceCommand(transcript);
      resetTranscript();
    }
  }, [transcript]);

  // Sync listening state
  useEffect(() => {
    setIsListening(listening);
  }, [listening]);

  // Welcome message from Jarvis
  useEffect(() => {
    const welcomeMessage = "Welcome aboard the spacecraft! I'm Jarvis, your AI companion for this mission. We're ready to explore the cosmos. What would you like to do first?";
    setJarvisMessage(welcomeMessage);
    speakWithJarvis(welcomeMessage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  // Initialize 3D Scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000011, 100, 500);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 10, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(800, 600);
    renderer.setClearColor(0x000011, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x001122, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create spaceship
    const spaceshipGroup = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.ConeGeometry(2, 8, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x4a90e2,
      shininess: 100,
      specular: 0x444444
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    spaceshipGroup.add(body);
    
    // Wings
    const wingGeometry = new THREE.BoxGeometry(8, 0.5, 2);
    const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x2c3e50 });
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(0, -1, 0);
    leftWing.castShadow = true;
    spaceshipGroup.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0, 1, 0);
    rightWing.castShadow = true;
    spaceshipGroup.add(rightWing);
    
    // Engine glow
    const engineGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const engineMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff4400
    });
    const engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.position.set(-4, 0, 0);
    spaceshipGroup.add(engine);
    
    spaceshipGroup.position.set(0, 0, 0);
    scene.add(spaceshipGroup);
    spaceshipRef.current = spaceshipGroup;

    // Create Mars (destination)
    const marsGeometry = new THREE.SphereGeometry(8, 32, 32);
    const marsMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xc1440e,
      shininess: 30,
      specular: 0x444444
    });
    const mars = new THREE.Mesh(marsGeometry, marsMaterial);
    mars.position.set(50, 0, 0);
    mars.castShadow = true;
    mars.receiveShadow = true;
    scene.add(mars);

    // Create asteroid belt representation
    const asteroidGeometry = new THREE.DodecahedronGeometry(15, 0);
    const asteroidMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8b7355,
      shininess: 10
    });
    const asteroidBelt = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    asteroidBelt.position.set(25, 0, 0);
    asteroidBelt.castShadow = true;
    asteroidBelt.receiveShadow = true;
    scene.add(asteroidBelt);

    // Create ISS (space station)
    const issGeometry = new THREE.BoxGeometry(3, 3, 3);
    const issMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x4a90e2,
      shininess: 80,
      specular: 0x666666
    });
    const iss = new THREE.Mesh(issGeometry, issMaterial);
    iss.position.set(0, 20, 0);
    iss.castShadow = true;
    iss.receiveShadow = true;
    scene.add(iss);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      const time = Date.now() * 0.001;

      // Rotate space objects
      mars.rotation.y += 0.005;
      asteroidBelt.rotation.y += 0.005;
      iss.rotation.y += 0.005;

      // Spaceship hover animation
      if (spaceshipRef.current) {
        spaceshipRef.current.position.y = Math.sin(time * 2) * 0.5;
        spaceshipRef.current.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const startMission = (mission: MissionObjective) => {
    setCurrentMission(mission);
    setGameMode('mission');
    const response = `Mission started: ${mission.title}. ${mission.description}`;
    setJarvisMessage(response);
    speakWithJarvis(response);
  };

  const returnToMenu = () => {
    setGameMode('menu');
    setCurrentMission(null);
    setJarvisMessage("Returned to main menu. What would you like to do next?");
  };

  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-blue-900 to-black relative overflow-hidden">
        {/* Stars Background */}
        <div className="absolute inset-0">
          {Array.from({ length: 200 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: `${(i % 3) + 1}px`,
                height: `${(i % 3) + 1}px`,
                left: `${(i * 17) % 100}%`,
                top: `${(i * 23) % 100}%`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 2 + (i % 3),
                repeat: Infinity,
                delay: (i * 0.1) % 2
              }}
            />
          ))}
        </div>

        {/* Header */}
        <motion.div 
          className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 text-center"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 tracking-wider drop-shadow-2xl">
            SPACECRAFT SIMULATION
          </h1>
          <p className="text-blue-300 text-xl md:text-2xl tracking-widest drop-shadow-lg mb-8">
            EMBARK ON A COSMIC JOURNEY WITH JARVIS
          </p>
          <div className="w-48 h-2 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"></div>
        </motion.div>

        {/* Mission Selection */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {missionObjectives.map((mission, index) => (
              <motion.div
                key={mission.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gradient-to-br from-blue-900/90 via-purple-900/90 to-cyan-900/90 backdrop-blur-lg rounded-2xl p-6 border border-blue-400/50 shadow-2xl cursor-pointer hover:scale-105 transition-transform"
                onClick={() => startMission(mission)}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">
                      {mission.type === 'navigation' ? '🚀' : 
                       mission.type === 'exploration' ? '🔍' : 
                       mission.type === 'communication' ? '📡' : '🔧'}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">{mission.title}</h3>
                  <p className="text-blue-200 text-sm">{mission.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Jarvis Companion */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="bg-gradient-to-br from-blue-900/95 via-purple-900/95 to-cyan-900/95 backdrop-blur-xl rounded-3xl p-8 border border-blue-400/50 shadow-2xl max-w-2xl">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                <span className="text-white text-3xl">🤖</span>
              </div>
              <div className="text-center">
                <h3 className="text-white font-bold text-2xl tracking-wider">JARVIS</h3>
                <p className="text-blue-200 text-sm">Your AI Space Companion</p>
              </div>
            </div>
            
            {jarvisMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 rounded-2xl p-6 border border-blue-400/30 mb-6 text-center"
              >
                <p className="text-white text-lg leading-relaxed font-medium">
                  {jarvisMessage}
                </p>
              </motion.div>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  if (isListening) {
                    stopListening();
                  } else {
                    startListening();
                  }
                }}
                disabled={!isSpeechSupported()}
                className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg'
                } ${!isSpeechSupported() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
              >
                {isListening ? '🛑 Stop Listening' : '🎤 Start Listening'}
              </button>
              
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                  isMuted 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg' 
                    : 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                } hover:scale-105`}
              >
                {isMuted ? '🔊 Unmute' : '🔇 Mute'}
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-blue-200 text-sm">
                Speech Support: {isSpeechSupported() ? '✅ Yes' : '❌ No'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameMode === 'mission') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-blue-900 to-black relative overflow-hidden">
        {/* 3D Scene */}
        <div className="absolute inset-0">
          <div ref={containerRef} className="w-full h-full" />
        </div>

        {/* Mission HUD */}
        <div className="absolute top-8 left-8 z-50">
          <div className="bg-gradient-to-br from-blue-900/90 via-purple-900/90 to-cyan-900/90 backdrop-blur-lg rounded-2xl p-6 border border-blue-400/50 shadow-2xl">
            <h2 className="text-white font-bold text-2xl mb-4">Mission: {currentMission?.title}</h2>
            <p className="text-blue-200 text-sm mb-4">{currentMission?.description}</p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-white text-sm">Health: 100%</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-white text-sm">Fuel: 100%</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                <span className="text-white text-sm">Oxygen: 100%</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                <span className="text-white text-sm">Speed: 0 km/s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Jarvis Mission Companion */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="bg-gradient-to-br from-blue-900/95 via-purple-900/95 to-cyan-900/95 backdrop-blur-xl rounded-3xl p-6 border border-blue-400/50 shadow-2xl max-w-xl">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-white text-xl">🤖</span>
              </div>
              <h3 className="text-white font-bold text-lg">JARVIS</h3>
            </div>
            
            {jarvisMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 rounded-xl p-4 border border-blue-400/30 mb-4 text-center"
              >
                <p className="text-white text-sm leading-relaxed">
                  {jarvisMessage}
                </p>
              </motion.div>
            )}

            <div className="flex justify-center space-x-3">
              <button
                onClick={() => {
                  if (isListening) {
                    stopListening();
                  } else {
                    startListening();
                  }
                }}
                disabled={!isSpeechSupported()}
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                } ${!isSpeechSupported() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
              >
                {isListening ? '🛑 Stop' : '🎤 Listen'}
              </button>
              
              <button
                onClick={returnToMenu}
                className="px-6 py-3 rounded-xl font-semibold text-sm bg-gray-600 hover:bg-gray-700 text-white transition-all duration-300 hover:scale-105"
              >
                🏠 Menu
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
