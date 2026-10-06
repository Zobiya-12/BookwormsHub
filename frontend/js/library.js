(function () {
    // Reader Tiers
    const TIERS = [
        { min: 1, max: 10, title: 'Casual Reader', icon: 'fa-coffee' },
        { min: 11, max: 25, title: 'Page Turner', icon: 'fa-book-open' },
        { min: 26, max: 50, title: 'Voracious Reader', icon: 'fa-books' },
        { min: 51, max: 75, title: 'Master Bibliophile', icon: 'fa-crown' },
        { min: 76, max: 100, title: 'Legendary Book Dragon', icon: 'fa-dragon' }
    ];

    const MASCOT_SVGS = {
        'owl': `<svg viewBox="0 0 64 64" fill="none" class="w-full h-full stroke-current" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M32 12C20 12 14 20 14 34C14 48 22 54 32 54C42 54 50 48 50 34C50 20 44 12 32 12Z" />
                    <circle cx="25" cy="28" r="6" /><circle cx="39" cy="28" r="6" />
                    <circle cx="25" cy="28" r="2" fill="currentColor" /><circle cx="39" cy="28" r="2" fill="currentColor" />
                    <path d="M32 32L30 37H34L32 32Z" fill="currentColor" />
                    <path d="M18 16L24 22M46 16L40 22" />
                </svg>`,
        'cat': `<svg viewBox="0 0 64 64" fill="none" class="w-full h-full stroke-current" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 22L22 30H14L16 22Z" fill="currentColor" />
                    <path d="M48 22L50 30H42L48 22Z" fill="currentColor" />
                    <circle cx="32" cy="34" r="16" />
                    <path d="M26 32A2 2 0 0 1 26 36A2 2 0 0 1 26 32" fill="currentColor" />
                    <path d="M38 32A2 2 0 0 1 38 36A2 2 0 0 1 38 32" fill="currentColor" />
                    <path d="M30 39C32 41 34 41 36 39" />
                    <path d="M18 36H10M54 36H46" />
                </svg>`,
        'fox': `<svg viewBox="0 0 64 64" fill="none" class="w-full h-full stroke-current" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 16L24 28L12 36L14 16Z" />
                    <path d="M50 16L40 28L52 36L50 16Z" />
                    <path d="M32 50L18 32H46L32 50Z" />
                    <circle cx="32" cy="46" r="3" fill="currentColor" />
                    <path d="M24 34H26M38 34H40" stroke-width="3" />
                </svg>`,
        'dragon': `<svg viewBox="0 0 64 64" fill="none" class="w-full h-full stroke-current" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 44C12 40 12 28 22 22C28 14 42 12 48 18C52 24 46 36 38 42C28 48 24 52 14 50" />
                    <path d="M38 18L46 10M32 24L38 14" />
                    <circle cx="34" cy="22" r="2" fill="currentColor" />
                </svg>`
    };

    const MASCOT_LABELS = {
        'owl': 'Wise Owl',
        'cat': 'Cozy Cat',
        'fox': 'Clever Fox',
        'dragon': 'Mythic Dragon'
    };

    const QUOTES = [
        '"A reader lives a thousand lives before he dies..." — George R.R. Martin',
        '"There is no friend as loyal as a book." — Ernest Hemingway',
        '"Books are a uniquely portable magic." — Stephen King',
        '"So many books, so little time." — Frank Zappa',
        '"I have always imagined that Paradise will be a kind of library." — Jorge Luis Borges'
    ];

    const state = {
        name: '',
        email: '',
        motto: 'Words are my sanctuary and my sword.',
        avatar: 'owl',
        genres: [],
        goal: 25,
        soundEnabled: true,
        cardId: 'BW-2026-' + Math.floor(1000 + Math.random() * 9000)
    };

    let audioCtx = null;
    function playTone(freq, type, duration, vol = 0.1) {
        if (!state.soundEnabled) return;
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            
            gain.gain.setValueAtTime(vol, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            // Audio context fallback
        }
    }

    function playFlipSound() {
        playTone(320, 'sine', 0.15, 0.08);
        setTimeout(() => playTone(440, 'triangle', 0.2, 0.06), 50);
    }

    function playClickSound() {
        playTone(600, 'sine', 0.08, 0.05);
    }

    function playSuccessSound() {
        playTone(440, 'sine', 0.2, 0.1);
        setTimeout(() => playTone(554.37, 'sine', 0.2, 0.1), 100);
        setTimeout(() => playTone(659.25, 'sine', 0.3, 0.12), 200);
    }

    let nextUrl = new URLSearchParams(location.search).get('next') || '../index.html';
    try { 
        if (new URL(nextUrl, location.href).origin !== location.origin) nextUrl = '../index.html'; 
    } catch { 
        nextUrl = '../index.html'; 
    }

    const laterBtn = document.getElementById('laterBtn') || document.getElementById('later');
    if (laterBtn) laterBtn.href = nextUrl;

    const userNameInput = document.getElementById('userName') || document.getElementById('name');
    const userEmailInput = document.getElementById('userEmail') || document.getElementById('email');
    const userMottoInput = document.getElementById('userMotto');
    const goalSlider = document.getElementById('goalSlider') || document.getElementById('goal');
    const goalValue = document.getElementById('goalValue') || document.getElementById('goalV');
    const pacePerMonth = document.getElementById('pacePerMonth');
    const dailyMinutes = document.getElementById('dailyMinutes');
    const tierTitle = document.getElementById('tierTitle') || document.getElementById('tierT');
    const tierIcon = document.getElementById('tierIcon');
    const genreCount = document.getElementById('genreCount') || document.getElementById('gc');
    const quickFillBtn = document.getElementById('quickFillBtn');
    const themeToggle = document.getElementById('themeToggle');
    const themeSelector = document.getElementById('themeSelector');
    const soundToggle = document.getElementById('soundToggle');
    const soundIcon = document.getElementById('soundIcon');
    const flipCardBtn = document.getElementById('flipCardBtn');
    const cardInner = document.getElementById('cardInner');
    const signupForm = document.getElementById('signupForm') || document.getElementById('form');
    
    // Card Preview Elements
    const cardName = document.getElementById('cardName');
    const cardEmail = document.getElementById('cardEmail');
    const cardBackMotto = document.getElementById('cardBackMotto');
    const cardAvatarContainer = document.getElementById('cardAvatarContainer');
    const cardGoal = document.getElementById('cardGoal');
    const cardTierTitle = document.getElementById('cardTierTitle');
    const cardGenres = document.getElementById('cardGenres');
    const cardIdEl = document.getElementById('cardId');
    const cardIssueDate = document.getElementById('cardIssueDate');
    const starterBookshelf = document.getElementById('starterBookshelf');

    // Set current issue date
    const dateObj = new Date();
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    if (cardIssueDate) cardIssueDate.textContent = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    if (cardIdEl) cardIdEl.textContent = state.cardId;

    function updateCard() {
        const nameVal = userNameInput ? userNameInput.value.trim() : '';
        if (cardName) cardName.textContent = nameVal || 'Your Name Here';
        
        const emailVal = userEmailInput ? userEmailInput.value.trim() : '';
        if (cardEmail) cardEmail.textContent = emailVal || 'reader@library.com';

        const mottoVal = userMottoInput ? userMottoInput.value.trim() : '';
        state.motto = mottoVal || 'Words are my sanctuary and my sword.';
        if (cardBackMotto) cardBackMotto.textContent = `"${state.motto}"`;

        const currentGoal = goalSlider ? parseInt(goalSlider.value) : 25;
        state.goal = currentGoal;
        if (goalValue) goalValue.textContent = currentGoal;
        if (cardGoal) cardGoal.textContent = currentGoal;

        const monthlyBooks = (currentGoal / 12).toFixed(1);
        const estDailyMins = Math.round((currentGoal * 300) / 365);
        if (pacePerMonth) pacePerMonth.textContent = `~${monthlyBooks} Books / Month`;
        if (dailyMinutes) dailyMinutes.textContent = `~${estDailyMins} mins / day`;

        const activeTier = TIERS.find(t => currentGoal >= t.min && currentGoal <= t.max) || TIERS[0];
        if (tierTitle) tierTitle.textContent = activeTier.title;
        if (tierIcon) tierIcon.innerHTML = `<i class="fa-solid ${activeTier.icon}"></i>`;
        if (cardTierTitle) cardTierTitle.textContent = activeTier.title;

        if (cardAvatarContainer) {
            cardAvatarContainer.innerHTML = MASCOT_SVGS[state.avatar] || MASCOT_SVGS['owl'];
        }

        if (cardGenres) {
            cardGenres.innerHTML = '';
            if (state.genres.length === 0) {
                cardGenres.innerHTML = `<span class="text-[9px] px-1.5 py-0.5 rounded bg-forestGreen text-sanctuary-300 border border-sanctuary-800">None</span>`;
            } else {
                state.genres.forEach(g => {
                    const badge = document.createElement('span');
                    badge.className = 'text-[8px] px-1.5 py-0.5 rounded bg-antiqueGold/20 text-antiqueGold border border-antiqueGold/30 font-medium truncate max-w-[80px]';
                    badge.textContent = g;
                    cardGenres.appendChild(badge);
                });
            }
        }
        if (genreCount) genreCount.textContent = `${state.genres.length} Selected`;

        renderStarterBookshelf();
    }

    function renderStarterBookshelf() {
        if (!starterBookshelf) return;
        starterBookshelf.innerHTML = '';
        const baseGenres = state.genres.length > 0 ? state.genres : ['Classics', 'Fiction', 'Poetry'];
        
        const spineStyles = [
            'bg-gradient-to-b from-forestGreen to-emeraldDeep text-antiqueGold border-forestGreen',
            'bg-gradient-to-b from-terracotta to-sanctuary-900 text-amber-200 border-terracotta',
            'bg-gradient-to-b from-sanctuary-700 to-sanctuary-900 text-sanctuary-200 border-sanctuary-600',
            'bg-gradient-to-b from-amber-700 to-sanctuary-900 text-antiqueGold border-amber-600',
            'bg-gradient-to-b from-teal-800 to-emeraldDeep text-teal-200 border-teal-600',
        ];

        baseGenres.forEach((genre, idx) => {
            const height = 70 + (idx * 9) % 30;
            const styleClass = spineStyles[idx % spineStyles.length];
            
            const spine = document.createElement('div');
            spine.className = `book-spine w-7 sm:w-8 rounded-t ${styleClass} border-t-2 flex flex-col justify-between p-1 text-center cursor-pointer select-none`;
            spine.style.height = `${height}px`;
            
            spine.innerHTML = `
                <span class="text-[7px] font-mono opacity-70">V.${idx + 1}</span>
                <span class="text-[8px] font-serif font-bold uppercase rotate-180 truncate block my-auto text-antiqueGold" style="writing-mode: vertical-rl;">${genre}</span>
                <i class="fa-solid fa-bookmark text-[7px] opacity-60"></i>
            `;

            spine.addEventListener('click', () => {
                playClickSound();
            });

            starterBookshelf.appendChild(spine);
        });
    }

    if (userNameInput) userNameInput.addEventListener('input', updateCard);
    if (userEmailInput) userEmailInput.addEventListener('input', updateCard);
    if (userMottoInput) userMottoInput.addEventListener('input', updateCard);
    if (goalSlider) {
        goalSlider.addEventListener('input', () => {
            updateCard();
            playClickSound();
        });
    }

    if (flipCardBtn && cardInner) {
        flipCardBtn.addEventListener('click', () => {
            cardInner.classList.toggle('flipped');
            playFlipSound();
        });
    }

    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            state.soundEnabled = !state.soundEnabled;
            if (soundIcon) {
                soundIcon.className = state.soundEnabled 
                    ? "fa-solid fa-volume-high text-antiqueGold" 
                    : "fa-solid fa-volume-xmark text-sanctuary-400";
            }
            if (state.soundEnabled) playClickSound();
        });
    }

    if (themeSelector) {
        themeSelector.addEventListener('change', (e) => {
            document.body.classList.remove('theme-academia', 'theme-midnight');
            if (e.target.value === 'academia') {
                document.body.classList.add('theme-academia');
            } else if (e.target.value === 'midnight') {
                document.body.classList.add('theme-midnight');
            }
            playClickSound();
        });
    }

    document.querySelectorAll('.mascot-card').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mascot-card').forEach(b => b.classList.remove('active-mascot'));
            btn.classList.add('active-mascot');
            state.avatar = btn.getAttribute('data-avatar');
            playClickSound();
            updateCard();
        });
    });

    document.querySelectorAll('.genre-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const genre = pill.getAttribute('data-genre');
            playClickSound();

            if (state.genres.includes(genre)) {
                state.genres = state.genres.filter(g => g !== genre);
            } else {
                if (state.genres.length >= 4) {
                    state.genres.shift();
                }
                state.genres.push(genre);
            }

            document.querySelectorAll('.genre-pill').forEach(p => {
                const gName = p.getAttribute('data-genre');
                if (state.genres.includes(gName)) {
                    p.classList.add('bg-forestGreen', 'text-antiqueGold', 'border-antiqueGold');
                } else {
                    p.classList.remove('bg-forestGreen', 'text-antiqueGold', 'border-antiqueGold');
                }
            });

            updateCard();
        });
    });

    if (quickFillBtn) {
        quickFillBtn.addEventListener('click', () => {
            playClickSound();
            const sampleNames = ['Arthur Pendelton', 'Clara Oswald', 'Julian Vance', 'Evelyn Hugo'];
            const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
            
            if (userNameInput) userNameInput.value = randomName;
            if (userEmailInput) userEmailInput.value = randomName.toLowerCase().replace(' ', '.') + '@bookworm.org';
            if (userMottoInput) userMottoInput.value = 'Finding solace in every turned page.';
            if (goalSlider) goalSlider.value = Math.floor(Math.random() * 35) + 20;
            
            state.genres = ['Fantasy', 'Mystery', 'Classics'];
            document.querySelectorAll('.genre-pill').forEach(p => {
                if (state.genres.includes(p.getAttribute('data-genre'))) {
                    p.classList.add('bg-forestGreen', 'text-antiqueGold', 'border-antiqueGold');
                } else {
                    p.classList.remove('bg-forestGreen', 'text-antiqueGold', 'border-antiqueGold');
                }
            });

            updateCard();
        });
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            playClickSound();
        });
    }

    let currentQuoteIdx = 0;
    const quoteDisplay = document.getElementById('quoteDisplay');
    const nextQuoteBtn = document.getElementById('nextQuoteBtn');

    function rotateQuote() {
        if (!quoteDisplay) return;
        quoteDisplay.classList.add('opacity-0');
        setTimeout(() => {
            currentQuoteIdx = (currentQuoteIdx + 1) % QUOTES.length;
            quoteDisplay.textContent = QUOTES[currentQuoteIdx];
            quoteDisplay.classList.remove('opacity-0');
        }, 400);
    }

    if (nextQuoteBtn) {
        nextQuoteBtn.addEventListener('click', () => {
            rotateQuote();
            playClickSound();
        });
    }

    setInterval(rotateQuote, 7000);

    const canvas = document.getElementById('particleCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        for (let i = 0; i < 28; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2.5 + 1,
                speedX: Math.random() * 0.4 - 0.2,
                speedY: Math.random() * -0.4 - 0.1,
                opacity: Math.random() * 0.35 + 0.1
            });
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const isDark = document.documentElement.classList.contains('dark');

            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;

                if (p.y < 0) p.y = canvas.height;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = isDark ? `rgba(200, 155, 86, ${p.opacity})` : `rgba(24, 60, 49, ${p.opacity})`;
                ctx.fill();
            });

            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }

    const confettiCanvas = document.getElementById('confettiCanvas');
    let confetti = [];

    function triggerConfetti() {
        if (!confettiCanvas) return;
        const cCtx = confettiCanvas.getContext('2d');
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
        confetti = [];

        const colors = ['#c89b56', '#183c31', '#c25948', '#f8f6f0', '#d9a05b'];

        for (let i = 0; i < 90; i++) {
            confetti.push({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 0.8) * 12,
                size: Math.random() * 7 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rSpeed: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }

        function renderConfetti() {
            cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            let active = false;

            confetti.forEach(p => {
                if (p.opacity <= 0) return;
                active = true;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.25;
                p.opacity -= 0.012;
                p.rotation += p.rSpeed;

                cCtx.save();
                cCtx.translate(p.x, p.y);
                cCtx.rotate((p.rotation * Math.PI) / 180);
                cCtx.globalAlpha = Math.max(0, p.opacity);
                cCtx.fillStyle = p.color;
                cCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                cCtx.restore();
            });

            if (active) requestAnimationFrame(renderConfetti);
        }

        renderConfetti();
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async e => {
            e.preventDefault();
            
            const userObj = {
                name: userNameInput ? userNameInput.value.trim() : '',
                email: userEmailInput ? userEmailInput.value.trim() : '',
                motto: state.motto,
                avatar: state.avatar,
                genres: state.genres,
                goal: state.goal,
                cardId: state.cardId
            };

            // LocalStorage persistence
            try {
                localStorage.setItem('bw_user', JSON.stringify(userObj));
            } catch (err) {
                console.error('LocalStorage error:', err);
            }

            // Backend API registration fallback
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userObj)
                });
                if (response.ok) {
                    const apiResult = await response.json();
                    console.log('API Registration Success:', apiResult);
                }
            } catch (apiErr) {
                console.warn('API connection offline or endpoint unavailable. Local save completed:', apiErr);
            }

            playSuccessSound();
            triggerConfetti();

            // Populate and display Success Modal
            const modalName = document.getElementById('modalName');
            const modalAvatar = document.getElementById('modalAvatar');
            const modalGoal = document.getElementById('modalGoal');
            const modalPassId = document.getElementById('modalPassId');

            if (modalName) modalName.textContent = userObj.name;
            if (modalAvatar) modalAvatar.textContent = MASCOT_LABELS[userObj.avatar] || 'Wise Owl';
            if (modalGoal) modalGoal.textContent = `${userObj.goal} Books / Year`;
            if (modalPassId) modalPassId.textContent = userObj.cardId;

            const modal = document.getElementById('successModal');
            const modalContainer = document.getElementById('modalCard');
            if (modal && modalContainer) {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                modalContainer.classList.remove('scale-95');
                modalContainer.classList.add('scale-100');
            }
        });
    }

    const modalContinueBtn = document.getElementById('modalContinueBtn');
    if (modalContinueBtn) {
        modalContinueBtn.addEventListener('click', () => {
            location.href = nextUrl;
        });
    }

    const printPassBtn = document.getElementById('printPassBtn');
    if (printPassBtn) {
        printPassBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Initial Card render
    updateCard();
})();