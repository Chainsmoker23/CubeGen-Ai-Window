import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from './Logo';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    const tools = [
        {
            title: 'Custom Playground',
            desc: 'Start from scratch. Create undefined architectures freely with our drag-and-drop editor.',
            path: '/playground',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            gradient: 'from-[#EC4899] to-[#E11D48]',
            delay: 0.1
        },
        {
            title: 'Code to Diagram',
            desc: 'Transform your infrastructure code into visual diagrams instantly using AI.',
            path: '/code-to-diagram',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
            ),
            gradient: 'from-[#8B5CF6] to-[#6366F1]',
            delay: 0.2
        },
    ];

    return (
        <div className="min-h-screen w-full bg-[#FFF0F5] relative overflow-y-auto overflow-x-hidden selection:bg-pink-100 flex flex-col font-sans text-slate-800">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, 0],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-gradient-to-br from-pink-200/40 to-purple-200/30 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute -bottom-[20%] -left-[10%] w-[700px] h-[700px] bg-gradient-to-tr from-blue-100/40 to-pink-100/40 rounded-full blur-[100px]"
                />
            </div>

            {/* Header */}
            <header className="relative z-20 px-6 py-4 md:px-10 md:py-6 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 text-[#E11D48] relative">
                        <div className="absolute inset-0 bg-pink-400/20 blur-lg rounded-full animate-pulse"></div>
                        <Logo className="w-full h-full relative z-10" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        CubeGen <span className="text-[#E11D48]">AI Studio</span>
                    </h1>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        {/* User info removed for standalone app */}
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 border border-pink-200 hover:bg-white hover:border-[#E11D48]/30 hover:shadow-lg hover:shadow-pink-500/10 transition-all duration-300 text-sm font-semibold text-slate-600 hover:text-[#E11D48]"
                    >
                        <span>Exit</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative z-10 container mx-auto px-6 py-8 md:py-16 flex flex-col justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                        What would you like to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E11D48] to-[#9F1239]">create?</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-light">
                        Select a workspace to begin your session.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full px-4">
                    {tools.map((tool) => (
                        <motion.button
                            key={tool.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: tool.delay, duration: 0.5 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(tool.path)}
                            className="group relative text-left h-full"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white to-pink-50 rounded-[2rem] shadow-xl shadow-pink-100/50 border border-white/60 backdrop-blur-sm transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-pink-200/50 group-hover:border-pink-200/50"></div>

                            {/* Hover Gradient Overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-5 rounded-[2rem] transition-opacity duration-500`}></div>

                            <div className="relative p-8 md:p-10 flex flex-col h-full rounded-[2rem] overflow-hidden">
                                {/* Decorational Blob */}
                                <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${tool.gradient} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>

                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg shadow-pink-500/20 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                                    {tool.icon}
                                </div>

                                <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-[#E11D48] transition-colors">{tool.title}</h3>
                                <p className="text-slate-500 mb-8 leading-relaxed font-medium flex-grow border-l-2 border-pink-100 pl-4 group-hover:border-[#E11D48]/30 transition-colors">
                                    {tool.desc}
                                </p>

                                <div className="flex items-center text-[#E11D48] font-bold text-sm tracking-wide uppercase group-hover:translate-x-2 transition-transform">
                                    Launch Tool
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </main>

            <footer className="relative z-10 py-6 text-center text-slate-400 text-xs font-semibold tracking-widest uppercase flex-shrink-0">
                &copy; 2026 CubeGen AI Studio
            </footer>
        </div>
    );
};

export default Dashboard;
