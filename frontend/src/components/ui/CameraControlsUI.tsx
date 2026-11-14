import type { FC } from 'react'
import { Eye, Compass, Layers, RotateCcw } from 'lucide-react'
import { useBoardStore, boardStore } from '../../state/boardStore'

export const CameraControlsUI: FC = () => {
  const { cameraView, showLabels } = useBoardStore()

  return (
    <div className="camera-controls-bar">
      <button
        className={`cam-btn ${cameraView === 'isometric' ? 'active' : ''}`}
        onClick={() => boardStore.setCameraView('isometric')}
        title="Reference Isometric Angle"
      >
        <Compass size={16} />
        <span>Isometric</span>
      </button>

      <button
        className={`cam-btn ${cameraView === 'topDown' ? 'active' : ''}`}
        onClick={() => boardStore.setCameraView('topDown')}
        title="Overhead Strategic View"
      >
        <Eye size={16} />
        <span>Top-Down</span>
      </button>

      <button
        className={`cam-btn ${cameraView === 'side' ? 'active' : ''}`}
        onClick={() => boardStore.setCameraView('side')}
        title="Low Action Angle"
      >
        <Layers size={16} />
        <span>Low Angle</span>
      </button>

      <button
        className={`cam-btn ${showLabels ? 'active' : ''}`}
        onClick={() => boardStore.toggleLabels()}
        title="Toggle Coordinate Labels"
      >
        <span>A-H / 1-8</span>
      </button>

      <button
        className="cam-btn"
        onClick={() => boardStore.setCameraView('isometric')}
        title="Reset Camera View"
      >
        <RotateCcw size={16} />
        <span>Reset</span>
      </button>
    </div>
  )
}
