#!/usr/bin/env python3
"""Build the static Fit2Trade site and its source-backed Insights articles."""
from __future__ import annotations

import html
import json
import re
import shutil
import sys
from datetime import date
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "_site"
SOURCES = ROOT / "content" / "insights"
SITE = "https://www.fit2trade.com"
SKIP = {".git", "_site", "content", "scripts", "README.md", "netlify.toml"}
SLUG = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*\Z")
REQUIRED = ("slug", "title", "seoTitle", "description", "excerpt", "date", "updated", "author", "category", "jurisdiction", "readingTime", "primaryKeyword")


def escape(value: object) -> str:
    return html.escape(str(value), quote=True)


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def load_content():
    categories = read_json(SOURCES / "categories.json")
    if not isinstance(categories, list) or len({c["slug"] for c in categories}) != len(categories):
        raise ValueError("Category registry must be a list of unique category slugs")
    by_slug = {}
    for category in categories:
        if not SLUG.fullmatch(category["slug"]) or not category["label"] or not isinstance(category["active"], bool):
            raise ValueError("Invalid category registry entry")
        by_slug[category["slug"]] = category

    articles = []
    for folder in sorted((SOURCES / "articles").iterdir()):
        if not folder.is_dir():
            continue
        metadata = read_json(folder / "article.json")
        body = (folder / "body.html").read_text(encoding="utf-8").strip()
        for key in REQUIRED:
            if not isinstance(metadata.get(key), str) or not metadata[key].strip():
                raise ValueError(f"{folder.name}: missing {key}")
        slug = metadata["slug"]
        if slug != folder.name or not SLUG.fullmatch(slug):
            raise ValueError(f"{folder.name}: invalid or mismatched slug")
        if metadata["category"] not in by_slug or not by_slug[metadata["category"]]["active"]:
            raise ValueError(f"{slug}: category is not active in the registry")
        for key in ("date", "updated"):
            if date.fromisoformat(metadata[key]).isoformat() != metadata[key]:
                raise ValueError(f"{slug}: invalid {key}")
        if not isinstance(metadata.get("relatedKeywords"), list) or not metadata["relatedKeywords"]:
            raise ValueError(f"{slug}: relatedKeywords must be a nonempty list")
        if len(body) < 1200 or re.search(r"<(?:script|style|iframe|form|object)\b|\bon\w+\s*=|javascript:", body, re.I):
            raise ValueError(f"{slug}: incomplete or unsafe body.html")
        ids = set(re.findall(r'\bid="([a-z0-9-]+)"', body))
        if any(anchor not in ids for anchor in re.findall(r'href="#([a-z0-9-]+)"', body)):
            raise ValueError(f"{slug}: broken in-page link")
        metadata["body"] = body
        metadata["url"] = f"/resources/blog/articles/{slug}/"
        metadata["categoryLabel"] = by_slug[metadata["category"]]["label"]
        articles.append(metadata)
    articles.sort(key=lambda item: (item["date"], item["title"]), reverse=True)
    return categories, articles


def document(title: str, description: str, canonical: str, main: str, *, article=None):
    header = (ROOT / "partials/header.html").read_text(encoding="utf-8").rstrip()
    footer = (ROOT / "partials/footer.html").read_text(encoding="utf-8").rstrip()
    type_tag = "article" if article else "website"
    published = f'<meta property="article:published_time" content="{escape(article["date"])}"/><meta property="article:modified_time" content="{escape(article["updated"])}"/>' if article else ""
    return f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>{escape(title)}</title><meta name="description" content="{escape(description)}"/>
<link rel="canonical" href="{SITE}{escape(canonical)}"/>
<meta property="og:type" content="{type_tag}"/><meta property="og:title" content="{escape(title)}"/>
<meta property="og:description" content="{escape(description)}"/><meta property="og:url" content="{SITE}{escape(canonical)}"/>{published}
<link rel="stylesheet" href="/assets/css/styles.css"/><link rel="stylesheet" href="/assets/css/insights.css"/>
<link rel="icon" href="/assets/images/favicon.svg"/></head>
<body class="credibility-page insights-page">
    <!-- shared-header:start -->
{header}
    <!-- shared-header:end -->
<main>{main}</main>
    <!-- shared-footer:start -->
{footer}
    <!-- shared-footer:end -->
<script src="/assets/js/main.js" defer></script><script src="/assets/js/insights.js" defer></script>
</body></html>'''


def card(item):
    return f'''<a class="insight-card insights-new-card" data-insight-card data-category="{escape(item["category"])}" href="{escape(item["url"])}">
