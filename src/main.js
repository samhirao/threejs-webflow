import * as THREE from 'three'
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import animateTitle from './features/animateTitle'
// import createBadge from './features/createBasge' // Removed badge import
import './styles/style.css'

// Features
// createBadge() // Commented out to remove "It works!" badge
animateTitle()

// Debug logging for mobile
console.log('Script loaded, window width:', window.innerWidth)
console.log('User agent:', navigator.userAgent)

// Canvas
const canvas = document.createElement('canvas')
canvas.classList.add('webgl')

// Attach to ASCII container div
const asciiContainer = document.querySelector('.ascii-bg')
if (!asciiContainer) {
  console.error('ASCII container .ascii-bg not found')
  // Create fallback container
  const fallback = document.createElement('div')
  fallback.className = 'ascii-bg'
  fallback.style.width = '100%'
  fallback.style.height = '400px'
  document.body.appendChild(fallback)
  asciiContainer = fallback
}

console.log('ASCII container found:', asciiContainer)
asciiContainer.appendChild(canvas)

// Scene
const scene = new THREE.Scene()

// Sizes
const sizes = {
  width: asciiContainer.offsetWidth || window.innerWidth,
  height: asciiContainer.offsetHeight || 400,
}

console.log('Initial sizes:', sizes)

// Mobile breakpoint
const MOBILE_BREAKPOINT = 768

// Check if mobile
function isMobile() {
  const mobile = window.innerWidth <= MOBILE_BREAKPOINT
  console.log('Is mobile:', mobile, 'Width:', window.innerWidth)
  return mobile
}

// Camera
const camera = new THREE.PerspectiveCamera(
  25,
  sizes.width / sizes.height,
  0.1,
  1000
)

// Set camera position based on device
if (isMobile()) {
  camera.position.z = 2.5 // Much closer on mobile
} else {
  camera.position.z = 4 // Normal distance on desktop
}

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
let modelLoaded = false
const referenceSize = 1440 // design reference width for scaling

console.log('Loading GLB model...')

