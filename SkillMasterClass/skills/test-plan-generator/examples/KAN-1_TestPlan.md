# Test Plan — KAN-1: Bankout Payment Request

> Status: **DRAFT — pending human review.** Not approved until a QA owner signs off.

---

## 1. Scope & Objectives

- **In scope:**
  - Create Payment Request API (`POST /payment-request`)
  - Mandatory field validation (Transaction ID, Amount, Sender Name, Sender Account Number, Beneficiary Name, Beneficiary Account, Sender Account Type)
  - Optional field handling (Ref ID)
  - Data-type validation (numeric, string, decimal, enum)
  - Length validation for all fields
  - Amount validation (positive, non-zero, decimal support)
  - Transaction ID uniqueness / duplicate rejection
  - Sender Account Type validation (Saving, Current only)
  - Same-account rejection (Sender = Beneficiary)
  - Success response structure
  - Error response structure and messaging
  - Atomic request processing (no partial creation)
  - Sensitive data masking in logs
  - Secure transmission (HTTPS/TLS)
  - Audit logging

- **Out of scope:**
  - Authentication/Authorization mechanism (deferred to Phase 2 — noted as gap)
  - Payment execution / fund transfer
  - Payment cancellation / reversal / refund
  - Transaction history / search UI
  - Beneficiary management
  - Scheduled / recurring payments
  - International currency conversion
  - Notification management
  - Idempotency key mechanism (mentioned in PRD but not detailed)

- **Objective:** Verify that the Bankout Create Payment Request API correctly validates, accepts, rejects, and logs payment requests per all stated business rules, field requirements, and acceptance criteria.

---

## 2. Gaps & Questions for the Author

| # | Area | Finding | Question to author |
|---|------|---------|-------------------|
| 1 | Transaction ID | ⚠️ Ambiguous | PRD says "Number/String" but examples show numeric-only (`12345`) and rejects `ABCDE` and `12A45`. Is Transaction ID strictly numeric? What is the exact length constraint (example `123` is rejected as "invalid")? |
| 2 | Transaction ID length | ❌ Missing | What are the min/max length limits? The PRD says "must comply with the defined length" but doesn't define it. |
| 3 | Ref ID format | ⚠️ Ambiguous | "Defined character and length restrictions" and "special characters should be restricted" — what are the exact allowed characters and max length? |
| 4 | Amount precision | ⚠️ Ambiguous | How many decimal places are supported? Is `50000.999` valid? What is the maximum transaction amount? |
| 5 | Sender Name length | ❌ Missing | "Maximum length should be configurable" — what is the configured max for this release? |
| 6 | Sender Name characters | ⚠️ Ambiguous | "Valid characters" not defined. Are spaces, hyphens, apostrophes allowed? (e.g., `O'Brien`, `Mary-Jane`) |
| 7 | Sender Account Number length | ❌ Missing | "Must comply with banking rules" — what is the exact length range? |
| 8 | Sender Account Number format | ⚠️ Ambiguous | "Permitted account-number characters" not defined. Numeric-only? Alphanumeric? |
| 9 | Beneficiary Name | ❌ Missing | Same gaps as Sender Name — length and allowed characters undefined. |
| 10 | Beneficiary Account | ❌ Missing | Same gaps as Sender Account Number — length and format undefined. |
| 11 | Account Type case | ⚠️ Ambiguous | PRD says "case handling should be defined by the API specification." Is `saving` (lowercase) accepted or only `Saving`? |
| 12 | Sender-Beneficiary name match | ❌ Missing | BR-005 says "Sender account must be associated with the submitted Sender Name where account verification is implemented." Is this in scope for Phase 1? |
| 13 | Self-transfer (BR-006) | ⚠️ Ambiguous | "If self-transfer is not supported by the business" — is self-transfer supported or rejected in this release? |
| 14 | Authentication | ❌ Missing | PRD defers auth mechanism to technical design. How should the API be tested without auth? Is there a test bypass? |
| 15 | API endpoint | ⚠️ Ambiguous | `POST /payment-request` is listed as "example" — is this the final endpoint? |
| 16 | Response structure | ⚠️ Ambiguous | Success response example shows `transactionId`, `refId`, `status`, `message`. Is this final? What error response structure looks like (error codes, field-level errors)? |
| 17 | Idempotency | ❌ Missing | PRD mentions idempotency should be "considered" but provides no implementation detail. Is it in scope for Phase 1? |
| 18 | Concurrent request handling | ❌ Missing | No specific concurrency limit or test criteria defined beyond "should support multiple requests." |
| 19 | Performance SLA | ⚠️ Ambiguous | "≤ 2 seconds for normal requests" — is this the final SLA or still TBD? |
| 20 | Logging format | ❌ Missing | Audit log fields listed but no spec on format (JSON, structured log), retention, or destination. |

