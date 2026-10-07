"""Live smoke tests for all HTTP components. Requires the API on :8000."""
import json
import sys
import tempfile
from pathlib import Path

import httpx

BASE = "http://127.0.0.1:8000"
PASS = 0
FAIL = 0


def check(name: str, ok: bool, detail: str = ""):
    global PASS, FAIL
    if ok:
        PASS += 1
        print(f"  PASS  {name}" + (f" — {detail}" if detail else ""))
    else:
        FAIL += 1
        print(f"  FAIL  {name}" + (f" — {detail}" if detail else ""))


def main() -> int:
    client = httpx.Client(base_url=BASE, timeout=120.0)

    print("\n=== Health / system ===")
    r = client.get("/health")
    check("GET /health", r.status_code == 200, r.text[:180])
    health = r.json() if r.status_code == 200 else {}
    check("ChromaDB ok", health.get("chromadb", {}).get("status") == "ok")
    check("OKF loaded", health.get("okf", {}).get("status") == "ok", f"docs={health.get('okf', {}).get('documents')}")

    r = client.get("/stats")
    check("GET /stats", r.status_code == 200, r.text[:180])

    r = client.get("/sources")
    check("GET /sources", r.status_code == 200, r.text[:180])

    print("\n=== Knowledge (OKF) ===")
    r = client.get("/knowledge/")
    check("GET /knowledge/", r.status_code == 200)
    docs = (r.json() or {}).get("documents", []) if r.status_code == 200 else []
    check("OKF documents present", len(docs) > 0, f"count={len(docs)}")

    r = client.get("/knowledge/stats")
    check("GET /knowledge/stats", r.status_code == 200, r.text[:180])

    r = client.get("/knowledge/types")
    check("GET /knowledge/types", r.status_code == 200, r.text[:180])

    r = client.get("/knowledge/tags")
    check("GET /knowledge/tags", r.status_code == 200, r.text[:180])

    r = client.get("/knowledge/search", params={"q": "database rollback"})
    check("GET /knowledge/search", r.status_code == 200)
    if r.status_code == 200:
        results = r.json().get("results", [])
        check("search returns hits", len(results) > 0, f"hits={len(results)}")

    source_id = None
    if docs:
        source_id = docs[0].get("source_id")
        r = client.get(f"/knowledge/{source_id}")
        check("GET /knowledge/{path}", r.status_code == 200, source_id)

    created_id = None
    r = client.post(
        "/knowledge/",
        json={
            "okf_type": "Standard",
            "title": "Smoke Test Standard",
            "description": "Created by smoke_test.py",
            "tags": ["smoke-test"],
            "content": "## Smoke\nThis document was created by the automated smoke test.",
            "author": "smoke-test",
        },
    )
    check("POST /knowledge/", r.status_code == 200, r.text[:180])
    if r.status_code == 200:
        created_id = r.json().get("source_id")

    if created_id:
        r = client.delete(f"/knowledge/{created_id}")
        check("DELETE /knowledge/{path}", r.status_code == 200, created_id)

    r = client.post("/knowledge/reload")
    check("POST /knowledge/reload", r.status_code == 200, r.text[:180])

    print("\n=== Chat sessions ===")
    r = client.get("/chat/sessions")
    check("GET /chat/sessions", r.status_code == 200)

    print("\n=== Upload + parse ===")
    sample = Path(__file__).resolve().parent.parent / "sample-data" / "auth-service.md"
    with open(sample, "rb") as f:
        r = client.post("/upload", files={"file": ("auth-service.md", f, "text/markdown")})
    check("POST /upload", r.status_code == 200, r.text[:220])

    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as tmp:
        tmp.write("Ephemeral parse smoke test content about auth tokens.")
        tmp_path = tmp.name
    with open(tmp_path, "rb") as f:
        r = client.post("/chat/parse-file", files={"file": ("note.txt", f, "text/plain")})
    check("POST /chat/parse-file", r.status_code == 200, r.text[:180])

    print("\n=== Chat (LLM optional) ===")
    r = client.post("/chat", json={"question": "How do I roll back the database?", "stream": False})
    check("POST /chat non-stream", r.status_code == 200, r.text[:220])

    r = client.post(
        "/chat",
        json={"question": "Summarize the auth service.", "stream": True},
        headers={"Accept": "text/event-stream"},
    )
    check("POST /chat stream", r.status_code == 200 and "data:" in r.text, r.text[:180])

    print("\n=== GitHub indexer (validation) ===")
    r = client.post("/github-index", json={"repo_url": "https://evil.example/not-github"})
    check("POST /github-index rejects non-GitHub URL", r.status_code in (400, 422), r.text[:180])

    print("\n=== Admin eval ===")
    r = client.post("/stats/evaluate")
    check("POST /stats/evaluate", r.status_code == 200, r.text[:180])

    print(f"\n{PASS} passed, {FAIL} failed")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
