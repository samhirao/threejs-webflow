import * as THREE from 'three'
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import animateTitle from './features/animateTitle'
import createBadge from './features/createBasge'
import './styles/style.css'

// Features
createBadge()
animateTitle()

// iOS Detection
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Debug logging for mobile
console.log('Script loaded, window width:', window.innerWidth)
console.log('User agent:', navigator.userAgent)
console.log('Is iOS:', isIOS())
console.log('WebGL support:', !!window.WebGLRenderingContext)

// Test WebGL context creation
function testWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) {
      console.error('WebGL not supported')
      return false
    }
    console.log('WebGL context created successfully')
    console.log('WebGL vendor:', gl.getParameter(gl.VENDOR))
    console.log('WebGL renderer:', gl.getParameter(gl.RENDERER))
    return true
  } catch (e) {
    console.error('WebGL test failed:', e)
    return false
  }
}

if (!testWebGL()) {
  console.error('WebGL test failed - falling back to error message')
  // You might want to show a fallback message here
}

// Canvas
const canvas = document.createElement('canvas')
canvas.classList.add('webgl')

// Attach to ASCII container div
let asciiContainer = document.querySelector('.ascii-bg')
if (!asciiContainer) {
  console.error('ASCII container .ascii-bg not found')
  // Create fallback container
  const fallback = document.createElement('div')
  fallback.className = 'ascii-bg'
  fallback.style.width = '100%'
  fallback.style.height = '400px'
  fallback.style.position = 'relative'
  fallback.style.overflow = 'hidden'
  document.body.appendChild(fallback)
  asciiContainer = fallback
}

console.log('ASCII container found:', asciiContainer)
asciiContainer.appendChild(canvas)

// Scene
const scene = new THREE.Scene()

// Sizes - iOS specific handling
const sizes = {
  width: asciiContainer.offsetWidth || window.innerWidth,
  height: asciiContainer.offsetHeight || 400,
}

// iOS Safari viewport fix
if (isIOS()) {
  // Force container dimensions on iOS
  sizes.width = Math.min(asciiContainer.offsetWidth || window.innerWidth, window.screen.width)
  sizes.height = Math.min(asciiContainer.offsetHeight || 400, window.screen.height * 0.4)
  console.log('iOS adjusted sizes:', sizes)
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
camera.position.z = 4
scene.add(camera)

// Lights - Reduced intensity for mobile performance
const lightIntensity = isMobile() ? 0.8 : 1
const mainlight = new THREE.DirectionalLight('white', lightIntensity)
mainlight.position.set(1, 2, 0.5)
const backlight = new THREE.DirectionalLight('white', lightIntensity * 0.5)
backlight.position.set(0, 5, 2)
const secondlight = new THREE.DirectionalLight('white', lightIntensity * 0.3)
secondlight.position.set(1, 0, 1)
scene.add(mainlight, backlight, secondlight)

// Model + Animation
const gltfLoader = new GLTFLoader()
let model = null
let mixer = null
let modelLoaded = false
const referenceSize = 1440 // design reference width for scaling

console.log('Loading GLB model...')

// Add timeout for model loading on slow connections
const modelLoadTimeout = setTimeout(() => {
  if (!modelLoaded) {
    console.warn('Model loading timeout - proceeding without model')
    // You could add a fallback geometry here
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 })
    model = new THREE.Mesh(geometry, material)
    modelLoaded = true
    scene.add(model)
    updateModelScale()
  }
}, 10000) // 10 second timeout

gltfLoader.load(
  'https://cdn.prod.website-files.com/68c6ab111eb5a797aedfa7bd/68c9b3f0ed751939a196b255_shield-orbit.glb.txt',
  (gltf) => {
    clearTimeout(modelLoadTimeout)
    console.log('GLB model loaded successfully')
    model = gltf.scene
    modelLoaded = true
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
  },
  (progress) => {
    console.log('Loading progress:', progress.loaded / progress.total * 100 + '%')
  },
  (error) => {
    clearTimeout(modelLoadTimeout)
    console.error('GLB loading error:', error)
    // Fallback geometry
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 })
    model = new THREE.Mesh(geometry, material)
    modelLoaded = true
    scene.add(model)
    updateModelScale()
  }
)

// Renderer with iOS-specific settings
const rendererConfig = {
  canvas: canvas,
  antialias: !isMobile(), // Disable antialiasing on mobile for performance
  alpha: true,
  powerPreference: isMobile() ? 'low-power' : 'high-performance',
  failIfMajorPerformanceCaveat: false, // Important for iOS compatibility
  preserveDrawingBuffer: true, // Helps with iOS rendering issues
}

console.log('Creating WebGL renderer with config:', rendererConfig)

let renderer
try {
  renderer = new THREE.WebGLRenderer(rendererConfig)
  console.log('WebGL renderer created successfully')
} catch (error) {
  console.error('WebGL renderer creation failed:', error)
  throw error
}

