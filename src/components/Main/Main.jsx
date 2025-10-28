import React, { useContext, useRef, useState, useEffect } from 'react';
import { Context } from '../../context/Context';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
    Send, Image as ImageIcon, Mic, Sparkles, MapPin, Lightbulb,
    MessageCircle, Code, User, X, Copy, RotateCw,
    Sun, Moon, StopCircle, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Main = () => {
    const {
        input,
        setInput,
        loading,
        uploadedImages,
        setUploadedImages,
        onSent,
        getCurrentConversation,
        regenerateResponse,
        copyMessage,
        theme,
        toggleTheme,
        isTyping,
    } = useContext(Context);

    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);

    const currentConversation = getCurrentConversation();
    const messages = currentConversation?.messages || [];

    // Auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'en-US';

            recognitionInstance.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev + ' ' + transcript);
                setIsListening(false);
            };

            recognitionInstance.onerror = () => setIsListening(false);
            recognitionInstance.onend = () => setIsListening(false);

            setRecognition(recognitionInstance);
        }
    }, []);

    const handleVoiceInput = () => {
        if (isListening) {
            recognition?.stop();
            setIsListening(false);
        } else {
            recognition?.start();
            setIsListening(true);
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        setUploadedImages(prev => [...prev, ...imageFiles]);
    };

    const removeImage = (index) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleCardClick = (promptText) => {
        setInput(promptText);
        onSent(promptText);
    };

    const handleSend = () => {
        if (input.trim() || uploadedImages.length > 0) {
            onSent();
        }
    };

    const promptCards = [
        {
            text: "Plan a 7-day cultural trip to Japan with budget breakdown",
            icon: MapPin,
            gradient: "from-blue-500 to-cyan-500"
        },
        {
            text: "Explain quantum computing like I'm a beginner",
            icon: Lightbulb,
            gradient: "from-amber-500 to-orange-500"
        },
        {
            text: "Help me write a creative short story about AI",
            icon: MessageCircle,
            gradient: "from-purple-500 to-pink-500"
        },
        {
            text: "Review and optimize this React component code",
            icon: Code,
            gradient: "from-green-500 to-emerald-500"
        }
    ];

    return (
        <div className={`flex-1 min-h-screen relative flex flex-col ${theme === 'dark'
                ? 'bg-slate-950'
                : 'bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50'
            }`}>
            {/* Navbar */}
            <nav className={`sticky top-0 z-30 backdrop-blur-md ${theme === 'dark'
                    ? 'bg-slate-900/90 border-slate-800'
                    : 'bg-white/90 border-slate-200'
                } border-b`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-7 h-7 text-blue-500" />
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Chatty AI
                                </h1>
                                <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'
                                    }`}>
                                    {currentConversation?.title || 'New conversation'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleTheme}
                                className={`p-2.5 rounded-xl ${theme === 'dark'
                                        ? 'bg-slate-800 hover:bg-slate-700'
                                        : 'bg-slate-100 hover:bg-slate-200'
                                    } transition-colors`}
                            >
                                {theme === 'dark' ? (
                                    <Sun className="w-5 h-5 text-yellow-400" />
                                ) : (
                                    <Moon className="w-5 h-5 text-slate-700" />
                                )}
                            </motion.button>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                                <User className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {messages.length === 0 ? (
                        <EmptyState
                            theme={theme}
                            promptCards={promptCards}
                            handleCardClick={handleCardClick}
                        />
                    ) : (
                        <div className="space-y-6">
                            {messages.map((message, index) => (
                                <MessageBubble
                                    key={message.id}
                                    message={message}
                                    theme={theme}
                                    onCopy={copyMessage}
                                    onRegenerate={regenerateResponse}
                                    isLatest={index === messages.length - 1}
                                />
                            ))}
                            {isTyping && <TypingIndicator theme={theme} />}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Input Section */}
            <div className={`sticky bottom-0 ${theme === 'dark'
                    ? 'bg-gradient-to-t from-slate-950 via-slate-950 to-transparent'
                    : 'bg-gradient-to-t from-white via-white to-transparent'
                } pt-6 pb-4 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                }`}>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <InputSection
                        input={input}
                        setInput={setInput}
                        uploadedImages={uploadedImages}
                        removeImage={removeImage}
                        handleSend={handleSend}
                        handleFileUpload={handleFileUpload}
                        handleVoiceInput={handleVoiceInput}
                        isListening={isListening}
                        loading={loading}
                        fileInputRef={fileInputRef}
                        theme={theme}
                    />
                </div>
            </div>
        </div>
    );
};

// Continue in next message...
// Empty State Component
const EmptyState = ({ theme, promptCards, handleCardClick }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12 pt-12"
    >
        <div className="text-center space-y-4">
            <motion.h2
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="text-5xl md:text-6xl font-bold"
            >
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Hello, Dev! 👋
                </span>
            </motion.h2>
            <p className={`text-xl md:text-2xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                What would you like to explore today?
            </p>
            <div className="flex flex-wrap gap-2 justify-center items-center mt-6">
                {['💡 Ask anything', '🖼️ Upload images', '🎤 Voice input', '💾 Export chats'].map((feature, idx) => (
                    <span
                        key={idx}
                        className={`px-4 py-2 rounded-full text-xs font-medium ${theme === 'dark'
                                ? 'bg-slate-800 text-slate-300 border-slate-700'
                                : 'bg-white text-slate-700 border-slate-200'
                            } border shadow-sm`}
                    >
                        {feature}
                    </span>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {promptCards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCardClick(card.text)}
                        className={`relative h-48 p-5 rounded-2xl ${theme === 'dark'
                                ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            } backdrop-blur-sm border
                        transition-all duration-300 hover:shadow-xl
                        text-left overflow-hidden group`}
                    >
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                                }`}>
                                {card.text}
                            </p>
                            <div className={`
                                w-12 h-12 rounded-xl bg-gradient-to-r ${card.gradient}
                                flex items-center justify-center shadow-lg
                                transform group-hover:scale-110 transition-transform
                            `}>
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </motion.button>
                );
            })}
        </div>
    </motion.div>
);

// Typing Indicator Component
const TypingIndicator = ({ theme }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4"
    >
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className={`${theme === 'dark' ? 'bg-slate-800/80' : 'bg-white'
            } backdrop-blur-sm border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
            } rounded-2xl px-5 py-4 shadow-lg`}>
            <div className="flex gap-2">
                {[0, 0.2, 0.4].map((delay, i) => (
                    <motion.div
                        key={i}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay }}
                        className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    />
                ))}
            </div>
        </div>
    </motion.div>
);

const InputSection = ({
    input,
    setInput,
    uploadedImages,
    removeImage,
    handleSend,
    handleFileUpload,
    handleVoiceInput,
    isListening,
    loading,
    fileInputRef,
    theme,
}) => (
    <div className="space-y-3">
        {/* Image Previews */}
        <AnimatePresence>
            {uploadedImages.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex gap-2 flex-wrap"
                >
                    {uploadedImages.map((image, index) => (
                        <motion.div
                            key={index}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="relative group"
                        >
                            <img
                                src={URL.createObjectURL(image)}
                                alt={`Preview ${index}`}
                                className={`w-20 h-20 object-cover rounded-xl border-2 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
                                    } shadow-md`}
                            />
                            <button
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>

        {/* Input Box */}
        <div className={`flex items-center gap-3 ${theme === 'dark'
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-slate-200'
            } backdrop-blur-md border rounded-2xl px-4 py-3 shadow-lg hover:shadow-xl transition-shadow`}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/png, image/jpeg, image/jpg, image/webp"
                multiple
                className="hidden"
            />

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                    } transition-colors`}
                title="Upload images"
            >
                <ImageIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`} />
            </motion.button>

            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder="Ask Chatty anything... (Press Enter to send)"
                className={`flex-1 bg-transparent outline-none ${theme === 'dark'
                        ? 'text-slate-100 placeholder-slate-500'
                        : 'text-slate-900 placeholder-slate-400'
                    } text-base focus:outline-none focus:ring-0 border-none`}
                style={{ border: 'none', boxShadow: 'none' }}
            />

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleVoiceInput}
                className={`p-2 rounded-lg ${isListening
                        ? 'bg-red-500 hover:bg-red-600'
                        : theme === 'dark'
                            ? 'hover:bg-slate-700'
                            : 'hover:bg-slate-100'
                    } transition-colors`}
                title="Voice input"
            >
                {isListening ? (
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                    >
                        <Mic className="w-5 h-5 text-white" />
                    </motion.div>
                ) : (
                    <Mic className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                        }`} />
                )}
            </motion.button>

            <AnimatePresence>
                {(input.trim() || uploadedImages.length > 0) && (
                    <motion.button
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSend}
                        disabled={loading}
                        className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Send message"
                    >
                        {loading ? (
                            <StopCircle className="w-5 h-5 text-white" />
                        ) : (
                            <Send className="w-5 h-5 text-white" />
                        )}
                    </motion.button>
                )}
            </AnimatePresence>
        </div>

        {/* Disclaimer */}
        <p className={`text-xs text-center ${theme === 'dark' ? 'text-slate-600' : 'text-slate-500'
            }`}>
            Chatty AI can make mistakes. Verify important information. • Built by Dev with ❤️
        </p>
    </div>
);


