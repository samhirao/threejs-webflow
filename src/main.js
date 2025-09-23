import * as THREE from 'three'
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import animateTitle from './features/animateTitle'
import './styles/style.css'

// force a small delay on mobile to ensure everything is ready
const initDelay = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 300 : 0

function initializeApp() {
  console.log('initializing app, mobile detected:', /iPhone|iPad/i.test(navigator.userAgent))

  // find ascii container with retry logic for mobile
  let asciiContainer = document.querySelector('.ascii-bg')
  let retryCount = 0

  function findContainer() {
    asciiContainer = document.querySelector('.ascii-bg')
    if (!asciiContainer && retryCount < 5) {
      retryCount++
      setTimeout(findContainer, 100)
      return
    }

    if (!asciiContainer) {
      console.error('ascii container not found after retries')
      return
    }

    startThreeJS()
  }

  function startThreeJS() {
    // canvas - mobile safari needs this even though we hide it
    const canvas = document.createElement('canvas')
    canvas.style.display = 'none'
    asciiContainer.appendChild(canvas)

    // scene
    const scene = new THREE.Scene()

    // sizes calc
    function calculateSizes() {
      // mobile safari viewport issues workaround
      const rect = asciiContainer.getBoundingClientRect()
      const width = Math.max(rect.width || asciiContainer.offsetWidth || window.innerWidth, 300)
      const height = Math.max(rect.height || asciiContainer.offsetHeight || 400, 400)

      return { width, height }
    }

    let sizes = calculateSizes()
    console.log('initial sizes:', sizes)

    // mobile check
    const isMobile = () => window.innerWidth <= 768

    // camera
    const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 1000)
    camera.position.z = isMobile() ? 2.5 : 4
    scene.add(camera)

    // lights - simplified for mobile performance
    const lights = [
      new THREE.DirectionalLight('white', 1),
      new THREE.DirectionalLight('white', 0.8),
      new THREE.DirectionalLight('white', 0.6)
    ]
    lights[0].position.set(1, 2, 0.5)
    lights[1].position.set(0, 3, 2)
    lights[2].position.set(1, 0, 1)
    scene.add(...lights)

    // placeholder while model loads
    const placeholderMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 12, 12), // lower poly for mobile
      new THREE.MeshBasicMaterial({
        color: 0x444444,
        wireframe: true,
        transparent: true,
        opacity: 0.4
      })
    )
    scene.add(placeholderMesh)

    // model loading
    let model = null
    let mixer = null
    let modelLoaded = false
    const referenceSize = 1440

    const loader = new GLTFLoader()
    console.log('loading model...')

    loader.load(
      'https://cdn.prod.website-files.com/68c6ab111eb5a797aedfa7bd/68c9b3f0ed751939a196b255_shield-orbit.glb.txt',
      (gltf) => {
        console.log('model loaded')
        model = gltf.scene
        modelLoaded = true
        scene.add(model)
        scene.remove(placeholderMesh)

        // animations
        if (gltf.animations?.length) {
          mixer = new THREE.AnimationMixer(model)
          gltf.animations.forEach(clip => {
            mixer.clipAction(clip).play()
          })
        }

        updateModelScale()
      },
      undefined,
      (error) => {
        console.error('model load failed:', error)
      }
    )

    // renderer - mobile optimized
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !isMobile(), // disable AA on mobile for performance  
      alpha: true,
      powerPreference: 'low-power' // battery friendly
    })

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile() ? 1.5 : 2))

    // ascii effect
    let effect = null
    let isReady = false

    function createAsciiEffect() {
      console.log('creating ascii effect')

      // cleanup old effect
      if (effect?.domElement?.parentNode) {
        effect.domElement.remove()
      }

      try {
        effect = new AsciiEffect(renderer, ' .:=*R$#@', { invert: false })
        effect.setSize(sizes.width, sizes.height)

        const element = effect.domElement
        element.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
          background: transparent;
          touch-action: none;
        `

        // mobile font optimization
        if (isMobile()) {
          element.style.fontFamily = 'Monaco, Consolas, monospace'
          element.style.fontSize = '7px'
          element.style.lineHeight = '7px'
          element.style.fontWeight = '400'
        }

        asciiContainer.appendChild(element)
        isReady = true

        // force render
        setTimeout(() => {
          if (effect && scene && camera) {
            effect.render(scene, camera)
          }
        }, 50)

      } catch (error) {
        console.error('ascii effect failed:', error)
        isReady = false
      }
    }

    createAsciiEffect()

    // model scaling
    function updateModelScale() {
      if (!model) return

      const baseScale = Math.max(sizes.width, 300) / referenceSize
      const finalScale = isMobile() ? baseScale * 4.5 : baseScale
      model.scale.setScalar(finalScale)
    }

    // input handling - optimized for mobile
    const cursor = { x: 0, y: 0 }
    let scrollY = 0
    let isInteracting = false

    function updateCursor(x, y) {
      cursor.x = (x / sizes.width - 0.5) * 2
      cursor.y = (y / sizes.height - 0.5) * 2
    }

    // mouse events
    window.addEventListener('mousemove', (e) => {
      if (!isInteracting) {
        updateCursor(e.clientX, e.clientY)
      }
    }, { passive: true })

    // touch events - better mobile handling
    window.addEventListener('touchstart', () => {
      isInteracting = true
    }, { passive: true })

    window.addEventListener('touchmove', (e) => {
      if (e.touches[0]) {
        updateCursor(e.touches[0].clientX, e.touches[0].clientY)
      }
    }, { passive: true })

    window.addEventListener('touchend', () => {
      setTimeout(() => {
        isInteracting = false
      }, 100)
    }, { passive: true })

    // scroll - simple camera zoom
    window.addEventListener('scroll', () => {
      scrollY = window.scrollY * 0.01
    }, { passive: true })

    // resize handling
    let resizeTimeout
    function resize() {
      const wasMobile = sizes.width <= 768
      sizes = calculateSizes()

      camera.aspect = sizes.width / sizes.height
      camera.updateProjectionMatrix()
      camera.position.z = isMobile() ? 2.5 : 4

      renderer.setSize(sizes.width, sizes.height)

      // recreate effect if mobile/desktop switch
      if (wasMobile !== isMobile()) {
        createAsciiEffect()
      } else if (effect) {
        effect.setSize(sizes.width, sizes.height)
      }

      updateModelScale()

      // force render
      if (effect && isReady) {
        effect.render(scene, camera)
      }
    }

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(resize, 200)
    })

    // mobile orientation handling
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        sizes = calculateSizes() // recalc after orientation settles
        resize()
      }, 500)
    })

    // animation loop
    const clock = new THREE.Clock()
    let placeholderRotation = 0
    let isAnimating = true

    function animate() {
      if (!isAnimating) return
      requestAnimationFrame(animate)

      const delta = clock.getDelta()

      // mixer update
      if (mixer) {
        mixer.update(delta)
      }

      // placeholder animation
      if (!modelLoaded && placeholderMesh) {
        placeholderRotation += 0.008 // slower for mobile
        placeholderMesh.rotation.y = placeholderRotation
        placeholderMesh.rotation.x = placeholderRotation * 0.3
      }

      // model interaction + scroll zoom
      if (model && modelLoaded) {
        model.rotation.y = cursor.x * 0.25
        model.rotation.x = cursor.y * 0.08
        model.position.set(-0.1, -0.1, 0) // keep model at origin

        // camera moves closer as you scroll down
        const baseZ = 4
        camera.position.z = baseZ - scrollY // subtract scrollY to move closer
      }

      // render
      if (effect && isReady) {
        effect.render(scene, camera)
      }
    }

    animate()

    // cleanup
    window.addEventListener('beforeunload', () => {
      isAnimating = false
      if (effect?.domElement) {
        effect.domElement.remove()
      }
    })

    console.log('threejs init complete')
  }

  findContainer()
}

// initialize with delay for mobile
setTimeout(() => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp)
  } else {
    initializeApp()
  }
}, initDelay)