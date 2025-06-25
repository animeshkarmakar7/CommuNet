import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import * as THREE from 'three';
import { MessageCircle, Shield, Users, Zap, Lock, Globe, ArrowRight, Star } from 'lucide-react';
import { Link } from "react-router-dom";

const ThreeBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Create floating particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 100;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.8,
      color: 0x667eea,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Create interconnected network lines
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = [];
    const connections = 150;

    for (let i = 0; i < connections; i++) {
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80
      );
      const end = new THREE.Vector3(
        start.x + (Math.random() - 0.5) * 20,
        start.y + (Math.random() - 0.5) * 20,
        start.z + (Math.random() - 0.5) * 20
      );

      linePositions.push(start.x, start.y, start.z);
      linePositions.push(end.x, end.y, end.z);
    }

    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x764ba2,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    camera.position.z = 50;

    const animate = () => {
      requestAnimationFrame(animate);

      particlesMesh.rotation.x += 0.0005;
      particlesMesh.rotation.y += 0.001;
      lines.rotation.x += 0.0003;
      lines.rotation.y += 0.0008;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 -z-10" />;
};

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/90 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <motion.div
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
          >
          <Link to="/signup">Communet</Link> 
          </motion.div>
          
        

          <div className="flex gap-3">
            <motion.button
              className="border border-purple-500/50 text-white px-6 py-2 rounded-full font-semibold hover:border-purple-400 hover:bg-purple-500/10 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
            <Link to="/login">Sign In</Link>
            </motion.button>
            
            <motion.button
              className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(168, 85, 247, 0.4)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/signup">Sign Up</Link>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

const Hero = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <motion.section
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ y, opacity }}
    >
      <div className="text-center z-10 px-6">
        <motion.h1
          className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        >
          Connect
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Beyond
          </span>
          <br />
          Boundaries
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl text-white/70 mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        >
          Experience the future of communication with Communet - where privacy meets innovation
        </motion.p>

        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
        >
          <motion.button
            className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 hover:from-purple-600 hover:to-pink-600 transition-all group"
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 0 30px rgba(168, 85, 247, 0.6)",
            }}
            whileTap={{ scale: 0.95 }}
          >
          <Link to="/signup"> Get Started</Link> 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>

      {/* Floating elements */}
      <motion.div
        className="absolute top-20 left-20 w-20 h-20 border border-purple-500/30 rounded-full"
        animate={{ 
          rotate: 360,
          scale: [1, 1.2, 1],
        }}
        transition={{ 
          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }}
      />

      <motion.div
        className="absolute bottom-40 right-20 w-16 h-16 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-xl"
        animate={{ 
          y: [-20, 20, -20],
          x: [-10, 10, -10]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
    </motion.section>
  );
};

const FeatureCard = ({ icon: Icon, title, description, delay }) => {
  return (
    <motion.div
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: "0 20px 40px rgba(168, 85, 247, 0.1)"
      }}
      viewport={{ once: true }}
    >
      <motion.div
        className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
        whileHover={{ rotate: 5 }}
      >
        <Icon className="w-8 h-8 text-white" />
      </motion.div>
      
      <h3 className="text-2xl font-bold mb-4 text-white">{title}</h3>
      <p className="text-white/70 leading-relaxed">{description}</p>
    </motion.div>
  );
};

const Features = () => {
  const features = [
    {
      icon: MessageCircle,
      title: "Real-time Messaging",
      description: "Experience lightning-fast messaging with end-to-end encryption. Your conversations are instant and secure."
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Built with privacy at its core. Your data belongs to you, and we keep it that way with zero-knowledge architecture."
    },
    {
      icon: Users,
      title: "User Authentication",
      description: "Secure multi-factor authentication ensures only you can access your account. Advanced security made simple."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized for speed and performance. Send messages, share files, and connect instantly without any delays."
    },
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "Military-grade encryption protects every message. Not even we can read your private conversations."
    },
    {
      icon: Globe,
      title: "Global Connectivity",
      description: "Connect with anyone, anywhere in the world. Break down barriers and build meaningful connections."
    }
  ];

  return (
    <section id="features" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Everything you need for secure, fast, and reliable communication
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const Stats = () => {
  const stats = [
    { phrase: "Connect", label: "Instantly" },
    { phrase: "Chat", label: "Securely" },
    { phrase: "Share", label: "Freely" },
    { phrase: "Communicate", label: "Seamlessly" }
  ];

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.phrase}
              className="text-center"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2"
                whileHover={{ scale: 1.1 }}
              >
                {stat.phrase}
              </motion.div>
              <div className="text-white/60 font-semibold">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTA = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-pink-900/20" />
      
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-6xl font-black mb-8 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Ready to Connect?
          </h2>
          
          <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
            Join millions of users who trust Communet for their daily communications. 
            Start your journey today.
          </p>

          <motion.button
            className="bg-gradient-to-r from-purple-500 to-pink-500 px-12 py-6 rounded-full font-bold text-xl flex items-center gap-3 mx-auto hover:from-purple-600 hover:to-pink-600 transition-all group"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 40px rgba(168, 85, 247, 0.6)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Star className="w-6 h-6" />
          <Link to="/signup">Get Started Now</Link>  
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 md:mb-0">
            Communet
          </div>
          
        </div>
        
        <div className="mt-8 pt-8 border-t border-white/10 text-center text-white/40">
          <p>© 2024 Communet. All rights reserved. Built with ❤️ for secure communication.</p>
        </div>
      </div>
    </footer>
  );
};

export default function CommunetLanding() {
  return (
    <div className="bg-black min-h-screen relative">
      <ThreeBackground />
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <CTA />
      <Footer />
    </div>
  );
}