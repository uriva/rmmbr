# Privacy Policy

**Last updated: November 25, 2026**

This Privacy Policy explains how **rmmbr** ("rmmbr", "we", "us", or "our")
collects, uses, stores, and protects information when you use our hosted cloud
caching service at [https://rmmbr.net](https://rmmbr.net) and web portal at
[https://hi.rmmbr.net](https://hi.rmmbr.net) (collectively, the "Service").

If you have questions or requests regarding this Privacy Policy, contact the
operator via [https://github.com/uriva/rmmbr](https://github.com/uriva/rmmbr) or
[https://uriv.me](https://uriv.me).

---

## 1. What rmmbr Is

rmmbr is a cloud key-value and function-result caching service for developers,
accessible via the rmmbr SDKs, CLI, API (`https://rmmbr.net`), and web dashboard
(`https://hi.rmmbr.net`).

This Privacy Policy applies only to the hosted Service operated at `rmmbr.net`
and `hi.rmmbr.net`. If you self-host the open-source rmmbr code under its MIT
License, your own infrastructure and privacy practices govern your deployment.

---

## 2. Information We Collect

### Account & Authentication Data

- **Email address & user identifier:** When you sign in to manage API tokens via
  **InstantDB** (magic-code email login), InstantDB processes your email address
  and session tokens.
- **Legacy Auth0 accounts:** Users who authenticated through our legacy
  **Auth0** integration have a legacy user identifier (`sub`) and API token
  mappings stored in our backend.
- **API tokens:** Tokens generated to authenticate requests to
  `https://rmmbr.net`.

### Cached Payloads & Optional Client-Side Encryption

- **Cache keys, cache IDs, values, and TTLs:** When your application sends
  `get`, `set`, `delete`, or `kv:*` requests to the hosted API, we store the
  cache entry scoped to your account ID and `cacheId`.
- **Client-side end-to-end encryption (`encryptionKey`) is OPTIONAL:**
  - If you configure an `encryptionKey` in the rmmbr client, your cache values
    are encrypted client-side before leaving your machine, and rmmbr only stores
    ciphertext and never receives your encryption key.
  - **If you do not configure `encryptionKey`, cache keys and values are stored
    in plaintext as transmitted** (protected in transit over TLS). Do not send
    unencrypted regulated or highly sensitive data (such as payment card
    numbers, protected health information, or passwords) to the hosted Service.

### Operational & Request Metadata

- Basic request metadata such as HTTP method, RPC method name, timestamps, IP
  addresses, and standard edge network telemetry processed by Cloudflare Workers
  to route traffic, prevent abuse, and diagnose errors. We do not log cache
  `params` (keys or values) in application logs.

---

## 3. How We Use Information

We use the information we collect solely to:

- Authenticate your account and API tokens;
- Store, retrieve, expire, and delete cached entries according to your API
  requests;
- Operate, maintain, and secure the hosted Service and prevent abuse or service
  disruption;
- Respond to support, security, and deletion requests submitted via
  [https://github.com/uriva/rmmbr](https://github.com/uriva/rmmbr) or
  [https://uriv.me](https://uriv.me);
- Comply with applicable laws or valid legal process.

We do **not** sell, rent, or trade your personal information or cached data, and
we do not use third-party behavioral advertising trackers on the Service.

---

## 4. Infrastructure & Subprocessors

We rely on the following third-party infrastructure providers to operate the
hosted Service:

- **Cloudflare Workers:** Hosts and serves the rmmbr API and edge routing.
- **Redis (managed Redis provider):** Stores cached entries (with automatic TTL
  expiration) and legacy API token mappings.
- **InstantDB:** Provides magic-code email authentication and API token
  management for current accounts.
- **Auth0:** Supports authentication for legacy user accounts and legacy API
  token endpoints.

---

## 5. Data Retention & Expiration

- **Cached entries:** Every cache entry stored in Redis is subject to a
  **maximum Time-To-Live (TTL) of 90 days** (or any shorter TTL you specify in
  your client call), after which Redis automatically expires and deletes the
  entry. You may also delete individual entries at any time via the API.
- **Account and token records:** Retained for as long as your account remains
  active or until you revoke tokens or request account deletion.
- **Operational logs:** Short-term infrastructure logs retained briefly for
  reliability, debugging, and security.

---

## 6. Security

We use TLS encryption in transit, account-scoped key prefixing
(`uid:cacheId:key`), and access controls on our backend infrastructure. For
sensitive cached data, we strongly recommend enabling optional client-side
encryption via `encryptionKey`. No method of internet transmission or electronic
storage is 100% secure, so we cannot guarantee absolute security.

---

## 7. Your Privacy Rights (GDPR / CCPA) & Data Deletion

Depending on your location (including the EEA, UK, and California), you may have
the right to:

- Access the personal information we hold about you;
- Request correction of inaccurate account information;
- Request deletion of your account, API tokens, and associated data;
- Request data portability, restriction of processing, or object to certain
  processing;
- Exercise your rights without discrimination.

**To request account or data deletion**, contact the operator via
[https://github.com/uriva/rmmbr](https://github.com/uriva/rmmbr) or
[https://uriv.me](https://uriv.me) with the email address associated with your
account. We will verify your identity and fulfill your request within a
reasonable timeframe (typically within 30 days), except where retention is
required by law.

---

## 8. Children's Privacy

The Service is intended for developers and adults aged 18 and older (or the age
of majority in your jurisdiction). We do not knowingly collect personal
information from children under 18. If you believe a child has provided personal
data to us, contact the operator via
[https://github.com/uriva/rmmbr](https://github.com/uriva/rmmbr) or
[https://uriv.me](https://uriv.me) and we will delete it.

---

## 9. Changes to This Policy

We may update this Privacy Policy from time to time by posting the revised
version with an updated "Last updated" date. Continued use of the Service after
changes take effect constitutes your acceptance of the updated policy.

---

## 10. Governing Law & Contact

This Privacy Policy is governed by the laws of the **State of New Mexico, United
States**, without regard to conflict-of-law principles.

For any privacy questions or data deletion requests, contact us at:

- **GitHub:** [https://github.com/uriva/rmmbr](https://github.com/uriva/rmmbr)
- **Operator:** [https://uriv.me](https://uriv.me)
- **Websites:** [https://rmmbr.net](https://rmmbr.net) /
  [https://hi.rmmbr.net](https://hi.rmmbr.net)
