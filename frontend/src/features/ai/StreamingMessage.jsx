import { useEffect, useState } from 'react'
import { MarkdownRenderer } from './MarkdownRenderer'

export function StreamingMessage({ content }) {
  const [visible, setVisible] = useState('')

  useEffect(() => {
    setVisible('')
    let index = 0
    const timer = window.setInterval(() => {
      index += 18
      setVisible(content.slice(0, index))
      if (index >= content.length) window.clearInterval(timer)
    }, 18)

    return () => window.clearInterval(timer)
  }, [content])

  return <MarkdownRenderer content={visible} />
}
