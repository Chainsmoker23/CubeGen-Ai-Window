import React from 'react';
import Intro from './components/Intro';

import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import TitleBar from './components/TitleBar';
import Dashboard from './components/Dashboard';
import CodePlayground from './components/CodePlayground';
import VisualPlayground from './components/VisualPlayground';
import './style.css';

class ComponentErrorBoundary extends React.Component<{ children: React.ReactNode, name: string }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode, name: string }) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
    componentDidCatch(error: Error, info: React.ErrorInfo) { console.error(`Error in ${this.props.name}:`, error, info); }
    render() {
        if (this.state.hasError) {
            return <div className="p-4 bg-red-100 text-red-800 border-l-4 border-red-500">
                <h3 className="font-bold">Error in {this.props.name}</h3>
                <pre className="text-xs mt-2 overflow-auto">{this.state.error?.message}</pre>
            </div>;
        }
        return this.props.children;
    }
}

function MainLayout() {
    return (
        <Router>
            <div id="app">
                <ComponentErrorBoundary name="TitleBar">
                    <TitleBar />
                </ComponentErrorBoundary>
                <div className="app-content">
                    <ComponentErrorBoundary name="Routes">
                        <Routes>
                            <Route path="/" element={<Intro />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/code-to-diagram" element={<CodePlayground />} />
                            <Route path="/playground" element={<VisualPlayground />} />
                        </Routes>
                    </ComponentErrorBoundary>
                </div>
            </div>
        </Router>
    );
}

export default MainLayout;
