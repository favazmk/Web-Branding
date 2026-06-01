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
    const animatedElements = document.querySelectorAll('.fade-in-up, .reveal-3d-fold, .reveal-3d-flip-left, .reveal-3d-flip-right, .reveal-3d-pop, .reveal-3d-roll');
    
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appeared');
            } else {
                entry.target.classList.remove('appeared');
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

    // --- 5. Interactive 3D ShapeGrid Backdrop (Azza Duality Style) ---
    const initShapeGrid = () => {
        const canvas = document.getElementById('shapegrid-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const heroSection = document.getElementById('home');
        
        const direction = 'diagonal'; // up, down, left, right, diagonal
        const speed = 0.5;
        const borderColor = '#2F293A'; // As requested
        const hoverFillColor = 'rgba(139, 61, 255, 0.12)'; // Premium Azza glowing brand violet!
        const squareSize = 40;
        const shape = 'hexagon'; // square, hexagon, circle, triangle
        const hoverTrailAmount = 4; // Fading hover trail cell count

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
            gradient.addColorStop(0, 'rgba(6, 2, 14, 0)');
            gradient.addColorStop(1, '#06020e'); // True deep obsidian purple-black

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
        const updateAnimation = () => {
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
        
        requestRef = requestAnimationFrame(updateAnimation);

        return () => {
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

        const animate = () => {
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

        animate();

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
                
                const img = card.querySelector('.founder-img, .portfolio-img, .hero-visual-img');
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
                
                const img = card.querySelector('.founder-img, .portfolio-img, .hero-visual-img');
                if (img) img.style.transform = '';
                
                const mesh = card.querySelector('.visual-mesh');
                if (mesh) mesh.style.transform = '';
            });
        });

        // 2. Mobile Touch & Drag 3D Tilt (Silky Tactile Mobile Enhancements)
        tiltCards.forEach(card => {
            let touchScheduled = false;

            const handleTouch = (e) => {
                if (!window.matchMedia('(pointer: coarse)').matches) return;
                
                isTactileActive = true;
                
                const touch = e.touches[0];
                const rect = card.getBoundingClientRect();
                
                // Keep touch coordinates inside bounding box limits
                const x = Math.min(Math.max(touch.clientX - rect.left, 0), rect.width);
                const y = Math.min(Math.max(touch.clientY - rect.top, 0), rect.height);
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const maxRotationX = 12; // Slightly more prominent on direct touch/drag
                const maxRotationY = 12;
                
                const rotateX = ((centerY - y) / centerY) * maxRotationX;
                const rotateY = ((x - centerX) / centerX) * maxRotationY;

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
                    touchScheduled = false;
                });
            };

            const resetTouch = () => {
                if (!window.matchMedia('(pointer: coarse)').matches) return;
                
                isTactileActive = false;
                
                window.requestAnimationFrame(() => {
                    card.style.transform = '';
                    card.style.boxShadow = '';
                    const img = card.querySelector('.founder-img, .portfolio-img, .hero-visual-img');
                    if (img) img.style.transform = '';
                });
            };

            card.addEventListener('touchstart', handleTouch, { passive: true });
            card.addEventListener('touchmove', handleTouch, { passive: true });
            card.addEventListener('touchend', resetTouch, { passive: true });
            card.addEventListener('touchcancel', resetTouch, { passive: true });
        });

        // 2. Mobile Gyroscope Device Orientation Tilt
        if (window.DeviceOrientationEvent) {
            let gyroScheduled = false;
            window.addEventListener('deviceorientation', (e) => {
                if (!window.matchMedia('(pointer: coarse)').matches) return; // Only trigger on mobile touchscreens
                if (isTactileActive) return; // Skip gyro tilt if user is actively touching/dragging
                
                const beta = e.beta;   // front-back tilt (-180 to 180)
                const gamma = e.gamma; // left-right tilt (-90 to 90)
                
                if (beta === null || gamma === null) return;
                
                if (gyroScheduled) return;
                gyroScheduled = true;
                
                window.requestAnimationFrame(() => {
                    // Normalizing phone angles based on standard vertical holding context
                    const normalBeta = Math.min(Math.max(beta - 45, -30), 30);
                    const normalGamma = Math.min(Math.max(gamma, -30), 30);
                    
                    const rotateX = (-normalBeta / 30) * 8; 
                    const rotateY = (normalGamma / 30) * 8; 

                    visibleCards.forEach(card => {
                        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
                        
                        const shadowX = -rotateY * 1.2;
                        const shadowY = rotateX * 1.2;
                        card.style.boxShadow = `${shadowX}px ${shadowY}px 25px var(--primary-glow), var(--shadow-premium)`;

                        const img = card.querySelector('.founder-img, .portfolio-img, .hero-visual-img');
                        if (img) {
                            img.style.transform = `scale(1.05) translate3d(${-rotateY * 0.3}px, ${-rotateX * 0.3}px, 20px)`;
                        }
                    });
                    
                    gyroScheduled = false;
                });
            });
        }

        // 3. Mobile Scroll Center Highlight Focus (Optimized to prevent layout thrashing)
        const handleScrollFocus = () => {
            const viewportCenterY = window.innerHeight / 2;

            // Only run getBoundingClientRect on cards currently visible in viewport to prevent layout thrashing
            visibleCards.forEach(card => {
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

        let scrollFocusScheduled = false;
        window.addEventListener('scroll', () => {
            // Only calculate scroll focus highlights on mobile/tablet viewports to save laptop performance
            if (!window.matchMedia('(max-width: 992px)').matches) return;

            if (scrollFocusScheduled) return;
            scrollFocusScheduled = true;
            window.requestAnimationFrame(() => {
                handleScrollFocus();
                scrollFocusScheduled = false;
            });
        }, { passive: true });
        
        // Remove viewport-focused highlights from all elements when resizing to desktop
        window.addEventListener('resize', () => {
            if (!window.matchMedia('(max-width: 992px)').matches) {
                tiltCards.forEach(card => card.classList.remove('viewport-focused'));
            }
        });
        
        if (window.matchMedia('(max-width: 992px)').matches) {
            handleScrollFocus(); // Run initially only on mobile/tablet
        }
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
});
