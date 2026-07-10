import shutil

files = {
    r"C:\Users\favaz\.gemini\antigravity-ide\brain\a5eead8a-2f7c-4f3a-b134-6fb30205bad8\mockup_fashion_1781156468093.png": r"C:\Users\favaz\Web Branding\mockup_fashion.png",
    r"C:\Users\favaz\.gemini\antigravity-ide\brain\a5eead8a-2f7c-4f3a-b134-6fb30205bad8\mockup_jewellery_1781156483548.png": r"C:\Users\favaz\Web Branding\mockup_jewellery.png",
    r"C:\Users\favaz\.gemini\antigravity-ide\brain\a5eead8a-2f7c-4f3a-b134-6fb30205bad8\mockup_beauty_1781156494617.png": r"C:\Users\favaz\Web Branding\mockup_beauty.png",
    r"C:\Users\favaz\.gemini\antigravity-ide\brain\a5eead8a-2f7c-4f3a-b134-6fb30205bad8\mockup_electronics_1781156505339.png": r"C:\Users\favaz\Web Branding\mockup_electronics.png",
    r"C:\Users\favaz\.gemini\antigravity-ide\brain\a5eead8a-2f7c-4f3a-b134-6fb30205bad8\mockup_abaya_1781156516626.png": r"C:\Users\favaz\Web Branding\mockup_abaya.png",
    r"C:\Users\favaz\.gemini\antigravity-ide\brain\a5eead8a-2f7c-4f3a-b134-6fb30205bad8\mockup_perfume_1781156532302.png": r"C:\Users\favaz\Web Branding\mockup_perfume.png"
}

for src, dst in files.items():
    try:
        shutil.copy2(src, dst)
        print(f"Copied {src} to {dst}")
    except Exception as e:
        print(f"Error copying {src}: {e}")

print("Done")
