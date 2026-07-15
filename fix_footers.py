import os
import re

footer_template = """    <!-- Footer Section -->
    <footer class="footer-main">
        <div class="container">
            <div class="footer-grid">

                <div class="footer-brand">
                    <a href="#" class="logo" style="margin-bottom: 8px; display: inline-block;">
                        <img src="logo.png" alt="The Web Branding Logo" class="footer-logo-img">
                    </a>
                    <p class="footer-brand-disc">
                        A full-service digital transformation agency. Combining strategy-led designs with high-impact marketing to grow brands in Dubai, India, and globally.
                    </p>

                    <div class="footer-socials">
                        <a href="https://linkedin.com" target="_blank" class="social-circle" aria-label="LinkedIn"><svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg></a>
                        <a href="https://www.instagram.com/thewebbranding/?hl=en" target="_blank" class="social-circle" aria-label="Instagram"><svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg></a>
                        <a href="https://x.com" target="_blank" class="social-circle" aria-label="X (Twitter)"><svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg></a>
                    </div>
                </div>

                <div class="footer-col">
                    <span class="footer-col-title">Navigation</span>
                    <ul class="footer-menu">
                        {nav_links}
                    </ul>
                </div>

                <div class="footer-col">
                    <span class="footer-col-title">Key Information</span>
                    <ul class="footer-menu">
                        {info_links}
                        <li><a href="https://hashirnisam.com" target="_blank" class="footer-menu-link">Founder's Site</a></li>
                    </ul>
                </div>

                <div class="footer-col">
                    <span class="footer-col-title">Get in Touch</span>
                    <div class="footer-contact-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <span>info@thewebbranding.com</span>
                    </div>
                    <div class="footer-contact-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>Abuhail Centre, 3 22A St,<br>Hor Al Anz East, Dubai, UAE</span>
                    </div>
                </div>

            </div>

            <div class="footer-bottom">
                <p class="copyright">&copy; <span id="current-year">2026</span> The Web Branding. Rebuilt for High Performance.</p>
                <div class="footer-legal-links">
                    <a href="#" class="legal-link">Privacy Policy</a>
                    <a href="#" class="legal-link">Terms of Service</a>
                </div>
            </div>
        </div>
    </footer>
"""

# Web Dev
with open('web-development-services.html', 'r', encoding='utf-8') as f:
    web = f.read()

nav_web = '''<li><a href="#packages" class="footer-menu-link">Website Packages</a></li>
                        <li><a href="#industries" class="footer-menu-link">Industries</a></li>
                        <li><a href="#projects" class="footer-menu-link">Portfolio</a></li>
                        <li><a href="#process" class="footer-menu-link">Our Process</a></li>'''
info_web = '''<li><a href="#ecommerce" class="footer-menu-link">E-Commerce Setup</a></li>
                        <li><a href="#compare" class="footer-menu-link">Interactive Proposal</a></li>'''
footer_web = footer_template.replace('{nav_links}', nav_web).replace('{info_links}', info_web)

# Remove old basic footer from web-development-services
web = re.sub(
    r'<div class=\"container\" style=\"margin-top: 80px; text-align: left; border-top: 1px solid rgba\(255,255,255,0\.1\); padding-top: 40px;\">.*?</section>',
    '</section>',
    web,
    flags=re.DOTALL
)
# Insert full footer after </main>
web = web.replace('</main>', '</main>\n\n' + footer_web)

# Fix CTA button
web = web.replace(
    '<a href=\"https://wa.me/971585577182\" class=\"btn btn-primary\" style=\"background: #fff; color: #5A2C89;\">',
    '<a href=\"tel:+971544387023\" class=\"btn btn-primary\" style=\"background: #fff; color: #5A2C89;\">'
)

with open('web-development-services.html', 'w', encoding='utf-8') as f:
    f.write(web)


# Digital Marketing
with open('digital-marketing.html', 'r', encoding='utf-8') as f:
    dig = f.read()

nav_dig = '''<li><a href="#packages" class="footer-menu-link">Marketing Packages</a></li>
                        <li><a href="#addons" class="footer-menu-link">Addons</a></li>
                        <li><a href="#industries" class="footer-menu-link">Industries</a></li>
                        <li><a href="#projects" class="footer-menu-link">Our Works</a></li>'''
info_dig = '''<li><a href="#offer" class="footer-menu-link">Book Free Audit</a></li>'''
footer_dig = footer_template.replace('{nav_links}', nav_dig).replace('{info_links}', info_dig)

# Remove old basic footer from digital-marketing (if any)
# Currently digital marketing doesn't even have a footer! It just ends after the CTA form section.
dig = dig.replace('</main>', '</main>\n\n' + footer_dig)

with open('digital-marketing.html', 'w', encoding='utf-8') as f:
    f.write(dig)
