import { useEffect } from 'react'
import { projects } from '../data/projects.js'
import { soundscape } from '../utils/audio.js'

export default function ArchiveIndexTray({ isOpen, onClose, onSelectProject, activeIndex }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="index-tray-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="index-tray-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="index-tray-header">
          <div>
            <p className="index-tray-tag">Collection</p>
            <h2 className="index-tray-title">Index</h2>
          </div>
          <button
            className="index-tray-close"
            onClick={() => {
              onClose()
              soundscape.playTactileClick('view')
            }}
            onMouseEnter={() => soundscape.playTick()}
            aria-label="Close index"
          >
            ✕ Close
          </button>
        </div>

        <div className="index-tray-list">
          {projects.map((p, idx) => (
            <div
              key={p.id}
              className={`index-item ${activeIndex === idx ? 'current' : ''}`}
              onClick={() => {
                onSelectProject(idx)
                onClose()
                soundscape.playGlassChime(idx)
              }}
              onMouseEnter={() => soundscape.playTick()}
            >
              <span className="index-item-num">{p.number}</span>
              <div className="index-item-info">
                <h3 className="index-item-title">{p.title}</h3>
                <p className="index-item-meta">{p.category} · {p.location}</p>
              </div>
              <span className="index-item-year">{p.year}</span>
              <span className="index-item-arrow">→</span>
            </div>
          ))}
        </div>

        <div className="index-tray-footer">
          <span>Works 2024–2026</span>
          <span>Kyoto Sanctuary</span>
        </div>
      </div>
    </div>
  )
}
