"""Export selected published Crypto Moonboys wiki pages for a faction workspace."""

import argparse
from html.parser import HTMLParser
from pathlib import Path
import json
import re
from urllib.request import Request, build_opener, HTTPRedirectHandler

ORIGIN = "https://cryptomoonboys.com"
INDEX = "/js/leader-lore-sources.json"
WIKI_PATH = re.compile(r"/wiki/[a-z0-9][a-z0-9-]*\.html\Z")


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None


def fetch(path, limit, mime):
    request = Request(ORIGIN + path, headers={"User-Agent": "SWARMSY-Faction-Canon/1"})
    with build_opener(NoRedirect()).open(request, timeout=20) as response:
        if response.headers.get_content_type() != mime:
            raise ValueError(f"{path}: unexpected content type")
        robots = response.headers.get_all("X-Robots-Tag", [])
        if any(re.search(r"\b(?:noindex|none)\b", value, re.I) for value in robots):
            raise ValueError(f"{path}: excluded from indexing")
        result = response.read(limit + 1)
        if len(result) > limit:
            raise ValueError(f"{path}: response exceeds size limit")
        return result.decode("utf-8")


class WikiText(HTMLParser):
    block = {"h1", "h2", "h3", "h4", "p", "li", "br", "tr", "blockquote"}
    excluded = {"script", "style", "nav", "footer", "aside", "template", "noscript"}

    def __init__(self):
        super().__init__()
        self.noindex = False
        self.article = 0
        self.skip = []
        self.parts = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta" and attrs.get("name", "").lower() in {"robots", "googlebot"}:
            self.noindex |= bool(re.search(r"\b(?:noindex|none)\b", attrs.get("content", ""), re.I))
        if tag == "article":
            self.article += 1
        if self.article and tag in self.excluded:
            self.skip.append(tag)
        if self.article and not self.skip and tag in self.block:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if self.skip and self.skip[-1] == tag:
            self.skip.pop()
        if self.article and not self.skip and tag in self.block:
            self.parts.append("\n")
        if tag == "article" and self.article:
            self.article -= 1

    def handle_data(self, data):
        if self.article and not self.skip:
            self.parts.append(data)

    def text(self):
        if self.noindex:
            raise ValueError("Page excludes indexing")
        return "\n".join(" ".join(line.split()) for line in "".join(self.parts).splitlines() if line.strip())


def export(paths, output):
    if any(not WIKI_PATH.fullmatch(path) for path in paths):
        raise ValueError("Only explicit /wiki/<slug>.html paths are accepted")
    catalog = set(json.loads(fetch(INDEX, 400_000, "application/json")))
    if not all(path in catalog for path in paths):
        raise ValueError("Every selected page must appear in the live published lore catalog")
    documents = {}
    for path in dict.fromkeys(paths):
        page = WikiText()
        page.feed(fetch(path, 512_000, "text/html"))
        article = page.text()
        if not article:
            raise ValueError(f"{path}: no article text found")
        documents[Path(path).stem + ".txt"] = f"Source: {ORIGIN}{path}\n\n{article}\n"
    output.mkdir()
    for name, content in documents.items():
        (output / name).write_text(content, encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True, help="A new output directory")
    parser.add_argument("paths", nargs="+")
    args = parser.parse_args()
    try:
        export(args.paths, args.out)
    except (OSError, ValueError) as error:
        parser.exit(1, f"{error}\n")
