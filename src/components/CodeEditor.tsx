/**
 * CodeEditor — Advanced CubeGen DSL editor with syntax highlighting.
 *
 * Uses a "mirror" approach: a hidden textarea captures all input/keyboard
 * events, while a visible `<div>` renders line-by-line highlighted code.
 * Both share a single scroll container so they're always in sync.
 */

import React, { useCallback, useRef, useState, useMemo } from 'react';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    errorLine?: number;
    className?: string;
}

// ─── Dracula-inspired color tokens ───────────────────────────────────

const T = {
    bg: '#282a36',
    bgLine: '#21222c',
    bgActive: '#44475a50',
    bgError: '#ff555520',
    gutter: '#6272a4',
    gutterAct: '#f8f8f2',
    keyword: '#ff79c6',
    ident: '#50fa7b',
    string: '#f1fa8c',
    number: '#bd93f9',
    arrow: '#ff5555',
    prop: '#8be9fd',
    propVal: '#ffb86c',
    comment: '#6272a4',
    plain: '#f8f8f2',
    cursor: '#f8f8f2',
    selection: '#44475a',
    border: '#44475a',
    scrollbar: '#6272a488',
};

// ─── Syntax highlighter ──────────────────────────────────────────────

function esc(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function span(color: string, text: string, bold = false) {
    return `<span style="color:${color}${bold ? ';font-weight:700' : ''}">${esc(text)}</span>`;
}

function highlightLine(line: string): string {
    if (!line) return '\n';
    const trimmed = line.trimStart();

    // Comment
    if (trimmed.startsWith('//')) {
        const indent = line.length - trimmed.length;
        return ' '.repeat(indent) + `<span style="color:${T.comment};font-style:italic">${esc(trimmed)}</span>`;
    }

    let out = '';
    let i = 0;

    while (i < line.length) {
        const ch = line[i];

        // Whitespace
        if (ch === ' ' || ch === '\t') { out += ch; i++; continue; }

        // String
        if (ch === '"') {
            let j = i + 1;
            while (j < line.length && line[j] !== '"') j++;
            out += span(T.string, line.substring(i, j + 1));
            i = j + 1;
            continue;
        }

        // Arrows
        if (line.substring(i, i + 3) === '<->') { out += span(T.arrow, '<->', true); i += 3; continue; }
        if (line.substring(i, i + 2) === '->') { out += span(T.arrow, '->', true); i += 2; continue; }

        // Braces
        if (ch === '{' || ch === '}') { out += span(T.plain, ch, true); i++; continue; }

        // Colon
        if (ch === ':') { out += span(T.gutter, ':'); i++; continue; }

        // Equals → then value
        if (ch === '=') {
            out += span(T.plain, '=');
            i++;
            let val = '';
            while (i < line.length && line[i] !== ' ' && line[i] !== '\t' && line[i] !== '"') { val += line[i]; i++; }
            if (val) out += /^\d+$/.test(val) ? span(T.number, val) : span(T.propVal, val);
            continue;
        }

        // Word token
        let word = '';
        while (i < line.length && /[a-zA-Z0-9_\-]/.test(line[i])) { word += line[i]; i++; }
        if (word) {
            if (word === 'node' || word === 'container') out += span(T.keyword, word, true);
            else if (i < line.length && line[i] === '=') out += span(T.prop, word);
            else if (/^\d+$/.test(word)) out += span(T.number, word);
            else out += span(T.ident, word);
            continue;
        }

        // Fallback
        out += esc(ch);
        i++;
    }
    return out;
}

// ─── Component ───────────────────────────────────────────────────────

const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    onChange,
    placeholder = '// Write your CubeGen DSL code here...',
    errorLine,
    className = '',
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mirrorRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeLine, setActiveLine] = useState(1);
    const [isFocused, setIsFocused] = useState(false);

    const lines = value.split('\n');
    const lineCount = lines.length;
    const gutterWidth = Math.max(String(lineCount).length * 10 + 24, 40);

    // Track cursor position for active line highlight
    const updateActiveLine = useCallback(() => {
        if (!textareaRef.current) return;
        const pos = textareaRef.current.selectionStart;
        const lineNum = value.substring(0, pos).split('\n').length;
        setActiveLine(lineNum);
    }, [value]);

    // Sync scroll between textarea and mirror
    const syncScroll = useCallback(() => {
        if (textareaRef.current && mirrorRef.current) {
            mirrorRef.current.scrollTop = textareaRef.current.scrollTop;
            mirrorRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    }, []);

    // Handle tab key
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const ta = e.currentTarget;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const newVal = value.substring(0, start) + '    ' + value.substring(end);
            onChange(newVal);
            requestAnimationFrame(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
                }
            });
        }
        // Update active line after keypress
        requestAnimationFrame(updateActiveLine);
    }, [value, onChange, updateActiveLine]);

    // Highlighted lines (memoized)
    const highlightedLines = useMemo(() => lines.map(l => highlightLine(l)), [value]);

    // Focus textarea when clicking on the mirror
    const handleMirrorClick = useCallback(() => {
        textareaRef.current?.focus();
    }, []);

    return (
        <div
            className={`flex flex-col rounded-xl overflow-hidden ${className}`}
            style={{
                background: T.bg,
                border: `1px solid ${isFocused ? '#6272a4' : T.border}`,
                transition: 'border-color 0.2s',
            }}
        >
            {/* Hide native scrollbars on the textarea */}
            <style>{`
                .cubegen-editor-textarea::-webkit-scrollbar { display: none; }
                .cubegen-editor-textarea { scrollbar-width: none; -ms-overflow-style: none; }
            `}</style>
            {/* Editor body */}
            <div
                ref={scrollRef}
                className="flex-1 relative"
                style={{ minHeight: 0 }}
            >
                {/* ─── Visual mirror (what user sees) ─── */}
                <div
                    ref={mirrorRef}
                    onClick={handleMirrorClick}
                    className="absolute inset-0 overflow-hidden pointer-events-none select-none"
                    style={{ fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace", fontSize: 13 }}
                >
                    {highlightedLines.map((html, idx) => {
                        const lineNum = idx + 1;
                        const isActive = lineNum === activeLine && isFocused;
                        const isError = lineNum === errorLine;
                        return (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    background: isError ? T.bgError : isActive ? T.bgActive : 'transparent',
                                    minHeight: 24,
                                    lineHeight: '24px',
                                }}
                            >
                                {/* Gutter */}
                                <div
                                    style={{
                                        width: gutterWidth,
                                        minWidth: gutterWidth,
                                        textAlign: 'right',
                                        paddingRight: 12,
                                        paddingLeft: 8,
                                        color: isError ? '#ff5555' : isActive ? T.gutterAct : T.gutter,
                                        fontWeight: isActive || isError ? 700 : 400,
                                        background: T.bgLine,
                                        borderRight: `1px solid ${T.border}`,
                                        userSelect: 'none',
                                        flexShrink: 0,
                                    }}
                                >
                                    {isError && (
                                        <span style={{ marginRight: 4, fontSize: 10 }} title="Error on this line">●</span>
                                    )}
                                    {lineNum}
                                </div>
                                {/* Code */}
                                <div
                                    style={{
                                        paddingLeft: 16,
                                        paddingRight: 16,
                                        whiteSpace: 'pre',
                                        color: T.plain,
                                        overflow: 'visible',
                                    }}
                                    dangerouslySetInnerHTML={{ __html: html || ' ' }}
                                />
                            </div>
                        );
                    })}
                    {/* Extra empty lines to match textarea padding */}
                    {lineCount < 15 && Array.from({ length: 15 - lineCount }, (_, i) => (
                        <div key={`pad-${i}`} style={{ display: 'flex', minHeight: 24, lineHeight: '24px' }}>
                            <div style={{
                                width: gutterWidth, minWidth: gutterWidth,
                                background: T.bgLine, borderRight: `1px solid ${T.border}`,
                            }} />
                            <div style={{ paddingLeft: 16 }}>&nbsp;</div>
                        </div>
                    ))}
                </div>

                {/* ─── Invisible textarea (handles all input) ─── */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => { onChange(e.target.value); requestAnimationFrame(updateActiveLine); }}
                    onScroll={syncScroll}
                    onKeyDown={handleKeyDown}
                    onClick={updateActiveLine}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    className="w-full h-full resize-none outline-none cubegen-editor-textarea"
                    style={{
                        position: 'relative',
                        zIndex: 2,
                        background: 'transparent',
                        color: 'transparent',
                        caretColor: T.cursor,
                        fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace",
                        fontSize: 13,
                        lineHeight: '24px',
                        padding: 0,
                        paddingLeft: gutterWidth + 16,
                        paddingTop: 0,
                        paddingRight: 16,
                        minHeight: Math.max(lineCount, 15) * 24,
                        WebkitTextFillColor: 'transparent',
                        tabSize: 4,
                        overflow: 'auto',
                        whiteSpace: 'pre',
                        // Hide native scrollbars since the visual layer doesn't scroll
                        // (the textarea IS the scroll container)
                    }}
                />
            </div>

            {/* Status bar */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 12px',
                    background: T.bgLine,
                    borderTop: `1px solid ${T.border}`,
                    fontSize: 11,
                    color: T.gutter,
                    userSelect: 'none',
                    flexShrink: 0,
                }}
            >
                <span>
                    Ln {activeLine}, Col {(() => {
                        if (!textareaRef.current) return 1;
                        const pos = textareaRef.current.selectionStart || 0;
                        const lineStart = value.lastIndexOf('\n', pos - 1) + 1;
                        return pos - lineStart + 1;
                    })()}
                </span>
                <span>{lineCount} line{lineCount !== 1 ? 's' : ''}</span>
                <span style={{ color: errorLine ? '#ff5555' : '#50fa7b', fontWeight: 600 }}>
                    {errorLine ? '● Error' : '● Ready'}
                </span>
            </div>
        </div>
    );
};

export default CodeEditor;
