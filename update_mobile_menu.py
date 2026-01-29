import os

# Configuration
target_dir = r"c:\Users\LENOVO\.gemini\antigravity\playground\silent-corona"
files_to_update = [
    "index.html", "svatby.html", "reality.html", "plesy.html", 
    "konference.html", "portfolio.html", "fotobudka.html", 
    "podcast.html", "promo.html", "kontakt.html", "360budka.html",
    "blog.html", "kalkulacka.html",
    "ochrana-osobnich-udaju.html", "marketingovy-souhlas.html", "obchodni-podminky.html"
]

# The NEW button HTML
new_button_html = '''            <button class="mobile-menu" aria-label="Menu">
                <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>'''

# The Logic Block (CSS + JS)
logic_block = '''    <!-- Mobile Menu Logic -->
    <style>
        /* Mobile Menu Styles */
        @media (max-width: 900px) {
            .mobile-menu {
                display: flex !important;
                align-items: center;
                justify-content: center;
                border: 1px solid rgba(212, 175, 55, 0.3);
                border-radius: 8px;
                padding: 0.5rem;
                background: rgba(10, 10, 15, 0.8);
                backdrop-filter: blur(10px);
                color: var(--gold);
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 1001;
            }

            .mobile-menu:hover {
                background: var(--gradient);
                color: var(--dark);
                border-color: transparent;
            }

            .nav {
                display: flex;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(5, 5, 8, 0.98);
                backdrop-filter: blur(20px);
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 2rem;
                z-index: 999;
                /* Below open button */
                opacity: 0;
                visibility: hidden;
                transform: translateY(-20px);
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .nav.active {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .nav a {
                font-size: 1.5rem;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.4s ease;
            }

            .nav.active a {
                opacity: 1;
                transform: translateY(0);
            }
            
            /* Staggered animation for links */
            .nav.active a:nth-child(1) { transition-delay: 0.1s; }
            .nav.active a:nth-child(2) { transition-delay: 0.15s; }
            .nav.active a:nth-child(3) { transition-delay: 0.2s; }
            .nav.active a:nth-child(4) { transition-delay: 0.25s; }
            .nav.active a:nth-child(5) { transition-delay: 0.3s; }
            .nav.active a:nth-child(6) { transition-delay: 0.35s; }
            .nav.active a:nth-child(7) { transition-delay: 0.4s; }
            .nav.active a:nth-child(8) { transition-delay: 0.45s; }

            .nav-cta {
                width: 80%;
                text-align: center;
                margin-top: 1rem;
            }
        }
    </style>

    <script>
        // Mobile Menu Toggle
        const mobileBtn = document.querySelector('.mobile-menu');
        const nav = document.querySelector('.nav');

        if (mobileBtn && nav) {
            mobileBtn.addEventListener('click', () => {
                nav.classList.toggle('active');
                mobileBtn.classList.toggle('active');
                
                // Toggle Icon
                const svg = mobileBtn.querySelector('svg');
                if (nav.classList.contains('active')) {
                    // Close IX
                    svg.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>';
                } else {
                    // Hamburger
                    svg.innerHTML = '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
                }
                
                // Prevent scrolling
                document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
            });

            // Close when clicking links
            const navLinks = nav.querySelectorAll('a');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    nav.classList.remove('active');
                    mobileBtn.classList.remove('active');
                    document.body.style.overflow = '';
                    // Reset icon
                    const svg = mobileBtn.querySelector('svg');
                    svg.innerHTML = '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
                });
            });
        }
    </script>'''

def update_file(filename):
    path = os.path.join(target_dir, filename)
    if not os.path.exists(path):
        print(f"Skipping {filename} (not found)")
        return

    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. REMOVE any existing mobile buttons (old text one OR correct one if re-running)
    # We'll use regex or simple replacement to clear the area between </nav> and </div> if possible, 
    # OR just targeting specific strings we know exist.
    
    # Remove the specific old button with ☰
    content = content.replace('<button class="mobile-menu" aria-label="Menu">☰</button>', '')
    
    # Remove my newly inserted button if it exists (to avoid duplication if re-run)
    # Since checking for multi-line string exact match can be tricky with indentation, 
    # we'll check if the Logic Block is present.
    
    has_logic = "<!-- Mobile Menu Logic -->" in content
    
    # 2. INSERT BUTTON
    # If the file doesn't have the SVG button, inject it.
    # We look for </nav>.
    if '<svg viewBox="0 0 24 24" width="32" height="32"' not in content:
        # We assume standard structure: ... </nav> ... </div>
        # Use simple replace.
        content = content.replace('</nav>', f'</nav>\n{new_button_html}')
        print(f"Inserted button in {filename}")
    else:
        print(f"Button already present in {filename}")

    # 3. APPEND LOGIC
    if not has_logic:
        # Insert before </body>
        content = content.replace('</body>', f'{logic_block}\n</body>')
        print(f"Appended logic to {filename}")
    else:
        print(f"Logic already present in {filename}")

    # Write back
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    for fname in files_to_update:
        update_file(fname)
