import * as THREE from 'three'
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import animateTitle from './features/animateTitle'
import createBadge from './features/createBasge'
import './styles/style.css'
// Features
createBadge()
animateTitle()
// Canvas
const canvas = document.createElement('canvas')
canvas.classList.add('webgl')
// Attach to ASCII container div
const asciiContainer = document.querySelector('.ascii-bg')
if (!asciiContainer) {
  console.error('ASCII container .ascii-bg not found')
}
asciiContainer.appendChild(canvas)
// Scene
const scene = new THREE.Scene()
// Sizes
const sizes = {
  width: asciiContainer.offsetWidth,
  height: asciiContainer.offsetHeight,
}
// Camera
const camera = new THREE.PerspectiveCamera(
  25,
  sizes.width / sizes.height,
  0.1,
  1000
)
camera.position.z = 4
scene.add(camera)
// Lights
const mainlight = new THREE.DirectionalLight('white', 1)
mainlight.position.set(1, 2, 0.5)
const backlight = new THREE.DirectionalLight('white', 1)
backlight.position.set(0, 5, 2)
const secondlight = new THREE.DirectionalLight('white', 1)
secondlight.position.set(1, 0, 1)
scene.add(mainlight, backlight, secondlight)
// Model + Animation
const gltfLoader = new GLTFLoader()
let model = null
let mixer = null
const referenceSize = 1440 // design reference width for scaling
gltfLoader.load(
  'https://cdn.prod.website-files.com/68c6ab111eb5a797aedfa7bd/68c9b3f0ed751939a196b255_shield-orbit.glb.txt',
  (gltf) => {
    model = gltf.scene
    scene.add(model)
    // If there are animations in the glb
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model)
      gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip)
        action.play()
        console.log('Playing animation:', clip.name)
      })
    }
    // Initial scale
    updateModelScale()
  }
)
// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
// ASCII Effect
const effect = new AsciiEffect(renderer, ` .:=*R$#@`, { invert: false })
effect.setSize(sizes.width, sizes.height)
asciiContainer.appendChild(effect.domElement)
// Hide original canvas
canvas.style.display = 'none'
// Cursor & Scroll
const cursor = { x: 0, y: 0 }
window.addEventListener('mousemove', (event) => {
  cursor.x = (event.clientX / sizes.width - 0.5) * 2
  cursor.y = (event.clientY / sizes.height - 0.5) * 2
})
let scrollY = 0
window.addEventListener('scroll', () => {
  scrollY = window.scrollY * 0.003
})
// ===== Resize based on ASCII container div =====
function updateModelScale() {
  if (!model) return
  const scale = asciiContainer.offsetWidth / referenceSize
  model.scale.set(scale, scale, scale)
}
function resize() {
  sizes.width = asciiContainer.offsetWidth
  sizes.height = asciiContainer.offsetHeight
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
  renderer.setSize(sizes.width, sizes.height)
  effect.setSize(sizes.width, sizes.height)
  updateModelScale()
}
window.addEventListener('resize', resize)
resize()
// Animate
const clock = new THREE.Clock()
function animate() {
  requestAnimationFrame(animate)
  const delta = clock.getDelta()
  // Update mixer (for GLB animations)
  if (mixer) {
    mixer.update(delta)
  }
  if (model) {
    const cursorXOffset = cursor.x * 0.3
    const cursorYOffset = cursor.y * 0.1
    // Keep only cursor + scroll control (no idle rotation)
    model.rotation.y = cursorXOffset
    model.rotation.x = cursorYOffset
    model.position.y = -0.1 // move it slightly down
    model.position.x = -0.1 // move it to the left
    model.position.z += (scrollY - model.position.z) * 0.5
  }
  effect.render(scene, camera)
}
animate()
