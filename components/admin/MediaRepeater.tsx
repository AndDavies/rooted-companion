"use client"
import { useCallback } from 'react'

export type MediaItem = {
  id: string
  type: 'video' | 'audio'
  url: string
  caption?: string
  start_time?: string
  transcript_url?: string
}

interface MediaRepeaterProps {
  value: MediaItem[]
  onChange: (media: MediaItem[]) => void
}

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function inferMediaType(url: string): 'video' | 'audio' {
  const lowerUrl = url.toLowerCase()
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerUrl.includes('vimeo.com')) {
    return 'video'
  }
  if (lowerUrl.match(/\.(mp3|wav|ogg|m4a|aac)$/)) {
    return 'audio'
  }
  return 'video' // default
}

function cleanUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    // Remove tracking parameters
    const cleanParams = new URLSearchParams()
    const entries = Array.from(urlObj.searchParams.entries())
    for (const [key, value] of entries) {
      if (!['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'].includes(key)) {
        cleanParams.append(key, value)
      }
    }
    urlObj.search = cleanParams.toString()
    return urlObj.toString()
  } catch {
    return url
  }
}

function validateUrl(url: string, type: 'video' | 'audio'): { isValid: boolean; error?: string } {
  if (!url.trim()) {
    return { isValid: false, error: 'URL is required' }
  }
  
  try {
    new URL(url)
  } catch {
    return { isValid: false, error: 'Invalid URL format' }
  }
  
  const lowerUrl = url.toLowerCase()
  
  if (type === 'video') {
    if (!lowerUrl.includes('youtube.com') && !lowerUrl.includes('youtu.be') && !lowerUrl.includes('vimeo.com')) {
      return { isValid: false, error: 'Video URLs must be from YouTube or Vimeo' }
    }
  } else if (type === 'audio') {
    if (!lowerUrl.match(/\.(mp3|wav|ogg|m4a|aac)$/)) {
      return { isValid: false, error: 'Audio URLs must have valid audio file extensions' }
    }
  }
  
  return { isValid: true }
}

// Tooltip component
const Hint = ({ text }: { text: string }) => (
  <div className="relative group">
    <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-xs font-medium cursor-help border border-blue-200 hover:bg-blue-200 transition-colors">
      ?
    </span>
    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 w-64">
      <div className="whitespace-normal leading-relaxed">{text}</div>
      <div className="absolute top-full left-3 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-gray-900"></div>
    </div>
  </div>
)

export default function MediaRepeater({ value, onChange }: MediaRepeaterProps) {
  const addItem = useCallback(() => {
    const newItem: MediaItem = {
      id: generateId(),
      type: 'video',
      url: '',
      caption: '',
      start_time: '',
      transcript_url: ''
    }
    onChange([...value, newItem])
  }, [value, onChange])

  const removeItem = useCallback((id: string) => {
    onChange(value.filter(item => item.id !== id))
  }, [value, onChange])

  const updateItem = useCallback((id: string, updates: Partial<MediaItem>) => {
    onChange(value.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ))
  }, [value, onChange])

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    const newItems = [...value]
    const [movedItem] = newItems.splice(fromIndex, 1)
    newItems.splice(toIndex, 0, movedItem)
    onChange(newItems)
  }, [value, onChange])

  const renderPreview = (item: MediaItem) => {
    if (!item.url) return null

    const validation = validateUrl(item.url, item.type)
    if (!validation.isValid) {
      return (
        <div className="text-red-500 text-xs p-2 bg-red-50 border border-red-200 rounded">
          {validation.error}
        </div>
      )
    }

    if (item.type === 'video') {
      // YouTube/Vimeo iframe
      let embedUrl = item.url
      if (item.url.includes('youtube.com/watch')) {
        const videoId = new URL(item.url).searchParams.get('v')
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}${item.start_time ? `?start=${item.start_time}` : ''}`
        }
      } else if (item.url.includes('youtu.be/')) {
        const videoId = item.url.split('youtu.be/')[1]
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}${item.start_time ? `?start=${item.start_time}` : ''}`
        }
      } else if (item.url.includes('vimeo.com/')) {
        const videoId = item.url.split('vimeo.com/')[1]
        if (videoId) {
          embedUrl = `https://player.vimeo.com/video/${videoId}${item.start_time ? `#t=${item.start_time}` : ''}`
        }
      }

      return (
        <iframe
          src={embedUrl}
          className="w-full h-32 rounded border"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )
    } else {
      // Audio player
      return (
        <audio controls className="w-full">
          <source src={item.url} />
          Your browser does not support the audio element.
        </audio>
      )
    }
  }

  return (
    <div className="space-y-4">
      {/* Add Media Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={addItem}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          + Add Media
        </button>
      </div>

      {/* Media Items */}
      <div className="space-y-4">
        {value.map((item, index) => (
          <div key={item.id} className="border border-gray-300 rounded p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium">Media Item {index + 1}</div>
              <div className="flex gap-2">
                {index > 0 && (
                  <button
                    onClick={() => moveItem(index, index - 1)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    ↑
                  </button>
                )}
                {index < value.length - 1 && (
                  <button
                    onClick={() => moveItem(index, index + 1)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    ↓
                  </button>
                )}
                <button
                  onClick={() => removeItem(item.id)}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column - Form Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Type <Hint text="Choose video or audio. We&apos;ll preview it here." />
                  </label>
                  <select
                    value={item.type}
                    onChange={(e) => updateItem(item.id, { type: e.target.value as 'video' | 'audio' })}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    URL <Hint text="Paste a YouTube/Vimeo link or audio file link. Example: https://youtu.be/abc123" />
                  </label>
                  <input
                    type="url"
                    value={item.url}
                    onChange={(e) => {
                      const url = cleanUrl(e.target.value)
                      const type = inferMediaType(url)
                      updateItem(item.id, { url, type })
                    }}
                    placeholder="https://youtu.be/abc123"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Caption <Hint text="What will they get from this clip? Example: &apos;2-min demo of 4-4-4-4 breathing.&apos;" />
                  </label>
                  <input
                    type="text"
                    value={item.caption || ''}
                    onChange={(e) => updateItem(item.id, { caption: e.target.value || undefined })}
                    placeholder="Brief description of what they'll learn"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start Time <Hint text="Optional. Begin playback at a specific point. Example: 00:45." />
                  </label>
                  <input
                    type="text"
                    value={item.start_time || ''}
                    onChange={(e) => updateItem(item.id, { start_time: e.target.value || undefined })}
                    placeholder="mm:ss (e.g., 01:30)"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Transcript URL <Hint text="Optional. Link to transcript/notes for accessibility." />
                  </label>
                  <input
                    type="url"
                    value={item.transcript_url || ''}
                    onChange={(e) => updateItem(item.id, { transcript_url: e.target.value || undefined })}
                    placeholder="https://example.com/transcript"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              {/* Right Column - Preview */}
              <div>
                <div className="text-sm font-medium mb-2">Preview</div>
                {renderPreview(item)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {value.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded">
          <div className="text-sm">No media items added yet</div>
          <div className="text-xs mt-1">Click &quot;Add Media&quot; to get started</div>
        </div>
      )}
    </div>
  )
}
