/* ==========================================================================
   THE WEB BRANDING - CLIENT LOGIC & ESTIMATOR
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Custom Toast Warning/Success System (Agency Themed) ---
    const showToast = (message, type = 'success') => {
        const existingToast = document.getElementById('twb-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.id = 'twb-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '30px';
        toast.style.right = '30px';
        toast.style.zIndex = '100000';
        toast.style.background = 'linear-gradient(135deg, rgba(35, 15, 65, 0.95) 0%, rgba(15, 8, 30, 0.98) 100%)';
        toast.style.border = type === 'success' ? '1.5px solid rgba(0, 229, 255, 0.5)' : '1.5px solid rgba(225, 29, 72, 0.5)';
        toast.style.boxShadow = type === 'success' ? '0 10px 30px rgba(0, 229, 255, 0.15)' : '0 10px 30px rgba(225, 29, 72, 0.15)';
        toast.style.borderRadius = '12px';
        toast.style.padding = '18px 24px';
        toast.style.color = '#fff';
        toast.style.fontFamily = "'Inter', sans-serif";
        toast.style.fontSize = '1rem';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '12px';
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
        toast.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';

        const iconSvg = type === 'success' 
            ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
            : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

        toast.innerHTML = `${iconSvg} <span style="font-weight: 500;">${message}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        }, 50);

        setTimeout(() => {
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    };
    
    // --- 1. Header Scroll Effect ---
    const header = document.getElementById('main-header');
    
    const handleScroll = () => {
        if (!header) return;
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    if (header) {
        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Run initially in case of refresh
    }

    // --- 2. Scroll Reveal Animations (Intersection Observer) ---
    const animatedElements = document.querySelectorAll('.fade-in-up, .reveal-3d-fold, .reveal-3d-flip-left, .reveal-3d-flip-right, .reveal-3d-pop, .reveal-3d-roll');
    
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appeared');
            } else {
                // Keep the appeared class permanently ONLY for the Scope Planner layout to prevent re-triggering glitches,
                // while letting all other elements re-animate beautifully when scrolling up and down!
                if (!entry.target.classList.contains('estimator-layout')) {
                    entry.target.classList.remove('appeared');
                }
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
    const initEstimator = () => {
        const currencySelect = document.getElementById('currency-select');
        const projectForm = document.getElementById('project-estimator-form');
        
        if (!currencySelect || !projectForm) return;

        const serviceInputs = document.querySelectorAll('.service-checkbox');
        const budgetRange = document.getElementById('budget-range');
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
            AED: { symbol: 'AED ', min: 1000, max: 50000, step: 500, default: 4000 },
            INR: { symbol: '₹', min: 20000, max: 1000000, step: 5000, default: 80000 },
            USD: { symbol: '$', min: 300, max: 20000, step: 100, default: 1200 }
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
                showToast('Please enter your name.', 'error');
                return;
            }
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showToast('Please enter a valid email address.', 'error');
                return;
            }
            if (!phone || !/^[+]?[0-9\s\-()]{7,20}$/.test(phone)) {
                showToast('Please enter a valid phone number (8-15 digits).', 'error');
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

            // Submit proposal silently via FormSubmit AJAX API using URLSearchParams
            const params = new URLSearchParams();
            params.append('name', name);
            params.append('email', email);
            params.append('phone', phone);
            params.append('_subject', "Custom Project Proposal - " + name);
            params.append('message', message);

            fetch('https://formsubmit.co/ajax/teamwebbranding@gmail.com', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: params
            })
            .then(response => response.json())
            .then(data => {
                console.log("FormSubmit Response:", data);
                showToast("Thank you! Your custom proposal request has been submitted successfully.", "success");
                try {
                    projectForm.reset();
                } catch(e) {}
            })
            .catch(error => {
                console.error("FormSubmit Error:", error);
                showToast("Something went wrong, please try again or contact us directly!", "error");
                alert("Submission failed. Please contact us directly at teamwebbranding@gmail.com");
            });
        };

        projectForm.addEventListener('submit', handleEstimatorSubmit);
    };
    initEstimator();

    // --- 5. Interactive 3D ShapeGrid Backdrop (Azza Duality Style) ---
    const initShapeGrid = () => {
        const canvas = document.getElementById('shapegrid-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const heroSection = document.getElementById('home');
        
        const direction = 'diagonal'; // up, down, left, right, diagonal
        const speed = 0.26;
        const borderColor = '#4c3d67';
        const hoverFillColor = '#3d254c';
        const squareSize = 40;
        const shape = 'hexagon'; // square, hexagon, circle, triangle
        const hoverTrailAmount = 2; // Fading hover trail cell count

        let width = canvas.width = heroSection.offsetWidth;
        let height = canvas.height = heroSection.offsetHeight;
        
        let numSquaresX = Math.ceil(width / squareSize) + 1;
        let numSquaresY = Math.ceil(height / squareSize) + 1;
        
        const gridOffset = { x: 0, y: 0 };
        let hoveredSquare = null;
        const trailCells = [];
        const cellOpacities = new Map();

        const isHex = shape === 'hexagon';
        const isTri = shape === 'triangle';
        const hexHoriz = squareSize * 1.5;
        const hexVert = squareSize * Math.sqrt(3);

        const resizeCanvas = () => {
            width = canvas.width = heroSection.offsetWidth;
            height = canvas.height = heroSection.offsetHeight;
            numSquaresX = Math.ceil(width / squareSize) + 1;
            numSquaresY = Math.ceil(height / squareSize) + 1;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const drawHex = (cx, cy, size) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const vx = cx + size * Math.cos(angle);
                const vy = cy + size * Math.sin(angle);
                if (i === 0) ctx.moveTo(vx, vy);
                else ctx.lineTo(vx, vy);
            }
            ctx.closePath();
        };

        const drawCircle = (cx, cy, size) => {
            ctx.beginPath();
            ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
            ctx.closePath();
        };

        const drawTriangle = (cx, cy, size, flip) => {
            ctx.beginPath();
            if (flip) {
                ctx.moveTo(cx, cy + size / 2);
                ctx.lineTo(cx + size / 2, cy - size / 2);
                ctx.lineTo(cx - size / 2, cy - size / 2);
            } else {
                ctx.moveTo(cx, cy - size / 2);
                ctx.lineTo(cx + size / 2, cy + size / 2);
                ctx.lineTo(cx - size / 2, cy + size / 2);
            }
            ctx.closePath();
        };

        const drawGrid = () => {
            ctx.clearRect(0, 0, width, height);

            if (isHex) {
                const colShift = Math.floor(gridOffset.x / hexHoriz);
                const offsetX = ((gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz;
                const offsetY = ((gridOffset.y % hexVert) + hexVert) % hexVert;

                const cols = Math.ceil(width / hexHoriz) + 3;
                const rows = Math.ceil(height / hexVert) + 3;

                for (let col = -2; col < cols; col++) {
                    for (let row = -2; row < rows; row++) {
                        const cx = col * hexHoriz + offsetX;
                        const cy = row * hexVert + ((col + colShift) % 2 !== 0 ? hexVert / 2 : 0) + offsetY;

                        const cellKey = `${col},${row}`;
                        const alpha = cellOpacities.get(cellKey);
                        if (alpha) {
                            ctx.globalAlpha = alpha;
                            drawHex(cx, cy, squareSize);
                            ctx.fillStyle = hoverFillColor;
                            ctx.fill();
                            ctx.globalAlpha = 1;
                        }

                        drawHex(cx, cy, squareSize);
                        ctx.strokeStyle = borderColor;
                        ctx.stroke();
                    }
                }
            } else if (isTri) {
                const halfW = squareSize / 2;
                const colShift = Math.floor(gridOffset.x / halfW);
                const rowShift = Math.floor(gridOffset.y / squareSize);
                const offsetX = ((gridOffset.x % halfW) + halfW) % halfW;
                const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;

                const cols = Math.ceil(width / halfW) + 4;
                const rows = Math.ceil(height / squareSize) + 4;

                for (let col = -2; col < cols; col++) {
                    for (let row = -2; row < rows; row++) {
                        const cx = col * halfW + offsetX;
                        const cy = row * squareSize + squareSize / 2 + offsetY;
                        const flip = ((col + colShift + row + rowShift) % 2 + 2) % 2 !== 0;

                        const cellKey = `${col},${row}`;
                        const alpha = cellOpacities.get(cellKey);
                        if (alpha) {
                            ctx.globalAlpha = alpha;
                            drawTriangle(cx, cy, squareSize, flip);
                            ctx.fillStyle = hoverFillColor;
                            ctx.fill();
                            ctx.globalAlpha = 1;
                        }

                        drawTriangle(cx, cy, squareSize, flip);
                        ctx.strokeStyle = borderColor;
                        ctx.stroke();
                    }
                }
            } else if (shape === 'circle') {
                const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
                const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;

                const cols = Math.ceil(width / squareSize) + 3;
                const rows = Math.ceil(height / squareSize) + 3;

                for (let col = -2; col < cols; col++) {
                    for (let row = -2; row < rows; row++) {
                        const cx = col * squareSize + squareSize / 2 + offsetX;
                        const cy = row * squareSize + squareSize / 2 + offsetY;

                        const cellKey = `${col},${row}`;
                        const alpha = cellOpacities.get(cellKey);
                        if (alpha) {
                            ctx.globalAlpha = alpha;
                            drawCircle(cx, cy, squareSize);
                            ctx.fillStyle = hoverFillColor;
                            ctx.fill();
                            ctx.globalAlpha = 1;
                        }

                        drawCircle(cx, cy, squareSize);
                        ctx.strokeStyle = borderColor;
                        ctx.stroke();
                    }
                }
            } else {
                const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
                const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;

                const cols = Math.ceil(width / squareSize) + 3;
                const rows = Math.ceil(height / squareSize) + 3;

                for (let col = -2; col < cols; col++) {
                    for (let row = -2; row < rows; row++) {
                        const sx = col * squareSize + offsetX;
                        const sy = row * squareSize + offsetY;

                        const cellKey = `${col},${row}`;
                        const alpha = cellOpacities.get(cellKey);
                        if (alpha) {
                            ctx.globalAlpha = alpha;
                            ctx.fillStyle = hoverFillColor;
                            ctx.fillRect(sx, sy, squareSize, squareSize);
                            ctx.globalAlpha = 1;
                        }

                        ctx.strokeStyle = borderColor;
                        ctx.strokeRect(sx, sy, squareSize, squareSize);
                    }
                }
            }

            // Radial vignette gradient to fade grid elegantly into Azza obsidian black at borders
            const gradient = ctx.createRadialGradient(
                width / 2,
                height / 2,
                0,
                width / 2,
                height / 2,
                Math.sqrt(width ** 2 + height ** 2) / 2
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(1, '#120F17');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        };

        const updateCellOpacities = () => {
            const targets = new Map();

            if (hoveredSquare) {
                targets.set(`${hoveredSquare.x},${hoveredSquare.y}`, 1);
            }

            if (hoverTrailAmount > 0) {
                for (let i = 0; i < trailCells.length; i++) {
                    const t = trailCells[i];
                    const key = `${t.x},${t.y}`;
                    if (!targets.has(key)) {
                        targets.set(key, (trailCells.length - i) / (trailCells.length + 1));
                    }
                }
            }

            for (const [key] of targets) {
                if (!cellOpacities.has(key)) {
                    cellOpacities.set(key, 0);
                }
            }

            for (const [key, opacity] of cellOpacities) {
                const target = targets.get(key) || 0;
                const next = opacity + (target - opacity) * 0.15;
                if (next < 0.005) {
                    cellOpacities.delete(key);
                } else {
                    cellOpacities.set(key, next);
                }
            }
        };

        let requestRef = null;
        let isVisible = true;

        const updateAnimation = () => {
            if (!isVisible) return;
            const effectiveSpeed = Math.max(speed, 0.1);
            const wrapX = isHex ? hexHoriz * 2 : squareSize;
            const wrapY = isHex ? hexVert : isTri ? squareSize * 2 : squareSize;

            switch (direction) {
                case 'right':
                    gridOffset.x = (gridOffset.x - effectiveSpeed + wrapX) % wrapX;
                    break;
                case 'left':
                    gridOffset.x = (gridOffset.x + effectiveSpeed + wrapX) % wrapX;
                    break;
                case 'up':
                    gridOffset.y = (gridOffset.y + effectiveSpeed + wrapY) % wrapY;
                    break;
                case 'down':
                    gridOffset.y = (gridOffset.y - effectiveSpeed + wrapY) % wrapY;
                    break;
                case 'diagonal':
                    gridOffset.x = (gridOffset.x - effectiveSpeed + wrapX) % wrapX;
                    gridOffset.y = (gridOffset.y - effectiveSpeed + wrapY) % wrapY;
                    break;
                default:
                    break;
            }

            updateCellOpacities();
            drawGrid();
            requestRef = requestAnimationFrame(updateAnimation);
        };

        const updateHover = (clientX, clientY) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = clientX - rect.left;
            const mouseY = clientY - rect.top;

            if (isHex) {
                const colShift = Math.floor(gridOffset.x / hexHoriz);
                const offsetX = ((gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz;
                const offsetY = ((gridOffset.y % hexVert) + hexVert) % hexVert;
                const adjustedX = mouseX - offsetX;
                const adjustedY = mouseY - offsetY;

                const col = Math.round(adjustedX / hexHoriz);
                const rowOffset = (col + colShift) % 2 !== 0 ? hexVert / 2 : 0;
                const row = Math.round((adjustedY - rowOffset) / hexVert);

                if (!hoveredSquare || hoveredSquare.x !== col || hoveredSquare.y !== row) {
                    if (hoveredSquare && hoverTrailAmount > 0) {
                        trailCells.unshift({ ...hoveredSquare });
                        if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount;
                    }
                    hoveredSquare = { x: col, y: row };
                }
            } else if (isTri) {
                const halfW = squareSize / 2;
                const offsetX = ((gridOffset.x % halfW) + halfW) % halfW;
                const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
                const adjustedX = mouseX - offsetX;
                const adjustedY = mouseY - offsetY;

                const col = Math.round(adjustedX / halfW);
                const row = Math.floor(adjustedY / squareSize);

                if (!hoveredSquare || hoveredSquare.x !== col || hoveredSquare.y !== row) {
                    if (hoveredSquare && hoverTrailAmount > 0) {
                        trailCells.unshift({ ...hoveredSquare });
                        if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount;
                    }
                    hoveredSquare = { x: col, y: row };
                }
            } else if (shape === 'circle') {
                const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
                const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;

                const adjustedX = mouseX - offsetX;
                const adjustedY = mouseY - offsetY;

                const col = Math.round(adjustedX / squareSize);
                const row = Math.round(adjustedY / squareSize);

                if (!hoveredSquare || hoveredSquare.x !== col || hoveredSquare.y !== row) {
                    if (hoveredSquare && hoverTrailAmount > 0) {
                        trailCells.unshift({ ...hoveredSquare });
                        if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount;
                    }
                    hoveredSquare = { x: col, y: row };
                }
            } else {
                const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
                const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;

                const adjustedX = mouseX - offsetX;
                const adjustedY = mouseY - offsetY;

                const col = Math.floor(adjustedX / squareSize);
                const row = Math.floor(adjustedY / squareSize);

                if (!hoveredSquare || hoveredSquare.x !== col || hoveredSquare.y !== row) {
                    if (hoveredSquare && hoverTrailAmount > 0) {
                        trailCells.unshift({ ...hoveredSquare });
                        if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount;
                    }
                    hoveredSquare = { x: col, y: row };
                }
            }
        };

        const handleMouseMove = (event) => {
            updateHover(event.clientX, event.clientY);
        };

        const handleMouseLeave = () => {
            if (hoveredSquare && hoverTrailAmount > 0) {
                trailCells.unshift({ ...hoveredSquare });
                if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount;
            }
            hoveredSquare = null;
        };

        const handleTouchMove = (event) => {
            if (event.touches.length > 0) {
                updateHover(event.touches[0].clientX, event.touches[0].clientY);
            }
        };

        // Attach mouse & touch events to heroSection instead of canvas so canvas can remain pointer-events: none!
        heroSection.addEventListener('mousemove', handleMouseMove);
        heroSection.addEventListener('mouseleave', handleMouseLeave);
        heroSection.addEventListener('touchstart', handleTouchMove, { passive: true });
        heroSection.addEventListener('touchmove', handleTouchMove, { passive: true });
        heroSection.addEventListener('touchend', handleMouseLeave, { passive: true });
        heroSection.addEventListener('touchcancel', handleMouseLeave, { passive: true });
        
        // Use IntersectionObserver to completely halt requestAnimationFrame loops when scrolled out of view to save battery and stop iPhone heating!
        const heroObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;
                if (isVisible) {
                    if (!requestRef) {
                        requestRef = requestAnimationFrame(updateAnimation);
                    }
                } else {
                    if (requestRef) {
                        cancelAnimationFrame(requestRef);
                        requestRef = null;
                    }
                }
            });
        }, { threshold: 0.02 });
        heroObserver.observe(heroSection);

        return () => {
            heroObserver.disconnect();
            window.removeEventListener('resize', resizeCanvas);
            if (requestRef) cancelAnimationFrame(requestRef);
            heroSection.removeEventListener('mousemove', handleMouseMove);
            heroSection.removeEventListener('mouseleave', handleMouseLeave);
            heroSection.removeEventListener('touchstart', handleTouchMove);
            heroSection.removeEventListener('touchmove', handleTouchMove);
            heroSection.removeEventListener('touchend', handleMouseLeave);
            heroSection.removeEventListener('touchcancel', handleMouseLeave);
        };
    };
    initShapeGrid();

    // --- 5b. Interactive TextPressure Variable Font Title (React Bits Port) ---
    const initTextPressure = () => {
        const title = document.querySelector('.hero-title');
        if (!title) return;

        const spans = [];

        // Helper to recursively wrap text node characters in spans to preserve HTML structure
        const wrapTextNodes = (element) => {
            const nodes = Array.from(element.childNodes);
            nodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent;
                    // Split text into words and whitespace to prevent breaking mid-word on mobile
                    const parts = text.split(/(\s+)/);
                    const frag = document.createDocumentFragment();
                    
                    parts.forEach(part => {
                        if (part.trim() === '') {
                            // Whitespace node, keep it as is
                            frag.appendChild(document.createTextNode(part));
                        } else {
                            // A word node! Wrap in a word span to keep it together
                            const wordSpan = document.createElement('span');
                            wordSpan.className = 'pressure-word';
                            wordSpan.style.display = 'inline-block';
                            wordSpan.style.whiteSpace = 'nowrap';
                            
                            const chars = part.split('');
                            chars.forEach(char => {
                                const charSpan = document.createElement('span');
                                charSpan.className = 'pressure-char';
                                charSpan.textContent = char;
                                charSpan.style.display = 'inline-block';
                                charSpan.style.transition = 'font-variation-settings 0.12s ease-out';
                                spans.push(charSpan);
                                wordSpan.appendChild(charSpan);
                            });
                            frag.appendChild(wordSpan);
                        }
                    });
                    
                    node.parentNode.replaceChild(frag, node);
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName !== 'BR') {
                        wrapTextNodes(node);
                    }
                }
            });
        };

        wrapTextNodes(title);

        // Tracking coordinates
        const mouse = { x: 0, y: 0 };
        const cursor = { x: 0, y: 0 };
        let isActive = false;
        let inactivityTimeout = null;
        let ambientTime = 0;
        
        let titleRect = title.getBoundingClientRect();
        mouse.x = cursor.x = window.innerWidth / 2;
        mouse.y = cursor.y = titleRect.top + titleRect.height / 2;

        // Caching relative offsets of character spans to eliminate layout thrashing
        let spanCoords = [];
        const cacheCoords = () => {
            // Temporarily set to baseline so we get the resting coordinates
            spans.forEach(span => {
                span.style.fontVariationSettings = `'wght' 200, 'wdth' 100, 'ital' 0`;
            });
            // Force layout reflow once
            titleRect = title.getBoundingClientRect();
            
            spanCoords = spans.map(span => {
                const rect = span.getBoundingClientRect();
                return {
                    span: span,
                    // Center coordinates relative to the title container
                    relX: (rect.left + rect.width / 2) - titleRect.left,
                    relY: (rect.top + rect.height / 2) - titleRect.top
                };
            });
        };

        // Cache coordinates when fonts are loaded or immediately
        if (document.fonts) {
            document.fonts.ready.then(() => {
                cacheCoords();
            });
        } else {
            setTimeout(cacheCoords, 100);
        }

        const activatePointer = () => {
            isActive = true;
            if (inactivityTimeout) clearTimeout(inactivityTimeout);
            // On mobile viewports, go back to ambient mode after 2.5 seconds of no new coordinates
            inactivityTimeout = setTimeout(() => {
                isActive = false;
            }, 2500);
        };

        const handleMouseMove = (e) => {
            activatePointer();
            cursor.x = e.clientX;
            cursor.y = e.clientY;
        };

        const handleTouchMove = (e) => {
            if (e.touches.length > 0) {
                activatePointer();
                cursor.x = e.touches[0].clientX;
                cursor.y = e.touches[0].clientY;
            }
        };

        const handleMouseLeave = () => {
            isActive = false;
            if (inactivityTimeout) clearTimeout(inactivityTimeout);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('mouseleave', handleMouseLeave);
        
        // Let touches directly on the title trigger it instantly
        title.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                activatePointer();
                cursor.x = e.touches[0].clientX;
                cursor.y = e.touches[0].clientY;
            }
        }, { passive: true });

        // Enhanced mathematically bounded scaling function with ease-out quadratic fallback
        const getAttr = (distance, maxD, minVal, maxVal) => {
            const ratio = Math.max(0, Math.min(1, 1 - distance / maxD));
            const easeRatio = 1 - Math.pow(1 - ratio, 2); // Quadratic ease-out for elasticity
            return minVal + (maxVal - minVal) * easeRatio;
        };

        let rafId = null;
        let lastWidth = window.innerWidth;
        let isTextPressureVisible = true;

        const animate = () => {
            if (!isTextPressureVisible) return;
            titleRect = title.getBoundingClientRect();
            
            // Check viewport characteristics
            const isMobile = window.innerWidth < 768;
            
            // maxDist floor avoids extreme squishing when screen width scales down
            const maxDist = Math.max(isMobile ? 450 : 650, titleRect.width * 0.85);

            // Ambient breathing wave when there is no active physical touch/hover
            if (!isActive) {
                ambientTime += isMobile ? 0.008 : 0.012; // Breathing rate
                cursor.x = titleRect.left + titleRect.width / 2 + Math.sin(ambientTime) * (titleRect.width * 0.35);
                cursor.y = titleRect.top + titleRect.height / 2 + Math.cos(ambientTime * 0.6) * (isMobile ? 8 : 15);
            }

            // Easing physics
            mouse.x += (cursor.x - mouse.x) / 10;
            mouse.y += (cursor.y - mouse.y) / 10;

            // Apply font variation settings from precalculated cached offsets relative to titleRect
            spanCoords.forEach(item => {
                const charX = titleRect.left + item.relX;
                const charY = titleRect.top + item.relY;

                const dx = charX - mouse.x;
                const dy = charY - mouse.y;
                const d = Math.sqrt(dx * dx + dy * dy);

                // Define limits to prevent over-stretching or over-squishing
                // Width range: 25 to 190 (desktop), 45 to 125 (mobile to prevent horizontal overflow)
                const minWdth = isMobile ? 45 : 25;
                const maxWdth = isMobile ? 120 : 190;
                
                // Weight range: 150 to 900 (desktop), 250 to 800 (mobile)
                const minWght = isMobile ? 250 : 150;
                const maxWght = isMobile ? 800 : 900;

                const wdth = Math.floor(getAttr(d, maxDist, minWdth, maxWdth));
                const wght = Math.floor(getAttr(d, maxDist, minWght, maxWght));
                const italVal = getAttr(d, maxDist, 0, 1).toFixed(2);

                const settings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`;
                item.span.style.fontVariationSettings = settings;
            });

            rafId = requestAnimationFrame(animate);
        };

        // Use IntersectionObserver to stop text pressure calculations when out of view!
        const textObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isTextPressureVisible = entry.isIntersecting;
                if (isTextPressureVisible) {
                    if (!rafId) {
                        rafId = requestAnimationFrame(animate);
                    }
                } else {
                    if (rafId) {
                        cancelAnimationFrame(rafId);
                        rafId = null;
                    }
                }
            });
        }, { threshold: 0.02 });
        textObserver.observe(title);

        window.addEventListener('resize', () => {
            if (window.innerWidth !== lastWidth) {
                lastWidth = window.innerWidth;
                cacheCoords();
            }
        });
    };
    initTextPressure();

    // --- 6. Dynamic 3D Tilt Effect (Mouse Hover & Mobile Gyroscope) ---
    const init3DTilt = () => {
        const tiltCards = document.querySelectorAll('.service-card, .portfolio-card, .founder-card-right, .founder-card-left, .visual-canvas');
        let isTactileActive = false;
        
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
                    const img = entry.target.querySelector('.founder-img, .portfolio-img, .hero-visual-img');
                    if (img) img.style.transform = '';
                }
            });
        }, { threshold: 0.1 });

        tiltCards.forEach(card => visibilityObserver.observe(card));

        // Tooltips have been disabled per user request
        /*
        // Create the figcaption floating caption elements dynamically for any card with a data-caption
        tiltCards.forEach(card => {
            const captionText = card.getAttribute('data-caption');
            if (captionText) {
                if (!card.querySelector('.tilted-card-caption')) {
                    const captionElement = document.createElement('figcaption');
                    captionElement.className = 'tilted-card-caption';
                    captionElement.innerText = captionText;
                    card.appendChild(captionElement);
                }
            }
        });
        */

        // 1. Desktop Mouse Move Hover Tilt
        tiltCards.forEach(card => {
            const captionElement = card.querySelector('.tilted-card-caption');
            let lastY = 0;
            let rotateFigcaption = 0;

            card.addEventListener('mousemove', (e) => {
                if (window.matchMedia('(pointer: coarse)').matches) return; // Skip on mobile devices

                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const offsetX = e.clientX - rect.left - centerX;
                const offsetY = e.clientY - rect.top - centerY;
                
                const rotateAmplitude = 6; // Controls how much the card tilts (matching TiltedCard rotateAmplitude)
                const rotateX = (offsetY / centerY) * -rotateAmplitude;
                const rotateY = (offsetX / centerX) * rotateAmplitude;
                
                // Calculate vertical velocity for tooltip rotation matching React Bits
                const velocityY = offsetY - lastY;
                rotateFigcaption = -velocityY * 0.6;
                rotateFigcaption = Math.min(Math.max(rotateFigcaption, -15), 15);
                lastY = offsetY;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
                
                const shadowX = -rotateY * 1.5;
                const shadowY = rotateX * 1.5;
                card.style.boxShadow = `${shadowX}px ${shadowY}px 30px rgba(168, 134, 205, 0.12), var(--shadow-premium)`;
                
                const img = card.querySelector('.founder-img, .portfolio-img, .hero-visual-img');
                if (img) {
                    img.style.transform = `scale(1.08) translate3d(${-rotateY * 0.4}px, ${-rotateX * 0.4}px, 40px)`;
                }
                
                const mesh = card.querySelector('.visual-mesh');
                if (mesh) {
                    mesh.style.transform = `translate3d(${rotateY * 0.5}px, ${-rotateX * 0.5}px, -20px)`;
                }

                // Inner elements 3D parallax inside service cards
                const icon = card.querySelector('.service-icon-box');
                if (icon) {
                    icon.style.transform = `translate3d(${-rotateY * 0.5}px, ${-rotateX * 0.5}px, 20px)`;
                }
                
                const num = card.querySelector('.service-card-num');
                if (num) {
                    num.style.transform = `translate3d(${rotateY * 0.3}px, ${rotateX * 0.3}px, 10px)`;
                }

                // 3D parallax for case study overlay contents (matching overlayContent)
                const overlay = card.querySelector('.portfolio-overlay');
                if (overlay) {
                    overlay.style.transform = `translate3d(${-rotateY * 0.4}px, ${-rotateX * 0.4}px, 30px)`;
                }

                // Follow tooltip
                if (captionElement) {
                    captionElement.style.opacity = '1';
                    captionElement.style.transform = `translate3d(${x + 12}px, ${y + 12}px, 50px) rotate(${rotateFigcaption}deg)`;
                }
            });
            
            card.addEventListener('mouseleave', () => {
                if (window.matchMedia('(pointer: coarse)').matches) return;
                card.style.transform = '';
                card.style.boxShadow = '';
                
                const img = card.querySelector('.founder-img, .portfolio-img, .hero-visual-img');
                if (img) img.style.transform = '';
                
                const mesh = card.querySelector('.visual-mesh');
                if (mesh) mesh.style.transform = '';

                const icon = card.querySelector('.service-icon-box');
                if (icon) icon.style.transform = '';
                
                const num = card.querySelector('.service-card-num');
                if (num) num.style.transform = '';

                const overlay = card.querySelector('.portfolio-overlay');
                if (overlay) overlay.style.transform = '';

                if (captionElement) {
                    captionElement.style.opacity = '0';
                    captionElement.style.transform = '';
                }
            });
        });

        // 2. Mobile Touch & Drag 3D Tilt (Silky Tactile Mobile Enhancements)
        tiltCards.forEach(card => {
            const captionElement = card.querySelector('.tilted-card-caption');
            let touchScheduled = false;
            let startX = 0;
            let startY = 0;
            let isDragging = false;
            let isVerticalScroll = false;
            let lastY = 0;
            let rotateFigcaption = 0;

            const handleTouchStart = (e) => {
                if (!window.matchMedia('(pointer: coarse)').matches) return;
                const touch = e.touches[0];
                startX = touch.pageX;
                startY = touch.pageY;
                isDragging = true;
                isVerticalScroll = false;
                
                isTactileActive = true;
                card.classList.add('active-tilt');
                
                updateTilt(touch);
            };

            const handleTouchMove = (e) => {
                if (!window.matchMedia('(pointer: coarse)').matches) return;
                if (!isDragging) return;
                const touch = e.touches[0];
                
                const dx = touch.pageX - startX;
                const dy = touch.pageY - startY;
                
                // If scroll direction is not determined yet, check if vertical swipe is prominent
                if (!isVerticalScroll && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) {
                    isVerticalScroll = true;
                }
                
                // If scrolling vertically, let the browser handle vertical page scroll naturally (do NOT preventDefault)
                if (isVerticalScroll) {
                    updateTilt(touch);
                    return;
                }
                
                // If dragging horizontally or gesture is tilt-focused, prevent default to avoid scroll interference
                if (e.cancelable) {
                    e.preventDefault();
                }
                
                updateTilt(touch);
            };

            const updateTilt = (touch) => {
                const rect = card.getBoundingClientRect();
                
                // Document-relative page coordinates to prevent coordinate jump glitches
                const absoluteCardX = rect.left + (window.scrollX || window.pageXOffset);
                const absoluteCardY = rect.top + (window.scrollY || window.pageYOffset);
                const x = Math.min(Math.max(touch.pageX - absoluteCardX, 0), rect.width);
                const y = Math.min(Math.max(touch.pageY - absoluteCardY, 0), rect.height);
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const maxRotationX = 6; // 3D tilt response
                const maxRotationY = 6;
                
                const rotateX = ((centerY - y) / centerY) * maxRotationX;
                const rotateY = ((x - centerX) / centerX) * maxRotationY;

                // Track touch movement velocity for caption rotation on mobile too
                const offsetY = y - centerY;
                const velocityY = offsetY - lastY;
                rotateFigcaption = -velocityY * 0.6;
                rotateFigcaption = Math.min(Math.max(rotateFigcaption, -15), 15);
                lastY = offsetY;

                if (touchScheduled) return;
                touchScheduled = true;
                
                window.requestAnimationFrame(() => {
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                    
                    const shadowX = -rotateY * 1.5;
                    const shadowY = rotateX * 1.5;
                    card.style.boxShadow = `${shadowX}px ${shadowY}px 30px var(--primary-glow), var(--shadow-premium)`;
                    
                    const img = card.querySelector('.founder-img, .portfolio-img, .hero-visual-img');
                    if (img) {
                        img.style.transform = `scale(1.08) translate3d(${-rotateY * 0.4}px, ${-rotateX * 0.4}px, 30px)`;
                    }

                    // Mobile service card elements parallax
                    const icon = card.querySelector('.service-icon-box');
                    if (icon) {
                        icon.style.transform = `translate3d(${-rotateY * 0.5}px, ${-rotateX * 0.5}px, 15px)`;
                    }
                    const num = card.querySelector('.service-card-num');
                    if (num) {
                        num.style.transform = `translate3d(${rotateY * 0.3}px, ${rotateX * 0.3}px, 5px)`;
                    }

                    // Mobile follow tooltip (placed slightly higher so the finger doesn't block it)
                    // Disabled tooltip on touch as per user request
                    /*
                    if (captionElement) {
                        captionElement.style.opacity = '1';
                        captionElement.style.transform = `translate3d(${x + 12}px, ${y - 32}px, 50px) rotate(${rotateFigcaption}deg)`;
                    }
                    */
                    touchScheduled = false;
                });
            };

            const resetTouch = () => {
                if (!window.matchMedia('(pointer: coarse)').matches) return;
                
                isDragging = false;
                isVerticalScroll = false;
                isTactileActive = false;
                card.classList.remove('active-tilt');
                
                window.requestAnimationFrame(() => {
                    card.style.transform = '';
                    card.style.boxShadow = '';
                    const img = card.querySelector('.founder-img, .portfolio-img, .hero-visual-img');
                    if (img) img.style.transform = '';

                    const icon = card.querySelector('.service-icon-box');
                    if (icon) icon.style.transform = '';
                    
                    const num = card.querySelector('.service-card-num');
                    if (num) num.style.transform = '';

                    if (captionElement) {
                        captionElement.style.opacity = '0';
                        captionElement.style.transform = '';
                    }
                });
            };

            card.addEventListener('touchstart', handleTouchStart, { passive: false });
            card.addEventListener('touchmove', handleTouchMove, { passive: false });
            card.addEventListener('touchend', resetTouch, { passive: false });
            card.addEventListener('touchcancel', resetTouch, { passive: false });
        });

        // 2. Mobile Gyroscope Device Orientation Tilt - Disabled at user request
        /*
        if (window.DeviceOrientationEvent) {
            // Gyroscope tilt logic disabled to prevent interference with explicit touch gestures
        }
        */


    };
    init3DTilt();

    // --- 7. Scroll-Bound 3D & Parallax Scrolling (Optimized) ---
    const initScrollParallax = () => {
        const orbs = document.querySelectorAll('.orb-primary, .orb-secondary, .orb-accent');
        const heroShape = document.querySelector('.hero-visual-img');
        
        let scrollParallaxScheduled = false;
        
        window.addEventListener('scroll', () => {
            if (scrollParallaxScheduled) return;
            
            scrollParallaxScheduled = true;
            window.requestAnimationFrame(() => {
                const scrolled = window.pageYOffset;
                
                // Move decorative background glowing blobs at variable slower speeds (depth effect)
                orbs.forEach((orb, index) => {
                    const speed = (index + 1) * 0.12;
                    orb.style.transform = `translate3d(0, ${scrolled * speed}px, 0)`;
                });
                
                // Subtly rotate and shift hero 3D asset on scroll
                if (heroShape) {
                    // Check scroll range directly instead of calling getBoundingClientRect to prevent layout thrashing
                    if (scrolled < 1200) {
                        const speed = -0.2;
                        const rotationSpeed = 0.04;
                        heroShape.style.transform = `translate3d(0, ${scrolled * speed}px, 50px) rotate(${scrolled * rotationSpeed}deg)`;
                    }
                }
                
                scrollParallaxScheduled = false;
            });
        }, { passive: true });
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
            toggleBtn.classList.toggle('active', isActive);
            
            if (isActive) {
                document.body.style.overflow = 'hidden'; // Stop background scrolling
            } else {
                document.body.style.overflow = ''; // Resume background scrolling
            }
        };
        
        toggleBtn.addEventListener('click', () => {
            toggleMenu();
            
            // Add unique tactile spring scaling and glowing expansion ring tap animation on mobile
            toggleBtn.classList.add('menu-tap-pulse');
            toggleBtn.addEventListener('animationend', () => {
                toggleBtn.classList.remove('menu-tap-pulse');
            }, { once: true });
        });
        
        // Auto-close menu when any navigation link is clicked
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                toggleBtn.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    };
    initMobileMenu();

    // --- 9. Hero Stats Count-Up Animation (Intersection Observer) ---
    const initHeroStatsCountUp = () => {
        const statsSection = document.querySelector('.hero-stats');
        const statNums = document.querySelectorAll('.stat-num');
        if (!statsSection || statNums.length === 0) return;

        let activeAnimations = new Map();

        const animateCount = (element) => {
            // Cancel any currently running count-up animation for this element to prevent overlapping loops
            if (activeAnimations.has(element)) {
                cancelAnimationFrame(activeAnimations.get(element));
            }

            const target = parseInt(element.getAttribute('data-target'), 10);
            const suffix = element.getAttribute('data-suffix') || '';
            const duration = 1800; // 1.8 seconds custom sweep
            const startTime = performance.now();

            const updateCount = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease-out quad deceleration curve for a highly elastic, premium numerical sweep
                const easeProgress = 1 - Math.pow(1 - progress, 2);
                
                const currentValue = Math.floor(easeProgress * target);
                element.textContent = currentValue.toLocaleString() + suffix;

                if (progress < 1) {
                    const rafId = requestAnimationFrame(updateCount);
                    activeAnimations.set(element, rafId);
                } else {
                    element.textContent = target.toLocaleString() + suffix;
                    activeAnimations.delete(element);
                }
            };

            const firstRafId = requestAnimationFrame(updateCount);
            activeAnimations.set(element, firstRafId);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    statNums.forEach(num => animateCount(num));
                } else {
                    // Reset numbers to 0 instantly when scrolled out, so they sweep upward beautifully on scrolling back
                    statNums.forEach(num => {
                        if (activeAnimations.has(num)) {
                            cancelAnimationFrame(activeAnimations.get(num));
                            activeAnimations.delete(num);
                        }
                        const suffix = num.getAttribute('data-suffix') || '';
                        num.textContent = "0" + suffix;
                    });
                }
            });
        }, { threshold: 0.15 });

        observer.observe(statsSection);
    };
    initHeroStatsCountUp();

    // --- 9b. About Skills Graph Animation ---
    const initAboutSkillsAnimation = () => {
        const skillsSection = document.querySelector('.about-skills');
        const skillFills = document.querySelectorAll('.skill-fill');
        const skillPercents = document.querySelectorAll('.skill-percent');
        if (!skillsSection || skillFills.length === 0) return;

        let activeSkillAnimations = new Map();

        const animateSkillPercent = (element) => {
            if (activeSkillAnimations.has(element)) {
                cancelAnimationFrame(activeSkillAnimations.get(element));
            }

            const target = parseInt(element.getAttribute('data-target'), 10);
            const duration = 1500; // Match the 1.5s CSS transition
            const startTime = performance.now();

            const updatePercent = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Deceleration curve
                const easeProgress = 1 - Math.pow(1 - progress, 2);
                
                const currentValue = Math.floor(easeProgress * target);
                element.textContent = currentValue + '%';

                if (progress < 1) {
                    const rafId = requestAnimationFrame(updatePercent);
                    activeSkillAnimations.set(element, rafId);
                } else {
                    element.textContent = target + '%';
                    activeSkillAnimations.delete(element);
                }
            };

            const rafId = requestAnimationFrame(updatePercent);
            activeSkillAnimations.set(element, rafId);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Set fill widths to trigger CSS transition
                    skillFills.forEach(fill => {
                        const pct = fill.getAttribute('data-percent');
                        fill.style.width = pct + '%';
                    });
                    // Sweep numbers
                    skillPercents.forEach(percent => animateSkillPercent(percent));
                } else {
                    // Reset fills and numbers
                    skillFills.forEach(fill => {
                        fill.style.width = '0%';
                    });
                    skillPercents.forEach(percent => {
                        if (activeSkillAnimations.has(percent)) {
                            cancelAnimationFrame(activeSkillAnimations.get(percent));
                            activeSkillAnimations.delete(percent);
                        }
                        percent.textContent = '0%';
                    });
                }
            });
        }, { threshold: 0.15 });

        observer.observe(skillsSection);
    };
    initAboutSkillsAnimation();

    // --- 11. Custom Floating Pill Mobile Header ---
    const initFloatingPillHeader = () => {
        const btn = document.getElementById('ag-mobile-btn');
        const menu = document.getElementById('ag-mobile-menu');
        const iconMenu = document.getElementById('ag-icon-menu');
        const iconClose = document.getElementById('ag-icon-close');
        
        if(!btn || !menu) return; // Guard clause

        let isMenuOpen = false;

        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent conflicts
            isMenuOpen = !isMenuOpen;
            
            const header = document.getElementById('ag-custom-header');
            
            // Toggle active state for SVG animations and styling
            btn.classList.toggle('active', isMenuOpen);
            
            if (isMenuOpen) {
                if (header) header.classList.add('menu-open');
                menu.style.maxHeight = menu.scrollHeight + "px";
                menu.classList.add('is-open'); 
            } else {
                if (header) header.classList.remove('menu-open');
                menu.style.maxHeight = "0px";
                menu.classList.remove('is-open'); 
            }
            
            // Add unique tactile spring scaling and glowing expansion ring tap animation on mobile
            btn.classList.add('menu-tap-pulse');
            btn.addEventListener('animationend', () => {
                btn.classList.remove('menu-tap-pulse');
            }, { once: true });
        });

        // Close on outside click
        document.addEventListener('click', (event) => {
            const header = document.getElementById('ag-custom-header');
            if (isMenuOpen && header && !header.contains(event.target)) {
                btn.click();
            }
        });

        // Close when a link is clicked
        const links = menu.querySelectorAll('.ag-menu-item');
        links.forEach(link => {
            link.addEventListener('click', () => {
                if (isMenuOpen) {
                    btn.click();
                }
            });
        });
    };
    initFloatingPillHeader();

    // --- Interactive Mascot Flying Logic ---
    const initMascot = () => {
        const mascotContainer = document.querySelector('.mascot-container');
        if (!mascotContainer) return;

        // Reset CSS for JS positioning
        mascotContainer.style.bottom = 'auto';
        mascotContainer.style.right = 'auto';
        mascotContainer.style.transition = 'top 0.8s cubic-bezier(0.25, 1, 0.5, 1), left 0.8s cubic-bezier(0.25, 1, 0.5, 1)';

        let currentClosestTarget = null;
        const updateMascotPosition = () => {
            const ceoBot = document.getElementById('ceo-sales-bot');
            const isCeoBotVisible = ceoBot && ceoBot.classList.contains('visible');

            // Default bottom-right corner
            let defaultX = window.innerWidth - 120;
            let defaultY = window.innerHeight - 150;

            if (ceoBot) {
                // Sit on top of CEO bot avatar on bottom-left
                defaultX = 15;
                defaultY = window.innerHeight - 215;

                // Bind mascot visibility to CEO bot visibility status
                if (isCeoBotVisible) {
                    mascotContainer.style.opacity = '1';
                    mascotContainer.style.pointerEvents = 'auto';
                } else {
                    mascotContainer.style.opacity = '0';
                    mascotContainer.style.pointerEvents = 'none';
                }
            } else {
                // Standard visibility for pages without CEO bot
                mascotContainer.style.opacity = '1';
                mascotContainer.style.pointerEvents = 'auto';
            }
            
            // Elements to track
            const targets = document.querySelectorAll('.section-title, .industry-card, .service-card, .portfolio-card');
            const centerY = window.innerHeight / 2;
            
            let closestTarget = null;
            let minDistance = Infinity;

            targets.forEach(target => {
                const rect = target.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    const targetCenterY = rect.top + rect.height / 2;
                    const distance = Math.abs(centerY - targetCenterY);
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestTarget = target;
                    }
                }
            });

            // If a target is near the center, fly to it
            if (closestTarget && minDistance < 250) {
                const rect = closestTarget.getBoundingClientRect();
                // Sit on top-right of the element
                let targetX = rect.right - 80; 
                let targetY = rect.top - 90; 
                
                // On mobile, center the mascot above the card
                if (window.innerWidth < 768) {
                    targetX = rect.left + (rect.width / 2) - 45; // Center horizontally
                    targetY = rect.top - 70; // Slightly closer vertically due to scale down
                }
                
                // Keep within screen bounds
                targetX = Math.max(20, Math.min(targetX, window.innerWidth - 120));
                targetY = Math.max(20, Math.min(targetY, window.innerHeight - 150));

                mascotContainer.style.left = `${targetX}px`;
                mascotContainer.style.top = `${targetY}px`;
            } else {
                // Fly back to default
                mascotContainer.style.left = `${defaultX}px`;
                mascotContainer.style.top = `${defaultY}px`;
            }
            currentClosestTarget = closestTarget;
        };

        // Initial setup
        setTimeout(updateMascotPosition, 100);

        // Throttle scroll events
        let isScrolling = false;
        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    updateMascotPosition();
                    isScrolling = false;
                });
                isScrolling = true;
            }
            // Hide bubble on scroll
            if (bubble && bubble.classList.contains('show')) {
                bubble.classList.remove('show');
            }
        });

        window.addEventListener('resize', updateMascotPosition);

        // Add speech bubble
        const bubble = document.createElement('div');
        bubble.className = 'mascot-bubble';
        mascotContainer.appendChild(bubble);
        
        // Hide bubble when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!mascotContainer.contains(e.target) && bubble.classList.contains('show')) {
                bubble.classList.remove('show');
            }
        });

        let bubbleTimeout;
        mascotContainer.removeAttribute('onclick'); // Remove any HTML inline onclick
        
        mascotContainer.addEventListener('click', () => {
            clearTimeout(bubbleTimeout);
            let pitch = "Hello! I'm here to help you build something amazing. Click Book Now to chat!";
            
            if (currentClosestTarget) {
                const text = currentClosestTarget.innerText.toLowerCase();
                const className = currentClosestTarget.className.toLowerCase();
                
                if (text.includes('marketing') || text.includes('seo') || className.includes('service')) {
                    pitch = "Want to 10x your traffic? Let's talk about our Digital Marketing strategies!";
                } else if (text.includes('fashion') || text.includes('commerce') || text.includes('store')) {
                    pitch = "Ready to sell online? I can set up a high-converting E-Commerce store for you!";
                } else if (className.includes('portfolio') || text.includes('real estate') || text.includes('portal')) {
                    pitch = "Need a premium platform? Our custom web apps are lightning fast and secure!";
                } else if (className.includes('industry')) {
                    pitch = `Love what you see? We can build a complete solution for just AED 4,499!`;
                }
            }
            
            bubble.innerText = pitch;
            
            // Adjust bubble direction based on mascot screen position
            const rect = mascotContainer.getBoundingClientRect();
            if (rect.left < window.innerWidth / 2) {
                // Mascot on left half: Bubble grows towards right
                bubble.classList.remove('bubble-right');
                bubble.classList.add('bubble-left');
            } else {
                // Mascot on right half: Bubble grows towards left
                bubble.classList.remove('bubble-left');
                bubble.classList.add('bubble-right');
            }
            
            bubble.classList.add('show');
            
            bubbleTimeout = setTimeout(() => {
                bubble.classList.remove('show');
            }, 5000);
        });
    };
    initMascot();

    // --- 7. Additional Form Handlers (Lead & Audit Forms) ---
    const handleGenericFormSubmit = (e, title) => {
        e.preventDefault();
        const form = e.target;
        const name = form.querySelector('[name="name"]')?.value || '';
        const phone = form.querySelector('[name="phone"]')?.value || '';
        const email = form.querySelector('[name="email"]')?.value || '';
        const company = form.querySelector('[name="company"]')?.value || '';
        const service = form.querySelector('[name="service"]')?.value || '';
        const messageInput = form.querySelector('[name="message"]')?.value || '';

        let message = `Hi Hashir & The Web Branding Team,\n\nI would like to request a ${title}.\n\n💼 *My Details:*\n• Name: ${name}\n• Phone: ${phone}\n`;
        
        if (email) message += `• Email / Website: ${email}\n`;
        if (company) message += `• Company: ${company}\n`;
        if (service) message += `• Interested In: ${service}\n`;
        if (messageInput) message += `\n💬 *Additional Notes:*\n${messageInput}\n`;

        message += `\nLooking forward to hearing from you!`;

        if (!name) {
            showToast("Please enter your name.", "error");
            return;
        }
        if (!phone || !/^[+]?[0-9\s\-()]{7,20}$/.test(phone)) {
            showToast("Please enter a valid phone number (8-15 digits).", "error");
            return;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast("Please enter a valid email address.", "error");
            return;
        }
        if (form.querySelector('[name="service"]') && !service) {
            showToast("Please select a service from the dropdown.", "error");
            return;
        }

        // Submit form silently via FormSubmit AJAX API using URLSearchParams
        const params = new URLSearchParams();
        params.append('name', name);
        params.append('phone', phone);
        params.append('email', email);
        params.append('company', company);
        params.append('service', service);
        params.append('_subject', title + " Request - " + name);
        params.append('message', message);

        fetch('https://formsubmit.co/ajax/teamwebbranding@gmail.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: params
        })
        .then(response => response.json())
        .then(data => {
            console.log("FormSubmit Response:", data);
            showToast("Thank you! Your request has been submitted successfully.", "success");
            try {
                form.reset();
            } catch(e) {}
        })
        .catch(error => {
            console.error("FormSubmit Error:", error);
            showToast("Something went wrong, please try again or contact us directly!", "error");
            alert("Submission failed. Please contact us directly at teamwebbranding@gmail.com");
        });
    };

    const marketingLeadForm = document.getElementById('marketing-lead-form');
    if (marketingLeadForm) {
        marketingLeadForm.addEventListener('submit', (e) => handleGenericFormSubmit(e, 'Digital Marketing Audit'));
    }

    const marketingAuditForm = document.getElementById('marketing-audit-form');
    if (marketingAuditForm) {
        marketingAuditForm.addEventListener('submit', (e) => handleGenericFormSubmit(e, 'Free Marketing Consultation'));
    }

    const campaignLeadForm = document.getElementById('campaign-lead-form');
    if (campaignLeadForm) {
        campaignLeadForm.addEventListener('submit', (e) => handleGenericFormSubmit(e, 'Website Quote'));
    }
});
