import { useEffect, useRef, useState } from "react"
import socket from "../socket"
import { ChatMessage } from "../types"

interface TypingUser {
    id: string;
    from: string;
}

function Chat() {
    const [message, setMessage] = useState("")
    const [chat, setChat] = useState<ChatMessage[]>([])
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])

    const chatContainerRef = useRef<HTMLDivElement>(null)
    const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
    const lastTypingTimeRef = useRef<number>(0)
    const stopTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Auto-scroll chat to bottom on new messages or typing updates
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [chat, typingUsers])

    useEffect(() => {
        function handleChatMessage(data: ChatMessage) {
            setChat(prevChat => [...prevChat, data])
            // Sender is no longer typing once their message arrives
            handleStopTyping({ id: data.id, from: data.from })
        }

        function handleTyping({ id, from }: TypingUser) {
            const userId = id || from
            const existingTimer = typingTimersRef.current.get(userId)
            if (existingTimer) {
                clearTimeout(existingTimer)
            }

            setTypingUsers(prev => {
                if (prev.some(u => (id && u.id === id) || u.from === from)) {
                    return prev
                }
                return [...prev, { id, from }]
            })

            // Clear typing state after 3 seconds of inactivity
            const timer = setTimeout(() => {
                setTypingUsers(prev => prev.filter(u => (id ? u.id !== id : u.from !== from)))
                typingTimersRef.current.delete(userId)
            }, 3000)

            typingTimersRef.current.set(userId, timer)
        }

        function handleStopTyping({ id, from }: { id?: string; from?: string }) {
            const userId = id || from || ""
            const timer = typingTimersRef.current.get(userId)
            if (timer) {
                clearTimeout(timer)
                typingTimersRef.current.delete(userId)
            }
            setTypingUsers(prev => prev.filter(u => {
                if (id && u.id === id) return false
                if (from && u.from === from) return false
                return true
            }))
        }

        socket.on("chatMessage", handleChatMessage)
        socket.on("typing", handleTyping)
        socket.on("stopTyping", handleStopTyping)

        return () => {
            socket.off("chatMessage", handleChatMessage)
            socket.off("typing", handleTyping)
            socket.off("stopTyping", handleStopTyping)

            typingTimersRef.current.forEach(timer => clearTimeout(timer))
            typingTimersRef.current.clear()

            if (stopTypingTimeoutRef.current) {
                clearTimeout(stopTypingTimeoutRef.current)
            }
        }
    }, [])

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value
        setMessage(val)

        if (val.trim()) {
            const now = Date.now()
            // Throttle emitting 'typing' to once every 1.5 seconds
            if (now - lastTypingTimeRef.current > 1500) {
                socket.emit("typing")
                lastTypingTimeRef.current = now
            }

            // Reset idle timeout: if user stops typing for 2s, notify stopTyping
            if (stopTypingTimeoutRef.current) {
                clearTimeout(stopTypingTimeoutRef.current)
            }
            stopTypingTimeoutRef.current = setTimeout(() => {
                socket.emit("stopTyping")
                lastTypingTimeRef.current = 0
            }, 2000)
        } else {
            if (stopTypingTimeoutRef.current) {
                clearTimeout(stopTypingTimeoutRef.current)
            }
            socket.emit("stopTyping")
            lastTypingTimeRef.current = 0
        }
    }

    function sendMessage() {
        const trimmed = message.trim()
        if (!trimmed) return

        if (stopTypingTimeoutRef.current) {
            clearTimeout(stopTypingTimeoutRef.current)
        }
        socket.emit("stopTyping")
        lastTypingTimeRef.current = 0

        socket.emit("chatMessage", trimmed)
        setMessage("")
    }

    function getTypingText(users: TypingUser[], myId: string | undefined): string {
        if (users.length === 0) return ""

        const isMeTyping = users.some(u => u.id === myId)
        const others = users.filter(u => u.id !== myId).map(u => u.from)

        if (isMeTyping) {
            if (others.length === 0) {
                return "You are typing..."
            } else if (others.length === 1) {
                return `You and ${others[0]} are typing...`
            } else {
                return `You and ${others.length} others are typing...`
            }
        } else {
            if (others.length === 1) {
                return `${others[0]} is typing...`
            } else if (others.length === 2) {
                return `${others[0]} and ${others[1]} are typing...`
            } else {
                return "Several players are typing..."
            }
        }
    }

    const typingText = getTypingText(typingUsers, socket.id)

    return (
        <div>
            <div
                ref={chatContainerRef}
                className="bg-accent/70 text-accent-foreground border p-2 h-40 overflow-y-auto scrollbar-thumb-accent-foreground flex flex-col gap-1 mb-2"
            >
                {chat.length === 0 ? (
                    <p className="text-xs opacity-70 italic">No messages yet...</p>
                ) : (
                    chat.map((line, idx) => (
                        <p key={`${line.from}-${line.timestamp || idx}`} className="text-sm">
                            <span className="font-semibold">{line.from} :</span> {line.message}
                        </p>
                    ))
                )}
                {typingText && (
                    <p className="text-xs italic opacity-85 animate-pulse pt-1">
                        {typingText}
                    </p>
                )}
            </div>

            <div className="flex gap-2">
                <input
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="p-2 placeholder:text-foreground/80 border shadow-xs flex-1"
                    placeholder="Write something..."
                />
                <button
                    onClick={sendMessage}
                    className="bg-secondary text-secondary-foreground p-1 px-3 shadow-xs hover:opacity-90 cursor-pointer"
                >
                    Send
                </button>
            </div>
        </div>
    )
}

export default Chat