export interface Project {
  title: string;
  category: 'web' | 'game' | 'ai';
  desc: string;
  tags: string[];
  icon: string;
  codeLink: string;
  liveLink: string;
  details?: string;
}

export interface Skill {
  name: string;
  lvl: number;
  icon: string;
  desc?: string;
}

export interface ExperienceItem {
  date: string;
  role: string;
  company: string;
  desc: string;
  icon: string;
  details?: string[];
}

export interface EducationItem {
  date: string;
  degree: string;
  institution: string;
  desc: string;
  icon: string;
}

export const portfolioData = {
  profile: {
    name: "Gohul",
    role: "Full Stack Developer",
    bio: "I build immersive web applications, high-performance interactive 3D experiences, and intelligent AI models. I bridge the gap between creative visual frontends and scalable backend architectures.",
    avatar: "👨‍💻",
    email: "gohul.dev@example.com",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    location: "San Francisco, CA"
  },
  projects: [
    {
      title: "Retro Voxel Odyssey",
      category: "game" as const,
      desc: "A procedural 3D voxel editor and shooter running directly in the browser with full shadow mapping and physics.",
      tags: ["Three.js", "WebGL", "JS", "Cannon.js"],
      icon: "🎮",
      codeLink: "https://github.com",
      liveLink: "https://example.com",
      details: "A browser-based retro graphics editor. Built with an optimized custom octree data structure to handle rendering thousands of voxel instances in real-time. Features real-time light rendering, soft shadows, and rigid body physics using Cannon.js."
    },
    {
      title: "Skyline Builder AI",
      category: "ai" as const,
      desc: "An AI-driven procedural city layout generator that designs urban grids, traffic flows, and exports 3D assets.",
      tags: ["Three.js", "Gemini API", "Node.js"],
      icon: "🏙️",
      codeLink: "https://github.com",
      liveLink: "https://example.com",
      details: "Leverages large language models and procedural algorithms to build detailed 3D cities. The user can request layouts in natural language, which are parsed to generate street structures, zones, building scales, and tree positions."
    },
    {
      title: "Nebula Chat Engine",
      category: "web" as const,
      desc: "Real-time collaborative game lobby and messenger with low latency custom WebSockets, dynamic avatars, and rooms.",
      tags: ["React", "WebSockets", "Tailwind", "Redis"],
      icon: "💬",
      codeLink: "https://github.com",
      liveLink: "https://example.com",
      details: "A high-concurrency chatting application designed for gaming lobbies. Employs Redis pub/sub channels to scale WebSocket server clusters, featuring rich-text formatting, custom avatar designers, and dynamic typing notifications."
    },
    {
      title: "Aura Music Visualizer",
      category: "web" as const,
      desc: "A gorgeous audio spectrum visualizer in 3D using HTML5 AudioContext, drawing reactive procedural meshes.",
      tags: ["Three.js", "Web Audio API", "Shaders"],
      icon: "🎵",
      codeLink: "https://github.com",
      liveLink: "https://example.com",
      details: "Captures real-time audio frequencies to animate complex parametric shapes. Employs custom vertex shaders to map low/mid/high audio bands to displacement textures and color gradients in WebGL."
    },
    {
      title: "Cosmic Quest RPG",
      category: "game" as const,
      desc: "An isometric browser RPG game built with canvas and vanilla Javascript, featuring pathfinding, maps, and dialogues.",
      tags: ["Canvas2D", "JavaScript", "HTML5"],
      icon: "⚔️",
      codeLink: "https://github.com",
      liveLink: "https://example.com",
      details: "A classic 2D isometric adventure. Implements an A* pathfinding algorithm for movement, custom tilemap loading systems, NPC event scripts, item inventory, and dynamic text dialogue screens."
    },
    {
      title: "Neural Vision Classifier",
      category: "ai" as const,
      desc: "A custom image classification pipeline training lightweight convolutional networks inside the browser.",
      tags: ["TensorFlow.js", "React", "TypeScript"],
      icon: "🧠",
      codeLink: "https://github.com",
      liveLink: "https://example.com",
      details: "Trains a neural net directly in-browser using the user's webcam or image uploads. Demonstrates transfer learning using MobileNet to classify custom gestures with low latency."
    }
  ],
  skills: {
    frontend: [
      { name: "React / Next.js", lvl: 90, icon: "⚛️" },
      { name: "TypeScript", lvl: 88, icon: "📘" },
      { name: "Three.js / WebGL / R3F", lvl: 85, icon: "📐" },
      { name: "HTML5 & CSS3", lvl: 95, icon: "🌐" },
      { name: "TailwindCSS", lvl: 92, icon: "🎨" }
    ],
    backend: [
      { name: "Node.js & Express", lvl: 88, icon: "🟢" },
      { name: "Go (Golang)", lvl: 75, icon: "🐹" },
      { name: "Django / Python", lvl: 82, icon: "🐍" },
      { name: "WebSockets & WebRTC", lvl: 80, icon: "⚡" }
    ],
    databases: [
      { name: "PostgreSQL", lvl: 85, icon: "🐘" },
      { name: "MySQL", lvl: 80, icon: "🐬" },
      { name: "MongoDB", lvl: 82, icon: "💾" },
      { name: "Redis Caching", lvl: 78, icon: "🌶️" }
    ],
    tools: [
      { name: "Git & GitHub", lvl: 92, icon: "🐙" },
      { name: "Docker", lvl: 75, icon: "🐳" },
      { name: "Vite / Webpack", lvl: 85, icon: "📦" },
      { name: "Blender 3D Modeling", lvl: 70, icon: "🖌️" }
    ]
  },
  experience: [
    {
      date: "2024 - PRESENT",
      role: "Creative Full Stack Developer",
      company: "Voxel Media Lab",
      desc: "Architected modern interactive 3D landing pages and custom web tools. Developed highly reusable React components and micro-interactions.",
      icon: "💻",
      details: [
        "Reduced page load times by 35% through WebGL texture optimization and asset instancing.",
        "Created an in-house React component library shared across 4 product teams.",
        "Integrated Gemini API to power user-customizable 3D asset generation workflows."
      ]
    },
    {
      date: "2022 - 2024",
      role: "Full Stack Engineer",
      company: "TechCrafters Studios",
      desc: "Designed and scaled backend APIs, relational databases, and low-latency WebSocket communication layers.",
      icon: "🛠️",
      details: [
        "Engineered real-time notification engine using Redis pub/sub and WebSockets, handling 15,000+ concurrent connections.",
        "Optimized database queries and schemas, reducing page generation time by 200ms on core templates.",
        "Established CI/CD deployment pipelines on AWS using Docker, streamlining developer operations."
      ]
    }
  ],
  education: [
    {
      date: "2019 - 2022",
      degree: "B.S. in Computer Science",
      institution: "State Institute of Technology",
      desc: "Focused on computer graphics, algorithms, and full-stack software development. Graduated with Honors.",
      icon: "🎓"
    }
  ],
  libraryBooks: [
    { name: "Python", desc: "Used for AI Laboratory models, Django backend endpoints, and data processing scripts." },
    { name: "React", desc: "My primary frontend library. Renders beautiful UI components and reactive 3D environments via Fiber." },
    { name: "Django", desc: "A robust Python framework used to build secure, scalable admin systems and RESTful APIs." },
    { name: "Go", desc: "Leveraged for low-latency, high-concurrency microservices and fast network routers." },
    { name: "JavaScript", desc: "The core language of the web. Essential for client-side behaviors, animations, and game scripting." },
    { name: "TypeScript", desc: "Provides static type checks, ensuring reliable code construction across large application footprints." },
    { name: "MySQL", desc: "A traditional relational database used for structured models, data integrity, and complex queries." },
    { name: "PostgreSQL", desc: "My database of choice for high-volume operations, custom JSON queries, and spatial data." }
  ]
};
