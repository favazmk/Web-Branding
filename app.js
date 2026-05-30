/* ==========================================================================
   THE WEB BRANDING - CLIENT LOGIC & ESTIMATOR
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Header Scroll Effect ---
    const header = document.getElementById('main-header');
    
    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Run initially in case of refresh

    // --- 2. Scroll Reveal Animations (Intersection Observer) ---
    const animatedElements = document.querySelectorAll('.fade-in-up');
    
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appeared');
                observer.unobserve(entry.target); // Stop observing once animated in
            }
        });
    };
    
    const revealObserver = new IntersectionObserver(revealCallback, {
        root: null,
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(element => {
        revealObserver.observe(element);
    });

    // --- 3. Interactive Project Estimator & Scope Calculator ---
    const serviceInputs = document.querySelectorAll('.service-checkbox');
    const budgetRange = document.getElementById('budget-range');
    const currencySelect = document.getElementById('currency-select');
    const contactName = document.getElementById('client-name');
    const contactEmail = document.getElementById('client-email');
    const contactPhone = document.getElementById('client-phone');
    
    // Display Elements
    const budgetValue = document.getElementById('display-budget-val');
    const summaryServices = document.getElementById('summary-services');
    const summaryScope = document.getElementById('summary-scope');
    const summaryTimeline = document.getElementById('summary-timeline');
    const summaryFinalBudget = document.getElementById('summary-final-budget');
    const submitBtn = document.getElementById('submit-estimator-btn');
    
    // Currency Configurations
    const currencies = {
        AED: { symbol: 'AED ', min: 3000, max: 50000, step: 1000, default: 8000 },
        INR: { symbol: '₹', min: 50000, max: 1000000, step: 10000, default: 150000 },
        USD: { symbol: '$', min: 1000, max: 20000, step: 500, default: 3500 }
    };

    // Active Settings
    let currentCurrency = 'AED';
    
    // Base pricing values per service (standard multipliers in USD)
    const baseServiceCosts = {
        webdev: 1500,
        marketing: 1000,
        videoprod: 1200,
        branding: 800
    };

    // Initialize Currency Settings
    const initCurrency = () => {
        currentCurrency = currencySelect.value;
        const config = currencies[currentCurrency];
        
        budgetRange.min = config.min;
        budgetRange.max = config.max;
        budgetRange.step = config.step;
        budgetRange.value = config.default;
        
        updateEstimator();
    };

    // Calculate Scope & Timeline
    const updateEstimator = () => {
        const config = currencies[currentCurrency];
        const budget = parseInt(budgetRange.value, 10);
        
        // Formatted Budget
        budgetValue.textContent = config.symbol + budget.toLocaleString();
        summaryFinalBudget.textContent = config.symbol + budget.toLocaleString();

        // 1. Gather Selected Services
        let activeServices = [];
        let totalUSDServiceWeight = 0;

        serviceInputs.forEach(input => {
            if (input.checked) {
                activeServices.push(input.dataset.name);
                totalUSDServiceWeight += baseServiceCosts[input.value];
            }
        });

        // Update active service display list
        if (activeServices.length === 0) {
            summaryServices.textContent = 'None Selected';
            summaryScope.textContent = 'Please select a service';
            summaryTimeline.textContent = '--';
            submitBtn.disabled = true;
            return;
        }

        submitBtn.disabled = false;
        summaryServices.textContent = activeServices.join(', ');

        // 2. Convert current budget to base USD value to normalize calculations
        let conversionRateToUSD = 1;
        if (currentCurrency === 'AED') conversionRateToUSD = 1 / 3.67;
        if (currentCurrency === 'INR') conversionRateToUSD = 1 / 83.5;
        
        const budgetInUSD = budget * conversionRateToUSD;
        
        // Define Quality Tier / Scope level based on budget comparison to base cost
        let scopeTier = 'Standard';
        let timeline = '2-3 Weeks';

        const budgetRatio = budgetInUSD / Math.max(500, totalUSDServiceWeight);

        if (budgetRatio < 0.8) {
            scopeTier = 'Essential (Lean Setup)';
            timeline = '1-2 Weeks';
        } else if (budgetRatio >= 0.8 && budgetRatio < 1.5) {
            scopeTier = 'Growth (Standard Pro)';
            timeline = '3-4 Weeks';
        } else if (budgetRatio >= 1.5 && budgetRatio < 2.5) {
            scopeTier = 'Enterprise (Premium Custom)';
            timeline = '5-6 Weeks';
        } else {
            scopeTier = 'Vanguard Elite (Bespoke 3D & Advanced Systems)';
            timeline = '8-10 Weeks';
        }

        summaryScope.textContent = scopeTier;
        summaryTimeline.textContent = timeline;
    };

    // Listeners for Estimator
    currencySelect.addEventListener('change', initCurrency);
    budgetRange.addEventListener('input', updateEstimator);
    serviceInputs.forEach(input => input.addEventListener('change', updateEstimator));

    // Initial setup
    initCurrency();

    // --- 4. Submit Lead Proposal Form ---
    const handleEstimatorSubmit = (e) => {
        e.preventDefault();
        
        const name = contactName.value.trim();
        const email = contactEmail.value.trim();
        const phone = contactPhone.value.trim();
        const config = currencies[currentCurrency];
        const budget = parseInt(budgetRange.value, 10);
        
        if (!name) {
            alert('Please provide your name so we can address you.');
            return;
        }

        // Package all active selections
        let selectedServicesList = [];
        serviceInputs.forEach(input => {
            if (input.checked) selectedServicesList.push(input.dataset.name);
        });

        const servicesString = selectedServicesList.join(', ');
        const finalBudgetString = config.symbol + budget.toLocaleString();
        const scope = summaryScope.textContent;
        const timeline = summaryTimeline.textContent;

        // Build a highly professional proposal brief message
        const message = `Hi Hashir & The Web Branding Team,
        
I just generated a custom project proposal brief on your website and would love to align:

💼 Client Details:
• Name: ${name}
${email ? `• Email: ${email}` : ''}
${phone ? `• Phone: ${phone}` : ''}

🎯 Project Scope Brief:
• Services: ${servicesString}
• Planned Budget: ${finalBudgetString}
• Projected Tier: ${scope}
• Estimated Timeline: ${timeline}

Looking forward to bringing this digital transformation to life!`;

        // Encode and redirect to WhatsApp API (Dubai Office Contact by default)
        const encodedMessage = encodeURIComponent(message);
        const whatsappNumber = '971544357023'; // Dubai agency number from live CTAs
        const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        
        // Open WhatsApp in a new tab
        window.open(whatsappURL, '_blank');
    };

    document.getElementById('project-estimator-form').addEventListener('submit', handleEstimatorSubmit);

    // --- 5. Interactive 3D Particles Constellation Backdrop ---
    const initParticles = () => {
        const canvas = document.getElementById('particles-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const heroSection = document.getElementById('home');
        
        let width = canvas.width = heroSection.offsetWidth;
        let height = canvas.height = heroSection.offsetHeight;
        
        const particles = [];
        const maxParticles = window.innerWidth < 768 ? 25 : 60;
        const connectionDistance = 110;
        
        const mouse = { x: null, y: null, radius: 150 };
        
        window.addEventListener('resize', () => {
            width = canvas.width = heroSection.offsetWidth;
            height = canvas.height = heroSection.offsetHeight;
        });
        
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        
        heroSection.addEventListener('mouseleave', () => {
            mouse.x = null;
            mouse.y = null;
        });
        
        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.radius = Math.random() * 2 + 1;
            }
            
            update() {
                this.x += this.vx;
                this.y += this.vy;
                
                // Boundary check
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
                
                // Interact with mouse
                if (mouse.x !== null && mouse.y !== null) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const dist = Math.hypot(dx, dy);
                    
                    if (dist < mouse.radius) {
                        const force = (mouse.radius - dist) / mouse.radius;
                        const angle = Math.atan2(dy, dx);
                        // Pull particle gently towards mouse
                        this.x += Math.cos(angle) * force * 0.5;
                        this.y += Math.sin(angle) * force * 0.5;
                    }
                }
            }
            
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(168, 134, 205, 0.4)';
                ctx.fill();
            }
        }
        
        for (let i = 0; i < maxParticles; i++) {
            particles.push(new Particle());
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            
            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const p1 = particles[i];
                    const p2 = particles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.hypot(dx, dy);
                    
                    if (dist < connectionDistance) {
                        const alpha = (connectionDistance - dist) / connectionDistance * 0.12;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(168, 134, 205, ${alpha})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    };
    initParticles();

    // --- 6. Dynamic 3D Tilt Effect (Mouse Hover & Mobile Gyroscope) ---
    const init3DTilt = () => {
        const tiltCards = document.querySelectorAll('.service-card, .portfolio-card, .founder-card-right, .founder-card-left, .visual-canvas');
        
        // Tracking visible cards to optimize orientation calculations
        const visibleCards = new Set();
        const visibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    visibleCards.add(entry.target);
                } else {
                    visibleCards.delete(entry.target);
                    entry.target.style.transform = '';
                    entry.target.style.boxShadow = '';
                    const img = entry.target.querySelector('.founder-img, .portfolio-img, img[src="hero-shape.webp"]');
                    if (img) img.style.transform = '';
                }
            });
        }, { threshold: 0.1 });

        tiltCards.forEach(card => visibilityObserver.observe(card));

        // 1. Desktop Mouse Move Hover Tilt
        tiltCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                if (window.matchMedia('(pointer: coarse)').matches) return; // Skip on mobile devices

                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const maxRotationX = 8; 
                const maxRotationY = 8; 
                
                const rotateX = ((centerY - y) / centerY) * maxRotationX;
                const rotateY = ((x - centerX) / centerX) * maxRotationY;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                
                const shadowX = -rotateY * 1.5;
                const shadowY = rotateX * 1.5;
                card.style.boxShadow = `${shadowX}px ${shadowY}px 30px rgba(168, 134, 205, 0.12), var(--shadow-premium)`;
                
                const img = card.querySelector('.founder-img, .portfolio-img, img[src="hero-shape.webp"]');
                if (img) {
                    img.style.transform = `scale(1.08) translate3d(${-rotateY * 0.4}px, ${-rotateX * 0.4}px, 40px)`;
                }
                
                const mesh = card.querySelector('.visual-mesh');
                if (mesh) {
                    mesh.style.transform = `translate3d(${rotateY * 0.5}px, ${-rotateX * 0.5}px, -20px)`;
                }
            });
            
            card.addEventListener('mouseleave', () => {
                if (window.matchMedia('(pointer: coarse)').matches) return;
                card.style.transform = '';
                card.style.boxShadow = '';
                
                const img = card.querySelector('.founder-img, .portfolio-img, img[src="hero-shape.webp"]');
                if (img) img.style.transform = '';
                
                const mesh = card.querySelector('.visual-mesh');
                if (mesh) mesh.style.transform = '';
            });
        });

        // 2. Mobile Gyroscope Device Orientation Tilt
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                if (!window.matchMedia('(pointer: coarse)').matches) return; // Only trigger on mobile touchscreens
                
                const beta = e.beta;   // front-back tilt (-180 to 180)
                const gamma = e.gamma; // left-right tilt (-90 to 90)
                
                if (beta === null || gamma === null) return;
                
                // Normalizing phone angles based on standard vertical holding context
                const normalBeta = Math.min(Math.max(beta - 45, -30), 30);
                const normalGamma = Math.min(Math.max(gamma, -30), 30);
                
                const rotateX = (-normalBeta / 30) * 8; 
                const rotateY = (normalGamma / 30) * 8; 

                visibleCards.forEach(card => {
                    card.style.transition = 'transform 0.25s ease-out, box-shadow 0.25s ease-out';
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
                    
                    const shadowX = -rotateY * 1.2;
                    const shadowY = rotateX * 1.2;
                    card.style.boxShadow = `${shadowX}px ${shadowY}px 25px rgba(168, 134, 205, 0.1), var(--shadow-premium)`;

                    const img = card.querySelector('.founder-img, .portfolio-img, img[src="hero-shape.webp"]');
                    if (img) {
                        img.style.transition = 'transform 0.25s ease-out';
                        img.style.transform = `scale(1.05) translate3d(${-rotateY * 0.3}px, ${-rotateX * 0.3}px, 20px)`;
                    }
                });
            });
        }

        // 3. Mobile Scroll Center Highlight Focus
        const handleScrollFocus = () => {
            const viewportCenterY = window.innerHeight / 2;

            tiltCards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const cardCenterY = rect.top + (rect.height / 2);
                
                // Calculate distance from screen center
                const distanceToCenter = Math.abs(viewportCenterY - cardCenterY);
                
                // Active range when card center is within 18% of screen center
                const focusRange = window.innerHeight * 0.18;
                
                if (distanceToCenter < focusRange) {
                    card.classList.add('viewport-focused');
                } else {
                    card.classList.remove('viewport-focused');
                }
            });
        };

        window.addEventListener('scroll', handleScrollFocus);
        handleScrollFocus(); // Run initially
    };
    init3DTilt();

    // --- 7. Scroll-Bound 3D & Parallax Scrolling ---
    const initScrollParallax = () => {
        const orbs = document.querySelectorAll('.orb-primary, .orb-secondary, .orb-accent');
        const heroShape = document.querySelector('img[src="hero-shape.webp"]');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            
            // Move decorative background glowing blobs at variable slower speeds (depth effect)
            orbs.forEach((orb, index) => {
                const speed = (index + 1) * 0.12;
                orb.style.transform = `translateY(${scrolled * speed}px)`;
            });
            
            // Subtly rotate and shift hero 3D asset on scroll
            if (heroShape) {
                const rect = heroShape.getBoundingClientRect();
                if (rect.bottom > 0 && rect.top < window.innerHeight) {
                    const speed = -0.2;
                    const rotationSpeed = 0.04;
                    heroShape.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * rotationSpeed}deg) translateZ(50px)`;
                }
            }
        });
    };
    initScrollParallax();

    // --- 8. Mobile Slide-Down Navigation Menu ---
    const initMobileMenu = () => {
        const toggleBtn = document.getElementById('menu-toggle-btn');
        const navLinks = document.querySelector('.nav-links');
        const menuIcon = toggleBtn ? toggleBtn.querySelector('.menu-icon') : null;
        const closeIcon = toggleBtn ? toggleBtn.querySelector('.close-icon') : null;
        
        if (!toggleBtn || !navLinks) return;
        
        const toggleMenu = () => {
            const isActive = navLinks.classList.toggle('active');
            
            if (isActive) {
                menuIcon.style.display = 'none';
                closeIcon.style.display = 'block';
                document.body.style.overflow = 'hidden'; // Stop background scrolling
            } else {
                menuIcon.style.display = 'block';
                closeIcon.style.display = 'none';
                document.body.style.overflow = ''; // Resume background scrolling
            }
        };
        
        toggleBtn.addEventListener('click', toggleMenu);
        
        // Auto-close menu when any navigation link is clicked
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                if (menuIcon && closeIcon) {
                    menuIcon.style.display = 'block';
                    closeIcon.style.display = 'none';
                }
                document.body.style.overflow = '';
            });
        });
    };
    initMobileMenu();
});
