#!/usr/bin/env python3
"""Auto-rebuild and serve. Watches content/ and source files for changes."""

from __future__ import annotations

import http.server
import socketserver
import subprocess
import sys
import threading
import time
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WATCH_PATHS = [
    ROOT / "content",
    ROOT / "static",
    ROOT / "js",
    ROOT / "index.html",
    ROOT / "public" / "about.html",
    ROOT / "public" / "contact.html",
    ROOT / "public" / "gallery.html",
    ROOT / "public" / "projects.html",
    ROOT / "content" / "friends.yml",
    ROOT / "scripts" / "build_posts.py",
    ROOT / "scripts" / "build_friends.py",
    ROOT / "scripts" / "build_site.py",
]


def collect_mtimes() -> dict[str, float]:
    mtimes: dict[str, float] = {}
    for path in WATCH_PATHS:
        if path.is_dir():
            for f in path.rglob("*"):
                if f.is_file():
                    mtimes[str(f)] = f.stat().st_mtime
        elif path.is_file():
            mtimes[str(path)] = path.stat().st_mtime
    return mtimes


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


def run_build() -> bool:
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "build_site.py")],
        cwd=str(ROOT),
    )
    return result.returncode == 0


def watcher() -> None:
    prev = collect_mtimes()
    while True:
        time.sleep(1)
        curr = collect_mtimes()
        if curr != prev:
            print("\n[watch] Change detected, rebuilding...")
            if run_build():
                print(f"[watch] Rebuild complete. Serving at http://localhost:{port}")
            else:
                print("[watch] Rebuild failed. Fix the error above and save again.")
            prev = curr


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

if not run_build():
    raise SystemExit(1)

t = threading.Thread(target=watcher, daemon=True)
t.start()

print(f"Serving at http://localhost:{port} (auto-rebuild on change)")
handler = partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
with ReusableTCPServer(("", port), handler) as httpd:
    httpd.serve_forever()
