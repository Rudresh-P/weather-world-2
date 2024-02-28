import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'
import earthVertexShader from './shaders/earth/vertex.glsl'
import earthFragmentShader from './shaders/earth/fragment.glsl'
import atmosphereVertexShader from './shaders/atmosphere/vertex.glsl'
import atmosphereFragmentShader from './shaders/atmosphere/fragment.glsl'

/**
 * Base
 */
// Debug
const gui = new GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loading Manager

const loadingManager = new THREE.LoadingManager(
    () => {
        console.log("Succesfully Loaded");
    },
    (itemsUrl, itemsLoaded, itemsTotal) => {
        const progressRatio = itemsLoaded / itemsTotal
    }
)

// Loaders
const textureLoader = new THREE.TextureLoader()

/**
 * Earth
*/
// color debug for atmosphere
const earthParameters = {}
earthParameters.atmosphericDayColor = "#00aaff"
earthParameters.atmosphericTwilightColor = "#9e3ac5"

gui
    .addColor(earthParameters, "atmosphericDayColor")
    .onChange(() => {
        earthMaterial.uniforms.uAtmosphericDayColor.value.set(earthParameters.atmosphericDayColor)
        atmosphereMaterial.uniforms.uAtmosphericDayColor.value.set(earthParameters.atmosphericDayColor)
    })

gui
    .addColor(earthParameters, "atmosphericTwilightColor")
    .onChange(() => {
        earthMaterial.uniforms.uAtmosphericTwilightColor.value.set(earthParameters.atmosphericTwilightColor)
        atmosphereMaterial.uniforms.uAtmosphericTwilightColor.value.set(earthParameters.atmosphericTwilightColor)
    })

// Textures
const anisotropyLevel = 16
const earthDayTexture = textureLoader.load("./earth/day.jpg")
earthDayTexture.colorSpace = THREE.SRGBColorSpace
earthDayTexture.anisotropy = anisotropyLevel



const earthNightTexture = textureLoader.load("./earth/night.jpg")
earthNightTexture.colorSpace = THREE.SRGBColorSpace
earthNightTexture.anisotropy = anisotropyLevel

const earthSpecularCloudsTexture = textureLoader.load("./earth/specularClouds.jpg")
earthSpecularCloudsTexture.anisotropy = anisotropyLevel
// Mesh
const earthGeometry = new THREE.SphereGeometry(2, 64, 64)
const earthMaterial = new THREE.ShaderMaterial({
    vertexShader: earthVertexShader,
    fragmentShader: earthFragmentShader,
    uniforms: {
        uDayTexture: new THREE.Uniform(earthDayTexture),
        uNightTexture: new THREE.Uniform(earthNightTexture),
        uSpecularCloudTexture: new THREE.Uniform(earthSpecularCloudsTexture),
        uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
        uAtmosphericDayColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphericDayColor)),
        uAtmosphericTwilightColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphericTwilightColor))
    }
})
const earth = new THREE.Mesh(earthGeometry, earthMaterial)
scene.add(earth)

// Earth Atmosphere

const atmosphereMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    uniforms: {
        uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
        uAtmosphericDayColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphericDayColor)),
        uAtmosphericTwilightColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphericTwilightColor))
    },

})

const atmosphere = new THREE.Mesh(earthGeometry, atmosphereMaterial)
atmosphere.scale.set(1.04, 1.04, 1.04)

scene.add(atmosphere)

/*
Sun
*/
const sunSherical = new THREE.Spherical(1, Math.PI * 0.5, 0.5)
const sunDirection = new THREE.Vector3()


//Debug Mesh
const debugSun = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.1, 2),
    new THREE.MeshBasicMaterial({ color: "red" })
)

scene.add(debugSun)

const updateSun = () => {

    // copy sun direction
    sunDirection.setFromSpherical(sunSherical)

    // Update Uniforms
    earthMaterial.uniforms.uSunDirection.value.copy(sunDirection)
    atmosphereMaterial.uniforms.uSunDirection.value.copy(sunDirection)

    //Debug
    debugSun.position.copy(sunDirection).multiplyScalar(5)
}
updateSun()

// tweaks

gui.add(sunSherical, "phi",).min(0).max(Math.PI).onChange(updateSun)
gui.add(sunSherical, "theta",).min(- Math.PI).max(Math.PI).onChange(updateSun)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 12
camera.position.y = 5
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)
renderer.setClearColor('#000011')


/**
 * 
 * Add new Raycater functionality and get latitude and longitude on click 
*/

// Pointer
const pointer = new THREE.Vector2();
window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
})



// Raycast
const raycaster = new THREE.Raycaster()

const earthClicked = () => {

    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObject(earth)
    if (intersects.length) {
        const { x, y, z } = (intersects[0].point.normalize())

        const latLong = xyzToLatLon([x, y, z])
        markerMesh.position.copy(intersects[0].point).multiplyScalar(2.05)

        const dist = camera.position.distanceTo(earth.position)
        camera.position.copy(markerMesh.position).multiplyScalar(dist / 2.05)



    }
}

window.addEventListener("pointerdown", () => {
    const down = clock.getElapsedTime()

    window.addEventListener("pointerup", () => {
        const up = clock.getElapsedTime()
        if (up - down < 0.2) {
            earthClicked()
        }
    })
})

// Convert
function xyzToLatLon(normalizedPosition) {

    const lat = 90 - Math.acos(normalizedPosition[1]) / Math.PI * 180
    const lon = -Math.atan2(normalizedPosition[2], normalizedPosition[0]) / Math.PI * 180

    return { lat, lon }
}

function calcPosFromLatLong(coords) {

    let phi = (90 - coords.lat) * (Math.PI / 180)
    let theta = (coords.lon + 180) * (Math.PI / 180)

    let x = -(Math.sin(phi) * Math.cos(theta))
    let z = (Math.sin(phi) * Math.sin(theta))
    let y = (Math.cos(phi))
    return new THREE.Vector3(x, y, z)

}


const markerPos = calcPosFromLatLong({ "lat": 14.098084306193016, "lon": -9.193757667977248 }).multiplyScalar(2.01)
console.log(markerPos);
const markerMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.1),
    new THREE.MeshBasicMaterial({ color: "cyan" })
)
scene.add(markerMesh)
markerMesh.position.copy(markerPos)
// markerMesh.scale.set(10,10,10)

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    // console.log(elapsedTime);

    // earth.rotation.y = elapsedTime * 0.05

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()