<div class="insight-card-meta"><span>{escape(item["categoryLabel"])}</span><small>{escape(item["date"])} · {escape(item["jurisdiction"])}</small></div>
<h2>{escape(item["title"])}</h2><p>{escape(item["excerpt"])}</p><b>Read the guide <i aria-hidden="true">↗</i></b></a>'''


def index_page(categories, articles):
    active = [category for category in categories if category["active"] and any(article["category"] == category["slug"] for article in articles)]
    filters = '<button type="button" data-insight-filter="all" aria-pressed="true">All guidance</button>' + ''.join(
        f'<button type="button" data-insight-filter="{escape(category["slug"])}" aria-pressed="false">{escape(category["label"])}</button>' for category in active)
    contents = ''.join(card(item) for item in articles)
    main = f'''<section class="credibility-hero insights-hero"><div class="container credibility-hero-copy insights-hero-inner">
<span class="eyebrow">Fit2Trade insights</span><h1>Practical health and safety guidance.</h1>
<p>Clear answers for the people managing workplace risk, training and frontline work. Browse by topic, then take what is useful back to your team.</p>
</div></section><section class="section insights-guides"><div class="container"><div class="section-head"><span class="eyebrow">Guides</span>
<h2>Start with the question in front of you.</h2><p>Each guide explains a real task or decision, with links to the official source where the rules matter.</p></div>
<div class="insights-filters" role="group" aria-label="Filter insights by topic">{filters}</div>
<p class="insights-filter-status" id="insights-filter-status" role="status" aria-live="polite">Showing {len(articles)} guides.</p>
<div class="insight-grid insights-new-grid" id="insights-new-grid">{contents}</div>
</div></section><section class="section muted"><div class="container insights-more"><div><span class="eyebrow">Fit2Trade</span>
<h2>Connect the guidance to the work.</h2><p>Explore how learning, safety and operational records can work together across sites.</p></div>
<a class="button primary" href="/modules/ensure/">Explore Ensure</a></div></section>'''
    return document("Health & Safety Insights | Fit2Trade", "Practical workplace health and safety guidance for frontline organisations in Ireland, the UK and the US.", "/resources/blog/", main)


def article_page(item):
    main = f'''<section class="credibility-hero insight-article-hero"><div class="container credibility-hero-copy">
<nav class="insight-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/resources/blog/">Insights</a> / {escape(item["categoryLabel"])}</nav>
<span class="eyebrow">{escape(item["categoryLabel"])} · {escape(item["jurisdiction"])}</span>
<h1>{escape(item["title"])}</h1><p>{escape(item["excerpt"])}</p>
<p class="insight-article-meta">{escape(item["author"])} · {escape(item["date"])} · {escape(item["readingTime"])}</p></div></section>
<section class="section"><div class="container insight-article-layout"><article class="insight-article-body">{item["body"]}</article>
<aside class="insight-article-aside"><span class="eyebrow">Fit2Trade Ensure</span><h2>Make safety work visible.</h2>
<p>Connect risk assessments, actions and evidence to the people responsible for them.</p>
<a class="button primary" href="/modules/ensure/">Explore Ensure</a><a class="insight-aside-link" href="/book-demo/">Talk to Fit2Trade ↗</a></aside></div></section>
<section class="section muted"><div class="container insights-more"><div><span class="eyebrow">Keep exploring</span><h2>More practical guidance.</h2></div><a class="button primary" href="/resources/blog/">Browse Insights</a></div></section>'''
    return document(item["seoTitle"], item["description"], item["url"], main, article=item)


def build():
    categories, articles = load_content()
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir()
    for item in ROOT.iterdir():
        if item.name in SKIP:
            continue
        target = OUTPUT / item.name
        if item.is_dir():
            shutil.copytree(item, target)
        elif item.is_file():
            shutil.copy2(item, target)
    (OUTPUT / "resources/blog/index.html").write_text(index_page(categories, articles), encoding="utf-8")
    for item in articles:
        target = OUTPUT / item["url"].strip("/")
        target.mkdir(parents=True, exist_ok=True)
        (target / "index.html").write_text(article_page(item), encoding="utf-8")
    tree = ET.parse(OUTPUT / "sitemap.xml")
    root = tree.getroot()
    ns = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
    existing = {x.text for x in root.iter(ns + "loc")}
    for item in articles:
        url = SITE + item["url"]
        if url in existing:
            raise ValueError(f"Duplicate sitemap URL: {url}")
        el = ET.SubElement(root, ns + "url")
        ET.SubElement(el, ns + "loc").text = url
        ET.SubElement(el, ns + "lastmod").text = item["updated"]
    tree.write(OUTPUT / "sitemap.xml", encoding="utf-8", xml_declaration=True)
    for item in articles:
        page = OUTPUT / item["url"].strip("/") / "index.html"
        if item["title"] not in page.read_text(encoding="utf-8"):
            raise ValueError(f"Missing title in {page}")
    print(f"Built Fit2Trade site with {len(articles)} Insights articles")


if __name__ == "__main__":
    try:
        build()
    except Exception as exc:
        print(f"Insights build failed: {exc}", file=sys.stderr)
        sys.exit(1)