---

## 3. Test Scenarios

### P0 — Critical (must-pass for release)

| ID | Type | Scenario | Maps to |
|----|------|----------|---------|
| TS-01 | Positive | Create payment request with all valid mandatory fields (Saving account type) | AC-001, BR-001 |
| TS-02 | Positive | Create payment request with all valid mandatory fields (Current account type) | AC-005 |
| TS-03 | Positive | Create payment request with optional Ref ID provided | AC-001, AC-007 |
| TS-04 | Positive | Create payment request without optional Ref ID | AC-007 |
| TS-05 | Negative | Submit request with Transaction ID missing | AC-002, BR-001 |
| TS-06 | Negative | Submit request with Amount missing | AC-002, BR-001 |
| TS-07 | Negative | Submit request with Sender Name missing | AC-002, BR-001 |
| TS-08 | Negative | Submit request with Sender Account Number missing | AC-002, BR-001 |
| TS-09 | Negative | Submit request with Beneficiary Name missing | AC-002, BR-001 |
| TS-10 | Negative | Submit request with Beneficiary Account missing | AC-002, BR-001 |
| TS-11 | Negative | Submit request with Sender Account Type missing | AC-002, BR-001 |
| TS-12 | Negative | Submit request with duplicate Transaction ID | AC-004, BR-002 |
| TS-13 | Negative | Submit request with Amount = 0 | AC-003, BR-003 |
| TS-14 | Negative | Submit request with negative Amount | AC-003, BR-003 |
| TS-15 | Negative | Submit request with non-numeric Amount (e.g., "ABC") | AC-003, BR-003 |
| TS-16 | Negative | Submit request with invalid Account Type (e.g., "Loan") | AC-006, BR-004 |
| TS-17 | Negative | Submit request where Sender Account = Beneficiary Account | BR-006 |
| TS-18 | Negative | Submit malformed JSON request | AC-002 |
| TS-19 | Positive | Verify success response structure (transactionId, refId, status, message) | AC-001, API-002 |
| TS-20 | Positive | Verify error response identifies the failing field(s) | AC-002, API-003 |

### P1 — High (important but not release-blocking if deferred)

| ID | Type | Scenario | Maps to |
|----|------|----------|---------|
| TS-21 | Boundary | Amount with minimum valid value (e.g., 0.01) | BR-003 |
| TS-22 | Boundary | Amount with maximum decimal precision (e.g., 50000.99) | BR-003 |
| TS-23 | Boundary | Transaction ID at minimum valid length | Field req 8.1 |
| TS-24 | Boundary | Transaction ID at maximum valid length | Field req 8.1 |
| TS-25 | Negative | Transaction ID with leading/trailing spaces | Field req 8.1 |
| TS-26 | Negative | Transaction ID with alphabetic characters (e.g., "ABCDE") | Field req 8.1 |
| TS-27 | Negative | Transaction ID with mixed alphanumeric (e.g., "12A45") | Field req 8.1 |
| TS-28 | Boundary | Sender Name at maximum length | Field req 8.4 |
| TS-29 | Negative | Sender Name with numeric-only value (e.g., "123456") | Field req 8.4 |
| TS-30 | Boundary | Beneficiary Name at maximum length | Field req 8.6 |
| TS-31 | Negative | Beneficiary Name with numeric-only value | Field req 8.6 |
| TS-32 | Boundary | Sender Account Number at min/max length | Field req 8.5 |
| TS-33 | Boundary | Beneficiary Account at min/max length | Field req 8.7 |
| TS-34 | Negative | Sender Account Number with invalid characters | Field req 8.5 |
| TS-35 | Negative | Beneficiary Account with invalid characters | Field req 8.7 |
| TS-36 | Positive | Account Type "Saving" (exact case) | AC-005, BR-004 |
| TS-37 | Positive | Account Type "Current" (exact case) | AC-005, BR-004 |
| TS-38 | Negative | Account Type case variation (e.g., "saving", "SAVING") | BR-004 |
| TS-39 | Positive | Ref ID with valid format | Field req 8.2 |
| TS-40 | Negative | Ref ID with invalid special characters | Field req 8.2 |
| TS-41 | Positive | Verify sensitive data (account numbers) masked in logs | AC-008, SEC-002 |
| TS-42 | Positive | Verify request transmitted over HTTPS | AC-008, SEC-001 |
| TS-43 | Positive | Verify audit trail captures transaction details | Audit req |

### P2 — Medium (edge cases, nice-to-have)

