import { useEffect } from 'react'
import { useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RGBELoader } from 'three-stdlib'

interface Props {
  files: string
}

export default function PanoramaBackground({ files }: Props) {
  const { scene } = useThree()
  const texture = useLoader(RGBELoader as any, files)

  useEffect(() => {
    if (!texture) return
    texture.mapping = THREE.EquirectangularReflectionMapping
    scene.background = texture
    scene.environment = texture
    return () => {
      // do not dispose if reused by loader cache; let R3F handle unmount
    }
  }, [texture, scene])

  return null
}

