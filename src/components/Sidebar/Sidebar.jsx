import React, { useState, useContext } from 'react';
import { Context } from '../../context/Context';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, Plus, MessageSquare, HelpCircle, Clock, Settings, X,
    Search, Pin, Trash2, Edit2, Download, MoreVertical, PinOff
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Sidebar = () => {
    const [extended, setExtended] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState("");

    const {
        conversations,
        activeConversationId,
        setActiveConversationId,
        createNewConversation,
        deleteConversation,
        renameConversation,
        pinConversation,
        exportConversation,
        theme,
    } = useContext(Context);

    const filteredConversations = conversations.filter(conv =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pinnedConvs = filteredConversations.filter(c => c.isPinned);
    const unpinnedConvs = filteredConversations.filter(c => !c.isPinned);

    const handleRename = (id, newTitle) => {
        if (newTitle.trim()) {
            renameConversation(id, newTitle.trim());
        }
        setEditingId(null);
        setEditTitle("");
    };

    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {extended && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setExtended(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                initial={false}
                animate={{ width: extended ? 280 : 72 }}
                className={`
                    fixed lg:relative inset-y-0 left-0 z-50
                    ${extended ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    transition-all duration-300 ease-in-out
                    min-h-screen flex flex-col
                    ${theme === 'dark' 
                        ? 'bg-slate-900 border-slate-800' 
                        : 'bg-white border-slate-200'
                    }
                    border-r shadow-lg
                    px-3 py-4
                `}
            >
                {/* Top Section */}
                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                    {/* Menu Toggle */}
                    <button
                        onClick={() => setExtended(prev => !prev)}
                        className={`p-2.5 rounded-xl ${
                            theme === 'dark' 
                                ? 'hover:bg-slate-800' 
                                : 'hover:bg-slate-100'
                        } transition-all duration-200 w-full flex items-center justify-center`}
                    >
                        {extended ? (
                            <X className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`} />
                        ) : (
                            <Menu className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`} />
                        )}
                    </button>

                    {/* New Chat Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={createNewConversation}
                        className={`
                            flex items-center gap-3 w-full px-3 py-3
                            bg-gradient-to-r from-blue-600 to-purple-600
                            hover:from-blue-700 hover:to-purple-700
                            text-white rounded-xl font-medium text-sm
                            transition-all duration-200 shadow-md hover:shadow-lg
                            ${!extended && 'justify-center'}
                        `}
                    >
                        <Plus className="w-5 h-5 flex-shrink-0" />
                        {extended && <span>New Chat</span>}
                    </motion.button>

                    {/* Search Bar */}
                    {extended && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative"
                        >
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                            }`} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search chats..."
                                className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm
                                    ${theme === 'dark'
                                        ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                                        : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'
                                    }
                                    border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                        </motion.div>
                    )}

                    {/* Conversations */}
                    {extended && conversations.length > 0 && (
                        <div className="space-y-4">
                            {/* Pinned */}
                            {pinnedConvs.length > 0 && (
                                <div className="space-y-1">
                                    <p className={`text-xs font-semibold px-2 flex items-center gap-1 ${
                                        theme === 'dark' ? 'text-slate-500' : 'text-slate-600'
                                    }`}>
                                        <Pin className="w-3 h-3" />
                                        Pinned
                                    </p>
                                    {pinnedConvs.map(conv => (
                                        <ConversationItem
                                            key={conv.id}
                                            conv={conv}
                                            isActive={conv.id === activeConversationId}
                                            onClick={() => setActiveConversationId(conv.id)}
                                            editingId={editingId}
                                            setEditingId={setEditingId}
                                            editTitle={editTitle}
                                            setEditTitle={setEditTitle}
                                            handleRename={handleRename}
                                            pinConversation={pinConversation}
                                            deleteConversation={deleteConversation}
                                            exportConversation={exportConversation}
                                            theme={theme}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Recent */}
                            {unpinnedConvs.length > 0 && (
                                <div className="space-y-1">
                                    <p className={`text-xs font-semibold px-2 ${
                                        theme === 'dark' ? 'text-slate-500' : 'text-slate-600'
                                    }`}>
                                        Recent
                                    </p>
                                    {unpinnedConvs.slice(0, 20).map(conv => (
                                        <ConversationItem
                                            key={conv.id}
                                            conv={conv}
                                            isActive={conv.id === activeConversationId}
                                            onClick={() => setActiveConversationId(conv.id)}
                                            editingId={editingId}
                                            setEditingId={setEditingId}
                                            editTitle={editTitle}
                                            setEditTitle={setEditTitle}
                                            handleRename={handleRename}
                                            pinConversation={pinConversation}
                                            deleteConversation={deleteConversation}
                                            exportConversation={exportConversation}
                                            theme={theme}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                
            </motion.div>

            {/* Mobile Menu Button */}
            {!extended && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setExtended(true)}
                    className={`fixed top-4 left-4 z-30 lg:hidden p-2.5 rounded-xl
                             ${theme === 'dark'
                                 ? 'bg-slate-800 border-slate-700'
                                 : 'bg-white border-slate-200'
                             }
                             border shadow-lg hover:shadow-xl transition-all`}
                >
                    <Menu className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`} />
                </motion.button>
            )}
        </>
    );
};

