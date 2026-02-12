import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

// ─── Particle Canvas Background ───
const ParticleCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        let w = 0, h = 0;

        interface P { x: number; y: number; vx: number; vy: number; r: number; a: number; color: string; }
        const colors = ['#E91E63', '#F48FB1', '#D6336C', '#FF80AB', '#FCE4EC'];
        let particles: P[] = [];

        const resize = () => {
            w = canvas.width = canvas.offsetWidth;
            h = canvas.height = canvas.offsetHeight;
        };

        const init = () => {
            resize();
            const count = Math.min(Math.floor((w * h) / 25000), 40);
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * w, y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
                r: Math.random() * 2 + 0.5, a: Math.random() * 0.4 + 0.05,
                color: colors[Math.floor(Math.random() * colors.length)],
            }));
        };

        const draw = () => {
            ctx.clearRect(0, 0, w, h);
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(214, 51, 108, ${0.06 * (1 - d / 120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            for (const p of particles) {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.a;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            animId = requestAnimationFrame(draw);
        };

        init(); draw();
        window.addEventListener('resize', init);
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', init); };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />;
};

// ─── 3D Perspective Retro Grid ───
const RetroGrid: React.FC = () => {
    return (
        <div className="absolute bottom-0 w-full h-[300px] pointer-events-none overflow-hidden" style={{ zIndex: 1, perspective: 500 }}>
            <div
                className="absolute w-[200%] h-[200%] -left-[50%]"
                style={{
                    transform: 'rotateX(60deg) translateY(-100px) translateZ(-200px)',
                    background: 'linear-gradient(transparent 0%, transparent 95%, rgba(214, 51, 108, 0.15) 95%)',
                    backgroundSize: '40px 40px',
                    animation: 'gridMove 2s linear infinite',
                }}
            />
            <div
                className="absolute w-[200%] h-[200%] -left-[50%]"
                style={{
                    transform: 'rotateX(60deg) translateY(-100px) translateZ(-200px)',
                    background: 'linear-gradient(90deg, transparent 0%, transparent 95%, rgba(214, 51, 108, 0.15) 95%)',
                    backgroundSize: '40px 40px',
                }}
            />
            <style>{`
                @keyframes gridMove {
                    0% { transform: rotateX(60deg) translateY(0) translateZ(-200px); }
                    100% { transform: rotateX(60deg) translateY(40px) translateZ(-200px); }
                }
            `}</style>
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(255,255,255,0)] to-[#FFFFFF]" style={{ background: 'linear-gradient(to top, rgba(255,255,255,0) 0%, #FFFFFF 100%)' }} />
        </div>
    );
};

// ─── Orbiting Rings around Logo ───
const OrbitRings: React.FC = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Ring 1 - Fast inner */}
        <motion.div
            className="absolute rounded-full"
            style={{
                width: 200, height: 200,
                border: '1px solid rgba(233, 30, 99, 0.15)',
            }}
            animate={{ rotate: 360, scale: [1, 1.05, 1] }}
            transition={{
                rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
                scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            }}
        >
            <motion.div
                className="absolute"
                style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#F48FB1',
                    top: -3, left: '50%', marginLeft: -3,
                    boxShadow: '0 0 10px rgba(244,143,177,0.8)',
                }}
            />
        </motion.div>

        {/* Ring 2 - Medium middle */}
        <motion.div
            className="absolute rounded-full"
            style={{
                width: 280, height: 280,
                border: '1px dashed rgba(214, 51, 108, 0.1)',
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        >
            <motion.div
                className="absolute"
                style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #E91E63, #FF80AB)',
                    top: '50%', right: -4, marginTop: -4,
                    boxShadow: '0 0 12px rgba(233,30,99,0.6)',
                }}
            />
        </motion.div>

        {/* Ring 3 - Slow outer */}
        <motion.div
            className="absolute rounded-full"
            style={{
                width: 420, height: 420,
                border: '1px solid rgba(233, 30, 99, 0.05)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        >
            <motion.div
                className="absolute"
                style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: '#D6336C',
                    bottom: '15%', left: '15%',
                    boxShadow: '0 0 8px rgba(214,51,108,0.4)',
                }}
            />
            <motion.div
                className="absolute"
                style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: '#D6336C',
                    top: '15%', right: '15%',
                    boxShadow: '0 0 8px rgba(214,51,108,0.4)',
                }}
            />
        </motion.div>
    </div>
);

// ─── Rotating Taglines ───
const TAGLINES = [
    'Design Architectures',
    'Visualize Systems',
    'Build Diagrams',
    'Export Anywhere',
];

