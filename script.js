


document.addEventListener('DOMContentLoaded', () => {

  /* =========== Helpers: textures via canvas =========== */
  function createRadialTexture(size = 64) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');

    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.18, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.6, 'rgba(255,240,230,0.4)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,size,size);

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
  }

  /* ======= Cute fluffy cloud texture ======= */
  function createCuteCloudTexture(size = 512) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    ctx.clearRect(0,0,size,size);

    const lightEdge = 'rgba(245,248,255,0.95)';

    function puff(x, y, r, coreAlpha = 1) {
      const coreR = r * 0.6;
      const gCore = ctx.createRadialGradient(x, y, 0, x, y, coreR);
      gCore.addColorStop(0, `rgba(255,255,255,${coreAlpha})`);
      gCore.addColorStop(1, `rgba(255,255,255,${coreAlpha * 0.98})`);
      ctx.fillStyle = gCore;
      ctx.beginPath();
      ctx.arc(x, y, coreR, 0, Math.PI * 2);
      ctx.fill();

      const gEdge = ctx.createRadialGradient(x, y, 0, x, y, r);
      gEdge.addColorStop(0, `rgba(255,255,255,${coreAlpha * 0.95})`);
      gEdge.addColorStop(0.65, lightEdge);
      gEdge.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gEdge;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawCloud(cx, cy, scale = 1) {
      const s = scale * size * 0.12;
      puff(cx - s*1.1, cy + s*0.15, s * 1.25, 1.0);
      puff(cx - s*0.2, cy - s*0.15, s * 1.45, 1.0);
      puff(cx + s*0.9, cy + s*0.05, s * 0.98, 0.98);
      puff(cx + s*0.35, cy + s*0.45, s * 0.9, 0.95);
      puff(cx, cy + s*0.75, s * 1.6, 0.7);
    }

    drawCloud(size * 0.5, size * 0.45, 1.0);

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
  }

  /* =========== Setup renderer, scene, camera =========== */
  const canvas = document.getElementById('threejs-canvas');
  if (!canvas) { return; }

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 5000);
  camera.position.z = 900;

  /* =========== STARS =========== */
  const starTex = createRadialTexture(64);
  function createStarLayer(count, spreadX, spreadY, zRange, size) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i*3]     = (Math.random() - 0.5) * spreadX;
      positions[i*3 + 1] = (Math.random() - 0.5) * spreadY;
      positions[i*3 + 2] = -Math.random() * zRange;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      map: starTex,
      size,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    return new THREE.Points(geom, mat);
  }

  // Default star sizes
  let starsTinySize = 2.2;
  let starsMidSize = 4.2;
  let starsBigSize = 7.4;

  const starsTiny = createStarLayer(2500, 2600, 1300, 2200, starsTinySize);
  const starsMid  = createStarLayer(900, 2600, 1100, 1600, starsMidSize);
  const starsBig  = createStarLayer(200, 2600, 1000, 1200, starsBigSize);

  const starGroup = new THREE.Group();
  starGroup.add(starsTiny, starsMid, starsBig);
  scene.add(starGroup);

  /* =========== CLOUD SPRITES =========== */
  let cloudTextureLight = createCuteCloudTexture(512);
  let cloudTextureDark  = createCuteCloudTexture(512);
  let activeCloudTexture = cloudTextureLight;

  const cloudsGroup = new THREE.Group();
  const cloudCount = 18;

  for (let i = 0; i < cloudCount; i++) {
    const mat = new THREE.SpriteMaterial({
      map: activeCloudTexture,
      transparent: true,
      opacity: 0.96,
      depthWrite: false
    });

    // Make clouds bigger: increase scaleBase and y scale
  const scaleBase = 320 + Math.random() * 340; // was 220 + Math.random() * 260
  const yScale = scaleBase * (0.65 + Math.random() * 0.12); // slightly taller
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scaleBase, yScale, 1);
  sprite.position.x = (Math.random() - 0.5) * 2200;
  sprite.position.y = (Math.random() - 0.1) * 900;
  sprite.position.z = -80 - Math.random() * 700;

    sprite.userData = {
      speed: 0.2 + Math.random() * 0.7,
      bobPhase: Math.random() * Math.PI * 2,
      bobAmp: 4 + Math.random() * 8,
      rotSpeed: (Math.random() - 0.5) * 0.001
    };

    cloudsGroup.add(sprite);
  }
  scene.add(cloudsGroup);

  /* =========== Visibility control (theme aware) =========== */
  const updateCloudsForTheme = () => {
    const dark = document.body.classList.contains('dark-mode');
    starGroup.visible = dark;
    cloudsGroup.visible = !dark;

    // Make stars bigger in dark mode, normal in light mode
    if (dark) {
      starsTiny.material.size = 3.2;
      starsMid.material.size = 6.2;
      starsBig.material.size = 12.4;
    } else {
      starsTiny.material.size = starsTinySize;
      starsMid.material.size = starsMidSize;
      starsBig.material.size = starsBigSize;
    }

    const newTex = dark ? cloudTextureDark : cloudTextureLight;
    if (activeCloudTexture !== newTex) {
      cloudsGroup.children.forEach(s => {
        s.material.map = newTex;
        s.material.needsUpdate = true;
      });
      activeCloudTexture = newTex;
    }
  };

  /* =========== Animation loop =========== */
  function animate() {
    requestAnimationFrame(animate);
    const t = Date.now() * 0.00045;

    starsTiny.rotation.y += 0.0006;
    starsMid.rotation.y  += 0.00045;
    starsBig.rotation.y  += 0.00025;

    starsTiny.material.opacity = 0.6 + Math.sin(t * 2.1) * 0.14;
    starsMid.material.opacity  = 0.75 + Math.sin(t * 1.2 + 0.6) * 0.18;
    starsBig.material.opacity  = 0.92 + Math.sin(t * 0.6 + 1.1) * 0.2;

    cloudsGroup.children.forEach((s) => {
      s.position.x += s.userData.speed * 0.55;
      s.position.y += Math.sin(t + s.userData.bobPhase) * 0.02 * s.userData.bobAmp;
      s.rotation.z += s.userData.rotSpeed * 0.5;

      if (s.position.x > 1400) {
        s.position.x = -1400 - Math.random() * 400;
        s.position.y = (Math.random() - 0.1) * 900;
        s.position.z = -80 - Math.random() * 700;
      }
    });

    renderer.render(scene, camera);
  }
  animate();

  /* =========== Resize handler =========== */
  window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  });

  /* =========== React to theme changes =========== */
  updateCloudsForTheme(); // run once on load
  document.addEventListener('theme-changed', updateCloudsForTheme);

  /* =========== Cursor =========== */
  const cursor = document.querySelector('.custom-cursor');
  if (cursor) {
  document.addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top  = `${e.clientY}px`;
    });

  document.querySelectorAll('a, button, .contact-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
  cursor.style.transform = 'scale(1.9)';
  cursor.style.opacity = '0.65';
      });
  el.addEventListener('mouseleave', () => {
  cursor.style.transform = 'scale(1)';
  cursor.style.opacity = '1';
      });
    });
  }

  /* =========== Intersection reveal =========== */
  const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
  if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, {threshold: 0.12});
  document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => observer.observe(el));

  /* =========== NAVBAR LOAD + LOGIC =========== */
  // NOTE: This assumes you have an element with id="navbar-placeholder" in your main HTML file.
  const navbarPlaceholder = document.getElementById("navbar-placeholder");
  if (navbarPlaceholder) {
      fetch("navbar.html")
        .then(res => res.text())
        .then(data => {
          navbarPlaceholder.innerHTML = data;

          // Theme toggle button
          const themeToggle = document.getElementById("theme-toggle");
          if (themeToggle) {
            themeToggle.addEventListener("click", () => {
              document.body.classList.toggle("dark-mode");
              const isDark = document.body.classList.contains("dark-mode");
              localStorage.setItem("theme", isDark ? "dark" : "light");
              themeToggle.textContent = isDark ? "☀️" : "🌙";
              document.dispatchEvent(new Event("theme-changed"));
            });
          }

          // Hamburger menu
          const menuToggle = document.getElementById("menu-toggle");
          // *** FIX: Get the .nav-links element directly ***
          const navLinks = document.querySelector(".nav-links");

          if (menuToggle && navLinks) {
            menuToggle.addEventListener("click", () => {
              menuToggle.classList.toggle("active");
              // *** FIX: Toggle the 'active' class on the navLinks list, not the whole navbar ***
              navLinks.classList.toggle("active");
            });
          }

          // Close mobile menu on link click
          const allNavLinks = document.querySelectorAll(".nav-links a");
          allNavLinks.forEach(link => {
            link.addEventListener("click", () => {
              // Ensure we only close if the menu is actually active
              if (menuToggle.classList.contains("active")) {
                  menuToggle.classList.remove("active");
                  // *** FIX: Also remove 'active' from navLinks to hide the menu ***
                  navLinks.classList.remove("active");
              }
            });
          });
        })
        .catch(err => console.error("Navbar failed to load:", err));
    }
});