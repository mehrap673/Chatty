import { createContext, useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import toast from "react-hot-toast";

export const Context = createContext();

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const ContextProvider = (props) => {
    const [input, setInput] = useState("");
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [theme, setTheme] = useState("dark");
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
    });

    const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
    };

    // Load conversations from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("chatty-conversations");
        if (saved) {
            const parsed = JSON.parse(saved);
            setConversations(parsed);
            if (parsed.length > 0 && !activeConversationId) {
                setActiveConversationId(parsed[0].id);
            }
        }
    }, []);

    // Save conversations to localStorage
    useEffect(() => {
        if (conversations.length > 0) {
            localStorage.setItem("chatty-conversations", JSON.stringify(conversations));
        }
    }, [conversations]);

    const getCurrentConversation = () => {
        return conversations.find(conv => conv.id === activeConversationId);
    };

    const createNewConversation = () => {
        const newConv = {
            id: Date.now().toString(),
            title: "New Chat",
            messages: [],
            createdAt: new Date().toISOString(),
            isPinned: false,
        };
        setConversations(prev => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        setInput("");
        setUploadedImages([]);
        toast.success("New conversation started!");
    };

    const deleteConversation = (id) => {
        setConversations(prev => prev.filter(conv => conv.id !== id));
        if (activeConversationId === id) {
            const remaining = conversations.filter(conv => conv.id !== id);
            setActiveConversationId(remaining[0]?.id || null);
        }
        toast.success("Conversation deleted");
    };

    const renameConversation = (id, newTitle) => {
        setConversations(prev =>
            prev.map(conv =>
                conv.id === id ? { ...conv, title: newTitle } : conv
            )
        );
    };

    const pinConversation = (id) => {
        setConversations(prev =>
            prev.map(conv =>
                conv.id === id ? { ...conv, isPinned: !conv.isPinned } : conv
            )
        );
    };

    const exportConversation = (id) => {
        const conv = conversations.find(c => c.id === id);
        if (!conv) return;

        const exportData = {
            title: conv.title,
            createdAt: conv.createdAt,
            messages: conv.messages,
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${conv.title}.json`;
        a.click();
        toast.success("Conversation exported!");
    };

    const fileToGenerativePart = async (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve({
                    inlineData: {
                        data: reader.result.split(",")[1],
                        mimeType: file.type,
                    },
                });
            };
            reader.readAsDataURL(file);
        });
    };

    const onSent = async (prompt, messageId = null) => {
        const userPrompt = prompt !== undefined ? prompt : input;

        if (!userPrompt && uploadedImages.length === 0) {
            toast.error("Please enter a message or upload an image");
            return;
        }

        // Clear input immediately
        setInput("");
        const imagesToSend = [...uploadedImages];
        setUploadedImages([]);

        setLoading(true);
        setIsTyping(true);

        // Create user message
        const userMessage = {
            id: Date.now().toString(),
            role: "user",
            content: userPrompt,
            images: imagesToSend.map(img => URL.createObjectURL(img)),
            timestamp: new Date().toISOString(),
        };

        // Create AI message placeholder
        const aiMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "",
            timestamp: new Date().toISOString(),
            isLoading: true,
        };

        // Update conversation with user message and placeholder
        setConversations(prev =>
            prev.map(conv => {
                if (conv.id === activeConversationId) {
                    const updatedMessages = messageId
                        ? conv.messages.filter(m => m.id !== messageId)
                        : conv.messages;
                    return {
                        ...conv,
                        messages: [...updatedMessages, userMessage, aiMessage],
                        title: conv.messages.length === 0 ? userPrompt.slice(0, 30) : conv.title,
                    };
                }
                return conv;
            })
        );

        try {
            const chatSession = model.startChat({
                generationConfig,
                history: [],
            });

            let contentParts = [];

            if (imagesToSend.length > 0) {
                for (const image of imagesToSend) {
                    const imagePart = await fileToGenerativePart(image);
                    contentParts.push(imagePart);
                }
            }

            if (userPrompt) {
                contentParts.push(userPrompt);
            }

            const result = await chatSession.sendMessage(contentParts);
            const response = result.response;
            let responseText = response.text();

            // Update AI message with response
            setConversations(prev =>
                prev.map(conv => {
                    if (conv.id === activeConversationId) {
                        return {
                            ...conv,
                            messages: conv.messages.map(msg =>
                                msg.id === aiMessage.id
                                    ? { ...msg, content: responseText, isLoading: false }
                                    : msg
                            ),
                        };
                    }
                    return conv;
                })
            );

            toast.success("Response generated!");
        } catch (error) {
            console.error("Error:", error);
            setConversations(prev =>
                prev.map(conv => {
                    if (conv.id === activeConversationId) {
                        return {
                            ...conv,
                            messages: conv.messages.map(msg =>
                                msg.id === aiMessage.id
                                    ? {
                                          ...msg,
                                          content: "⚠️ Sorry, something went wrong. Please try again.",
                                          isLoading: false,
                                          isError: true,
                                      }
                                    : msg
                            ),
                        };
                    }
                    return conv;
                })
            );
            toast.error("Failed to generate response");
        }

        setLoading(false);
        setIsTyping(false);
    };

    const regenerateResponse = (messageId) => {
        const conv = getCurrentConversation();
        if (!conv) return;

        const messageIndex = conv.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return;

        const userMessage = conv.messages[messageIndex - 1];
        if (!userMessage || userMessage.role !== "user") return;

        // Remove the AI message
        setConversations(prev =>
            prev.map(c => {
                if (c.id === activeConversationId) {
                    return {
                        ...c,
                        messages: c.messages.filter(m => m.id !== messageId),
                    };
                }
                return c;
            })
        );

        // Regenerate
        onSent(userMessage.content);
    };

    const deleteMessage = (messageId) => {
        setConversations(prev =>
            prev.map(conv => {
                if (conv.id === activeConversationId) {
                    return {
                        ...conv,
                        messages: conv.messages.filter(m => m.id !== messageId),
                    };
                }
                return conv;
            })
        );
        toast.success("Message deleted");
    };

    const copyMessage = (content) => {
        navigator.clipboard.writeText(content);
        toast.success("Copied to clipboard!");
    };

    const toggleTheme = () => {
        setTheme(prev => (prev === "dark" ? "light" : "dark"));
    };

    const contextValue = {
        input,
        setInput,
        conversations,
        activeConversationId,
        setActiveConversationId,
        loading,
        theme,
        uploadedImages,
        setUploadedImages,
        isTyping,
        createNewConversation,
        deleteConversation,
        renameConversation,
        pinConversation,
        exportConversation,
        onSent,
        regenerateResponse,
        deleteMessage,
        copyMessage,
        toggleTheme,
        getCurrentConversation,
    };

    return (
        <Context.Provider value={contextValue}>
            {props.children}
        </Context.Provider>
    );
};

export default ContextProvider;
