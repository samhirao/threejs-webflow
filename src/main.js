import * as THREE from 'three'
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import animateTitle from './features/animateTitle'
import './styles/style.css'

// canvas
const canvas = document.createElement('canvas')
canvas.classList.add('webgl')

// attach to ascii container div
const asciiContainer = document.querySelector('.ascii-bg')
if (!asciiContainer) {
  console.error('ASCII container .ascii-bg not found')
  const fallback = document.createElement('div')
  fallback.className = 'ascii-bg'
  fallback.style.width = '100%'
  fallback.style.height = '400px'
  document.body.appendChild(fallback)
  asciiContainer = fallback
}

asciiContainer.appendChild(canvas)

// scene
const scene = new THREE.Scene()

// sizes
const sizes = {
  width: asciiContainer.offsetWidth || window.innerWidth,
  height: asciiContainer.offsetHeight || 400,
}

// camera
const camera = new THREE.PerspectiveCamera(
  25,
  sizes.width / sizes.height,
  0.1,
  1000
)
camera.position.z = 4
scene.add(camera)

// lights
const mainlight = new THREE.DirectionalLight('white', 1)
mainlight.position.set(1, 2, 0.5)
const backlight = new THREE.DirectionalLight('white', 1)
backlight.position.set(0, 5, 2)
const secondlight = new THREE.DirectionalLight('white', 1)
secondlight.position.set(1, 0, 1)
scene.add(mainlight, backlight, secondlight)

// model + animation
const gltfLoader = new GLTFLoader()
let model = null
let mixer = null
let modelLoaded = false

gltfLoader.load(
  'https://cdn.prod.website-files.com/68c6ab111eb5a797aedfa7bd/68c9b3f0ed751939a196b255_shield-orbit.glb.txt',
  (gltf) => {
    model = gltf.scene
    modelLoaded = true
    scene.add(model)

    // remove placeholder when model loads
    scene.remove(placeholderMesh)

    // handle animations
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model)
      gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip)
        action.play()
      })
    }

    // scale model based on container size
    const scale = Math.max(asciiContainer.offsetWidth, 300) / 1440
    model.scale.set(scale, scale, scale)
  },
  undefined,
  (error) => {
    console.error('GLB loading error:', error)
  }
)

// renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// ascii effect
const characters = ` .:=*R$#@`
const effect = new AsciiEffect(renderer, characters, { invert: false })
effect.setSize(sizes.width, sizes.height)
asciiContainer.appendChild(effect.domElement)

// hide original canvas
canvas.style.display = 'none'

// placeholder geometry while loading
const placeholderGeometry = new THREE.SphereGeometry(0.5, 16, 16)
const placeholderMaterial = new THREE.MeshBasicMaterial({
  color: 0x333333,
  wireframe: true,
  transparent: true,
  opacity: 0.3
})
const placeholderMesh = new THREE.Mesh(placeholderGeometry, placeholderMaterial)
scene.add(placeholderMesh)

// mouse interaction
const cursor = { x: 0, y: 0 }
window.addEventListener('mousemove', (event) => {
  cursor.x = (event.clientX / sizes.width - 0.5) * 2
  cursor.y = (event.clientY / sizes.height - 0.5) * 2
})

// scroll interaction
let scrollY = 0
window.addEventListener('scroll', () => {
  scrollY = window.scrollY * 0.001
})

// resize handling
function resize() {
  sizes.width = asciiContainer.offsetWidth || window.innerWidth
  sizes.height = asciiContainer.offsetHeight || 400

  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  renderer.setSize(sizes.width, sizes.height)
  effect.setSize(sizes.width, sizes.height)

  // update model scale
  if (model) {
    const scale = Math.max(asciiContainer.offsetWidth, 300) / 1440
    model.scale.set(scale, scale, scale)
  }
}

window.addEventListener('resize', resize)

// animation loop
const clock = new THREE.Clock()
function animate() {
  requestAnimationFrame(animate)
  const delta = clock.getDelta()

  // update animations
  if (mixer) {
    mixer.update(delta)
  }

  // animate placeholder while loading
  if (!modelLoaded && placeholderMesh) {
    placeholderMesh.rotation.y += 0.01
    placeholderMesh.rotation.x += 0.005
  }

  // animate model
  if (model && modelLoaded) {
    model.rotation.y = cursor.x * 0.3
    model.rotation.x = cursor.y * 0.1
    model.position.y = -0.1
    model.position.x = -0.1
    model.position.z += (scrollY - model.position.z) * 0.5
  }

  effect.render(scene, camera)
}

animate()