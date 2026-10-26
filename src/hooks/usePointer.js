import { useEffect, useRef } from 'react'

export function usePointer() {
  const pointer = useRef({ x: 0, y: 0, ndc: { x: 0, y: 0 } })

  useEffect(() => {
    const onMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      pointer.current.x = clientX
      pointer.current.y = clientY
      pointer.current.ndc.x = (clientX / window.innerWidth) * 2 - 1
      pointer.current.ndc.y = -(clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
    }
  }, [])

  return pointer
}