| ID | Type | Scenario | Maps to |
|----|------|----------|---------|
| TS-44 | Boundary | Amount with very large value (e.g., 999999999.99) | BR-003 |
| TS-45 | Boundary | All fields at maximum length simultaneously | Field reqs |
| TS-46 | Negative | Empty JSON body `{}` | AC-002 |
| TS-47 | Negative | Null values for mandatory fields | AC-002 |
| TS-48 | Negative | Extra unknown fields in request body | API validation |
| TS-49 | Positive | Sender Name with permitted special chars (hyphen, apostrophe) | Field req 8.4 |
| TS-50 | Positive | Beneficiary Name with permitted special chars | Field req 8.6 |
| TS-51 | Negative | SQL injection attempt in string fields | SEC-003 |
| TS-52 | Negative | JSON injection attempt in request body | SEC-003 |
| TS-53 | Positive | Concurrent duplicate Transaction ID submissions (race condition) | BR-002, REL-001 |
| TS-54 | Positive | Verify atomic processing — failed validation does not create partial record | BR-008 |
| TS-55 | Negative | Sender Name with only spaces | Field req 8.4 |
| TS-56 | Negative | Beneficiary Name with only spaces | Field req 8.6 |

---

## 4. Test Data & Environment

- **Data:**
  - Valid sender accounts: `123456789012` (Saving), `112233445566` (Current)
  - Valid beneficiary accounts: `987654321098`, `665544332211`
  - Valid Transaction IDs: `12345`, `10001`, `99999`
  - Valid amounts: `100`, `50000.00`, `0.01`, `999999.99`
  - Valid sender names: `Rahul Sharma`, `O'Brien`, `Mary-Jane`
  - Valid beneficiary names: `Amit Patil`, `Jean-Pierre Dupont`
  - Invalid data sets per each negative scenario

- **Environment / flags:**
  - Target environment TBD (dev/staging)
  - API base URL TBD
  - HTTPS endpoint required
  - No authentication bypass confirmed (pending gap #14)

- **Roles / permissions:**
  - Authorized user/system (can create requests)
  - Unauthorized user/system (should be rejected — Phase 2)

---

## 5. Risks & Assumptions

- **Assumptions made:**
  - Transaction ID is strictly numeric (based on examples rejecting alphabetic input)
  - Account Type is case-sensitive (`Saving`/`Current` only)
  - Self-transfer (same sender/beneficiary account) is NOT supported in this release
  - Authentication is not enforced in Phase 1 testing (or a test bypass exists)
  - The API endpoint is `POST /payment-request`
  - Ref ID allows alphanumeric characters with some special chars (format TBD)
  - Decimal precision for Amount is 2 decimal places

- **Risks:**
  - Undefined field lengths/formats may lead to test gaps or false failures
  - No auth mechanism defined — security testing is incomplete
  - Idempotency behavior unclear — duplicate handling during retries untestable
  - Concurrent request handling has no defined limits — race condition testing is best-effort
  - Account validation (BR-005) scope unclear for Phase 1

---

## 6. Entry / Exit criteria

- **Entry:**
  - API endpoint is deployed and accessible in test environment
  - All mandatory fields are accepted by the API contract
  - Test data (valid accounts, transaction IDs) is available
  - HTTPS is configured (or HTTP test bypass confirmed)
  - Logging/audit system is operational

- **Exit:**
  - All P0 scenarios pass (100%)
  - All P1 scenarios pass (≥ 95%, remaining documented)
  - P2 scenarios executed (≥ 80%)
  - No open P0/P1 defects
  - All gaps from Section 2 are resolved or accepted by the product owner
  - Audit logging verified for success and failure cases
  - Sensitive data masking confirmed in logs

---

## HUMAN REVIEW GATE

- **I assumed:**
  - Transaction ID is numeric-only (PRD examples contradict the "Number/String" data type)
  - Account Type is case-sensitive
  - Self-transfer is rejected
  - 2 decimal places for Amount
  - No authentication required for Phase 1 API testing

- **I could not confirm:**
  - Exact field length constraints (Transaction ID, Ref ID, names, account numbers)
  - Allowed character sets for names and account numbers
  - Maximum transaction amount
  - Whether account-name verification (BR-005) is in Phase 1
  - Final API endpoint path
  - Error response structure (field-level errors vs. single message)
  - Idempotency implementation scope

- **Open questions blocking sign-off:**
  1. What are the exact min/max lengths for Transaction ID, account numbers, names, and Ref ID?
  2. Is Transaction ID strictly numeric or alphanumeric?
  3. Is Account Type case-sensitive?
  4. Is self-transfer rejected or allowed?
  5. What authentication mechanism (if any) applies to Phase 1?
  6. What does the error response JSON structure look like?
  7. Is idempotency in scope for Phase 1?

- **Approve, or edit, before I write test cases / automation.**
