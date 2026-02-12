import React, { useState, useRef, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { DiagramData } from '../types';
import { TEMPLATES, Template } from './content/templateData';
import DiagramCanvas from './DiagramCanvas';

interface TemplateChooserProps {
    onSelect: (data: DiagramData) => void;
    onBack: () => void;
}

// ─── Animated Particle Background ───
const ParticleField: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        let w = 0, h = 0;

        interface Particle {
            x: number; y: number;
            vx: number; vy: number;
            r: number;
            alpha: number;
            color: string;
        }

        const colors = ['#E91E63', '#F48FB1', '#D6336C', '#FF80AB', '#FCE4EC', '#F8BBD0'];
        let particles: Particle[] = [];

        const resize = () => {
            w = canvas.width = canvas.offsetWidth;
            h = canvas.height = canvas.offsetHeight;
        };

        const init = () => {
            resize();
            const count = Math.min(Math.floor((w * h) / 12000), 80);
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                r: Math.random() * 2.5 + 0.5,
                alpha: Math.random() * 0.5 + 0.1,
                color: colors[Math.floor(Math.random() * colors.length)],
            }));
        };

        const draw = () => {
            ctx.clearRect(0, 0, w, h);

            // Draw connection lines
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(214, 51, 108, ${0.08 * (1 - dist / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            // Draw particles
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha;
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            animId = requestAnimationFrame(draw);
        };

        init();
        draw();
        window.addEventListener('resize', init);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', init);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
        />
    );
};

// ─── Floating Orbs ───
const FloatingOrbs: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <motion.div
            className="absolute rounded-full"
            style={{
                width: 400, height: 400,
                background: 'radial-gradient(circle, rgba(233,30,99,0.12) 0%, transparent 70%)',
                top: '-5%', right: '-5%',
                filter: 'blur(60px)',
            }}
            animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.1, 0.95, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
            className="absolute rounded-full"
            style={{
                width: 350, height: 350,
                background: 'radial-gradient(circle, rgba(244,143,177,0.15) 0%, transparent 70%)',
                bottom: '5%', left: '-3%',
                filter: 'blur(50px)',
            }}
            animate={{ x: [0, -25, 35, 0], y: [0, 30, -25, 0], scale: [1, 0.9, 1.15, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
            className="absolute rounded-full"
            style={{
                width: 250, height: 250,
                background: 'radial-gradient(circle, rgba(214,51,108,0.08) 0%, transparent 70%)',
                top: '40%', left: '50%',
                filter: 'blur(40px)',
            }}
            animate={{ x: [0, 50, -30, 0], y: [0, -20, 40, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
    </div>
);

// ─── Animation variants ───
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};

const itemVariants: Variants = {
    hidden: { y: 30, opacity: 0, scale: 0.95 },
    visible: {
        y: 0, opacity: 1, scale: 1,
        transition: { type: 'spring', stiffness: 120, damping: 15 },
    },
};

const heroVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

// ─── Template Card with live diagram preview ───
const TemplateCard: React.FC<{
    template: Template;
    onSelect: (t: Template) => void;
    index: number;
}> = ({ template, onSelect }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const fitScreenRef = useRef<(() => void) | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.02 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="relative rounded-2xl cursor-pointer flex flex-col overflow-hidden group"
            style={{
                height: 380,
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(214, 51, 108, 0.12)',
                boxShadow: isHovered
                    ? '0 20px 60px rgba(233, 30, 99, 0.15), 0 0 30px rgba(214, 51, 108, 0.08), inset 0 1px 0 rgba(255,255,255,0.8)'
                    : '0 4px 20px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
                transition: 'box-shadow 0.4s ease',
            }}
            onClick={() => onSelect(template)}
        >
            {/* Glow border on hover */}
            <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                    border: '1px solid transparent',
                    background: 'linear-gradient(135deg, rgba(233,30,99,0.15), rgba(244,143,177,0.1), transparent) border-box',
                    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
            />

            {/* Diagram Preview */}
            <div
                className="flex-1 w-full relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #FFF5F8 0%, #FFF0F5 50%, #FFEEF4 100%)',
                }}
            >
                <div className="absolute inset-0 pointer-events-none transition-transform duration-700 ease-out group-hover:scale-105">
                    <DiagramCanvas
                        data={template.data}
                        onDataChange={() => { }}
                        selectedIds={selectedIds}
                        setSelectedIds={setSelectedIds}
                        forwardedRef={svgRef}
                        fitScreenRef={fitScreenRef}
                        isEditable={false}
                        interactionMode="pan"
                        onLinkStart={() => { }}
                        linkingState={null}
                        previewLinkTarget={null}
                        showGrid={false}
                        autoFit={true}
                    />
                </div>

                {/* Shimmer overlay on hover */}
                <motion.div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
                        backgroundSize: '200% 200%',
                    }}
                    animate={isHovered ? {
                        backgroundPosition: ['200% 200%', '-100% -100%'],
                    } : {}}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                />

                {/* Bottom gradient fade */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-16"
                    style={{
                        background: 'linear-gradient(to top, rgba(255,255,255,0.9), transparent)',
                    }}
                />
            </div>

            {/* Info Area */}
            <div
                className="px-5 py-4 relative z-10"
                style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0.8))',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <h3
                    className="text-base font-bold mb-1 truncate"
                    style={{ color: '#1a1a2e' }}
                    title={template.title}
                >
                    {template.title}
                </h3>
                <p
                    className="text-xs mb-3"
                    style={{
                        color: '#666',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: 32,
                    }}
                >
                    {template.description}
                </p>
                <div className="flex items-center text-sm font-semibold" style={{ color: '#D6336C' }}>
                    <span>Use Template</span>
                    <motion.svg
                        className="w-4 h-4 ml-2"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        animate={{ x: isHovered ? 5 : 0 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </motion.svg>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Main Template Chooser ───
const TemplateChooser: React.FC<TemplateChooserProps> = ({ onSelect, onBack }) => {
    const defaultDiagram: DiagramData = {
        title: 'New Diagram',
        architectureType: 'Visual Playground',
        nodes: [],
        links: [],
        containers: [],
    };

    // Animated counter for template count
    const [displayCount, setDisplayCount] = useState(0);
    useEffect(() => {
        const target = TEMPLATES.length;
        const duration = 800;
        const startTime = Date.now();
        const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, []);

    return (
        <div
            className="h-screen w-screen flex flex-col overflow-hidden relative"
            style={{
                background: 'linear-gradient(160deg, #FFFFFF 0%, #FFF5F8 25%, #FFEEF4 50%, #FFF0F5 75%, #FFFFFF 100%)',
            }}
        >
            {/* Animated Background */}
            <ParticleField />
            <FloatingOrbs />

            {/* Subtle grid pattern */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(214,51,108,0.04) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                    zIndex: 0,
                }}
            />

            {/* Header */}
            <motion.header
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="flex items-center justify-between px-8 py-4 flex-shrink-0 relative"
                style={{
                    zIndex: 20,
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(214, 51, 108, 0.08)',
                }}
            >
                <div className="flex items-center gap-4">
                    <motion.button
                        onClick={onBack}
                        whileHover={{ scale: 1.05, x: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                            color: '#666',
                            background: 'rgba(214, 51, 108, 0.04)',
                            border: '1px solid rgba(214, 51, 108, 0.08)',
                            cursor: 'pointer',
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Dashboard
                    </motion.button>

                    <div style={{ width: 1, height: 24, background: 'rgba(214,51,108,0.12)' }} />

                    <div>
                        <h1 className="text-lg font-bold" style={{ color: '#1a1a2e' }}>
                            Cube<span style={{ color: '#D6336C' }}>Gen</span> Templates
                        </h1>
                    </div>
                </div>

                {/* Template counter badge */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{
                        background: 'linear-gradient(135deg, rgba(233,30,99,0.08), rgba(244,143,177,0.08))',
                        border: '1px solid rgba(214,51,108,0.1)',
                    }}
                >
                    <span style={{ color: '#D6336C', fontWeight: 700, fontSize: 18 }}>{displayCount}</span>
                    <span style={{ color: '#888', fontSize: 12, fontWeight: 500 }}>templates</span>
                </motion.div>
            </motion.header>

            {/* Hero Section */}
            <motion.div
                className="text-center px-8 pt-6 pb-4 flex-shrink-0 relative"
                style={{ zIndex: 10 }}
                variants={heroVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.h2
                    className="text-3xl md:text-4xl font-extrabold tracking-tight"
                    style={{ color: '#1a1a2e' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    From Idea to Architecture.{' '}
                    <span
                        style={{
                            background: 'linear-gradient(135deg, #D6336C, #E91E63, #FF5252)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Instantly.
                    </span>
                </motion.h2>
                <motion.p
                    className="mt-2 text-sm max-w-xl mx-auto"
                    style={{ color: '#777' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    Choose a pre-built reference architecture or start fresh with a blank canvas
                </motion.p>
            </motion.div>

            {/* Template Grid */}
            <main className="flex-1 overflow-y-auto px-8 pb-8 relative" style={{ zIndex: 10 }}>
                <motion.div
                    className="grid gap-6"
                    style={{
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        maxWidth: 1500,
                        margin: '0 auto',
                    }}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* ── Blank Canvas Card ── */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="relative rounded-2xl cursor-pointer flex flex-col items-center justify-center group overflow-hidden"
                        style={{
                            height: 380,
                            background: 'rgba(255, 255, 255, 0.5)',
                            backdropFilter: 'blur(20px)',
                            border: '2px dashed rgba(214, 51, 108, 0.2)',
                            transition: 'all 0.4s ease',
                        }}
                        onClick={() => onSelect(defaultDiagram)}
                    >
                        {/* Pulse animation */}
                        <motion.div
                            className="absolute rounded-full"
                            style={{
                                width: 120, height: 120,
                                background: 'radial-gradient(circle, rgba(233,30,99,0.06) 0%, transparent 70%)',
                            }}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        />

                        <motion.div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 relative"
                            style={{
                                background: 'linear-gradient(135deg, rgba(233,30,99,0.08), rgba(244,143,177,0.1))',
                                border: '1px solid rgba(214,51,108,0.12)',
                            }}
                            whileHover={{ rotate: 90 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                        >
                            <svg
                                className="w-7 h-7"
                                style={{ color: '#D6336C' }}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                            </svg>
                        </motion.div>

                        <h3 className="text-lg font-bold mb-1" style={{ color: '#1a1a2e' }}>
                            Blank Canvas
                        </h3>
                        <p className="text-sm" style={{ color: '#888' }}>
                            Start from scratch
                        </p>

                        <motion.div
                            className="mt-4 flex items-center text-sm font-semibold"
                            style={{ color: '#D6336C' }}
                        >
                            <span>Create</span>
                            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </motion.div>
                    </motion.div>

                    {/* ── Template Cards ── */}
                    {TEMPLATES.map((template, index) => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            onSelect={t => onSelect(t.data)}
                            index={index}
                        />
                    ))}
                </motion.div>
            </main>
        </div>
    );
};

export default TemplateChooser;
