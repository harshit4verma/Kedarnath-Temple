/**
 * Kedarnath 360 AR/VR - Main Application Orchestrator
 * Bootstraps Three.js WebGL/WebXR, loads temple & environment,
 * connects HUD buttons, hotkeys, and render loop.
 */

class KedarnathApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();
    
    this.initThree();
    this.initWorld();
    this.initUI();
    this.startLoop();
  }

  initThree() {
    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 800);

    // 3. Renderer with Photorealistic PBR & ACES Filmic Tone Mapping
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    // Resize listener
    window.addEventListener('resize', () => this.onWindowResize());
  }

  initWorld() {
    // 1. Himalayan Mountain Environment & Campus
    this.environment = new HimalayanEnvironment(this.scene);

    // 2. 3D Kedarnath Temple, Nandi & Bells
    this.temple = new KedarnathTemple(this.scene);

    // 3. First-Person Walk, Drone & Interaction Controls
    this.controls = new ControllerManager(this.camera, this.renderer, this.temple, this.environment);

    // 4. WebXR VR & Mobile Gyro AR Manager
    this.xr = new XRManager(this.renderer, this.scene, this.camera, this.temple);
  }

  initUI() {
    // 1. Atmosphere / Time of Day Toggle (Day -> Sunset -> Night Aarti)
    const timeBtn = document.getElementById('btn-time');
    const timeModes = ['day', 'sunset', 'night'];
    const timeLabels = { day: '☀️ Day', sunset: '🌅 Sunset', night: '🪔 Aarti' };
    let currentTimeIndex = 0;

    if (timeBtn) {
      timeBtn.addEventListener('click', () => {
        currentTimeIndex = (currentTimeIndex + 1) % timeModes.length;
        const selectedMode = timeModes[currentTimeIndex];
        this.environment.setTimeOfDay(selectedMode);
        timeBtn.querySelector('.label-text').textContent = timeLabels[selectedMode];
      });
    }

    // 1b. Real Snow Mountain Toggle ("Put the mountain are covered from snow look like real")
    const snowBtn = document.getElementById('btn-snow');
    let isSnowMode = true;
    if (snowBtn) {
      snowBtn.addEventListener('click', () => {
        isSnowMode = !isSnowMode;
        this.environment.setSnowMode(isSnowMode);
        snowBtn.classList.toggle('active', isSnowMode);
        snowBtn.querySelector('.label-text').textContent = isSnowMode ? 'Snow Mountain' : 'Clear Mountain';
        snowBtn.querySelector('.btn-icon').textContent = isSnowMode ? '❄️' : '🏔️';
      });
    }

    // 2. Audio & Chant Toggle
    const soundBtn = document.getElementById('btn-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        if (window.soundEngine) {
          const isMuted = window.soundEngine.toggleMute();
          soundBtn.classList.toggle('active', !isMuted);
          soundBtn.querySelector('.label-text').textContent = isMuted ? 'Muted' : 'Audio On';
        }
      });
    }

    // 3. Mode Toggle (Walk vs 360° Drone Tour)
    const modeBtn = document.getElementById('btn-mode');
    if (modeBtn) {
      modeBtn.addEventListener('click', () => {
        if (this.controls.mode === 'walk') {
          this.controls.setMode('drone');
          modeBtn.querySelector('.btn-text').textContent = 'Walk Tour';
          modeBtn.querySelector('.btn-icon').textContent = '🚶';
        } else {
          this.controls.setMode('walk');
          modeBtn.querySelector('.btn-text').textContent = '360° Drone';
          modeBtn.querySelector('.btn-icon').textContent = '🚁';
        }
      });
    }

    // 4. WebXR VR Button
    const vrBtn = document.getElementById('btn-vr');
    if (vrBtn) {
      vrBtn.addEventListener('click', () => {
        this.xr.enterVR();
      });
    }

    // 5. Mobile Gyro / AR Button
    const arBtn = document.getElementById('btn-ar');
    if (arBtn) {
      arBtn.addEventListener('click', () => {
        this.xr.toggleARPortal();
      });
    }

    // 6. Sacred Hotspots Quick-Jump
    const hotspotButtons = document.querySelectorAll('.hotspot-btn');
    hotspotButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        hotspotButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const spotId = btn.getAttribute('data-spot');
        this.controls.teleportTo(spotId);
      });
    });

    // 7. Fullscreen Toggle
    const fsBtn = document.getElementById('btn-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          if (document.exitFullscreen) document.exitFullscreen();
        }
      });
    }

    // 8. Info Modal
    const infoBtn = document.getElementById('btn-info');
    const infoModal = document.getElementById('info-modal');
    const closeModals = document.querySelectorAll('.modal-close');

    if (infoBtn && infoModal) {
      infoBtn.addEventListener('click', () => infoModal.classList.add('active'));
    }

    closeModals.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
      });
    });

    // Close modals on clicking backdrop background
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('active');
        }
      });
    });

    // Close modals and cards on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
        document.querySelectorAll('.nandi-card').forEach(c => c.classList.remove('visible'));
      }
    });

    // 9. Close guide card
    const closeGuide = document.querySelector('.close-guide');
    if (closeGuide) {
      closeGuide.addEventListener('click', () => {
        const guide = document.getElementById('controls-guide');
        if (guide) guide.style.display = 'none';
      });
    }

    // 10. Real Nandi Photo Card & Gallery Modal
    const viewNandiBtn = document.getElementById('btn-view-nandi-photos');
    const nandiModal = document.getElementById('nandi-modal');
    const closeNandiBtn = document.getElementById('btn-close-nandi-modal');
    const closeNandiCardBtn = document.getElementById('btn-close-nandi-card');
    const ringNandiBellBtn = document.getElementById('btn-ring-nandi-bell');

    if (viewNandiBtn && nandiModal) {
      viewNandiBtn.addEventListener('click', () => nandiModal.classList.add('active'));
    }
    if (closeNandiBtn && nandiModal) {
      closeNandiBtn.addEventListener('click', () => nandiModal.classList.remove('active'));
    }
    if (closeNandiCardBtn) {
      closeNandiCardBtn.addEventListener('click', () => {
        const card = document.getElementById('nandi-darshan-card');
        if (card) {
          card.classList.remove('visible');
          card.dataset.manuallyClosed = 'true';
        }
      });
    }
    if (ringNandiBellBtn) {
      ringNandiBellBtn.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playTempleBell(1.0);
        this.temple.ringBell(0);
      });
    }

    // 10b. Dedicated Bottom Nandi Dock Widget Controls ("On the bottom put Nandi show it")
    const dockFocusBtn = document.getElementById('btn-dock-nandi-focus');
    const dock360Btn = document.getElementById('btn-dock-nandi-360');
    const dockPhotosBtn = document.getElementById('btn-dock-nandi-photos');
    const dockBellBtn = document.getElementById('btn-dock-nandi-bell');

    if (dockFocusBtn) {
      dockFocusBtn.addEventListener('click', () => {
        this.controls.teleportTo('nandi');
        const hotspotButtons = document.querySelectorAll('.hotspot-btn');
        hotspotButtons.forEach(b => b.classList.remove('active'));
        const nandiSpotBtn = document.querySelector('.hotspot-btn[data-spot="nandi"]');
        if (nandiSpotBtn) nandiSpotBtn.classList.add('active');
      });
    }

    if (dock360Btn) {
      dock360Btn.addEventListener('click', () => {
        this.controls.orbitNandi();
        dock360Btn.classList.add('active');
        setTimeout(() => dock360Btn.classList.remove('active'), 2000);
      });
    }

    if (dockPhotosBtn && nandiModal) {
      dockPhotosBtn.addEventListener('click', () => {
        nandiModal.classList.add('active');
      });
    }

    if (dockBellBtn) {
      dockBellBtn.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playTempleBell(1.0);
        this.temple.ringBell(0);
      });
    }

    // Nandi modal thumbnail strip switching
    const nandiThumbs = document.querySelectorAll('.nandi-thumbs-strip .nandi-thumb:not(.sanctum-thumb)');
    const nandiMainImg = document.getElementById('nandi-main-img');
    const nandiCaption = document.getElementById('nandi-caption');
    nandiThumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        nandiThumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        if (nandiMainImg) nandiMainImg.src = thumb.dataset.img;
        if (nandiCaption) nandiCaption.textContent = thumb.dataset.cap;
      });
    });

    // 11. Real Sanctum Jyotirlinga Card & Gallery Modal
    const viewSanctumBtn = document.getElementById('btn-view-sanctum-photos');
    const sanctumModal = document.getElementById('sanctum-modal');
    const closeSanctumBtn = document.getElementById('btn-close-sanctum-modal');
    const closeSanctumCardBtn = document.getElementById('btn-close-sanctum-card');
    const darshanBellBtn = document.getElementById('btn-darshan-bell');

    if (viewSanctumBtn && sanctumModal) {
      viewSanctumBtn.addEventListener('click', () => sanctumModal.classList.add('active'));
    }
    if (closeSanctumBtn && sanctumModal) {
      closeSanctumBtn.addEventListener('click', () => sanctumModal.classList.remove('active'));
    }
    if (closeSanctumCardBtn) {
      closeSanctumCardBtn.addEventListener('click', () => {
        const card = document.getElementById('sanctum-darshan-card');
        if (card) {
          card.classList.remove('visible');
          card.dataset.manuallyClosed = 'true';
        }
      });
    }
    if (darshanBellBtn) {
      darshanBellBtn.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playTempleBell(1.2);
        this.temple.ringBell(1);
      });
    }

    // Sanctum modal thumbnail strip switching
    const sanctumThumbs = document.querySelectorAll('#sanctum-modal .thumb-item');
    const sanctumHeroImg = document.getElementById('sanctum-hero-img');
    const sanctumCaption = document.getElementById('sanctum-hero-caption');
    sanctumThumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        sanctumThumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        if (sanctumHeroImg) sanctumHeroImg.src = thumb.dataset.src;
        if (sanctumCaption) sanctumCaption.innerHTML = thumb.dataset.caption;
      });
    });

    // 12. Real Bhim Shila Photo Card & Gallery Modal ("Back this from back side")
    const viewBhimBtn = document.getElementById('btn-view-bhim-photos');
    const bhimModal = document.getElementById('bhimshila-modal');
    const closeBhimBtn = document.getElementById('btn-close-bhim-modal');
    const closeBhimCardBtn = document.getElementById('btn-close-bhim-card');
    const ringBhimBellBtn = document.getElementById('btn-ring-bhim-bell');

    if (viewBhimBtn && bhimModal) {
      viewBhimBtn.addEventListener('click', () => bhimModal.classList.add('active'));
    }
    if (closeBhimBtn && bhimModal) {
      closeBhimBtn.addEventListener('click', () => bhimModal.classList.remove('active'));
    }
    if (closeBhimCardBtn) {
      closeBhimCardBtn.addEventListener('click', () => {
        const card = document.getElementById('bhimshila-darshan-card');
        if (card) {
          card.classList.remove('visible');
          card.dataset.manuallyClosed = 'true';
        }
      });
    }
    if (ringBhimBellBtn) {
      ringBhimBellBtn.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playTempleBell(0.9);
        this.temple.ringBell(2); // Ring Bhim Shila bell
      });
    }

    // Bhim Shila modal thumbnail strip switching
    const bhimThumbs = document.querySelectorAll('#bhimshila-modal .thumb-item');
    const bhimHeroImg = document.getElementById('bhim-hero-img');
    const bhimCaption = document.getElementById('bhim-hero-caption');
    bhimThumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        bhimThumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        if (bhimHeroImg) bhimHeroImg.src = thumb.dataset.src;
        if (bhimCaption) bhimCaption.innerHTML = thumb.dataset.caption;
      });
    });

    // 13. Real Temple & Mountains Photo Gallery Modal ("temple colour and mountains like this image")
    const viewTemplePhotosBtn = document.getElementById('btn-real-photos');
    const templeModal = document.getElementById('temple-photos-modal');
    const closeTempleBtn = document.getElementById('btn-close-temple-modal');

    if (viewTemplePhotosBtn && templeModal) {
      viewTemplePhotosBtn.addEventListener('click', () => templeModal.classList.add('active'));
    }
    if (closeTempleBtn && templeModal) {
      closeTempleBtn.addEventListener('click', () => templeModal.classList.remove('active'));
    }

    const templeThumbs = document.querySelectorAll('#temple-photos-modal .thumb-item');
    const templeHeroImg = document.getElementById('temple-hero-img');
    const templeCaption = document.getElementById('temple-hero-caption');
    templeThumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        templeThumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        if (templeHeroImg) templeHeroImg.src = thumb.dataset.src;
        if (templeCaption) templeCaption.innerHTML = thumb.dataset.caption;
      });
    });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  startLoop() {
    // Set animation loop compatible with WebXR stereoscopic rendering
    this.renderer.setAnimationLoop((timestamp) => {
      const delta = Math.min(this.clock.getDelta(), 0.1);
      const elapsedTime = this.clock.getElapsedTime();

      // Update controllers & physics
      this.controls.update(delta, elapsedTime);

      // Update temple animations (flags, bells, diyas)
      this.temple.update(elapsedTime, delta);

      // Update environment (snow particles, prayer flags, lights)
      this.environment.update(elapsedTime, delta);

      // Render frame
      this.renderer.render(this.scene, this.camera);
    });
  }
}

// Start app once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new KedarnathApp();
});
