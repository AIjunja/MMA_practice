#!/usr/bin/env python3
"""Capture stable, bright mobile portfolio screenshots from the live service."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

from playwright.sync_api import Page, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "public" / "portfolio" / "mma-ai-champion"
DEFAULT_URL = "https://aijunja.github.io/MMA_practice/"

STABLE_CAPTURE_CSS = """
*, *::before, *::after {
  animation: none !important;
  transition: none !important;
  caret-color: transparent !important;
}
.screen, .category-card {
  opacity: 1 !important;
  transform: none !important;
}
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def settle(page: Page) -> None:
    page.add_style_tag(content=STABLE_CAPTURE_CSS)
    page.evaluate("document.fonts.ready")
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(500)


def capture(page: Page, output_dir: Path, stem: str) -> None:
    settle(page)
    page.screenshot(path=str(output_dir / f"{stem}.png"), full_page=False)
    page.screenshot(path=str(output_dir / f"{stem}-full.png"), full_page=True)


def main() -> int:
    args = parse_args()
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(
            viewport={"width": 430, "height": 1000},
            device_scale_factor=2,
            color_scheme="light",
        )
        page.emulate_media(reduced_motion="reduce")

        page.goto(args.url, wait_until="networkidle", timeout=60_000)
        capture(page, output_dir, "mobile-home")

        page.get_by_role(
            "button", name=re.compile(r"^과천.*등록 시설")
        ).click()
        settle(page)
        page.locator(".category-card", has_text="문화").click()
        settle(page)
        page.get_by_role(
            "button", name="과천시 추사박물관 상세정보 보기"
        ).click()
        capture(page, output_dir, "mobile-facility-detail")

        page.goto(args.url, wait_until="networkidle", timeout=60_000)
        page.locator(".px-entry").click()
        settle(page)
        page.locator("#px-search").fill("박달")
        settle(page)
        page.get_by_role("button", name="박달 상세정보 보기").click()
        capture(page, output_dir, "mobile-px-detail")

        browser.close()

    for path in sorted(output_dir.glob("mobile-*.png")):
        print(path.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