renderer.setSize(sizes.width, sizes.height)
// Limit pixel ratio on mobile to improve performance
const pixelRatio = isMobile() ? Math.min(window.devicePixelRatio, 2) : Math.min(window.devicePixelRatio, 2)
renderer.setPixelRatio(pixelRatio)

console.log('Renderer created, pixel ratio:', pixelRatio)

// ASCII Effect with responsive font size and iOS fixes
let effect = null

function createAsciiEffect() {
  console.log('Creating ASCII effect...')

  // Remove existing effect if it exists
  if (effect && effect.domElement) {
    try {
      asciiContainer.removeChild(effect.domElement)
    } catch (e) {
      console.warn('Could not remove existing effect element:', e)
    }
  }

  const characters = ` .:=*R$#@`

  try {
    effect = new AsciiEffect(renderer, characters, { invert: false })
    console.log('ASCII effect created')

    effect.setSize(sizes.width, sizes.height)

    // Ensure the ASCII element is properly added
    if (effect.domElement) {
      asciiContainer.appendChild(effect.domElement)
      console.log('ASCII element added to container')

      // Add mobile/desktop class for CSS targeting
      if (isMobile()) {
        effect.domElement.classList.add('ascii-mobile')
        effect.domElement.classList.remove('ascii-desktop')

        // Apply mobile font directly via JS as fallback
        const fontSize = isIOS() ? '6px' : '8px' // Smaller font for iOS
        effect.domElement.style.fontFamily = 'Monaco, "Lucida Console", "Courier New", monospace'
        effect.domElement.style.fontSize = fontSize
        effect.domElement.style.lineHeight = fontSize
        effect.domElement.style.fontWeight = 'normal'
        effect.domElement.style.letterSpacing = '0px'
        effect.domElement.style.textRendering = 'optimizeSpeed'
        effect.domElement.style.webkitFontSmoothing = 'none'
        effect.domElement.style.webkitTextStroke = 'initial'

        console.log('Applied mobile styles to ASCII effect')
      } else {
        effect.domElement.classList.add('ascii-desktop')
        effect.domElement.classList.remove('ascii-mobile')
      }

      // Force visibility and positioning
      effect.domElement.style.visibility = 'visible'
      effect.domElement.style.display = 'block'
      effect.domElement.style.position = 'absolute'
      effect.domElement.style.top = '0'
      effect.domElement.style.left = '0'
      effect.domElement.style.width = '100%'
      effect.domElement.style.height = '100%'
      effect.domElement.style.zIndex = '1'

      // iOS specific fixes
      if (isIOS()) {
        effect.domElement.style.webkitUserSelect = 'none'
        effect.domElement.style.webkitTouchCallout = 'none'
        effect.domElement.style.webkitTapHighlightColor = 'transparent'
        effect.domElement.style.touchAction = 'manipulation'
      }

      // Start rendering immediately
      startRendering()
    } else {
      console.error('ASCII effect domElement is null')
    }

  } catch (error) {
    console.error('ASCII effect creation failed:', error)
    // Show error message to user
    const errorDiv = document.createElement('div')
    errorDiv.textContent = 'WebGL not supported on this device'
    errorDiv.style.cssText = 'color: white; text-align: center; padding: 20px; font-family: monospace;'
    asciiContainer.appendChild(errorDiv)
  }
}

// Separate rendering function
function startRendering() {
  console.log('Starting ASCII rendering...')

  // Render an initial frame to show ASCII immediately
  if (effect) {
    try {
      effect.render(scene, camera)
      console.log('Initial ASCII render successful')
    } catch (error) {
      console.error('Initial ASCII render failed:', error)
    }
  }
}

// Initialize ASCII effect after a small delay to ensure DOM is ready
setTimeout(() => {
  createAsciiEffect()
}, 100)

// Hide original canvas
canvas.style.display = 'none'

// Cursor & Scroll with iOS touch handling
const cursor = { x: 0, y: 0 }

// Mouse events
window.addEventListener('mousemove', (event) => {
  cursor.x = (event.clientX / sizes.width - 0.5) * 2
  cursor.y = (event.clientY / sizes.height - 0.5) * 2
})

// Touch handling for mobile with iOS fixes
let lastTouch = { x: 0, y: 0 }

window.addEventListener('touchstart', (event) => {
  if (event.touches.length > 0) {
    const touch = event.touches[0]
    lastTouch.x = touch.clientX
    lastTouch.y = touch.clientY
  }
}, { passive: true })

window.addEventListener('touchmove', (event) => {
  if (event.touches.length > 0) {
    const touch = event.touches[0]
    cursor.x = (touch.clientX / sizes.width - 0.5) * 2
    cursor.y = (touch.clientY / sizes.height - 0.5) * 2
    lastTouch.x = touch.clientX
    lastTouch.y = touch.clientY
  }
}, { passive: true })

