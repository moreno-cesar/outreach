# Spike: lead data source (OUT-30)

Research date: 26 October 2026. This is a product recommendation from published terms and from samples pulled without API keys. It is not a legal opinion. A short counsel check is listed at the end before customer data is stored in a paid workspace.

Issues this unblocks:

- [OUT-22](https://github.com/moreno-cesar/outreach/issues/22) lead finder
- [OUT-39](https://github.com/moreno-cesar/outreach/issues/39) Canadian sources
- Warm-up fields in [OUT-31](https://github.com/moreno-cesar/outreach/issues/31) and trigger feeds in [OUT-32](https://github.com/moreno-cesar/outreach/issues/32), which both say to use the source chosen here

## Decision

Store lead records from government license and filing files. Do not build the lead finder on Google Places API (New).

Places is a poor system of record for Outreach for three independent reasons:

1. The Google Maps Platform Terms prohibit saving the business listing. Section 3.2.3(a) says the customer will not "pre-fetch, index, store, reshare, or rehost Google Maps Content" and gives "copy and save business names, addresses, or user reviews" as an example. Google Maps Content is defined to include "places data (including business listings)." Phone and website are Places fields, so they are covered even though the example sentence names name, address, and reviews. The only identifier that may be kept indefinitely is `place_id`. The only Places cache the service terms allow is latitude and longitude, for 30 consecutive days, after which it must be deleted. Section 3.2.3(c)(iv) separately prohibits using Places latitude/longitude as an input for point-in-polygon analysis, so those coordinates also cannot be kept to test a workspace territory.
2. Section 3.2.3(d)(iii) prohibits using the Google Maps Core Services "in a listings or directory service." A vertical-and-territory business search that an agent imports into a workspace is that kind of product.
3. Text Search (New) returns at most 60 results for a query. That is a sample of what Google chooses to rank, not the set of licensed HVAC, plumbing, or electrical contractors in a state.

OUT-22 should search a workspace territory against a table Outreach refreshes from the registries below, then import the rows the agent selects. Each lead stores the business name, phone when the registry publishes one, address, license number as the source id, license status or expiration, trade, territory, source name, and the file's as-of date. Website and employee count stay empty until a vendor contract expressly allows those fields to live in a customer's workspace and in the CSV export (OUT-12).

What is dialable in the first three territories, checked against the published layouts and, for Texas, against the live open-data file on 26 October 2026:

| Territory and trade | Dialable from a free public file? | Why |
| --- | --- | --- |
| Texas electrical | Yes | TDLR open data: 14,031 Electrical Contractor rows, 14,025 with a business phone and 14,012 with a street address |
| Texas HVAC | No | Same file: 20,462 A/C Contractor rows, 0 business phones, 0 street addresses. Owner name and county are present |
| Texas plumbing | Not yet shown | Plumbers are licensed by TSBPE, not TDLR. The Responsible Master Plumber CSV is free and daily. This environment could not download it (Cloudflare HTTP 403), so phone and address are unconfirmed |
| Florida HVAC, plumbing, electrical | Identity and address only | DBPR's weekly licensee extract has name, DBA, mailing address, license class, status, and original licensure date. The official column list has no phone |
| Georgia HVAC, plumbing, electrical | No | SOS lookup is one record at a time. Bulk is a paid roster request. Published descriptions of that roster include no phone |
| British Columbia, any trade | No | OrgBook has legal name, status, and registration date, and is legally barred from showing address or phone. Technical Safety BC covers electrical and gas contractors, but no bulk file was found |

OUT-39 should not block the US lead finder. For the BC pilot, request Technical Safety BC's published contractor lists and join them to OrgBook for legal name, status, and registration date. Import a BC row into the dialer only after that list is inspected and a phone is actually on it.

## What the product needs from a source

OUT-22 imports a cold lead with name, phone, website, address, a stable source id, and the workspace territory. The power dialer needs a stored number that has already passed call-compliance checks (OUT-21 / OUT-27). Re-fetching a number at dial time from a source that forbids storage does not meet that.

OUT-31 wants employee count or range (the useful band is about 5–50), a hiring signal, and years in business, each with a source and an as-of date. OUT-32 wants a daily or weekly feed of new filings, new or renewed licenses, and growth events inside the workspace's territories.

None of the free sources has employee count or hiring. Years in business is available where the file has an original license date, a formation date, or a registration date. Places does not publish employee count either, so it does not solve OUT-31.

## Comparison

| Source | Name | Phone | Website | Address | Employees | License status | Years in business | Cost | May Outreach store it on a lead? | Refresh | Access |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Places API (New) | Yes | Yes, Enterprise field | Yes, Enterprise field | Yes | No | Business status only | No | Text Search Enterprise: 1,000 free/month, then $35 per 1,000 | No, except `place_id` | Live | API, max 60 results per text query |
| Florida DBPR construction and electrical | Yes, plus DBA | Not in the licensee extract | No | Mailing address | No | Yes | Original licensure date | Free | Yes, as a Chapter 119 public record. Counsel check below | Weekly | Bulk CSV from the public-records pages. No API key. This host got HTTP 403 |
| Florida Sunbiz corporate filings | Entity name and up to six officers | No | No | Principal and mailing | No | Active / inactive | File date of the formation filing | Free | Yes, for the entity. Do not dial officer home addresses | Daily files on work days; full active snapshot quarterly | Public SFTP. Fixed-width text. No API |
| Texas TDLR open data | Yes | Yes for Electrical Contractor; no for A/C Contractor | No | Yes for Electrical Contractor; county only for A/C Contractor | No | No status column. Expiration date only | No issue date | Free | Published for download. License on the portal is "unspecified." Counsel check below | Portal says the listing is updated daily. The snapshot read here was last modified 19 October 2026 | Socrata JSON, no key for small reads. Also CSV from TDLR |
| Texas TSBPE plumbing | Person name and last known company name on the Responsible Master Plumber list | Not verified this run | No | Not verified this run | No | Expiration is implied; the page says expired licenses must not be used | Unknown until the CSV is opened | Free | Disclaimer permits download and disclaims accuracy | Daily, "current as of the previous work day" | CSV links on the board site. No API found |
| Georgia SOS licensing rosters | Yes | No, on every description found | No | City, ZIP, county, and issue date. Street address is disputed between an old form and a current listing | No | Expiration date | Issue date, if the current roster still has it | Historical roster form: $100 per profession. Confirm the current form | Buying the roster is the permitted bulk path. One-by-one lookup is not a feed | Whatever the purchased file's date is. No standing feed found | Paid text file by request. Public lookup is one licensee at a time |
| OrgBook BC | Legal name and DBAs | No | No | No | No | Active / historical, from the credential | Registration date | Free | Yes for the fields it returns, under BC government terms. Full-database scraping is prohibited | About 30 minutes after BC Registries | REST, no key for reads. Rate limited |
| BC Registries search API | Yes | No | No | On the paid profile | No | Yes | Registration / filing dates on the profile | $7.00 statutory + $1.50 service charge per BC Registry Search | The paid profile is a purchased record. Do not bulk-buy the registry | Real time | API key and account id required |
| Technical Safety BC contractor search | Contractor name | The public guide says "contact details" are shown. Not verified in bulk | Unknown | Address is published only with the licensee's consent (Safety Standards Act s. 21) | No | Active licenses only in the public search; enforcement actions since 2022 | Unknown | Free to search. Informal copies of already published lists are free | Use a list the registrar publishes or releases. Do not scrape the search tool as the integration | Not published | Web search. No bulk API found |
| Data Axle business API | Yes | Yes, on the standard plan | Yes, on the standard plan | Yes | Yes, on the standard plan | "In business" recency, not a trade-board status | Year established appears on a filed 2025–26 schedule, not in the standard-plan bullet list | Standard plan: $50 per 1,000 records requested, for 3,001–100,000 records/month | Only under a contract that allows a multi-tenant workspace and customer CSV export. Marketing copy invites building products; the schedule controls | Real time, plus a changes API | REST. Search, scan, match, changes, file delivery |
| ZoomInfo | Yes | Yes, including direct dials on higher packages | Yes | Yes | Yes | Not a license status | Founding year on some records | Quote only. No public list price | No for this product. License is for the licensee's own B2B use, not for the benefit of other persons | Continuous during the subscription | Web app and API under the ordering document |
| Apollo | Yes | Yes, credits | Website on the organization record | Yes | Estimated employee count | No | Founded year | Seat plans are Free, Basic, Professional, Custom. Dollar amounts were not in the text of the pricing page. Organization search is 1 credit per page | No under standard plans. Powering a product for customers requires a separate agreement | On demand, while the subscription is current | API. Credits reset each billing cycle and do not roll over |

## Google Places API (New)

Docs and terms read 26 October 2026.

The pending OUT-22 approach was `places:searchText` with a field mask that includes `nationalPhoneNumber` and `websiteUri`. Those two fields, plus opening hours, rating, and price fields, are what trigger the **Text Search Enterprise** SKU. A request is billed at the highest SKU of any field in the mask. List price for SKU `E967-44BC-B44D`: 1,000 free events per month, then $35 per 1,000 up to 100,000, $28 per 1,000 through 500,000, and lower above that. `displayName` alone would be Text Search Pro ($32 per 1,000, 5,000 free). `id` alone is Text Search Essentials (IDs Only) and is priced at $0 with an unlimited free cap. Place Details Essentials (IDs Only), the call used to refresh a stored `place_id`, is also unlimited at $0.

Text Search returns at most 20 results per page and at most 60 results across pages. There is no employee-count field and no years-in-business field in the Places field lists.

Storage, from the terms:

- [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms), section 3.2.3(a), (b), (c), and (d). The no-scraping clause forbids pre-fetching, indexing, storing, resharing, or rehosting Google Maps Content, and names copying business names and addresses. The no-caching clause allows a cache only where the service-specific terms allow it. The listings clause forbids use in a listings or directory service.
- [Maps Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms), section 3: `place_id` may be cached. Section 14.3: Places latitude and longitude may be cached for 30 consecutive calendar days and must then be deleted. Name, phone, website, and street address are not in that permission.
- [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies) (page updated 2026-10-23): the place id is exempt from the caching restrictions and may be stored indefinitely. The same page says the end-user Autocomplete exception, which lets a person keep a street address they selected, applies only to that address and "does not apply to any POI or address lookup functionality offered by other Google Maps Platform Services." A search for plumbers is a POI lookup.
- [Place IDs](https://developers.google.com/maps/documentation/places/web-service/place-id): refresh ids older than 12 months with a Place Details call for the id field only. An obsolete id returns `NOT_FOUND` when the business closes or moves. Keeping the original query so it can be re-run is the documented recovery, and that re-run is billed.

Places UI Kit does not remove the restriction. Its service terms still require compliance with the bans on caching and exporting Google Maps Content when it is combined with other services.

The [Places Aggregate API](https://cloud.google.com/maps-platform/terms/maps-service-terms) terms (section 13.3) also say it must not be used in a way that results in decisions or scoring of an individual relating to insurance. That product is not a candidate for employee count.

A design that stores only `place_id` and calls Place Details when the agent opens the lead still fails OUT-22: the dialer needs a stored number, the 60-result cap remains, and the directory-service clause still applies to the search itself. OUT-47 (a restricted Places key) is not on the critical path for the lead finder. Leave the key uncreated until there is a use that counsel has read against section 3.2.3.

Non-EEA terms are the ones quoted. Customers with an EEA billing address are on a different terms set. Outreach's expected billing address is outside the EEA.

## Florida DBPR (construction and electrical)

Construction trades are licensed by the Construction Industry Licensing Board. Electrical contractors are a separate board. Both publish weekly licensee extracts under [Chapter 119, Florida Statutes](https://www.myfloridalicense.com/sto/documents/readme.pdf) (the DBPR download disclaimer cites s. 119.01(2)(b) and the duty to provide electronic copies of non-exempt records).

Official layout for the licensee file, from that disclaimer:

- Board number, occupation code, licensee name, doing-business-as name, class code
- Three address lines, city, state, ZIP, county code
- License number, primary status, secondary status
- Original licensure date, effective date, expiration date, renewal period, alternate license number

There is no phone column, no email column, and no website column on that layout. Phone does appear on the construction/electrical *applicant* layout and on the hotels-and-restaurants extract. Those are different files. The disclaimer says the construction file is refreshed weekly, is provided as-is, and is large enough that the department warns about spreadsheet row limits. It also tells requestors they can sort by original license date or county and delete occupations they do not want, which is the use Outreach would make of it.

Occupation codes that map to the pilot verticals, from the same disclaimer:

| Vertical | Board / code | License | Class, where published |
| --- | --- | --- | --- |
| HVAC | 06 / 0601 | CAC, Certified Air Conditioning Contractor | A commercial, B residential, C service |
| HVAC | 06 / 0614 | RA, Registered Air Conditioning Contractor | A / B / C, same split |
| Plumbing | 06 / 0604 | CFC, Certified Plumbing Contractor | |
| Plumbing | 06 / 0617 | RF, Registered Plumbing Contractor | |
| Electrical | 08 / 0801 and 08 / 0805 | EC certified, ER registered | Separate electrical extract. Specialty class codes exist for alarms, signs, and limited energy |

Related rows that should not become dial targets: course providers, financial responsible officers, and qualified-business-organization rows until the file is profiled. Florida licenses the qualifier (a person) and often a business organization separately. The DBA field is how a person's license points at the company. The import should prefer a row with a DBA or a qualified-business record, and it should keep the qualifier name as a contact on that business rather than as a second lead.

The construction public-records page is [www2.myfloridalicense.com/construction-industry/public-records](https://www2.myfloridalicense.com/construction-industry/public-records/). The electrical page is [www2.myfloridalicense.com/electrical-contractors/public-records](https://www2.myfloridalicense.com/electrical-contractors/public-records/). Both say the extract includes active, inactive, and voluntarily inactive licensees, and excludes null-and-void, delinquent, and involuntarily inactive records. Disappearing from the weekly file is itself an OUT-32 signal. Primary status codes in the disclaimer (the general DBPR table) include 20 Current, 30 Probation, 42 Suspended, 45 Delinquent, and 60 Null and Void. Confirm the construction file uses those numeric codes, rather than a one-letter code, when the CSV is opened. This environment could not open it: Cloudflare returned HTTP 403 for the public-records page and for the extract path named in secondary write-ups.

Use the Florida file as the trade, address, status, and years-licensed spine. Join a phone from a later source before the row can be dialed. Years licensed in Florida is not the same fact as the age of the current LLC: a qualifier can have held a license before the company existed.

## Florida Sunbiz

The Division of Corporations publishes free corporate downloads "for informational purposes," as-is, and says files may be changed or removed at any time ([data downloads](https://dos.fl.gov/sunbiz/other-services/data-downloads/)). Daily files exist on work days. Quarterly files in January, April, July, and October are the full active snapshot. Access is browser or SFTP at `sftp.floridados.gov`. The public username and password are printed on that page; do not copy them into the repo. Read them from the page at runtime.

Daily corporate filings live at `doc/cor/yyyymmddc.txt`. Daily events live at `doc/cor/events/yyyymmddce.txt`. The [corporate file definition](https://dos.sunbiz.org/data-definitions/cor.html) is fixed-width, 1,440 characters: document number, name, status (`A` or `I`), filing type (including `FLAL` for a Florida LLC and `DOMP` for a domestic profit corporation), principal address, mailing address, file date, FEI number, last transaction date, three annual-report years, registered agent, and up to six officers with title and address. The definition warns that address and officer fields in the file can lag sunbiz.org because of the fixed width. Annual reports and address changes are not all in the event file.

There is no phone, website, NAICS code, or employee count. A name keyword such as "air" or "plumb" is a weak trade filter and will both miss "ABC Mechanical LLC" and keep firms that only have the word in an old name.

Use Sunbiz for OUT-32, not as the lead-finder index. A useful trigger is a new domestic LLC or corporation whose normalized name and city match an active DBPR license. That is "a licensed contractor just formed an entity," which is a better benefits-sales moment than either file alone.

Officer street addresses on small LLCs are often homes. Keep them off the dialer even though the file is public. The lead address should be the entity's principal address. Call compliance (OUT-21) still applies to any number later joined to that address.

## Texas TDLR

TDLR publishes every license it holds to [data.texas.gov dataset 7358-krk7](https://data.texas.gov/dataset/TDLR-All-Licenses/7358-krk7), sourced from [the TDLR license-file page](https://www.tdlr.texas.gov/LicenseSearch/licfile.asp). The portal lists 18 columns, about 967,000 rows, and license "unspecified." The agency is subject to the Texas Public Information Act, Government Code chapter 552. No click-wrap beyond that was found on the Socrata endpoint. Small JSON reads do not need an app token.

Columns include license type and number, business name, business street, city/state/ZIP, county, business telephone, expiration date (`MM/DD/YYYY`), owner name, and the same fields for the mailing address. There is no original issue date, no website, no employee count, and no status other than the expiration date. Treat a row whose expiration is before today as not importable. The filtered-view text on the portal says the listing is updated daily. The SODA header on the snapshot read for this spike was `X-SODA2-Truth-Last-Modified: Mon, 19 Oct 2026`, seven days before the research date, so the mirror can lag. The import job should record that header as the as-of date and should prefer the TDLR direct file if the mirror falls further behind.

Counts from that snapshot, via `scripts/poc/sample_public_lead_source.py`:

| License type | Rows | Business name | Business phone | Street address |
| --- | --- | --- | --- | --- |
| Electrical Contractor | 14,031 | 14,031 | 14,025 | 14,012 |
| A/C Contractor | 20,462 | 20,050 | 0 | 0 |

A/C rows do have owner name (20,462) and a county (19,685). They do not have a city line or a phone. The electrical address line is sometimes a PO box rather than a job site, so territory matching should also use the city line and county. Subtypes on the A/C rows match TDLR's class letters (environmental and refrigeration, class A and class B, plus combined endorsements). Those letters are a scope of work, not a headcount. Electrical Sign Contractor (652) and Appliance Installation Contractor (829) are also fully populated with phone and address; they are adjacent to the electrical vertical, not a substitute for HVAC.

The [TDLR license-listing format](https://www.tdlr.texas.gov/dbproduction2/lrformat.txt) describes a comma-delimited file that includes phone and business address as columns. Those columns exist on the open-data row and are empty for A/C contractors, so this is not a parser bug. Texas HVAC cannot be dialed from this file. Electrical can. Source id for an imported lead is `license_type` plus `license_number`, because license numbers are not unique across types.

Plumbers are not in this dataset. A query for license types containing "plumb" returned no plumbing board.

## Texas plumbing (TSBPE)

The Texas State Board of Plumbing Examiners publishes [free licensee CSVs](https://tsbpe.texas.gov/free-licensee-list/), updated daily, "current as of the previous work day," with a disclaimer that the board guarantees nothing and will correct errors it is told about. The Responsible Master Plumber list is the business list: the page says it contains the last known company name, and that a company offering plumbing to the public must have at least one Responsible Master Plumber and insurance on file with the board. Master, journeyman, tradesman, and apprentice lists are individual workers and should not be imported as leads.

The page does not document whether the RMP file has phone or street address. Download of the page itself returned Cloudflare HTTP 403 from this environment, so the header row was not inspected. OUT-22 plumbing for Texas waits on that one-time inspection. If the RMP file has company name plus phone and address, it becomes the plumbing source on the same pattern as TDLR electrical. If it has company name only, it joins the Florida pattern: identity without a dialable number.

## Georgia SOS licensing

The Secretary of State licenses conditioned air contractors, electrical contractors, and plumbers. The public lookup at [sos.ga.gov/licensing-division-license-lookup](https://sos.ga.gov/licensing-division-license-lookup) is organized under Building & Contractors. [verify.sos.ga.gov](https://verify.sos.ga.gov/verification/) says the site is for individual verification and that bulk data requires the Roster Request Form.

A circulated Professional Licensing Boards roster form (footer `IT/KM/08-09`) lists Conditioned Air Contractor, Electrical Contractor, and Plumber at $100 each, delivered as text, containing license number, name, address, city, state, ZIP, county, issue date, and expiration date, and not containing phone or email. A non-government storefront selling a "Conditioned Air Contractor-Non Restricted License Roster" for $100 in 2026 describes the same price and the same dates, and says the file does not include phone, personal mailing address, or email. Those two descriptions disagree about street address. The current form from the Secretary of State is the authority, and this spike did not download it.

Georgia is not a v1 dialable source. Issue date, if the current roster still has it, is a years-in-business field worth having later. There is no API and no daily feed. New-business filings at the Georgia Corporations Division were not priced in this spike.

## OrgBook BC and BC Registries

[OrgBook BC](https://orgbook.gov.bc.ca/) is the free public directory of verifiable credentials issued from BC Registries. The API at `https://orgbook.gov.bc.ca/api/` requires no key for reads. The client FAQ (source in [orgbook-bc-client `faq/en.ts`](https://github.com/bcgov/orgbook-bc-client/blob/main/src/data/faq/en.ts)) states:

- Fields that are public: legal name, DBAs, BC Registries id, CRA business number when available, entity type, active or historical status, and registration events such as name changes and dissolutions.
- Address, directors, contact information, and ownership are not displayed. The FAQ calls that a legislative restriction and points people to BC Registries for the rest.
- Updates land in about 30 minutes.
- Use is under the BC Government terms of use. Scraping the full database is against the terms. High-volume clients are asked to throttle. Responses observed here carried rate-limit policies of 50 and 25 requests per one-second window.
- Search is by legal name, BC Registries id, or CRA business number. There is no trade or NAICS filter. The web UI caps how far a person can page.

A live read on 26 October 2026 confirms the gap. `GET /api/v2/search/autocomplete?q=plumbing&inactive=false` reported 5,643 keyword hits. That count is "the legal name contains this word," not "this firm holds a plumbing licence." The first v3 hit, T.N.T. PLUMBING, registries id `FM0061400`, has credential attributes `registration_date` 1985-05-24, `entity_status` `ACT`, `entity_type` `SP`, and `home_jurisdiction` `BC`. The attribute list has no phone, address, website, or employee count. The script prints this shape.

[BC Registries Registry Search API](https://developer.connect.gov.bc.ca/en-CA/products/rs/overview/) is the paid counterpart. Every request needs a BC Registries API key and an account id. A staff reply on the BC Registries forum (29 December 2025) says the registry API can return further information for a fee, including a corporate summary with addresses, and that OrgBook only carries what BC Registries can publish at no cost. The [BC OnLine price list](https://www.bconline.gov.bc.ca/price_list.html) prices a BC Registry Search at $7.00 statutory fee plus a $1.50 service charge. That is a reasonable price to open one known entity. It is not a price at which to enumerate HVAC firms: OrgBook's plumbing keyword alone is thousands of hits, and most BC companies are not trade contractors. Paid profiles still are not a phone directory and are not coded by trade.

## Technical Safety BC, and the rest of Canada

Technical Safety BC licenses electrical contractors and gas contractors (the provincial credential closest to HVAC). The [Find a Licensed Contractor](https://www.technicalsafetybc.ca/regulatory-resources/find-a-licensed-contractor) tool searches active licences by company name or licence number. The [guide](https://www.technicalsafetybc.ca/regulatory-resources/licensed-contractor-guide) says the registry shows contact details, scope of work, and enforcement actions since 2022. The [Safety Standards Act](https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/03039_01) sections 20 and 21 require a registry and allow the registrar to publish it, and they forbid publishing an address that is personal information unless the person has consented. So a phone on that search page cannot be assumed to survive into a bulk list, and an address may be absent even when the registrar has one.

[Informal requests](https://www.technicalsafetybc.ca/contact/contact-us/request-information) for information the organization has already published, "including ... lists of licensed contractors," are free. That request is the next BC step. Do not scrape the search tool. Plumbing in BC is generally a municipal matter, not a Technical Safety BC technology, so a TSBC list will not cover plumbers. Employee count will still be absent.

Other provinces, for the OUT-39 note, not for the first build:

- Quebec. The Régie du bâtiment du Québec publishes the [list of active licences](https://open.canada.ca/data/en/dataset/755b45d6-7aee-46df-a216-748a0191c79f) as CSV and JSON on Données Québec. Anyone who performs construction work for others needs an RBQ licence unless exempt. Field-level phone and address fill was not inspected here. This is the strongest next provincial file after BC is understood.
- Ontario. The Electrical Safety Authority [contractor locator](https://findacontractor.esasafe.com/) searches licensed electrical contractors and includes HVAC as a type of work. No sanctioned bulk file was found. Do not scrape it.
- Alberta. No single free provincial trade-contractor bulk file turned up in this pass. The corporate registry is a paid search, on the same pattern as BC OnLine.

Places is not the Canadian phone backfill. The storage and directory clauses apply to Canadian business listings the same way they apply to US ones.

## Paid vendors

License-board files are the right index for trades that must be licensed, because a local HVAC shop is often missing from a B2B contact database built for technology companies. Vendors are the candidate for the fields the boards do not have: employee size, website, and a phone where the board withheld one. They are a bad embedded database unless the contract allows Outreach to store the fields on a customer's lead and include them in that customer's export.

**Data Axle** is the vendor to ask. The [business API page](https://www.data-axle.com/data-solutions/apis/) (read 26 October 2026) prices a standard plan at $50 per 1,000 records for 3,001–100,000 records a month, and says volumes above that go to sales. The standard attribute list on that page includes addresses, phone, employees, names, categories, and website. The page also says the APIs are for building apps and bringing the data into the customer's own products, and that records are pay-as-you-go based on records requested. A higher tier adds further employee and contact attributes; its price did not render as a clean figure in the page text, so confirm it on the page. A [2025–2026 licensed-data schedule](https://www.opramachine.com/request/records_request_library_vendor_c/response/148009/attach/10/Data%20Axle%20MPSA%20Lic%20Data%20Schedule%202025%202026%20signed.pdf) filed in a public-records response lists, among US business attributes, phone, website, corporate employee size, year established, and years in database, and its geography line reads "All United States and all Canada." That schedule is someone else's contract. It shows the attributes exist. It does not give Outreach those rights.

Ask Data Axle for a schedule that names the fields (employee range, year established, website, phone), allows those fields to be stored on a lead inside a customer workspace, allows the customer's own CSV export, and states the retention period and the refresh (the changes API versus paying again per record each month). Use it as a join onto a license row (name plus address), not as the list of who is licensed. Ten thousand Florida joins at the published standard rate are $500 for that request volume, before any enhanced attributes.

**ZoomInfo** does not fit the shared lead index. The [License Terms and Conditions dated 1 May 2025](https://www.zoominfo.com/legal/ltc_05_01_2025) grant a non-exclusive license during the term (section 1.1), say downloaded copies do not transfer ownership (section 1.3), and limit use to the licensee's own B2B sales, marketing, recruiting, or business development (section 2.3: not "for the benefit of or on behalf of any person or entity except Licensee"). Section 1.4 forbids integrating the materials so that people who are not authorized users can access them. Section 3.3.1 lets the licensee keep using materials obtained during the term after the agreement ends, still subject to those use limits, and requires them to stop using ZoomInfo's technology. [Pricing](https://www.zoominfo.com/faqs/pricing) is a custom quote. Coverage of 5–50 employee trade shops is the weaker product fit even if a special license were negotiated.

**Apollo** is the same shape at a lower published entry point. The [pricing page](https://www.apollo.io/pricing) describes Free, Basic, Professional, and Custom plans and says, in the FAQ, that those plans are for internal business use and that using Apollo data to power an external product or share it with customers is not allowed without a separate agreement. The [API credit table](https://docs.apollo.io/docs/api-pricing) charges organization search at 1 credit per page (up to 100 results) and organization enrichment at 1 credit per organization. Job-posting search, which would have been the OUT-31 hiring signal, is also 1 credit per page. Credits reset each cycle and do not roll over. Seat prices did not appear as text on the pricing page (they appear to be rendered outside the extracted copy), so no dollar figure is stated here. Apollo's estimated employee counts are a poor match for "must be a licensed contractor," and the standard contract does not allow Outreach to hand the records to agent customers.

## Recommendation for OUT-22

Replace the Places approach in the issue with a registry search.

1. Ingest, on a schedule, the dialable files into an internal table keyed by source and license number, with the file's as-of timestamp. First file: TDLR Electrical Contractor, dropping rows with a past expiration or a blank phone.
2. Map the agent's vertical and territory onto license types. Texas + electrical is the first pair that returns name, phone, and address. Other pairs return a clear empty state ("this registry does not publish a phone") rather than a Places fallback.
3. The agent previews rows and imports the ones they want. Imported leads are cold, source `lead finder`, source id = license number, scoped to the workspace, deduped on source id. Website and employee count are null. Territory is the workspace territory that contained the address.
4. Add TSBPE Responsible Master Plumber after its header is inspected. Add the Florida DBPR extracts as the address, trade, status, and original-licensure-date record, and keep phone null until a join exists. Georgia stays off the dialer.
5. Searches count against the workspace quota (OUT-34) as registry queries, which are cheap. The cost that matters is the ingest and the later enrichment quote, not a per-search Places fee.
6. Numbers still pass OUT-21 / OUT-27 before they can be dialed. A license-board phone is often a business line and is not automatically a safe-harbor number.

Vertical crosswalk for the importer:

| Agent vertical | Florida DBPR | Texas | Georgia roster |
| --- | --- | --- | --- |
| HVAC | CAC, RA, class A/B/C | A/C Contractor (not dialable from open data) | Conditioned Air |
| Plumbing | CFC, RF | TSBPE Responsible Master Plumber | Plumber |
| Electrical | EC, ER | TDLR Electrical Contractor | Electrical |

## Recommendation for OUT-39

OrgBook is the identity, status, and years-registered source for a BC business whose legal name is already known. It cannot answer "electrical contractors in Vancouver" and it cannot fill the dialer.

The BC path that can:

1. File an informal request with Technical Safety BC for the published lists of electrical contractors and gas contractors. Inspect phone, city, and licence class before writing an importer.
2. Join a list row to OrgBook on legal name to store registries id, entity status, entity type, and registration date, plus the TSBC licence number as the source id and the list date as the as-of date.
3. Leave plumbing, website, and employee count empty for the pilot, and say so in the BC empty state.
4. Do not buy BC Registry Search in bulk. Use the $8.50 search only when an agent asks to open one named entity and the workspace is willing to pay the statutory fee.
5. When a second province is justified, evaluate the Quebec RBQ open file before Ontario or Alberta.

OUT-39's acceptance item "the lead finder can search a Canadian province and trade and import leads" stays open until the TSBC list is in hand and has a phone. The source and as-of date required by that issue should be columns on every lead, including US ones.

## OUT-31 and OUT-32

**Years in business (OUT-31).** Store it where a date exists, labeled as what it actually is:

- Florida: DBPR original licensure date ("licensed in Florida since")
- Florida, when a Sunbiz row matches: corporate file date ("entity filed on")
- BC: OrgBook `registration_date`
- Texas open data: not available. Expiration is not a start date
- Georgia: issue date, only after the current roster is confirmed to include it

**Employee count and hiring (OUT-31).** Not in the free files, and not in Places. Ship the lead without them. The 5–50 filter waits on a Data Axle (or equivalent) schedule with redistribution rights. Do not use Apollo job postings or ZoomInfo headcount inside the product under their standard contracts. Florida class A versus class B is a commercial-versus-residential licence scope, not a headcount, and should not be displayed as an employee range.

**Triggers (OUT-32).** Diff the same files:

- TDLR electrical: new license numbers since the previous as-of date, and expirations inside the next renewal window. These can be one-click leads because the phone is on the row.
- DBPR weekly: new original-licensure dates, and licenses that vanished from the extract. These are research cards until a phone is joined.
- Sunbiz daily: new domestic LLCs and corporations, shown when they match a DBPR name and city. Do not create a dialable lead from Sunbiz alone.
- OrgBook and TSBC: a BC trigger feed waits on the TSBC list. OrgBook keyword search is too broad to page through under the anti-scraping term.

## Proof of concept

`scripts/poc/sample_public_lead_source.py` uses the Python standard library and no secrets.

```bash
python3 scripts/poc/sample_public_lead_source.py --limit 5
python3 scripts/poc/sample_public_lead_source.py --source orgbook --query plumbing
python3 scripts/poc/sample_public_lead_source.py --source all --limit 3 --write /tmp/sample.json
```

The default command reads TDLR and prints Electrical Contractor rows plus the A/C fill rates. `--source orgbook` reads one plumbing-name credential from OrgBook. A frozen sample from the 26 October 2026 run is in `scripts/poc/samples/public-sample.json`.

Florida was not scripted, because the extract is behind Cloudflare from this host and because the official layout already answers the field question.

## Checks before build

1. Counsel, briefly: storing Chapter 119 and Texas public-information license rows in a paid multi-tenant workspace, and exporting them to the customer who imported them. Also confirm Sunbiz officer addresses stay off the dialer.
2. From a browser, open the Florida construction extract and confirm the headerless columns match the disclaimer (in particular, that there is still no phone).
3. Open the TSBPE Responsible Master Plumber CSV and record whether phone and street address are present.
4. Send the Technical Safety BC informal request for the electrical and gas contractor lists.
5. If Florida, Georgia, or Texas HVAC must be dialable for the first agents, request the Data Axle redistribution schedule described above. Do not start that by creating the Places key in OUT-47.

## Sources

All read 26 October 2026 unless noted.

- Google Maps Platform Terms of Service, section 3.2.3 and the definition of Google Maps Content: https://cloud.google.com/maps-platform/terms
- Google Maps Platform Service Specific Terms, sections 3, 13.3, and 14: https://cloud.google.com/maps-platform/terms/maps-service-terms
- Places API policies (updated 2026-10-23): https://developers.google.com/maps/documentation/places/web-service/policies
- Place IDs: https://developers.google.com/maps/documentation/places/web-service/place-id
- Text Search (New), including the 60-result cap and Enterprise field list: https://developers.google.com/maps/documentation/places/web-service/text-search
- Places SKU details: https://developers.google.com/maps/billing-and-pricing/sku-details
- Core services price list: https://developers.google.com/maps/billing-and-pricing/pricing
- DBPR licensee-download disclaimer and occupation codes: https://www2.myfloridalicense.com/sto/documents/readme.pdf
- DBPR construction public records: https://www2.myfloridalicense.com/construction-industry/public-records/
- DBPR electrical public records: https://www2.myfloridalicense.com/electrical-contractors/public-records/
- Sunbiz data downloads: https://dos.fl.gov/sunbiz/other-services/data-downloads/
- Sunbiz daily files: https://dos.fl.gov/sunbiz/other-services/data-downloads/daily-data/
- Sunbiz corporate file definitions: https://dos.sunbiz.org/data-definitions/cor.html
- TDLR open data: https://data.texas.gov/dataset/TDLR-All-Licenses/7358-krk7
- TDLR license files: https://www.tdlr.texas.gov/LicenseSearch/licfile.asp
- TDLR listing format: https://www.tdlr.texas.gov/dbproduction2/lrformat.txt
- TSBPE free licensee lists: https://tsbpe.texas.gov/free-licensee-list/
- Georgia license lookup: https://sos.ga.gov/licensing-division-license-lookup
- Georgia individual-verification notice: https://verify.sos.ga.gov/verification/
- OrgBook BC API: https://orgbook.gov.bc.ca/api/
- OrgBook FAQ source: https://github.com/bcgov/orgbook-bc-client/blob/main/src/data/faq/en.ts
- BC Registries API: https://developer.connect.gov.bc.ca/en-CA/products/rs/overview/
- BC Registries staff explanation of OrgBook versus the registry API (29 December 2025): https://discourse.onebc.ca/t/clarification-needed-difference-between-bc-registry-api-and-orgbook-api-search-results/613
- BC OnLine price list: https://www.bconline.gov.bc.ca/price_list.html
- Technical Safety BC contractor search and guide: https://www.technicalsafetybc.ca/regulatory-resources/find-a-licensed-contractor and https://www.technicalsafetybc.ca/regulatory-resources/licensed-contractor-guide
- Technical Safety BC informal requests: https://www.technicalsafetybc.ca/contact/contact-us/request-information
- Safety Standards Act, ss. 20–21: https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/03039_01
- RBQ active licences, open data: https://open.canada.ca/data/en/dataset/755b45d6-7aee-46df-a216-748a0191c79f
- ESA contractor locator: https://findacontractor.esasafe.com/
- Data Axle APIs: https://www.data-axle.com/data-solutions/apis/
- ZoomInfo license terms (1 May 2025): https://www.zoominfo.com/legal/ltc_05_01_2025
- ZoomInfo pricing FAQ: https://www.zoominfo.com/faqs/pricing
- Apollo pricing: https://www.apollo.io/pricing
- Apollo API credits: https://docs.apollo.io/docs/api-pricing
