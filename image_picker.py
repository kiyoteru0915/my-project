#!/usr/bin/env python3
"""
image_picker.py — 画像検索スクリプト
対応ソース: Unsplash / Pexels / Pixabay

使い方:
  python image_picker.py --query "検索キーワード" --source unsplash
  python image_picker.py --query "検索キーワード" --source pexels
  python image_picker.py --query "検索キーワード" --source pixabay
  python image_picker.py --query "検索キーワード" --source all
  python image_picker.py --query "検索キーワード" --source all --count 5
"""

import argparse
import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

UNSPLASH_KEY = os.getenv("UNSPLASH_ACCESS_KEY")
PEXELS_KEY = os.getenv("PEXELS_API_KEY")
PIXABAY_KEY = os.getenv("PIXABAY_API_KEY")


def search_unsplash(query: str, count: int) -> list[dict]:
    if not UNSPLASH_KEY:
        print("[Unsplash] APIキーが設定されていません", file=sys.stderr)
        return []
    url = "https://api.unsplash.com/search/photos"
    params = {"query": query, "per_page": count, "orientation": "landscape"}
    headers = {"Authorization": f"Client-ID {UNSPLASH_KEY}"}
    try:
        res = requests.get(url, params=params, headers=headers, timeout=10)
        res.raise_for_status()
        results = []
        for item in res.json().get("results", []):
            results.append({
                "source": "Unsplash",
                "url": item["urls"]["regular"],
                "page_url": item["links"]["html"],
                "photographer": item["user"]["name"],
            })
        return results
    except requests.RequestException as e:
        print(f"[Unsplash] エラー: {e}", file=sys.stderr)
        return []


def search_pexels(query: str, count: int) -> list[dict]:
    if not PEXELS_KEY:
        print("[Pexels] APIキーが設定されていません", file=sys.stderr)
        return []
    url = "https://api.pexels.com/v1/search"
    params = {"query": query, "per_page": count, "orientation": "landscape"}
    headers = {"Authorization": PEXELS_KEY}
    try:
        res = requests.get(url, params=params, headers=headers, timeout=10)
        res.raise_for_status()
        results = []
        for item in res.json().get("photos", []):
            results.append({
                "source": "Pexels",
                "url": item["src"]["large"],
                "page_url": item["url"],
                "photographer": item["photographer"],
            })
        return results
    except requests.RequestException as e:
        print(f"[Pexels] エラー: {e}", file=sys.stderr)
        return []


def search_pixabay(query: str, count: int) -> list[dict]:
    if not PIXABAY_KEY:
        print("[Pixabay] APIキーが設定されていません", file=sys.stderr)
        return []
    url = "https://pixabay.com/api/"
    params = {
        "key": PIXABAY_KEY,
        "q": query,
        "per_page": count,
        "image_type": "photo",
        "orientation": "horizontal",
        "lang": "ja",
    }
    try:
        res = requests.get(url, params=params, timeout=10)
        res.raise_for_status()
        results = []
        for item in res.json().get("hits", []):
            results.append({
                "source": "Pixabay",
                "url": item["largeImageURL"],
                "page_url": item["pageURL"],
                "photographer": item["user"],
            })
        return results
    except requests.RequestException as e:
        print(f"[Pixabay] エラー: {e}", file=sys.stderr)
        return []


def print_results(results: list[dict]):
    if not results:
        print("  該当なし")
        return
    for i, item in enumerate(results, 1):
        print(f"  [{i}] {item['source']} | 撮影者: {item['photographer']}")
        print(f"      画像URL  : {item['url']}")
        print(f"      ページURL: {item['page_url']}")
        print()


def main():
    parser = argparse.ArgumentParser(description="画像検索スクリプト")
    parser.add_argument("--query", "-q", required=True, help="検索キーワード")
    parser.add_argument(
        "--source", "-s",
        choices=["unsplash", "pexels", "pixabay", "all"],
        default="all",
        help="検索ソース（デフォルト: all）",
    )
    parser.add_argument(
        "--count", "-n",
        type=int,
        default=5,
        help="各ソースから取得する件数（デフォルト: 5）",
    )
    args = parser.parse_args()

    query = args.query
    source = args.source
    count = args.count

    print(f"\n検索キーワード: 「{query}」 / ソース: {source} / 各{count}件\n")
    print("=" * 60)

    if source in ("unsplash", "all"):
        print("\n【Unsplash】")
        print_results(search_unsplash(query, count))

    if source in ("pexels", "all"):
        print("\n【Pexels】")
        print_results(search_pexels(query, count))

    if source in ("pixabay", "all"):
        print("\n【Pixabay】")
        print_results(search_pixabay(query, count))

    print("=" * 60)
    print("完了\n")


if __name__ == "__main__":
    main()
