export type PanoramaNode = {
  id: string
  title: string
  /** Path or URL to an HDRI/equirect env. Use .hdr or .exr if possible. */
  files: string
  /** Neighbor hotspots in local XZ plane (meters) */
  neighbors: Array<{ id: string; position: [number, number]; label?: string }>
}

// Sample CC0 HDRIs from Poly Haven CDN (2k). You can swap to local files under public/panoramas.
export const PANORAMA_NODES: PanoramaNode[] = [
  {
    id: 'corner',
    title: 'Street Corner',
    files:
      'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/spruit_sunrise_2k.hdr',
    neighbors: [
      { id: 'alley', position: [0, -4], label: 'Go forward' },
    ],
  },
  {
    id: 'alley',
    title: 'Alley',
    files:
      'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/kloofendal_38d_partly_cloudy_2k.hdr',
    neighbors: [
      { id: 'corner', position: [0, 4], label: 'Back' },
    ],
  },
]

export function getNode(id: string): PanoramaNode | undefined {
  return PANORAMA_NODES.find((n) => n.id === id)
}

