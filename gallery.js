// Gallery JavaScript - Professional Pinterest-style functionality

document.addEventListener('DOMContentLoaded', function() {
    // Gallery elements
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');

        // Mobile overlay tap support
    function isMobileDevice() {
        return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    }
    if (isMobileDevice()) {
        galleryItems.forEach(item => {
            item.addEventListener('click', function(e) {
                // If overlay is already shown, open lightbox on second tap
                if (this.classList.contains('show-overlay')) {
                    this.classList.remove('show-overlay');
                    const img = this.querySelector('img');
                    openLightbox(img.src, img.alt);
                    return;
                }
                // Prevent lightbox if tapping overlay area
                if (e.target.classList.contains('overlay') || e.target.closest('.overlay')) {
                    return;
                }
                // Remove .show-overlay from all
                galleryItems.forEach(i => i.classList.remove('show-overlay'));
                // Add to this one
                this.classList.add('show-overlay');
                // Hide overlay if tapped outside
                setTimeout(() => {
                    const handler = (ev) => {
                        if (!this.contains(ev.target)) {
                            this.classList.remove('show-overlay');
                            document.removeEventListener('touchstart', handler);
                            document.removeEventListener('mousedown', handler);
                        }
                    };
                    document.addEventListener('touchstart', handler);
                    document.addEventListener('mousedown', handler);
                }, 0);
            });
        });
    }

    let currentImageIndex = 0;
    let visibleImages = [];

    // Initialize gallery
    init();

    function init() {
        setupFiltering();
        setupLightbox();
        setupImageLazyLoading();
        updateVisibleImages();
        addScrollAnimations();
    }

    // Filter functionality
    function setupFiltering() {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter');
                
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Filter items with smooth animation
                filterItems(filter);
            });
        });
    }

    function filterItems(category) {
        galleryItems.forEach((item, index) => {
            const itemCategory = item.getAttribute('data-category');
            const shouldShow = category === 'all' || itemCategory === category;
            
            if (shouldShow) {
                // Staggered entrance animation
                setTimeout(() => {
                    item.style.display = 'block';
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(30px) scale(0.95)';
                    
                    requestAnimationFrame(() => {
                        item.style.transition = 'all 0.5s ease';
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0) scale(1)';
                    });
                }, index * 100);
            } else {
                // Fade out animation
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '0';
                item.style.transform = 'translateY(-20px) scale(0.95)';
                
                setTimeout(() => {
                    item.style.display = 'none';
                }, 300);
            }
        });
        
        // Update visible images for lightbox
        setTimeout(() => {
            updateVisibleImages();
        }, 500);
    }

    // Lightbox functionality
    function setupLightbox() {
        // Open lightbox when clicking on gallery items (desktop only)
        if (!isMobileDevice()) {
            galleryItems.forEach((item, index) => {
                item.addEventListener('click', function() {
                    const img = this.querySelector('img');
                    openLightbox(img.src, img.alt, index);
                });
            });
        }

        // Close lightbox
        lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        // Navigation
        lightboxPrev.addEventListener('click', showPreviousImage);
        lightboxNext.addEventListener('click', showNextImage);

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (!lightbox.classList.contains('active')) return;
            
            switch(e.key) {
                case 'Escape':
                    closeLightbox();
                    break;
                case 'ArrowLeft':
                    showPreviousImage();
                    break;
                case 'ArrowRight':
                    showNextImage();
                    break;
            }
        });
    }

    function updateVisibleImages() {
        visibleImages = Array.from(galleryItems)
            .filter(item => item.style.display !== 'none')
            .map(item => ({
                src: item.querySelector('img').src,
                alt: item.querySelector('img').alt
            }));
    }

    function openLightbox(src, alt, index) {
        currentImageIndex = visibleImages.findIndex(img => img.src === src);
        lightboxImage.src = src;
        lightboxImage.alt = alt;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Add entrance animation
        lightboxImage.style.transform = 'scale(0.8)';
        lightboxImage.style.opacity = '0';
        
        requestAnimationFrame(() => {
            lightboxImage.style.transition = 'all 0.3s ease';
            lightboxImage.style.transform = 'scale(1)';
            lightboxImage.style.opacity = '1';
        });
    }

    function closeLightbox() {
        lightboxImage.style.transform = 'scale(0.8)';
        lightboxImage.style.opacity = '0';
        
        setTimeout(() => {
            lightbox.classList.remove('active');
            document.body.style.overflow = 'auto';
        }, 300);
    }

    function showPreviousImage() {
        if (visibleImages.length === 0) return;
        
        currentImageIndex = currentImageIndex > 0 
            ? currentImageIndex - 1 
            : visibleImages.length - 1;
        
        updateLightboxImage();
    }

    function showNextImage() {
        if (visibleImages.length === 0) return;
        
        currentImageIndex = currentImageIndex < visibleImages.length - 1 
            ? currentImageIndex + 1 
            : 0;
        
        updateLightboxImage();
    }

    function updateLightboxImage() {
        const currentImage = visibleImages[currentImageIndex];
        
        // Slide transition
        lightboxImage.style.transform = 'translateX(-100px)';
        lightboxImage.style.opacity = '0';
        
        setTimeout(() => {
            lightboxImage.src = currentImage.src;
            lightboxImage.alt = currentImage.alt;
            lightboxImage.style.transform = 'translateX(0)';
            lightboxImage.style.opacity = '1';
        }, 200);
    }

    // Lazy loading for better performance
    function setupImageLazyLoading() {
        const images = document.querySelectorAll('.gallery-item img');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.src; // Trigger actual loading
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px'
            });

            images.forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    // Scroll animations
    function setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe all gallery items
        galleryItems.forEach(item => {
            observer.observe(item);
        });
    }

    // Masonry layout adjustment (for dynamic content)
    function adjustMasonryLayout() {
        const grid = document.querySelector('.gallery-grid');
        const items = grid.querySelectorAll('.gallery-item');
        
        // Simple masonry-like adjustment
        items.forEach(item => {
            const img = item.querySelector('img');
            if (img.complete) {
                adjustItemHeight(item, img);
            } else {
                img.onload = () => adjustItemHeight(item, img);
            }
        });
    }

    function adjustItemHeight(item, img) {
        // Add random height variation for Pinterest-like layout
        const variations = [1, 1.2, 0.8, 1.1, 0.9];
        const randomVariation = variations[Math.floor(Math.random() * variations.length)];
        
        img.style.aspectRatio = `1 / ${randomVariation}`;
    }

    // Search functionality (if you want to add it later)
    function addSearchFunctionality() {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search gallery...';
        searchInput.className = 'gallery-search';
        
        const filtersContainer = document.querySelector('.gallery-filters');
        filtersContainer.insertBefore(searchInput, filtersContainer.firstChild);
        
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            galleryItems.forEach(item => {
                const title = item.querySelector('.item-title').textContent.toLowerCase();
                const desc = item.querySelector('.item-desc').textContent.toLowerCase();
                const category = item.getAttribute('data-category').toLowerCase();
                
                const matches = title.includes(searchTerm) || 
                               desc.includes(searchTerm) || 
                               category.includes(searchTerm);
                
                item.style.display = matches ? 'block' : 'none';
                item.style.opacity = matches ? '1' : '0';
            });
            
            updateVisibleImages();
        });
    }

    // Touch/swipe support for mobile
    function addTouchSupport() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        lightbox.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        lightbox.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    showNextImage(); // Swipe left - next image
                } else {
                    showPreviousImage(); // Swipe right - previous image
                }
            }
        }
    }

    // Initialize additional features
    addTouchSupport();
    
    // Optional: Uncomment to add search functionality
    // addSearchFunctionality();
    
    // Adjust layout on window resize
    window.addEventListener('resize', debounce(adjustMasonryLayout, 250));
    
    // Utility function for debouncing
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Add loading states
    galleryItems.forEach(item => {
        const img = item.querySelector('img');
        
        img.addEventListener('load', function() {
            item.classList.add('loaded');
        });
        
        img.addEventListener('error', function() {
            item.classList.add('error');
            // You could add a placeholder image here
        });
    });
});

// Fade-in gallery items as they enter the viewport
// (Auto-animates .gallery-item with .visible class)
document.addEventListener('DOMContentLoaded', function() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    galleryItems.forEach(item => observer.observe(item));
  } else {
    // Fallback for old browsers: show all
    galleryItems.forEach(item => item.classList.add('visible'));
  }
});