# Terms of Service

**Last updated: November 25, 2026**

These Terms of Service ("Terms") govern your access to and use of the hosted
**rmmbr** cloud caching service operated at
[https://rmmbr.net](https://rmmbr.net) and
[https://hi.rmmbr.net](https://hi.rmmbr.net), including its API, web portal, and
hosted endpoints (collectively, the "Service"). By accessing or using the
Service, you agree to be bound by these Terms and our
[Privacy Policy](./privacy_policy.md). If you do not agree, do not use the
Service.

---

## 1. Open-Source Software vs. Hosted Service

The rmmbr client libraries, CLI, and server source code are made available as
open-source software under the **MIT License** in our repository at
[https://github.com/uriva/rmmbr](https://github.com/uriva/rmmbr).

- **Self-hosted use** of the open-source code is governed solely by the MIT
  License.
- **Hosted use** of `https://rmmbr.net`, `https://hi.rmmbr.net`, and our managed
  caching infrastructure is governed by these Terms of Service.

---

## 2. Eligibility & Accounts

- You must be at least 18 years old (or the age of legal majority in your
  jurisdiction) to use the Service.
- You are responsible for maintaining the confidentiality of your login
  credentials, magic-code email access, and API tokens, and for all activity
  conducted using your account or tokens.
- Notify us immediately via
  [https://github.com/uriva/rmmbr](https://github.com/uriva/rmmbr) or
  [https://uriv.me](https://uriv.me) if you suspect unauthorized access to your
  account or API tokens.

---

## 3. Nature of the Caching Service & Optional Encryption

- **Ephemeral Cache (90-Day Max TTL):** rmmbr is an ephemeral cloud cache backed
  by Redis with a **maximum TTL of 90 days** per entry. Cached entries may
  expire, be evicted, or be cleared at any time. **Do not use rmmbr as durable
  primary storage or as your sole copy of important data.**
- **Optional Client-Side Encryption:** Client-side end-to-end encryption
  (`encryptionKey`) is **optional**. When you do not enable `encryptionKey`,
  cached keys and values are stored on our infrastructure in plaintext as
  transmitted. You are solely responsible for deciding whether to encrypt data
  before sending it to the Service and for safeguarding your own `encryptionKey`
  (we cannot recover lost keys).
- **Your Data & License:** You retain all ownership rights to the data you cache
  through the Service. You grant rmmbr a limited license to store, transmit, and
  process that data solely as necessary to operate, maintain, and secure the
  Service.

---

## 4. Acceptable Use Policy

You agree not to use the Service to:

- Store, cache, or transmit unlawful, infringing, malicious, or fraudulent
  content;
- Store **unencrypted sensitive or legally regulated data**, including protected
  health information (PHI / HIPAA-regulated data), payment card data (PCI-DSS),
  government identification numbers, or credentials/secrets of third parties
  without authorization;
- Disrupt, overload, flood, scrape, or impose unreasonable load on our
  Cloudflare Workers or Redis infrastructure;
- Probe, scan, test vulnerabilities of, or attempt to bypass authentication,
  rate limits, or isolation boundaries of the Service;
- Violate any applicable local, state, national, or international law or
  third-party rights.

We reserve the right to throttle, block, suspend, or terminate accounts or
delete cached entries that violate these Terms or threaten the stability or
security of the Service.

---

## 5. Service Changes & Availability

We may modify, update, impose usage limits on, or discontinue any part of the
Service at any time. While we aim to operate the Service reliably, we make no
uptime guarantees unless separately agreed in writing.

---

## 6. Third-Party Infrastructure

The Service operates on third-party infrastructure providers including
Cloudflare Workers, managed Redis, InstantDB, and legacy Auth0. rmmbr is not
responsible for outages, delays, or failures caused by third-party networks or
infrastructure providers outside our reasonable control.

---

## 7. Disclaimer of Warranties

THE SERVICE IS PROVIDED **"AS IS"** AND **"AS AVAILABLE"** WITHOUT WARRANTIES OF
ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING ANY IMPLIED
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, OR
NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
ERROR-FREE, OR SECURE, OR THAT CACHED DATA WILL BE PRESERVED WITHOUT EXPIRATION,
EVICTION, OR LOSS.

---

## 8. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:

- NEITHER rmmbr NOR ITS OPERATORS OR SUPPLIERS SHALL BE LIABLE FOR ANY INDIRECT,
  INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING
  LOSS OF DATA, LOST PROFITS, LOSS OF GOODWILL, OR BUSINESS INTERRUPTION,
  ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN
  IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
- rmmbr'S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING TO
  THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE FEES YOU
  PAID TO rmmbr FOR THE SERVICE IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING
  THE EVENT GIVING RISE TO LIABILITY, OR (B) ONE HUNDRED U.S. DOLLARS ($100
  USD).

---

## 9. Indemnification

You agree to indemnify, defend, and hold harmless rmmbr and its operators from
and against any claims, damages, losses, liabilities, and expenses (including
reasonable attorneys' fees) arising out of or related to: (a) data you store or
cache through the Service; (b) your use of the Service; or (c) your violation of
these Terms or any applicable law or third-party right.

---

## 10. Termination & Data Deletion

You may stop using the Service at any time and request deletion of your account
and tokens via [https://github.com/uriva/rmmbr](https://github.com/uriva/rmmbr)
or [https://uriv.me](https://uriv.me). We may suspend or terminate your access
to the Service at any time, with or without cause or notice. Sections relating
to intellectual property, disclaimers, limitation of liability, indemnification,
and governing law survive termination.

---

## 11. Governing Law

These Terms and any dispute arising out of or relating to them or the Service
are governed by the laws of the **State of New Mexico, United States**, without
regard to its conflict-of-law rules.

---

## 12. Changes & Contact

We may update these Terms from time to time by posting the updated Terms with a
new "Last updated" date. Your continued use of the Service after updates take
effect constitutes acceptance of the revised Terms.

For questions, notices, or support, contact us at:

- **GitHub:** [https://github.com/uriva/rmmbr](https://github.com/uriva/rmmbr)
- **Operator:** [https://uriv.me](https://uriv.me)
- **Websites:** [https://rmmbr.net](https://rmmbr.net) /
  [https://hi.rmmbr.net](https://hi.rmmbr.net)
