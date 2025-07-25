import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMail, FiCopy, FiRefreshCw, FiTrash2, FiClock,
    FiInbox, FiEye, FiDownload, FiAlertCircle, FiCheck,
    FiPlus, FiSettings
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import tempmailService from '../services/tempmailService';

const TempMailPage = () => {
    const [session, setSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [copied, setCopied] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    // Create new temp email session
    const createSession = async (duration = 30) => {
        setLoading(true);
        try {
            const newSession = await tempmailService.createSession(duration);
            setSession(newSession);
            setMessages([]);
            setTimeRemaining(newSession.time_remaining);
            toast.success('New temporary email created!');

            // Store session token in localStorage
            localStorage.setItem('tempmail_session', newSession.session_token);
        } catch (error) {
            toast.error('Failed to create temporary email');
            console.error('Error creating session:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load existing session from localStorage
    const loadExistingSession = useCallback(async () => {
        const sessionToken = localStorage.getItem('tempmail_session');
        if (!sessionToken) return;

        try {
            const existingSession = await tempmailService.getSession(sessionToken);
            if (!existingSession.is_expired) {
                setSession(existingSession);
                setTimeRemaining(existingSession.time_remaining);
                loadMessages(sessionToken);
            } else {
                localStorage.removeItem('tempmail_session');
            }
        } catch (error) {
            localStorage.removeItem('tempmail_session');
            console.error('Error loading existing session:', error);
        }
    }, []);

    // Load messages
    const loadMessages = async (sessionToken = session?.session_token) => {
        if (!sessionToken) return;

        setMessagesLoading(true);
        try {
            const response = await tempmailService.getMessages(sessionToken);
            setMessages(response.messages || []);
        } catch (error) {
            console.error('Error loading messages:', error);
            if (error.response?.status === 410) {
                // Session expired
                setSession(null);
                setMessages([]);
                localStorage.removeItem('tempmail_session');
                toast.error('Session has expired');
            }
        } finally {
            setMessagesLoading(false);
        }
    };

    // Copy email to clipboard
    const copyEmail = async () => {
        if (!session?.email_address) return;

        try {
            await navigator.clipboard.writeText(session.email_address);
            setCopied(true);
            toast.success('Email copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error('Failed to copy email');
        }
    };

    // Extend session
    const extendSession = async () => {
        if (!session?.session_token) return;

        try {
            const updatedSession = await tempmailService.extendSession(session.session_token);
            setSession(updatedSession);
            setTimeRemaining(updatedSession.time_remaining);
            toast.success('Session extended by 10 minutes!');
        } catch (error) {
            toast.error('Failed to extend session');
        }
    };

    // Delete message
    const deleteMessage = async (messageId) => {
        try {
            await tempmailService.deleteMessage(messageId);
            setMessages(messages.filter(msg => msg.id !== messageId));
            toast.success('Message deleted');

            if (selectedMessage?.id === messageId) {
                setSelectedMessage(null);
                setShowMessageModal(false);
            }
        } catch (error) {
            toast.error('Failed to delete message');
        }
    };

    // Delete entire session
    const deleteSession = async () => {
        if (!session?.session_token) return;

        try {
            await tempmailService.deleteSession(session.session_token);
            setSession(null);
            setMessages([]);
            localStorage.removeItem('tempmail_session');
            toast.success('Email session deleted');
        } catch (error) {
            toast.error('Failed to delete session');
        }
    };

    // View message
    const viewMessage = async (message) => {
        try {
            const fullMessage = await tempmailService.getMessage(message.id);
            setSelectedMessage(fullMessage);
            setShowMessageModal(true);

            // Update message as read in local state
            setMessages(messages.map(msg =>
                msg.id === message.id ? { ...msg, is_read: true } : msg
            ));
        } catch (error) {
            toast.error('Failed to load message');
        }
    };

    // Download attachment
    const downloadAttachment = async (attachment) => {
        try {
            const response = await tempmailService.downloadAttachment(attachment.id);

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', attachment.filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Attachment downloaded');
        } catch (error) {
            toast.error('Failed to download attachment');
        }
    };

    // Format time remaining
    const formatTimeRemaining = (seconds) => {
        if (seconds <= 0) return '0:00';

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Timer effect
    useEffect(() => {
        if (timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        setSession(null);
                        setMessages([]);
                        localStorage.removeItem('tempmail_session');
                        toast.error('Session has expired');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [timeRemaining]);

    // Set page title with beta indicator
    useEffect(() => {
        document.title = 'Temp Email (Beta) - URLBriefr';
        return () => {
            document.title = 'URLBriefr';
        };
    }, []);

    // Auto-refresh messages
    useEffect(() => {
        if (autoRefresh && session && !messagesLoading) {
            const interval = setInterval(() => {
                loadMessages();
            }, 5000); // Refresh every 5 seconds

            return () => clearInterval(interval);
        }
    }, [session, autoRefresh, messagesLoading]);

    // Load existing session on mount
    useEffect(() => {
        loadExistingSession();
    }, [loadExistingSession]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
            <div className="container mx-auto px-4 py-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-6xl mx-auto"
                >
                    {/* Header */}
                    <motion.div variants={itemVariants} className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <div className="h-16 w-16 rounded-full bg-primary-500 text-white flex items-center justify-center mr-4">
                                <FiMail className="h-8 w-8" />
                            </div>
                            <div>
                                <div className="flex items-center justify-center">
                                    <h1 className="text-4xl font-display font-bold text-dark-900">
                                        Temporary Email
                                    </h1>
                                    <span className="ml-3 px-3 py-1 text-sm font-semibold bg-orange-100 text-orange-800 rounded-full border border-orange-200">
                                        BETA
                                    </span>
                                </div>
                                <p className="text-dark-600 mt-2">
                                    Get a disposable email address that expires automatically
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {!session ? (
                        /* Create Email Section */
                        <motion.div variants={itemVariants} className="text-center">
                            <div className="bg-white rounded-xl shadow-soft p-8 max-w-md mx-auto">
                                <FiMail className="h-16 w-16 text-primary-500 mx-auto mb-4" />
                                <div className="flex items-center justify-center mb-4">
                                    <h2 className="text-2xl font-display font-semibold text-dark-900">
                                        Create Temporary Email
                                    </h2>
                                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                                        BETA
                                    </span>
                                </div>
                                <p className="text-dark-600 mb-4">
                                    Generate a random email address that will receive emails for 30 minutes
                                </p>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <h3 className="font-medium text-blue-900 mb-2">💡 Perfect for Registration!</h3>
                                    <p className="text-sm text-blue-800">
                                        Use this temporary email to register for URLBriefr or any other service.
                                        Verification emails will appear in your inbox instantly!
                                    </p>
                                </div>
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-center mb-2">
                                        <span className="px-2 py-0.5 text-xs font-semibold bg-orange-200 text-orange-900 rounded-full mr-2">
                                            BETA
                                        </span>
                                        <h3 className="font-medium text-orange-900">Beta Feature</h3>
                                    </div>
                                    <p className="text-sm text-orange-800">
                                        This feature is currently in beta. While fully functional, you may experience occasional issues.
                                        We're continuously improving the service!
                                    </p>
                                </div>
                                <button
                                    onClick={() => createSession()}
                                    disabled={loading}
                                    className="btn btn-primary w-full flex items-center justify-center"
                                >
                                    {loading ? (
                                        <FiRefreshCw className="animate-spin mr-2" />
                                    ) : (
                                        <FiPlus className="mr-2" />
                                    )}
                                    {loading ? 'Creating...' : 'Generate Email'}
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        /* Email Dashboard */
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Email Info Panel */}
                            <motion.div variants={itemVariants} className="lg:col-span-1">
                                <div className="bg-white rounded-xl shadow-soft p-6 sticky top-6">
                                    {/* Email Address */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-dark-700">
                                                Your Temporary Email
                                            </label>
                                            <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                                                BETA
                                            </span>
                                        </div>
                                        <div className="flex items-center bg-gray-50 rounded-lg p-3">
                                            <span className="flex-1 font-mono text-sm text-dark-900 break-all">
                                                {session.email_address}
                                            </span>
                                            <button
                                                onClick={copyEmail}
                                                className="ml-2 p-2 text-dark-500 hover:text-primary-600 transition-colors"
                                                title="Copy email"
                                            >
                                                {copied ? <FiCheck className="text-green-500" /> : <FiCopy />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Timer */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-dark-700">Time Remaining</span>
                                            <button
                                                onClick={extendSession}
                                                className="text-xs text-primary-600 hover:text-primary-700"
                                            >
                                                +10 min
                                            </button>
                                        </div>
                                        <div className={`text-2xl font-display font-bold ${timeRemaining < 300 ? 'text-red-500' : 'text-primary-600'
                                            }`}>
                                            <FiClock className="inline mr-2" />
                                            {formatTimeRemaining(timeRemaining)}
                                        </div>
                                        {timeRemaining < 300 && (
                                            <p className="text-xs text-red-500 mt-1">
                                                <FiAlertCircle className="inline mr-1" />
                                                Session expiring soon!
                                            </p>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="text-center">
                                            <div className="text-2xl font-display font-bold text-dark-900">
                                                {messages.length}
                                            </div>
                                            <div className="text-sm text-dark-500">Total</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-display font-bold text-primary-600">
                                                {messages.filter(msg => !msg.is_read).length}
                                            </div>
                                            <div className="text-sm text-dark-500">Unread</div>
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => loadMessages()}
                                            disabled={messagesLoading}
                                            className="btn btn-outline w-full flex items-center justify-center"
                                        >
                                            <FiRefreshCw className={`mr-2 ${messagesLoading ? 'animate-spin' : ''}`} />
                                            Refresh
                                        </button>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-dark-700">Auto-refresh</span>
                                            <button
                                                onClick={() => setAutoRefresh(!autoRefresh)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoRefresh ? 'bg-primary-600' : 'bg-gray-200'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoRefresh ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => createSession()}
                                            className="btn btn-primary w-full flex items-center justify-center"
                                        >
                                            <FiPlus className="mr-2" />
                                            New Email
                                        </button>

                                        <a
                                            href={`/register?email=${encodeURIComponent(session.email_address)}`}
                                            className="btn btn-outline w-full flex items-center justify-center"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <FiSettings className="mr-2" />
                                            Register with this Email
                                        </a>

                                        <button
                                            onClick={deleteSession}
                                            className="btn bg-red-600 text-white hover:bg-red-700 w-full flex items-center justify-center"
                                        >
                                            <FiTrash2 className="mr-2" />
                                            Delete Session
                                        </button>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Messages Panel */}
                            <motion.div variants={itemVariants} className="lg:col-span-2">
                                <div className="bg-white rounded-xl shadow-soft">
                                    {/* Messages Header */}
                                    <div className="p-6 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <h2 className="text-xl font-display font-semibold text-dark-900 flex items-center">
                                                    <FiInbox className="mr-2" />
                                                    Inbox
                                                </h2>
                                                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                                                    BETA
                                                </span>
                                            </div>
                                            <div className="text-sm text-dark-500">
                                                {messages.length} messages
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages List */}
                                    <div className="max-h-96 overflow-y-auto">
                                        {messagesLoading ? (
                                            <div className="p-8 text-center">
                                                <FiRefreshCw className="animate-spin h-8 w-8 text-primary-500 mx-auto mb-4" />
                                                <p className="text-dark-500">Loading messages...</p>
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="p-8 text-center">
                                                <FiInbox className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                                <p className="text-dark-500 mb-2">No messages yet</p>
                                                <div className="text-sm text-dark-400">
                                                    <p className="mb-2">Send an email to <strong>{session.email_address}</strong> to get started</p>
                                                    <p className="text-xs bg-blue-50 text-blue-700 p-2 rounded">
                                                        💡 This email can receive messages from any external email service (Gmail, Yahoo, Outlook, etc.)
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-200">
                                                <AnimatePresence>
                                                    {messages.map((message) => (
                                                        <motion.div
                                                            key={message.id}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -20 }}
                                                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!message.is_read ? 'bg-blue-50 border-l-4 border-l-primary-500' : ''
                                                                }`}
                                                            onClick={() => viewMessage(message)}
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center mb-1">
                                                                        <span className={`text-sm font-medium ${!message.is_read ? 'text-dark-900' : 'text-dark-700'
                                                                            }`}>
                                                                            {message.sender_display}
                                                                        </span>
                                                                        {!message.is_read && (
                                                                            <span className="ml-2 h-2 w-2 bg-primary-500 rounded-full"></span>
                                                                        )}
                                                                    </div>
                                                                    <p className={`text-sm mb-1 ${!message.is_read ? 'font-medium text-dark-900' : 'text-dark-600'
                                                                        }`}>
                                                                        {message.subject || '(No Subject)'}
                                                                    </p>
                                                                    <p className="text-xs text-dark-500">
                                                                        {message.time_ago}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center space-x-2 ml-4">
                                                                    {message.attachments && message.attachments.length > 0 && (
                                                                        <FiDownload className="h-4 w-4 text-dark-400" />
                                                                    )}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            deleteMessage(message.id);
                                                                        }}
                                                                        className="p-1 text-dark-400 hover:text-red-500 transition-colors"
                                                                    >
                                                                        <FiTrash2 className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Message Modal */}
            <AnimatePresence>
                {showMessageModal && selectedMessage && (
                    <div className="fixed inset-0 bg-dark-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-xl shadow-soft max-w-4xl w-full max-h-[90vh] flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
                                <div>
                                    <h2 className="text-xl font-display font-semibold text-dark-900">
                                        {selectedMessage.subject || '(No Subject)'}
                                    </h2>
                                    <p className="text-sm text-dark-500 mt-1">
                                        From: {selectedMessage.sender_display}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowMessageModal(false)}
                                    className="text-dark-400 hover:text-dark-600"
                                >
                                    <FiTrash2 className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Attachments */}
                                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-medium text-dark-700 mb-3">
                                            Attachments ({selectedMessage.attachments.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {selectedMessage.attachments.map((attachment) => (
                                                <div
                                                    key={attachment.id}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                                >
                                                    <div className="flex items-center">
                                                        <FiDownload className="h-4 w-4 text-dark-400 mr-3" />
                                                        <div>
                                                            <p className="text-sm font-medium text-dark-900">
                                                                {attachment.filename}
                                                            </p>
                                                            <p className="text-xs text-dark-500">
                                                                {attachment.size_display}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => downloadAttachment(attachment)}
                                                        className="btn btn-sm btn-outline"
                                                    >
                                                        Download
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Message Body */}
                                <div className="prose max-w-none">
                                    {selectedMessage.body_html ? (
                                        <div
                                            dangerouslySetInnerHTML={{ __html: selectedMessage.body_html }}
                                            className="text-dark-900"
                                        />
                                    ) : (
                                        <pre className="whitespace-pre-wrap text-dark-900 font-sans">
                                            {selectedMessage.body_text || 'No content'}
                                        </pre>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-gray-200 flex justify-between flex-shrink-0">
                                <div className="text-sm text-dark-500">
                                    Received: {new Date(selectedMessage.received_at).toLocaleString()}
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => deleteMessage(selectedMessage.id)}
                                        className="btn bg-red-600 text-white hover:bg-red-700"
                                    >
                                        <FiTrash2 className="mr-2" />
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => setShowMessageModal(false)}
                                        className="btn btn-outline"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TempMailPage;