gltfLoader.load(
  'https://cdn.prod.website-files.com/68c6ab111eb5a797aedfa7bd/68c9b3f0ed751939a196b255_shield-orbit.glb.txt',
  (gltf) => {
    console.log('GLB model loaded successfully')
    model = gltf.scene
    modelLoaded = true
    scene.add(model)

    // Remove placeholder when model loads
    scene.remove(placeholderMesh)

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
  },
  (progress) => {
    console.log('Loading progress:', progress.loaded / progress.total * 100 + '%')
  },
  (error) => {
    console.error('GLB loading error:', error)
    // Keep placeholder if model fails to load
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

console.log('Renderer created, pixel ratio:', window.devicePixelRatio)

// ASCII Effect with responsive font size
let effect = null

function createAsciiEffect() {
  console.log('Creating ASCII effect...')

  // Remove existing effect if it exists
  if (effect && effect.domElement) {
    asciiContainer.removeChild(effect.domElement)
  }

  const characters = ` .:=*R$#@`

  try {
    effect = new AsciiEffect(renderer, characters, { invert: false })
    console.log('ASCII effect created')

    effect.setSize(sizes.width, sizes.height)
    asciiContainer.appendChild(effect.domElement)

    // Add mobile/desktop class for CSS targeting
    if (isMobile()) {
      effect.domElement.classList.add('ascii-mobile')
      effect.domElement.classList.remove('ascii-desktop')

      // Apply mobile font directly via JS as fallback
      effect.domElement.style.fontFamily = 'Monaco, "Lucida Console", "Courier New", monospace'
      effect.domElement.style.fontSize = '8px'
      effect.domElement.style.lineHeight = '8px'
      effect.domElement.style.fontWeight = 'normal'
      effect.domElement.style.letterSpacing = '0px'

      console.log('Applied mobile styles to ASCII effect')
    } else {
      effect.domElement.classList.add('ascii-desktop')
      effect.domElement.classList.remove('ascii-mobile')
    }

    // Force visibility
    effect.domElement.style.visibility = 'visible'
    effect.domElement.style.display = 'block'

    // Start rendering immediately with empty scene
    startRendering()

  } catch (error) {
    console.error('ASCII effect creation failed:', error)
  }
}

// Separate rendering function
function startRendering() {
  console.log('Starting ASCII rendering...')

  // Render an initial frame to show ASCII immediately
  if (effect) {
    effect.render(scene, camera)
  }
}

// Initialize ASCII effect immediately
createAsciiEffect()

// Hide original canvas
canvas.style.display = 'none'

// Add a placeholder/loading geometry to show ASCII immediately
const placeholderGeometry = new THREE.SphereGeometry(0.5, 16, 16)
const placeholderMaterial = new THREE.MeshBasicMaterial({
  color: 0x333333,
  wireframe: true,
  transparent: true,
  opacity: 0.3
})
const placeholderMesh = new THREE.Mesh(placeholderGeometry, placeholderMaterial)
scene.add(placeholderMesh)

// Animate placeholder while loading
let placeholderRotation = 0

// Cursor & Scroll
const cursor = { x: 0, y: 0 }
window.addEventListener('mousemove', (event) => {
  cursor.x = (event.clientX / sizes.width - 0.5) * 2
  cursor.y = (event.clientY / sizes.height - 0.5) * 2
})

// Touch handling for mobile
window.addEventListener('touchmove', (event) => {
  if (event.touches.length > 0) {
    const touch = event.touches[0]
    cursor.x = (touch.clientX / sizes.width - 0.5) * 2
    cursor.y = (touch.clientY / sizes.height - 0.5) * 2
  }
})

let scrollY = 0
window.addEventListener('scroll', () => {
  scrollY = window.scrollY * 0.001
})

// ===== Responsive model scaling =====
function updateModelScale() {
  if (!model) return

  const baseScale = Math.max(asciiContainer.offsetWidth, 300) / referenceSize

  if (isMobile()) {
    // On mobile, make the model MUCH bigger (5x) and no scroll scaling
    const mobileScale = baseScale * 5
    model.scale.set(mobileScale, mobileScale, mobileScale)
    camera.position.z = 2.5
    console.log('Applied mobile model scale:', mobileScale)
  } else {
    // Desktop: normal scaling only (scroll handled in animate loop)
    model.scale.set(baseScale, baseScale, baseScale)
    camera.position.z = 4
    console.log('Applied desktop model scale:', baseScale)
  }
}

function resize() {
  console.log('Resize triggered')

  const wasMobile = sizes.width <= MOBILE_BREAKPOINT
  const isNowMobile = window.innerWidth <= MOBILE_BREAKPOINT

  sizes.width = asciiContainer.offsetWidth || window.innerWidth
  sizes.height = asciiContainer.offsetHeight || 400

  console.log('New sizes:', sizes)

  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update camera position based on current device type
  if (isNowMobile) {
    camera.position.z = 2.5
  } else {
    camera.position.z = 4
  }

  renderer.setSize(sizes.width, sizes.height)

  // Recreate ASCII effect if we switched between mobile/desktop
  if (wasMobile !== isNowMobile) {
    console.log('Mobile/desktop switch detected, recreating ASCII effect')
    createAsciiEffect()
  } else {
    if (effect) {
      effect.setSize(sizes.width, sizes.height)
    }
  }

  updateModelScale()
}

// Debounce resize to prevent too many calls
let resizeTimeout
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(resize, 100)
})

// Also handle orientation change
window.addEventListener('orientationchange', () => {
  setTimeout(resize, 100)
})

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

  // Animate placeholder while loading
  if (!modelLoaded && placeholderMesh) {
    placeholderRotation += 0.01
    placeholderMesh.rotation.y = placeholderRotation
    placeholderMesh.rotation.x = placeholderRotation * 0.5
  }

  if (model && modelLoaded) {
    const cursorXOffset = cursor.x * 0.3
    const cursorYOffset = cursor.y * 0.1

    // Keep only cursor + scroll control (no idle rotation)
    model.rotation.y = cursorXOffset
    model.rotation.x = cursorYOffset
    model.position.y = -0.1 // move it slightly down
    model.position.x = -0.1 // move it to the left

    // Smooth scroll animation (all devices)
    model.position.z += (scrollY - model.position.z) * 0.5
  }

  if (effect) {
    try {
      effect.render(scene, camera)
    } catch (error) {
      console.error('Render error:', error)
    }
  }
}

animate()

// Debug info for mobile
if (isMobile()) {
  console.log('Mobile device detected - debug info:')
  console.log('Screen dimensions:', screen.width, 'x', screen.height)
  console.log('Window dimensions:', window.innerWidth, 'x', window.innerHeight)
  console.log('Container dimensions:', asciiContainer.offsetWidth, 'x', asciiContainer.offsetHeight)
  console.log('Device pixel ratio:', window.devicePixelRatio)
}