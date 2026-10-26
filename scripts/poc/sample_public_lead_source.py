#!/usr/bin/env python3
"""Pull a small sample from a free public lead source. No API keys.

Default source is the Texas Department of Licensing and Regulation open-data
file (Socrata dataset 7358-krk7). It prints a few Electrical Contractor rows,
which include a business phone and street address, and the fill rates that
show A/C Contractor rows do not.

`--source orgbook` reads OrgBook BC (no key). A trade word matches legal
names only. The credential has status and registration date, and no phone
or address.

Florida DBPR is not called. The licensee layout published by DBPR has no
phone column, and the extract URL returned Cloudflare HTTP 403 from this
environment on 2026-10-26. See docs/spikes/lead-data-source.md.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

USER_AGENT = "outreach-lead-data-spike/1.0 (public-data sample; no key)"
TDLR_ENDPOINT = "https://data.texas.gov/resource/7358-krk7.json"
ORGBOOK_SEARCH = "https://orgbook.gov.bc.ca/api/v3/search/autocomplete"
ORGBOOK_COUNT = "https://orgbook.gov.bc.ca/api/v2/search/autocomplete"
ORGBOOK_CREDENTIAL = "https://orgbook.gov.bc.ca/api/v4/credential/{credential_id}"

ELECTRICAL = "Electrical Contractor"
AIR_CONDITIONING = "A/C Contractor"
SAMPLE_FIELDS = (
    "license_type,license_number,license_subtype,business_name,owner_name,"
    "business_address_line1,business_city_state_zip,business_county,"
    "business_telephone,license_expiration_date_mmddccyy"
)


class SampleError(RuntimeError):
    pass


def fetch(url: str) -> tuple[dict, bytes]:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            headers = {key.lower(): value for key, value in response.headers.items()}
            body = response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read(400).decode("utf-8", "replace")
        raise SampleError(f"HTTP {exc.code} for {url}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise SampleError(f"request failed for {url}: {exc.reason}") from exc
    try:
        payload = json.loads(body)
    except json.JSONDecodeError as exc:
        raise SampleError(f"response was not JSON for {url}") from exc
    return headers, payload


def soda(params: dict[str, str]) -> tuple[dict, list]:
    url = TDLR_ENDPOINT + "?" + urllib.parse.urlencode(params)
    headers, payload = fetch(url)
    if not isinstance(payload, list):
        raise SampleError("TDLR response was not a list")
    return headers, payload


def tdlr_fill(license_type: str) -> dict:
    headers, rows = soda(
        {
            "$select": (
                "count(*) as n, "
                "count(business_name) as business_name, "
                "count(owner_name) as owner_name, "
                "count(business_address_line1) as street, "
                "count(business_city_state_zip) as city_line, "
                "count(business_county) as county, "
                "count(business_telephone) as phone, "
                "count(license_expiration_date_mmddccyy) as expiration"
            ),
            "$where": f"license_type = '{license_type}'",
        }
    )
    if not rows:
        raise SampleError(f"no fill-rate row for {license_type}")
    row = {key: int(value) for key, value in rows[0].items()}
    row["license_type"] = license_type
    row["dataset_last_modified"] = headers.get("x-soda2-truth-last-modified")
    return row


def sample_tdlr(limit: int) -> dict:
    fill_electrical = tdlr_fill(ELECTRICAL)
    fill_ac = tdlr_fill(AIR_CONDITIONING)
    _, rows = soda(
        {
            "$select": SAMPLE_FIELDS,
            "$where": (
                f"license_type = '{ELECTRICAL}' "
                "AND business_telephone IS NOT NULL "
                "AND business_name IS NOT NULL "
                "AND business_address_line1 IS NOT NULL"
            ),
            "$order": "license_number",
            "$limit": str(limit),
        }
    )
    return {
        "source": "Texas TDLR open data",
        "dataset": "data.texas.gov 7358-krk7",
        "endpoint": TDLR_ENDPOINT,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "dataset_last_modified": fill_electrical.get("dataset_last_modified"),
        "electrical_contractor_fill": fill_electrical,
        "ac_contractor_fill": fill_ac,
        "electrical_sample": rows,
    }


def sample_orgbook(query: str) -> dict:
    _, search = fetch(ORGBOOK_SEARCH + "?" + urllib.parse.urlencode({"q": query}))
    results = search.get("results") if isinstance(search, dict) else None
    if not results:
        raise SampleError(f"OrgBook returned no results for {query!r}")
    hit = results[0]
    credential_id = hit.get("credential_id")
    if not credential_id:
        raise SampleError("OrgBook hit had no credential_id")
    _, credential = fetch(ORGBOOK_CREDENTIAL.format(credential_id=credential_id))
    attributes = {
        item.get("type"): item.get("value")
        for item in credential.get("attributes", [])
        if isinstance(item, dict)
    }
    _, counted = fetch(
        ORGBOOK_COUNT
        + "?"
        + urllib.parse.urlencode({"q": query, "inactive": "false"})
    )
    return {
        "source": "OrgBook BC",
        "endpoint": ORGBOOK_SEARCH,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "query": query,
        "keyword_hits_excluding_inactive": counted.get("total"),
        "sample": {
            "legal_name": hit.get("value"),
            "bc_registries_id": hit.get("topic_source_id"),
            "credential_id": credential_id,
            "entity_status": attributes.get("entity_status"),
            "entity_type": attributes.get("entity_type"),
            "home_jurisdiction": attributes.get("home_jurisdiction"),
            "registration_date": attributes.get("registration_date"),
            "phone": None,
            "address": None,
            "website": None,
            "employee_count": None,
            "attribute_types": sorted(attributes),
        },
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        choices=("tdlr", "orgbook", "all"),
        default="tdlr",
        help="public source to sample (default: tdlr)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=5,
        help="electrical contractor rows to return (default: 5)",
    )
    parser.add_argument(
        "--query",
        default="plumbing",
        help="OrgBook legal-name query (default: plumbing)",
    )
    parser.add_argument(
        "--write",
        help="also write the JSON sample to this path",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.limit < 1 or args.limit > 20:
        print("--limit must be between 1 and 20", file=sys.stderr)
        return 2
    try:
        if args.source == "tdlr":
            payload = sample_tdlr(args.limit)
        elif args.source == "orgbook":
            payload = sample_orgbook(args.query)
        else:
            payload = {
                "retrieved_at": datetime.now(timezone.utc).isoformat(),
                "tdlr": sample_tdlr(args.limit),
                "orgbook": sample_orgbook(args.query),
            }
    except SampleError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    text = json.dumps(payload, indent=2)
    print(text)
    if args.write:
        destination = Path(args.write)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(text + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
