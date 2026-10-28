"""Test static files at both / and the actual GitHub Pages project subpath."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
PREFIX = "/IM-excellence-cleaning"


class ProjectHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path):
        # Preserve self.path so the normal directory-to-trailing-slash redirect
        # retains the project prefix and queries are handled by the HTTP server.
        pathname = urlsplit(path).path
        if pathname == PREFIX or pathname.startswith(PREFIX + "/"):
            path = path[len(PREFIX):] or "/"
        return super().translate_path(path)


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", 3000), ProjectHandler).serve_forever()
