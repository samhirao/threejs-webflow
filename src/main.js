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
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  effect.setSize(sizes.width, sizes.height)
})

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
)
camera.position.z = 3
scene.add(camera)

// Lights
const mainlight = new THREE.DirectionalLight('white', 1)
mainlight.position.set(1, 2, 0.5)
mainlight.intensity = 1

const backlight = new THREE.DirectionalLight('white', 1)
backlight.position.set(0, 5, 2)
backlight.intensity = 1

const secondlight = new THREE.DirectionalLight('white', 1)
secondlight.position.set(1, 0, 1)
secondlight.intensity = 0

scene.add(mainlight, backlight, secondlight)

// Model
const gltfLoader = new GLTFLoader()
let model = null

gltfLoader.load(
  'https://cdn.prod.website-files.com/68c6ab111eb5a797aedfa7bd/68c71f738962ad220817ceb3_dummy.glb.txt',
  (gltf) => {
    model = gltf.scene
    scene.add(model)
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
const effect = new AsciiEffect(renderer, ' .:-+*=R$#', { invert: false })
effect.setSize(sizes.width, sizes.height)
effect.domElement.style.position = 'absolute'
effect.domElement.style.top = '0px'
effect.domElement.style.left = '0px'
effect.domElement.style.fontFamily = 'Arial, Bold'
effect.domElement.style.fontSize = '12px'
effect.domElement.style.backgroundColor = '#000000ff'
document.body.appendChild(effect.domElement)
canvas.style.display = 'none'

// Map characters to opacity
const charOpacityMap = {
  ' ': 0.1,
  '.': 0.2,
  ':': 0.3,
  '-': 0.4,
  '+': 0.5,
  '*': 0.6,
  '=': 0.7,
  '%': 0.8,
  R: 1,
  $: 1,
}

// Function to update opacity each frame
function updateAsciiOpacity() {
  const pre = effect.domElement.querySelector('pre')
  if (!pre) return

  const text = pre.textContent
  let html = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '\n') {
      html += '\n'
    } else {
      const opacity = charOpacityMap[char] ?? 1
      html += `<span style="color: rgba(0,255,0,${opacity})">${char}</span>`
    }
  }

  pre.innerHTML = html
}

// Hide original canvas
canvas.style.display = 'none'

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
  scrollY = window.scrollY * 0.001
})

// Base rotation for continuous idle rotation
let baseRotationY = 0

// Animate
function animate() {
  requestAnimationFrame(animate)

  if (model) {
    baseRotationY += 0.002

    const cursorXOffset = cursor.x * 0.2
    const cursorYOffset = cursor.y * 0.2

    model.rotation.y = baseRotationY + cursorXOffset
    model.rotation.x = cursorYOffset
    model.position.y += (scrollY - model.position.y) * 0.05
  }

  effect.render(scene, camera)
  updateAsciiOpacity() // apply opacity to characters
}

animate()