// Message Bubble Component
const MessageBubble = ({ message, theme, onCopy, onRegenerate, isLatest }) => {
    const [showActions, setShowActions] = useState(false);
    const [reaction, setReaction] = useState(null);

    if (message.role === 'user') {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 justify-end"
            >
                <div className="max-w-2xl">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl rounded-tr-md px-5 py-3 shadow-md">
                        <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                            {message.content}
                        </p>
                        {message.images && message.images.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                {message.images.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img}
                                        alt={`Uploaded ${idx}`}
                                        className="rounded-lg w-full h-32 object-cover"
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    <p className={`text-xs mt-1.5 text-right ${theme === 'dark' ? 'text-slate-600' : 'text-slate-500'
                        }`}>
                        {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                    </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <User className="w-5 h-5 text-white" />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-3"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 max-w-3xl">
                <div className={`${theme === 'dark'
                        ? 'bg-slate-800/80 border-slate-700'
                        : 'bg-white border-slate-200'
                    } backdrop-blur-sm border rounded-2xl rounded-tl-md px-5 py-4 shadow-md`}>
                    {message.isLoading ? (
                        <div className="space-y-3">
                            {[100, 100, 65].map((width, i) => (
                                <div
                                    key={i}
                                    className={`h-4 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
                                        } rounded animate-pulse`}
                                    style={{ width: `${width}%` }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={`prose ${theme === 'dark' ? 'prose-invert' : 'prose-slate'
                            } max-w-none text-sm md:text-base prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-pre:my-2`}>
                            <ReactMarkdown
                                components={{
                                    code({ node, inline, className, children, ...props }) {
                                        return !inline ? (
                                            <pre className={`${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'
                                                } rounded-lg p-4 overflow-x-auto my-3 border ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                                                }`}>
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            </pre>
                                        ) : (
                                            <code
                                                className={`${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'
                                                    } px-1.5 py-0.5 rounded text-sm`}
                                                {...props}
                                            >
                                                {children}
                                            </code>
                                        );
                                    },
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <AnimatePresence>
                    {showActions && !message.isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center gap-1 mt-2"
                        >
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onCopy(message.content)}
                                className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                                    } transition-colors`}
                                title="Copy"
                            >
                                <Copy className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'
                                    }`} />
                            </motion.button>
                            {isLatest && (
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => onRegenerate(message.id)}
                                    className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                                        } transition-colors`}
                                    title="Regenerate"
                                >
                                    <RotateCw className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'
                                        }`} />
                                </motion.button>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setReaction(reaction === 'up' ? null : 'up')}
                                className={`p-2 rounded-lg ${reaction === 'up'
                                        ? 'bg-green-500/20'
                                        : theme === 'dark'
                                            ? 'hover:bg-slate-800'
                                            : 'hover:bg-slate-100'
                                    } transition-colors`}
                                title="Good response"
                            >
                                <ThumbsUp
                                    className={`w-4 h-4 ${reaction === 'up'
                                            ? 'text-green-500'
                                            : theme === 'dark'
                                                ? 'text-slate-500'
                                                : 'text-slate-600'
                                        }`}
                                />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setReaction(reaction === 'down' ? null : 'down')}
                                className={`p-2 rounded-lg ${reaction === 'down'
                                        ? 'bg-red-500/20'
                                        : theme === 'dark'
                                            ? 'hover:bg-slate-800'
                                            : 'hover:bg-slate-100'
                                    } transition-colors`}
                                title="Bad response"
                            >
                                <ThumbsDown
                                    className={`w-4 h-4 ${reaction === 'down'
                                            ? 'text-red-500'
                                            : theme === 'dark'
                                                ? 'text-slate-500'
                                                : 'text-slate-600'
                                        }`}
                                />
                            </motion.button>
                            <p className={`text-xs ml-auto ${theme === 'dark' ? 'text-slate-600' : 'text-slate-500'
                                }`}>
                                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default Main;
