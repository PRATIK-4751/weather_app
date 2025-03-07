import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87CEEB, 0.2);
camera.position.set(0, 20, 50);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

function createStarField() {
    const stars = [];
    for (let i = 0; i < 500; i++) {
        const geometry = new THREE.SphereGeometry(Math.random() * 0.5, 24, 24);
        const material = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color(`hsl(${Math.random() * 360}, 100%, ${Math.random() * 50 + 50}%)`)
        });
        const star = new THREE.Mesh(geometry, material);
        const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(200));
        star.position.set(x, y, z);
        star.originalZ = z;
        scene.add(star);
        stars.push(star);
    }
    return stars;
}

function createCloudField() {
    const clouds = [];
    for (let i = 0; i < 30; i++) {
        const geometry = new THREE.DodecahedronGeometry(Math.random() * 15 + 10, 0);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            shininess: 10
        });
        const cloud = new THREE.Mesh(geometry, material);
        const [x, y, z] = [
            THREE.MathUtils.randFloatSpread(150),
            THREE.MathUtils.randFloat(20, 80),
            THREE.MathUtils.randFloatSpread(150)
        ];
        cloud.position.set(x, y, z);
        cloud.originalX = x;
        scene.add(cloud);
        clouds.push(cloud);
    }
    return clouds;
}

const stars = createStarField();
const clouds = createCloudField();

const nebulaGeometry = new THREE.SphereGeometry(150, 32, 32);
const nebulaMaterial = new THREE.MeshBasicMaterial({
    color: 0x330066,
    transparent: true,
    opacity: 0.1,
    side: THREE.BackSide
});
const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
scene.add(nebula);

const pointLight = new THREE.PointLight(0xffffff, 1.5);
pointLight.position.set(50, 50, 50);
const ambientLight = new THREE.AmbientLight(0x87CEEB, 0.7);
scene.add(pointLight, ambientLight);

let isDarkMode = false;
let isAutoMode = true;

const modeToggle = document.getElementById('mode-toggle');
const autoToggle = document.getElementById('auto-toggle');

function updateMode(dark) {
    isDarkMode = dark;
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(dark ? 'dark' : 'light');
    if (dark) {
        modeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        stars.forEach(star => star.visible = true);
        clouds.forEach(cloud => cloud.visible = false);
        nebula.visible = true;
        renderer.setClearColor(0x000000, 0);
    } else {
        modeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        stars.forEach(star => star.visible = false);
        clouds.forEach(cloud => cloud.visible = true);
        nebula.visible = false;
        renderer.setClearColor(0x87CEEB, 0.2);
    }
}

function checkTime() {
    if (isAutoMode) {
        const hour = new Date().getHours();
        updateMode(hour >= 18 || hour < 6);
    }
}

modeToggle.addEventListener('click', () => {
    if (!isAutoMode) {
        updateMode(!isDarkMode);
    }
});

autoToggle.addEventListener('click', () => {
    isAutoMode = !isAutoMode;
    autoToggle.classList.toggle('active');
    if (isAutoMode) {
        checkTime();
    }
});

setInterval(checkTime, 60000);
checkTime();

const apiKey = 'bc2dedb4c08e081067b79b462e3b0c2e';

async function fetchWeather(location) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${apiKey}`
        );
        if (!response.ok) throw new Error('Location not found');
        const data = await response.json();
        updateCurrentWeather(data);
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${location}&units=metric&appid=${apiKey}`
        );
        const forecastData = await forecastResponse.json();
        updateForecast(forecastData);
    } catch (error) {
        alert(error.message);
    }
}

function getWeatherIcon(code) {
    const iconMap = {
        '01d': 'fa-sun',
        '01n': 'fa-moon',
        '02d': 'fa-cloud-sun',
        '02n': 'fa-cloud-moon',
        '03d': 'fa-cloud',
        '03n': 'fa-cloud',
        '04d': 'fa-cloud',
        '04n': 'fa-cloud',
        '09d': 'fa-cloud-showers-heavy',
        '09n': 'fa-cloud-showers-heavy',
        '10d': 'fa-cloud-sun-rain',
        '10n': 'fa-cloud-moon-rain',
        '11d': 'fa-bolt',
        '11n': 'fa-bolt',
        '13d': 'fa-snowflake',
        '13n': 'fa-snowflake',
        '50d': 'fa-smog',
        '50n': 'fa-smog'
    };
    return iconMap[code] || 'fa-question';
}

function updateCurrentWeather(data) {
    const date = new Date();
    document.getElementById('day').textContent = date.toLocaleDateString('en-US', { weekday: 'long' });
    document.getElementById('date-location').textContent = `${date.toLocaleDateString()} ${data.name}, ${data.sys.country}`;
    document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById('condition').textContent = data.weather[0].description;
    const weatherIcon = document.getElementById('current-weather-icon');
    weatherIcon.className = 'fas ' + getWeatherIcon(data.weather[0].icon);
}

function updateForecast(data) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = '';
    const dailyForecast = {};
    data.list.forEach(entry => {
        const date = new Date(entry.dt_txt).toLocaleDateString();
        if (!dailyForecast[date]) {
            dailyForecast[date] = entry;
        }
    });
    Object.values(dailyForecast).slice(1, 6).forEach(forecast => {
        const date = new Date(forecast.dt_txt);
        const div = document.createElement('div');
        div.className = 'forecast-day';
        div.innerHTML = `
            <p>${date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
            <i class="fas ${getWeatherIcon(forecast.weather[0].icon)}"></i>
            <p>${Math.round(forecast.main.temp)}°C</p>
        `;
        forecastContainer.appendChild(div);
    });
}

document.getElementById('search-btn').addEventListener('click', () => {
    const location = document.getElementById('search-input').value.trim();
    if (location) fetchWeather(location);
});

document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const location = e.target.value.trim();
        if (location) fetchWeather(location);
    }
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    if (isDarkMode) {
        stars.forEach(star => {
            star.position.z += 0.1;
            if (star.position.z > 100) star.position.z = star.originalZ - 200;
        });
    } else {
        clouds.forEach(cloud => {
            cloud.position.x += 0.1;
            cloud.rotation.y += 0.02;
            cloud.rotation.z += 0.01;
            if (cloud.position.x > 75) cloud.position.x = cloud.originalX - 150;
        });
    }
    renderer.render(scene, camera);
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onResize);
animate();
fetchWeather('sikkim');