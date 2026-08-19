#!/usr/bin/env python3
"""Synchronise the shared header and footer across static public pages."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PARTIALS = ROOT / "partials"
EXCLUDED_PAGES = {"netlify-form.html"}

SECTIONS = {
    "header": {
        "partial": PARTIALS / "header.html",
        "start": "    <!-- shared-header:start -->",
        "end": "    <!-- shared-header:end -->",
        "raw": re.compile(
            r'^    <header class="site-header">.*?^    </header>', re.MULTILINE | re.DOTALL
        ),
    },
    "footer": {
        "partial": PARTIALS / "footer.html",
        "start": "    <!-- shared-footer:start -->",
        "end": "    <!-- shared-footer:end -->",
        "raw": re.compile(
            r'^    <footer class="site-footer">.*?^    </footer>', re.MULTILINE | re.DOTALL
        ),
    },
}


def read_exact(path: Path) -> str:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return handle.read()


def write_exact(path: Path, content: str) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        handle.write(content)


def normalise_newlines(content: str) -> str:
    return content.replace("\r\n", "\n").replace("\r", "\n")


def public_pages() -> list[Path]:
    pages: list[Path] = []
    for path in ROOT.rglob("*.html"):
        relative = path.relative_to(ROOT)
        if relative.as_posix() in EXCLUDED_PAGES or relative.parts[0] == "partials":
            continue
        pages.append(path)
    return sorted(pages)


def canonical_block(section: dict[str, object], newline: str) -> str:
    partial_path = section["partial"]
    assert isinstance(partial_path, Path)
    partial = normalise_newlines(read_exact(partial_path)).strip("\n")
    partial = partial.replace("\n", newline)
    return f'{section["start"]}{newline}{partial}{newline}{section["end"]}'


def marked_pattern(section_name: str) -> re.Pattern[str]:
    return re.compile(
        rf"^    <!-- shared-{section_name}:start -->.*?"
        rf"^    <!-- shared-{section_name}:end -->",
        re.MULTILINE | re.DOTALL,
    )


def update_page(path: Path, check_only: bool) -> tuple[bool, list[str]]:
    original = read_exact(path)
    newline = "\r\n" if "\r\n" in original else "\n"
    updated = original
    issues: list[str] = []

    for name, section in SECTIONS.items():
        expected = canonical_block(section, newline)
        marked = marked_pattern(name)
        match = marked.search(updated)

        if check_only:
            if not match:
                issues.append(f"missing shared {name} markers")
            elif match.group(0) != expected:
                issues.append(f"shared {name} differs from partial")
            continue

        if match:
            updated, count = marked.subn(lambda _: expected, updated, count=1)
        else:
            raw = section["raw"]
            assert isinstance(raw, re.Pattern)
            updated, count = raw.subn(lambda _: expected, updated, count=1)

        if count != 1:
            issues.append(f"could not locate exactly one {name}")

    changed = updated != original
    if changed and not check_only and not issues:
        write_exact(path, updated)
    return changed, issues


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Synchronise or verify the shared static-site header and footer."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Verify every public page without changing files.",
    )
    args = parser.parse_args()

    missing_partials = [
        str(section["partial"])
        for section in SECTIONS.values()
        if not isinstance(section["partial"], Path) or not section["partial"].is_file()
    ]
    if missing_partials:
        for path in missing_partials:
            print(f"Missing partial: {path}", file=sys.stderr)
        return 1

    pages = public_pages()
    changed_count = 0
    failures: list[tuple[Path, list[str]]] = []

    for page in pages:
        changed, issues = update_page(page, args.check)
        changed_count += int(changed)
        if issues:
            failures.append((page, issues))

    if failures:
        for page, issues in failures:
            relative = page.relative_to(ROOT)
            print(f"{relative}: {'; '.join(issues)}", file=sys.stderr)
        return 1

    if args.check:
        print(f"Shared layout check passed for {len(pages)} pages.")
    else:
        print(f"Shared layout synchronised across {len(pages)} pages; {changed_count} updated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
