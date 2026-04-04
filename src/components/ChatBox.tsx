'use client'

import { useEffect, useState, useRef } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

interface Message {
  id: string
  deal_id: string
  sender_id: string
  content: string
  created_at: string
}

interface ChatBoxProps {
  dealId: string
  currentUserId: string
}

export default function ChatBox({ dealId, currentUserId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Khởi tạo Supabase client
  const supabase = getSupabaseBrowserClient()

  // Hàm tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    let isMounted = true

    // 1. Tải lịch sử tin nhắn
    const loadMessages = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('deal_id', dealId) // Bắt buộc phải là deal_id
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[ChatBox] Lỗi thật sự khi tải tin:', error.message || error)
      } else if (isMounted) {
        setMessages(data || [])
      }
      if (isMounted) setIsLoading(false)
    }

    loadMessages()

    // 2. Kích hoạt Supabase Realtime (Nghe lén tin nhắn mới)
    const channel = supabase
      .channel(`room_${dealId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `deal_id=eq.${dealId}` // Bắt buộc phải là deal_id
        },
        (payload) => {
          const newMsg = payload.new as Message
          if (isMounted) {
            setMessages((prev) => [...prev, newMsg])
          }
        }
      )
      .subscribe()

    // Dọn dẹp khi thoát phòng chat
    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [dealId, supabase])

  // 3. Hàm gửi tin nhắn
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!newMessage.trim()) return

    // Lưu tạm nội dung để clear ô input cho nhanh (Tạo cảm giác mượt)
    const textToSend = newMessage.trim()
    setNewMessage('')

    const { error } = await supabase
      .from('messages')
      .insert({
        deal_id: dealId,           // Cột chuẩn
        sender_id: currentUserId,  // Cột chuẩn
        content: textToSend
      })

    if (error) {
      console.error('[ChatBox] Lỗi khi gửi:', error.message || error)
      alert('Lỗi gửi tin nhắn: ' + (error.message || 'Vui lòng thử lại'))
      setNewMessage(textToSend) // Trả lại text nếu gửi lỗi
    }
  }

  // Giao diện Loading
  if (isLoading) {
    return (
      <div className="flex h-[450px] items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[450px] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Khu vực hiển thị tin nhắn */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <svg className="w-12 h-12 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            <p>Chưa có tin nhắn nào. Hãy bắt đầu thương lượng!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                  isMe 
                    ? 'bg-emerald-600 text-white rounded-br-sm' 
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Khu vực nhập tin nhắn */}
      <div className="p-3 bg-white border-t border-gray-100">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhập mức giá hoặc câu hỏi của bạn..."
            className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-gray-900"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  )
}