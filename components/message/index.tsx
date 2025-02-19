'use client'

import { SiOpenai } from 'react-icons/si'
import { HiUser } from 'react-icons/hi'
import cs from 'clsx'
import Markdown from '../markdown'

export interface MessageProps {
  message: ChatMessage
}

const Message = (props: MessageProps) => {
  const { role, content } = props.message
  const isUser = role === 'user'

  return (
    <div
      className={`group w-full text-gray-800 dark:text-gray-100 border-b border-black/10 bg-white border-green-400 border-2 grid grid-cols-12 divide-x divide-gray-200`}
    >
      <div className="text-sm gap-4 md:gap-6 flex lg:px-4 w-full p-4 col-span-8">
        <div
          className={cs(
            `relative h-7 w-7 rounded-sm text-white flex items-center justify-center text-opacity-100r`,
            isUser ? 'bg-blue-gray-500' : 'bg-green-500'
          )}
        >
          {isUser ? <HiUser className="h-4 w-4" /> : <SiOpenai className="h-4 w-4" />}
        </div>
        <div className="relative flex-1 min-h-20 markdown break-words overflow-hidden">
          <Markdown content={content} />
        </div>
      </div>
      <div className="text-sm gap-4 md:gap-6 flex lg:px-4 w-full p-4 col-span-4">also me</div>
    </div>
  )
}

export default Message
