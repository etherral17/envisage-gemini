import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from config import ALLOWED_DOMAINS

# `playwright` is optional; when installed it can render JS-heavy pages.
# After adding to requirements, run `python -m playwright install` once to
# download browser binaries.
try:
    from playwright.sync_api import sync_playwright
    _playwright_available = True
except ImportError:
    _playwright_available = False

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 \
    (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
}


def scrape_page(url):

    try:

        domain = urlparse(url).netloc

        if not any(d in domain for d in ALLOWED_DOMAINS):
            raise Exception("Domain not allowed")

        # use Playwright when available to execute JS; otherwise fall back
        # to a simple requests call
        if _playwright_available:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(url, timeout=15000)
                html = page.content()
                browser.close()
        else:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                print("Request failed:", response.status_code)
                return ""
            html = response.text

        soup = BeautifulSoup(html, "html.parser")

        text_content = []

        # extract multiple text elements
        for tag in soup.find_all(["p", "article", "div", "span"]):
            text = tag.get_text(strip=True)
            if len(text) > 40:
                text_content.append(text)

        final_text = " ".join(text_content)

        print("Scraped text length:", len(final_text))

        return final_text

    except Exception as e:

        print("Scraping error:", e)

        return ""