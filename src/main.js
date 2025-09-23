import * as THREE from 'three'
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import animateTitle from './features/animateTitle'
import './styles/style.css'

// debug logging for mobile
console.log('Script loaded, window width:', window.innerWidth)
console.log('User agent:', navigator.userAgent)

// wait for DOM to be fully loaded
function initializeApp() {
  console.log('Initializing app...')

  // canvas
  const canvas = document.createElement('canvas')
  canvas.classList.add('webgl')

  // attach to ASCII container div with better error handling
  let asciiContainer = document.querySelector('.ascii-bg')
  if (!asciiContainer) {
    console.error('ASCII container .ascii-bg not found, creating fallback')
    const fallback = document.createElement('div')
    fallback.className = 'ascii-bg'
    fallback.style.cssText = `
      width: 100%;
      height: 400px;
      position: relative;
      overflow: hidden;
    `
    document.body.appendChild(fallback)
    asciiContainer = fallback
  }

  console.log('ASCII container found:', asciiContainer)

  // ensure container has proper styling
  if (!asciiContainer.style.position) {
    asciiContainer.style.position = 'relative'
  }

  asciiContainer.appendChild(canvas)

  // scene
  const scene = new THREE.Scene()

  // sizes with more robust calculation
  function calculateSizes() {
    const containerRect = asciiContainer.getBoundingClientRect()
    return {
      width: Math.max(containerRect.width, asciiContainer.offsetWidth, 300),
      height: Math.max(containerRect.height, asciiContainer.offsetHeight, 400),
    }
  }

  let sizes = calculateSizes()
  console.log('Initial sizes:', sizes)

  // mobile breakpoint
  const MOBILE_BREAKPOINT = 768

  // check if mobile
  function isMobile() {
    const mobile = window.innerWidth <= MOBILE_BREAKPOINT
    console.log('Is mobile:', mobile, 'Width:', window.innerWidth)
    return mobile
  }

  // camera
  const camera = new THREE.PerspectiveCamera(
    25,
    sizes.width / sizes.height,
    0.1,
    1000
  )

  // set cam position based on device
  if (isMobile()) {
    camera.position.z = 2.5
  } else {
    camera.position.z = 4
  }

  scene.add(camera)

  // lights
  const mainlight = new THREE.DirectionalLight('white', 1)
  mainlight.position.set(1, 2, 0.5)
  const backlight = new THREE.DirectionalLight('white', 1)
  backlight.position.set(0, 5, 2)
  const secondlight = new THREE.DirectionalLight('white', 1)
  secondlight.position.set(1, 0, 1)
  scene.add(mainlight, backlight, secondlight)

  // model + anim
  const gltfLoader = new GLTFLoader()
  let model = null
  let mixer = null
  let modelLoaded = false
  const referenceSize = 1440

  // add a placeholder/loading geometry to show ASCII immediately
  const placeholderGeometry = new THREE.SphereGeometry(0.5, 16, 16)
  const placeholderMaterial = new THREE.MeshBasicMaterial({
    color: 0x333333,
    wireframe: true,
    transparent: true,
    opacity: 0.3
  })
  const placeholderMesh = new THREE.Mesh(placeholderGeometry, placeholderMaterial)
  scene.add(placeholderMesh)

  console.log('Loading GLB model...')

  gltfLoader.load(
    'https://cdn.prod.website-files.com/68c6ab111eb5a797aedfa7bd/68c9b3f0ed751939a196b255_shield-orbit.glb.txt',
    (gltf) => {
      console.log('GLB model loaded successfully')
      model = gltf.scene
      modelLoaded = true
      scene.add(model)

      // remove placeholder when model loads
      scene.remove(placeholderMesh)

      // play glb animations
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model)
        gltf.animations.forEach((clip) => {
          const action = mixer.clipAction(clip)
          action.play()
          console.log('Playing animation:', clip.name)
        })
      }

      // initial scale
      updateModelScale()
    },
    (progress) => {
      console.log('Loading progress:', progress.loaded / progress.total * 100 + '%')
    },
    (error) => {
      console.error('GLB loading error:', error)
      // keep placeholder if model fails to load
    }
  )

  // renderer with better settings
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true, // some rendering issues
  })

  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0) // Transparent background

  console.log('Renderer created, pixel ratio:', window.devicePixelRatio)

  // ascii Effect with more robust initialization
  let effect = null
  let isEffectReady = false

  function createAsciiEffect() {
    console.log('Creating ASCII effect...')

    // remove existing effect if it exists
    if (effect && effect.domElement && effect.domElement.parentNode) {
      effect.domElement.parentNode.removeChild(effect.domElement)
    }

    const characters = ` .:=*R$#@`

    try {
      effect = new AsciiEffect(renderer, characters, { invert: false })
      console.log('ASCII effect created')

      effect.setSize(sizes.width, sizes.height)

      // style the ascii effect element
      const asciiElement = effect.domElement
      asciiElement.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        border: none;
        outline: none;
        background: transparent;
        pointer-events: none;
        z-index: 1;
        display: block;
        visibility: visible;
      `

      // add mobile/desktop specific styles
      if (isMobile()) {
        asciiElement.classList.add('ascii-mobile')
        asciiElement.classList.remove('ascii-desktop')
        asciiElement.style.fontFamily = 'Monaco, "Lucida Console", "Courier New", monospace'
        asciiElement.style.fontSize = '8px'
        asciiElement.style.lineHeight = '8px'
        asciiElement.style.fontWeight = 'normal'
        asciiElement.style.letterSpacing = '0px'
        console.log('Applied mobile styles to ASCII effect')
      } else {
        asciiElement.classList.add('ascii-desktop')
        asciiElement.classList.remove('ascii-mobile')
      }

      asciiContainer.appendChild(asciiElement)
      isEffectReady = true

      console.log('ASCII effect added to container')

      // force an initial render
      requestAnimationFrame(() => {
        if (effect && scene && camera) {
          effect.render(scene, camera)
          console.log('Initial ASCII render completed')
        }
      })

    } catch (error) {
      console.error('ASCII effect creation failed:', error)
      isEffectReady = false
    }
  }

  // initialize ascii
  createAsciiEffect()

  // hide original canvas
  canvas.style.display = 'none'

  // animate placeholder while loading
  let placeholderRotation = 0

  // cursor & scroll with more better event handling
  const cursor = { x: 0, y: 0 }

  function updateCursor(clientX, clientY) {
    cursor.x = (clientX / sizes.width - 0.5) * 2
    cursor.y = (clientY / sizes.height - 0.5) * 2
  }

  window.addEventListener('mousemove', (event) => {
    updateCursor(event.clientX, event.clientY)
  }, { passive: true })

  // touch handling for mobile with better touch support
  window.addEventListener('touchmove', (event) => {
    if (event.touches.length > 0) {
      const touch = event.touches[0]
      updateCursor(touch.clientX, touch.clientY)
    }
  }, { passive: true })

  let scrollY = 0
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY * 0.001
  }, { passive: true })

  // ===== responsive model scaling =====
  function updateModelScale() {
    if (!model) return

    const baseScale = Math.max(sizes.width, 300) / referenceSize

    if (isMobile()) {
      const mobileScale = baseScale * 5
      model.scale.set(mobileScale, mobileScale, mobileScale)
      camera.position.z = 2.5
      console.log('Applied mobile model scale:', mobileScale)
    } else {
      model.scale.set(baseScale, baseScale, baseScale)
      camera.position.z = 4
      console.log('Applied desktop model scale:', baseScale)
    }
  }

  function resize() {
    console.log('Resize triggered')

    const wasMobile = sizes.width <= MOBILE_BREAKPOINT
    const isNowMobile = window.innerWidth <= MOBILE_BREAKPOINT

    // recalc sizes better
    sizes = calculateSizes()
    console.log('New sizes:', sizes)

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // update camera position based on current device type
    if (isNowMobile) {
      camera.position.z = 2.5
    } else {
      camera.position.z = 4
    }

    renderer.setSize(sizes.width, sizes.height)

    // recreate ascii  effect if we switched between mobile/desktop
    if (wasMobile !== isNowMobile) {
      console.log('Mobile/desktop switch detected, recreating ASCII effect')
      isEffectReady = false
      createAsciiEffect()
    } else {
      if (effect) {
        effect.setSize(sizes.width, sizes.height)
      }
    }

    updateModelScale()

    // force a render after resize
    if (effect && isEffectReady) {
      requestAnimationFrame(() => {
        effect.render(scene, camera)
      })
    }
  }

  // debounce resize to prevent too many calls
  let resizeTimeout
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(resize, 150) // slightly longer debounce
  })

  // handle orientation change with delay for mobile
  window.addEventListener('orientationchange', () => {
    setTimeout(resize, 300) // Longer delay for orientation change
  })

  // initial resize to ensure everything is set up correctly
  setTimeout(resize, 100)

  // animate with more error handling
  const clock = new THREE.Clock()
  let animationId = null

  function animate() {
    animationId = requestAnimationFrame(animate)

    try {
      const delta = clock.getDelta()

      // update mixer (for GLB anim)
      if (mixer) {
        mixer.update(delta)
      }

      // animate placeholder while loading
      if (!modelLoaded && placeholderMesh) {
        placeholderRotation += 0.01
        placeholderMesh.rotation.y = placeholderRotation
        placeholderMesh.rotation.x = placeholderRotation * 0.5
      }

      if (model && modelLoaded) {
        const cursorXOffset = cursor.x * 0.3
        const cursorYOffset = cursor.y * 0.1

        model.rotation.y = cursorXOffset
        model.rotation.x = cursorYOffset
        model.position.y = -0.1
        model.position.x = -0.1

        // smooth scroll anim
        model.position.z += (scrollY - model.position.z) * 0.5
      }

      // render with error handling
      if (effect && isEffectReady) {
        effect.render(scene, camera)
      }

    } catch (error) {
      console.error('Animation loop error:', error)
      // don't break the anim loop on error
    }
  }

  // start anim
  animate()

  // debug info for mobile
  if (isMobile()) {
    console.log('Mobile device detected - debug info:')
    console.log('Screen dimensions:', screen.width, 'x', screen.height)
    console.log('Window dimensions:', window.innerWidth, 'x', window.innerHeight)
    console.log('Container dimensions:', sizes.width, 'x', sizes.height)
    console.log('Device pixel ratio:', window.devicePixelRatio)
  }

  // cleanup function for page unload
  window.addEventListener('beforeunload', () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    if (effect && effect.domElement && effect.domElement.parentNode) {
      effect.domElement.parentNode.removeChild(effect.domElement)
    }
  })

  console.log('App initialization completed')
}

// initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp)
} else {
  // DOM is already loaded
  initializeApp()
}