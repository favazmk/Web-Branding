import shutil

files = {
    r"C:\Users\favaz\.gemini\antigravity-ide\brain\a5eead8a-2f7c-4f3a-b134-6fb30205bad8\mockup_fashion_1781096742936.png": r"C:\Users\favaz\Web Branding\mockup_fashion.png",
    r"C:\Users\favaz\.gemini\antigravity-ide\brain\a5eead8a-2f7c-4f3a-b134-6fb30205bad8\mockup_jewellery_1781096753246.png": r"C:\Users\favaz\Web Branding\mockup_jewellery.png",
    r"C:\Users\favaz\.gemini\antigravity-ide\brain\a5eead8a-2f7c-4f3a-b134-6fb30205bad8\mockup_beauty_1781096765370.png": r"C:\Users\favaz\Web Branding\mockup_beauty.png",
    r"C:\Users\favaz\.gemini\antigravity-ide\brain\a5eead8a-2f7c-4f3a-b134-6fb30205bad8\mockup_electronics_1781096776759.png": r"C:\Users\favaz\Web Branding\mockup_electronics.png",
    r"C:\Users\favaz\.gemini\antigravity-ide\brain\a5eead8a-2f7c-4f3a-b134-6fb30205bad8\mockup_abaya_1781096788720.png": r"C:\Users\favaz\Web Branding\mockup_abaya.png"
}

for src, dst in files.items():
    try:
        shutil.copy2(src, dst)
        print(f"Copied {src} to {dst}")
    except Exception as e:
        print(f"Error copying {src}: {e}")

print("Done")
