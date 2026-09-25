export interface Project {
  title: string;
  category: 'web' | 'game' | 'ai';
  desc: string;
  tags: string[];
  icon: string;
  codeLink: string;
  liveLink: string;
  features?: string[];
  contribution?: string;
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
    bio: "Hi, I'm Gohul! I am a passionate Full Stack Developer with an MSc in Computer Science. I specialize in building modern interactive web applications, high-performance backend systems, and engaging 3D digital experiences.",
    avatar: "👨‍💻",
    email: "gohul.dev@example.com",
    github: "https://github.com/gohul",
    linkedin: "https://linkedin.com/in/gohul",
    location: "Sreekandapuram, Kerala, India"
  },
  projects: [
    {
      title: "CloudStick",
      category: "web" as const,
      desc: "A powerful server management and web hosting control panel designed for developers to effortlessly deploy, manage, and scale cloud infrastructure.",
      tags: ["Python", "Django", "React", "REST APIs", "SQL", "Linux"],
      icon: "☁️",
      codeLink: "https://github.com/gohul/cloudstick",
      liveLink: "https://cloudstick.io",
      features: [
        "Automated Nginx & PHP-FPM server configuration",
        "One-click SSL certificate provisioning via Let's Encrypt",
        "Real-time server CPU, RAM, and disk telemetry dashboard",
        "Git automated deployment hooks for web projects"
      ],
      contribution: "Architected the Django REST backend API, integrated server automation scripts, and engineered the responsive dashboard UI.",
      details: "CloudStick simplifies complex server administration into a smooth web UI. Built to handle server provisioning, database management, and site isolation with maximum security."
    },
    {
      title: "KSmart",
      category: "web" as const,
      desc: "An integrated e-governance service portal streamlining municipal operations, civil registrations, and public utility management.",
      tags: ["React", "TypeScript", "Django", "REST APIs", "Tailwind CSS"],
      icon: "🏛️",
      codeLink: "https://github.com/gohul/ksmart",
      liveLink: "https://ksmart.gov.in",
      features: [
        "Digital application tracking and automated approval workflows",
        "Secure payment gateway integration for municipal licensing",
        "Multi-lingual UI supporting regional languages",
        "Role-based access control for administrative staff"
      ],
      contribution: "Developed core frontend modules using React and TypeScript, designed REST API endpoints, and integrated secure payment handlers.",
      details: "KSmart brings citizen services to your fingertips with digital certificate issuance, trade license processing, and property tax payments."
    },
    {
      title: "People's Voice",
      category: "web" as const,
      desc: "A civic engagement platform connecting citizens directly with local community representatives to vote on proposals and address grievances.",
      tags: ["React", "Node.js", "WebSockets", "SQL", "HTML/CSS"],
      icon: "📢",
      codeLink: "https://github.com/gohul/peoples-voice",
      liveLink: "https://peoplesvoice-demo.com",
      features: [
        "Real-time civic poll creation and community sentiment voting",
        "Interactive complaint resolution tracker with geotagging",
        "Live discussion forums powered by WebSockets",
        "Automated notification triggers for issue resolution updates"
      ],
      contribution: "Designed and built the full-stack architecture, real-time WebSocket messaging layer, and voting aggregation engine.",
      details: "People's Voice empowers local communities to voice concerns, vote on infrastructure initiatives, and track resolution statuses transparently."
    },
    {
      title: "AI News Reader",
      category: "ai" as const,
      desc: "An intelligent voice-controlled news aggregation application that curates, summarizes, and reads daily articles aloud using natural language processing.",
      tags: ["Python", "React", "Alan AI", "REST APIs", "Tailwind CSS"],
      icon: "📰",
      codeLink: "https://github.com/gohul/ai-news-reader",
      liveLink: "https://ainewsreader-demo.com",
      features: [
        "Hands-free voice navigation using conversational AI commands",
        "Real-time news feed aggregation from global publishing APIs",
        "Automated article summarization powered by NLP models",
        "Customizable reading preferences and voice playback speeds"
      ],
      contribution: "Built the React frontend, configured voice command intent parsers, and integrated real-time news API pipelines.",
      details: "AI News Reader allows users to stay informed hands-free. Simply command the application using speech to fetch top headlines, read category news, or summarize articles."
    },
    {
      title: "Retro Voxel Odyssey",
      category: "game" as const,
      desc: "A procedural 3D voxel world editor and mini-game running directly in the browser with shadow mapping and physics.",
      tags: ["Three.js", "React Three Fiber", "JavaScript", "WebGL"],
      icon: "🎮",
      codeLink: "https://github.com/gohul/voxel-odyssey",
      liveLink: "https://voxel-odyssey-demo.com",
      features: [
        "Real-time voxel block placement and terrain destruction",
        "Optimized octree spatial partition for 60FPS rendering",
        "Soft shadow mapping and dynamic day-night sky box"
      ],
      contribution: "Implemented procedural terrain mesh generation, WebGL shadow shaders, and character movement physics.",
      details: "A cozy browser 3D game showcasing octree performance tuning and WebGL rendering in React."
    }
  ],
  skills: {
    languages: [
      { name: "Python", lvl: 92, icon: "🐍", desc: "Core language for Django backends, AI algorithms, and server automation scripts." },
      { name: "JavaScript", lvl: 94, icon: "🟨", desc: "Primary web scripting language for dynamic interfaces, WebGL, and async logic." },
      { name: "TypeScript", lvl: 90, icon: "📘", desc: "Type-safe development ensuring robust and maintainable codebases." },
      { name: "HTML & CSS", lvl: 96, icon: "🌐", desc: "Semantic markup, responsive layouts, flexbox, grid, and animations." }
    ],
    frameworks: [
      { name: "React", lvl: 92, icon: "⚛️", desc: "Custom component libraries, state management, and React Three Fiber 3D." },
      { name: "Django", lvl: 88, icon: "🟢", desc: "RESTful API architecture, ORM query optimization, and secure authentication." },
      { name: "Tailwind CSS", lvl: 90, icon: "🎨", desc: "Utility-first modern styling for sleek, responsive UI design systems." },
      { name: "REST APIs", lvl: 92, icon: "⚡", desc: "JSON web service design, OpenAPI documentation, and HTTP status handling." }
    ],
    databases_tools: [
      { name: "SQL / PostgreSQL / MySQL", lvl: 88, icon: "🐘", desc: "Relational database schema modeling, indexing, and complex queries." },
      { name: "Git & GitHub", lvl: 94, icon: "🐙", desc: "Version control workflows, branching strategies, and CI/CD actions." },
      { name: "Three.js & WebGL", lvl: 84, icon: "📐", desc: "3D scene composition, custom shaders, lights, and mesh animation." }
    ]
  },
  experience: [
    {
      date: "2024 - PRESENT",
      role: "Full Stack Developer",
      company: "CloudHouse Technologies",
      desc: "Leading full-stack web application development, building scalable Django REST APIs, modern React frontends, and server control panel features.",
      icon: "💻",
      details: [
        "Architected scalable microservices using Django REST framework and PostgreSQL, reducing latency by 40%.",
        "Developed responsive React and TypeScript frontends with state management and rich interactive UI components.",
        "Engineered automated server management workflows and deployment hooks for cloud web hosting solutions."
      ]
    },
    {
      date: "2022 - 2024",
      role: "Software Developer Intern / Assistant",
      company: "SES Tech Solutions",
      desc: "Assisted in building municipal portal modules, e-governance solutions, and real-time civic web applications.",
      icon: "🛠️",
      details: [
        "Built responsive UI components using React, HTML5, and CSS3 for public service portals.",
        "Integrated REST APIs and payment gateways, enabling secure digital transactions for citizens.",
        "Participated in database query optimization and Git code reviews."
      ]
    }
  ],
  education: [
    {
      date: "2022 – 2024",
      degree: "MSc Computer Science",
      institution: "SES College Sreekandapuram",
      desc: "Specialized in Advanced Computer Science, Software Architecture, Web Technologies, Database Systems, and Distributed Computing. Graduated with top academic standing.",
      icon: "🎓"
    },
    {
      date: "2019 – 2022",
      degree: "B.S. in Computer Science",
      institution: "SES College Sreekandapuram",
      desc: "Focused on core Data Structures & Algorithms, Object-Oriented Programming, Operating Systems, and Computer Networks.",
      icon: "🏫"
    }
  ],
  workshop: {
    currentlyLearning: [
      { name: "Next.js 14 & Server Actions", icon: "🚀", desc: "Exploring full-stack React framework features and edge rendering." },
      { name: "AI Agent Frameworks & LLM Integration", icon: "🤖", desc: "Building autonomous AI agents using LangChain and Gemini API." },
      { name: "Advanced WebGL Shaders & GLSL", icon: "✨", desc: "Creating realistic water ripple and particle physics shaders in Three.js." }
    ],
    devTools: [
      { name: "VS Code & Terminal", icon: "💻", desc: "Primary development workspace with custom zsh setup and extensions." },
      { name: "Docker & Containers", icon: "🐳", desc: "Containerized local dev environments and deployment builds." },
      { name: "Postman & Insomnia", icon: "🚀", desc: "API testing, endpoint benchmarking, and request payload debugging." },
      { name: "Git & GitHub Actions", icon: "🐙", desc: "Automated test suites, linter checks, and deployment pipelines." }
    ]
  }
};

