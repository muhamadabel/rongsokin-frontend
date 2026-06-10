# -*- coding: utf-8 -*-
import docx
import re

def search_terms():
    path = "/Users/mrfrog/Documents/Lomba/OLIVIA/proposal_backup.docx"
    doc = docx.Document(path)
    
    # We want to find references to technologies, platforms, and methods in BAB I-III (paragraphs 0 to 210)
    print("=== TECH AND DESIGN MENTIONS IN BAB I-III ===")
    tech_keywords = [
        "express", "node", "next", "react", "tailwind", "prisma", "postgis", "postgres", 
        "supabase", "caprover", "docker", "home server", "railway", "cloudinary", "socket", "websocket",
        "wise", "sage", "lime", "yogyakarta", "diy", "sleman", "bantul", "wallet", "kyc", "ktp", "siup"
    ]
    
    for idx, p in enumerate(doc.paragraphs[:211]):
        text_lower = p.text.lower()
        matched = [kw for kw in tech_keywords if kw in text_lower]
        if matched:
            print(f"[{idx}] Matched: {matched} | Text: '{p.text[:120]}...'")

if __name__ == "__main__":
    search_terms()