let scrollY = 0
window.addEventListener('scroll', () => {
  scrollY = window.scrollY * 0.003
}, { passive: true })

// ===== Responsive model scaling =====
function updateModelScale() {
  if (!model) return

  const baseScale = Math.max(asciiContainer.offsetWidth, 300) / referenceSize

  if (isMobile()) {
    // On mobile, make the model bigger to compensate for smaller screen
    const mobileScale = baseScale * (isIOS() ? 2.5 : 3) // Slightly smaller on iOS
    model.scale.set(mobileScale, mobileScale, mobileScale)
    console.log('Applied mobile model scale:', mobileScale)
  } else {
    // Desktop: normal scaling
    model.scale.set(baseScale, baseScale, baseScale)
    console.log('Applied desktop model scale:', baseScale)
  }
}

function resize() {
  console.log('Resize triggered')

  const wasMobile = sizes.width <= MOBILE_BREAKPOINT
  const isNowMobile = window.innerWidth <= MOBILE_BREAKPOINT

  sizes.width = asciiContainer.offsetWidth || window.innerWidth
  sizes.height = asciiContainer.offsetHeight || 400

  // iOS specific size adjustments
  if (isIOS()) {
    sizes.width = Math.min(sizes.width, window.screen.width)
    sizes.height = Math.min(sizes.height, window.screen.height * 0.4)
  }

  console.log('New sizes:', sizes)

  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  if (renderer) {
    renderer.setSize(sizes.width, sizes.height)
  }

  // Recreate ASCII effect if we switched between mobile/desktop
  if (wasMobile !== isNowMobile) {
    console.log('Mobile/desktop switch detected, recreating ASCII effect')
    setTimeout(() => createAsciiEffect(), 100)
  } else {
    if (effect) {
      try {
        effect.setSize(sizes.width, sizes.height)
      } catch (error) {
        console.error('Error resizing ASCII effect:', error)
      }
    }
  }

  updateModelScale()
}

// Debounce resize to prevent too many calls
let resizeTimeout
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(resize, 150) // Slightly longer delay for mobile
})

// Handle orientation change with iOS-specific delay
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    console.log('Orientation change detected')
    resize()
  }, 200) // Longer delay for iOS
})

// Initial resize
setTimeout(() => resize(), 200)

// Animate with performance monitoring
const clock = new THREE.Clock()
let frameCount = 0
let lastPerformanceLog = Date.now()

function animate() {
  requestAnimationFrame(animate)

  frameCount++

  // Log performance every 5 seconds on mobile
  if (isMobile() && Date.now() - lastPerformanceLog > 5000) {
    const fps = frameCount / 5
    console.log('Average FPS:', fps.toFixed(1))
    frameCount = 0
    lastPerformanceLog = Date.now()
  }

  const delta = clock.getDelta()

  // Update mixer (for GLB animations) with reduced frequency on mobile
  if (mixer) {
    if (!isMobile() || frameCount % 2 === 0) { // Reduce animation updates on mobile
      mixer.update(delta)
    }
  }

  if (model && modelLoaded) {
    const cursorXOffset = cursor.x * 0.3
    const cursorYOffset = cursor.y * 0.1

    // Keep only cursor + scroll control (no idle rotation)
    model.rotation.y = cursorXOffset
    model.rotation.x = cursorYOffset
    model.position.y = -0.1 // move it slightly down
    model.position.x = -0.1 // move it to the left
    model.position.z += (scrollY - model.position.z) * 0.5
  }

  if (effect) {
    try {
      effect.render(scene, camera)
    } catch (error) {
      console.error('Render error:', error)
      // Try to recreate the effect if rendering fails
      if (frameCount % 60 === 0) { // Only retry once per second
        console.log('Attempting to recreate ASCII effect after render error')
        createAsciiEffect()
      }
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

  if (isIOS()) {
    console.log('iOS specific info:')
    console.log('Safari version:', navigator.userAgent.match(/Version\/([0-9\._]+)/)?.[1] || 'unknown')
    console.log('Standalone mode:', window.navigator.standalone)
  }
}

// Add error handler for unhandled WebGL errors
window.addEventListener('error', (event) => {
  if (event.message.includes('WebGL') || event.message.includes('CONTEXT_LOST')) {
    console.error('WebGL context error detected:', event.message)
    // You might want to show a user-friendly error message here
  }
})

// Handle WebGL context lost/restored
canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault()
  console.warn('WebGL context lost')
}, false)

canvas.addEventListener('webglcontextrestored', () => {
  console.log('WebGL context restored - reinitializing')
  // Reinitialize everything
  setTimeout(() => {
    createAsciiEffect()
  }, 100)
}, false)