const ConversationItem = ({
    conv,
    isActive,
    onClick,
    editingId,
    setEditingId,
    editTitle,
    setEditTitle,
    handleRename,
    pinConversation,
    deleteConversation,
    exportConversation,
    theme,
}) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="relative group">
            {editingId === conv.id ? (
                <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleRename(conv.id, editTitle)}
                    onKeyPress={(e) => e.key === 'Enter' && handleRename(conv.id, editTitle)}
                    autoFocus
                    className={`w-full px-3 py-2 rounded-xl text-sm
                        ${theme === 'dark'
                            ? 'bg-slate-800 border-blue-500 text-slate-200'
                            : 'bg-white border-blue-500 text-slate-900'
                        }
                        border focus:outline-none`}
                />
            ) : (
                <button
                    onClick={onClick}
                    className={`
                        flex items-start gap-2 w-full px-3 py-2 rounded-xl
                        transition-all duration-200 text-left
                        ${isActive
                            ? theme === 'dark'
                                ? 'bg-slate-800 text-white'
                                : 'bg-blue-50 text-blue-900'
                            : theme === 'dark'
                                ? 'hover:bg-slate-800 text-slate-300'
                                : 'hover:bg-slate-100 text-slate-700'
                        }
                    `}
                >
                    <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{conv.title}</p>
                        <p className={`text-xs truncate ${
                            theme === 'dark' ? 'text-slate-600' : 'text-slate-500'
                        }`}>
                            {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className={`opacity-0 group-hover:opacity-100 p-1 rounded ${
                            theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
                        }`}
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </button>
            )}

            {/* Context Menu */}
            <AnimatePresence>
                {showMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`absolute right-0 top-full mt-1 w-48 rounded-xl shadow-xl z-50 overflow-hidden
                            ${theme === 'dark'
                                ? 'bg-slate-800 border-slate-700'
                                : 'bg-white border-slate-200'
                            }
                            border`}
                        onMouseLeave={() => setShowMenu(false)}
                    >
                        <button
                            onClick={() => {
                                setEditingId(conv.id);
                                setEditTitle(conv.title);
                                setShowMenu(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2
                                ${theme === 'dark'
                                    ? 'text-slate-300 hover:bg-slate-700'
                                    : 'text-slate-700 hover:bg-slate-100'
                                }`}
                        >
                            <Edit2 className="w-4 h-4" />
                            Rename
                        </button>
                        <button
                            onClick={() => {
                                pinConversation(conv.id);
                                setShowMenu(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2
                                ${theme === 'dark'
                                    ? 'text-slate-300 hover:bg-slate-700'
                                    : 'text-slate-700 hover:bg-slate-100'
                                }`}
                        >
                            {conv.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                            {conv.isPinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                            onClick={() => {
                                exportConversation(conv.id);
                                setShowMenu(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2
                                ${theme === 'dark'
                                    ? 'text-slate-300 hover:bg-slate-700'
                                    : 'text-slate-700 hover:bg-slate-100'
                                }`}
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Delete this conversation?')) {
                                    deleteConversation(conv.id);
                                }
                                setShowMenu(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SidebarButton = ({ icon: Icon, label, extended, theme }) => (
    <button
        className={`
            flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm
            ${theme === 'dark'
                ? 'hover:bg-slate-800 text-slate-400'
                : 'hover:bg-slate-100 text-slate-600'
            }
            transition-all duration-200
            ${!extended && 'justify-center'}
        `}
    >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {extended && <span>{label}</span>}
    </button>
);

export default Sidebar;