const RotatingTagline: React.FC = () => {
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIdx(prev => (prev + 1) % TAGLINES.length);
        }, 2500);
        return () => clearInterval(timer);
    }, []);

    const variants: Variants = {
        enter: { y: 20, opacity: 0, filter: 'blur(4px)' },
        center: { y: 0, opacity: 1, filter: 'blur(0px)', transition: { duration: 0.4, ease: 'easeOut' } },
        exit: { y: -20, opacity: 0, filter: 'blur(4px)', transition: { duration: 0.3, ease: 'easeIn' } },
    };

    return (
        <div className="h-8 relative overflow-hidden flex items-center justify-center w-full">
            <AnimatePresence mode="wait">
                <motion.div
                    key={idx}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute text-lg font-medium tracking-wider uppercase"
                    style={{
                        background: 'linear-gradient(90deg, #D6336C, #E91E63)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    {TAGLINES[idx]}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

// ─── Main Intro Component ───
const Intro: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div
            className="h-screen w-screen flex flex-col items-center justify-center text-slate-800 relative overflow-hidden selection:bg-pink-200"
            style={{
                background: 'linear-gradient(160deg, #FFFFFF 0%, #FFF5F8 20%, #FFEEF4 45%, #FFF0F5 70%, #FFFFFF 100%)',
            }}
        >
            {/* Layer 0: Animated Backgrounds */}
            <ParticleCanvas />

            {/* Retro Moving Grid at bottom */}
            <RetroGrid />

            {/* Floating gradient orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0], x: [0, 50, 0], y: [0, -30, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-[10%] -right-[5%] w-[800px] h-[800px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(233,30,99,0.08) 0%, transparent 70%)', filter: 'blur(90px)' }}
                />
                <motion.div
                    animate={{ scale: [1, 1.1, 1], x: [0, -40, 0], y: [0, 50, 0] }}
                    transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    className="absolute -bottom-[10%] -left-[10%] w-[700px] h-[700px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(244,143,177,0.1) 0%, transparent 70%)', filter: 'blur(80px)' }}
                />
            </div>

            {/* Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5, opacity: 0.03, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.4) 50%)', backgroundSize: '100% 4px' }} />
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 5, background: 'linear-gradient(to bottom, transparent, rgba(233,30,99,0.1), transparent)', height: '20%' }}
                animate={{ top: ['-20%', '120%'] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />

            {/* Main Content */}
            <div className="z-10 flex flex-col items-center max-w-4xl px-8 text-center w-full relative">

                {/* Astonishing Logo Presentation */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, type: 'spring', stiffness: 80 }}
                    className="relative mb-10"
                    style={{ width: 180, height: 180 }}
                >
                    {/* Intense center glow */}
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(233,30,99,0.3) 0%, rgba(233,30,99,0.1) 40%, transparent 70%)',
                            filter: 'blur(25px)',
                        }}
                        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.3, 0.6] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    {/* Orbiting rings */}
                    {/* Orbiting rings */}
                    <OrbitRings />

                    {/* Logo */}
                    <motion.div
                        className="relative z-10 w-full h-full flex items-center justify-center p-6"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        {/* White backdrop for logo contrast if needed, but going for transparent look */}
                        <div className="relative z-10 drop-shadow-2xl filter brightness-110">
                            <Logo className="w-32 h-32 md:w-36 md:h-36 text-[#E11D48]" />
                        </div>
                    </motion.div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                    className="text-5xl md:text-7xl font-black tracking-tighter mb-4"
                    style={{ color: '#1a1a2e' }}
                >
                    CubeGen{' '}
                    <span
                        style={{
                            background: 'linear-gradient(135deg, #E11D48, #D6336C, #E91E63)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            textShadow: '0 4px 20px rgba(233,30,99,0.3)'
                        }}
                    >
                        AI Studio
                    </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                    className="text-xl md:text-3xl font-light mb-6 tracking-wide"
                    style={{ color: '#555' }}
                >
                    Architect the future.{' '}
                    <span className="font-semibold text-[#1a1a2e]">Visualize instantly.</span>
                </motion.p>

                {/* Rotating Tagline (Clean, no box) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="mb-12 h-8"
                >
                    <RotatingTagline />
                </motion.div>

                {/* CTA Button - Ultra Premium */}
                <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1, type: 'spring' }}
                    onClick={() => navigate('/dashboard')}
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 40px rgba(233,30,99,0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-12 py-5 text-white text-xl font-bold rounded-full overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, #E11D48 0%, #C2185B 100%)',
                        boxShadow: '0 8px 30px rgba(233,30,99,0.25)',
                        border: '1px solid rgba(255,255,255,0.2)',
                    }}
                >
                    {/* Shimmer sweep */}
                    <motion.div
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
                            backgroundSize: '200% 100%',
                        }}
                        animate={{ backgroundPosition: ['200% 0', '-100% 0'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                    />

                    <span className="relative z-10 flex items-center gap-3">
                        Start Creating
                        <motion.svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </motion.svg>
                    </span>
                </motion.button>

            </div>

            {/* Footer - Minimalist */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.5 }}
                className="absolute bottom-8 flex items-center gap-4 text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 mix-blend-multiply"
                style={{ color: '#E91E63', zIndex: 10 }}
            >
                <span>Architecture</span>
                <span>•</span>
                <span>Cloud</span>
                <span>•</span>
                <span>AI</span>
            </motion.div>
        </div>
    );
};

export default Intro;
