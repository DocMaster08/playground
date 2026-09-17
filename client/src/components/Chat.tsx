import { useEffect, useRef, useState } from "react"
import socket from "../socket"
import { ChatMessage } from "../types"
import { Send, MessageSquareText } from "lucide-react"

interface TypingUser {
  id: string
  from: string
}

function Chat() {
  const [message, setMessage] = useState("")
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])

  const chatContainerRef = useRef<HTMLDivElement>(null)
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const lastTypingTimeRef = useRef<number>(0)
  const stopTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chat, typingUsers])

  useEffect(() => {
    function handleChatMessage(data: ChatMessage) {
      setChat((prevChat) => [...prevChat, data])
      handleStopTyping({ id: data.id, from: data.from })
    }

    function handleTyping({ id, from }: TypingUser) {
      const userId = id || from
      const existingTimer = typingTimersRef.current.get(userId)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      setTypingUsers((prev) => {
        if (prev.some((u) => (id && u.id === id) || u.from === from)) {
          return prev
        }
        return [...prev, { id, from }]
      })

      const timer = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => (id ? u.id !== id : u.from !== from)))
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
      setTypingUsers((prev) =>
        prev.filter((u) => {
          if (id && u.id === id) return false
          if (from && u.from === from) return false
          return true
        })
      )
    }

    socket.on("chatMessage", handleChatMessage)
    socket.on("typing", handleTyping)
    socket.on("stopTyping", handleStopTyping)

    return () => {
      socket.off("chatMessage", handleChatMessage)
      socket.off("typing", handleTyping)
      socket.off("stopTyping", handleStopTyping)

      typingTimersRef.current.forEach((timer) => clearTimeout(timer))
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
      if (now - lastTypingTimeRef.current > 1500) {
        socket.emit("typing")
        lastTypingTimeRef.current = now
      }

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

    const isMeTyping = users.some((u) => u.id === myId)
    const others = users.filter((u) => u.id !== myId).map((u) => u.from)

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
    <div className="flex flex-col gap-3">
      <div
        ref={chatContainerRef}
        className="bg-muted/40 border-2 border-black p-3 h-44 overflow-y-auto flex flex-col gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
      >
        {chat.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1">
            <MessageSquareText className="w-6 h-6 opacity-40" />
            <p className="text-xs font-bold uppercase tracking-wider">No messages yet. Say hello!</p>
          </div>
        ) : (
          chat.map((line, idx) => {
            return (
              <div
                key={`${line.from}-${line.timestamp || idx}`}
                className="text-xs flex items-start gap-1.5"
              >
                <span className="font-extrabold bg-amber-200 text-black px-1.5 py-0.5 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0">
                  {line.from}
                </span>
                <span className="font-semibold text-foreground bg-background px-2 py-0.5 border border-black flex-1 wrap-break-word">
                  {line.message}
                </span>
              </div>
            )
          })
        )}
        {typingText && (
          <p className="text-[11px] font-bold italic text-amber-600 animate-pulse pt-1">
            💬 {typingText}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={message}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="p-2.5 border-2 border-black font-semibold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-amber-50 focus:outline-none flex-1 bg-background placeholder:text-muted-foreground/60"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-accent text-accent-foreground font-black p-2.5 px-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center gap-1 uppercase text-xs tracking-wider"
        >
          <Send className="w-3.5 h-3.5 stroke-3" /> Send
        </button>
      </div>
    </div>
  )
}

export default Chat
