# Test Plan: Job Tracker AI Application

## 1. Executive Summary

This test plan covers the comprehensive testing of the Job Tracker AI application — a local-first, browser-based Kanban job tracking system built with React 18+, Vite, Tailwind CSS, and IndexedDB. The application enables users to manage job applications through a visual Kanban workflow with full CRUD operations, drag-and-drop, search/filtering, and data persistence.

**Application URL:** http://localhost:5173/

---

## 2. Gap Analysis & Open Questions

### 2.1 Requirements Clarifications Needed

| # | Question | Impact | Priority |
|---|----------|--------|----------|
| Q1 | What is the maximum number of jobs the application should support without performance degradation? | Performance testing scope | High |
| Q2 | Should the application support multiple resumes (comma-separated) or single resume per job? | Data model validation | Medium |
| Q3 | What happens when a user tries to import JSON that contains jobs with duplicate LinkedIn URLs? | Import validation logic | Medium |
| Q4 | Should the "Days since applied" auto-calculate or remain static after editing the date? | UI behavior testing | High |
| Q5 | What is the expected behavior when IndexedDB storage quota is exceeded? | Error handling scope | Medium |
| Q6 | Should search be case-sensitive or case-insensitive? (Spec says "contains" but doesn't specify) | Search testing | High |
| Q7 | Should drag-and-drop work across all columns or only adjacent columns? | Kanban workflow testing | High |
| Q8 | What validation should apply to LinkedIn URL format? (e.g., must contain linkedin.com) | Form validation scope | Medium |
| Q9 | Should the application preserve column scroll positions after drag-and-drop? | UX testing | Low |
| Q10 | What happens to the application state when IndexedDB is cleared by the browser? | Error recovery testing | Medium |

### 2.2 Assumptions

1. **Case-insensitive search**: Search will be case-insensitive by default (modern UX expectation)
2. **Cross-column drag-and-drop**: Jobs can be moved between any columns (not just adjacent)
3. **Single resume per job**: Each job stores one resume name (dropdown selection)
4. **Auto-calculate days**: "Days since applied" recalculates dynamically based on current date
5. **LinkedIn URL validation**: Basic URL format validation (starts with http/https)
6. **Unlimited jobs**: No artificial limit, but performance testing will verify at 100+ jobs
7. **Browser compatibility**: Chrome, Firefox, Edge (latest 2 versions)
8. **Responsive breakpoints**: Mobile (< 768px), Tablet (768-1024px), Desktop (> 1024px)

---

## 3. Test Scenarios by Priority

### 3.1 P0 — Critical (Must Pass for Release)

#### 3.1.1 Job Creation (CRUD - Create)

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-P0-001 | Create job with all required fields | 1. Click "Add Job"<br>2. Fill Company, Job Title<br>3. Click Save | Job created in Wishlist column | Job appears in Wishlist with correct data |
| TC-P0-002 | Create job with all fields | 1. Click "Add Job"<br>2. Fill all fields (Company, Title, URL, Resume, Salary, Notes)<br>3. Click Save | Job created with all data preserved | All fields display correctly on card |
| TC-P0-003 | Create job without Company name | 1. Click "Add Job"<br>2. Leave Company empty<br>3. Fill Job Title<br>4. Click Save | Validation error: "Company name is required" | Form prevents submission, shows error |
| TC-P0-004 | Create job without Job Title | 1. Click "Add Job"<br>2. Fill Company<br>3. Leave Job Title empty<br>4. Click Save | Validation error: "Job title is required" | Form prevents submission, shows error |
| TC-P0-005 | Date auto-population | 1. Click "Add Job"<br>2. Check Date Applied field | Date is pre-filled with today's date | Date field shows current date, editable |

#### 3.1.2 Job Display (CRUD - Read)

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-P0-006 | Display job card correctly | Create a job with all fields | Card shows Company, Title, Resume, Days since applied, LinkedIn link | All required elements visible |
| TC-P0-007 | LinkedIn link functionality | 1. Create job with LinkedIn URL<br>2. Click LinkedIn link | Opens URL in new tab/window | Link is clickable, opens correct URL |
| TC-P0-008 | Days since applied calculation | Create job, wait 1+ days | Shows correct number of days | Calculation is accurate |
| TC-P0-009 | Kanban column counts | Create 3 jobs in Wishlist | Wishlist shows count "3" | Count updates in real-time |

#### 3.1.3 Job Editing (CRUD - Update)

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-P0-010 | Edit job salary | 1. Click Edit on job<br>2. Change salary<br>3. Click Save | Salary updated in UI and IndexedDB | Change persists after refresh |
| TC-P0-011 | Edit job status | 1. Click Edit on job<br>2. Change status to "Applied"<br>3. Click Save | Job moves to Applied column | Column counts update correctly |
| TC-P0-012 | Edit required fields | 1. Click Edit<br>2. Clear Company name<br>3. Click Save | Validation error | Cannot save without required fields |

#### 3.1.4 Job Deletion (CRUD - Delete)

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-P0-013 | Delete job with confirmation | 1. Click Delete<br>2. Confirm deletion | Job removed from UI and IndexedDB | Column count decreases |
| TC-P0-014 | Cancel job deletion | 1. Click Delete<br>2. Cancel | Job remains unchanged | No data loss |
| TC-P0-015 | Delete confirmation dialog | Click Delete on any job | Shows "Are you sure?" dialog | Dialog appears before deletion |

#### 3.1.5 Data Persistence

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-P0-016 | Persistence after browser refresh | 1. Create job<br>2. Refresh browser (F5) | Job still displayed | Data survives refresh |
| TC-P0-017 | Persistence after browser restart | 1. Create job<br>2. Close browser<br>3. Reopen | Job still displayed | Data survives restart |
| TC-P0-018 | Persistence after app restart | 1. Create job<br>2. Stop dev server<br>3. Restart | Job still displayed | IndexedDB persists independently |

#### 3.1.6 Drag-and-Drop Kanban

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-P0-019 | Drag job from Wishlist to Applied | Drag card from Wishlist to Applied column | Job status changes to Applied | Persists after refresh |
| TC-P0-020 | Drag job to Rejected | Drag card from Interview to Rejected | Job moves to Rejected | Column counts update |
| TC-P0-021 | Drag-and-drop persistence | 1. Drag job<br>2. Refresh browser | Job remains in new column | Status persisted to IndexedDB |
| TC-P0-022 | Column counts update on drag | Drag job from Wishlist (5) to Applied (3) | Wishlist: 4, Applied: 4 | Counts update immediately |

---

### 3.2 P1 — High Priority

#### 3.2.1 Search and Filtering

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-P1-001 | Search by company name | Type "ABC" in search bar | Shows only jobs with "ABC" in company name | Non-matching jobs hidden |
| TC-P1-002 | Search by job title | Type "QA Engineer" in search bar | Shows jobs with matching title | Case-insensitive matching |
| TC-P1-003 | Clear search results | 1. Search for "ABC"<br>2. Clear search bar | All jobs displayed again | No data modification |
| TC-P1-004 | Search with no results | Search for "XYZNonExistent" | Shows empty state message | No errors, graceful empty state |
| TC-P1-005 | Search updates without refresh | Type in search field | Results update dynamically | Real-time filtering |

#### 3.2.2 Form Validation

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-P1-006 | LinkedIn URL validation | Enter invalid URL format | Validation error message | Prevents invalid URLs |
| TC-P1-007 | Valid LinkedIn URL | Enter "https://linkedin.com/jobs/123" | Accepts URL | Link works correctly |
| TC-P1-008 | Date validation | Enter invalid date format | Validation error | Only valid dates accepted |
| TC-P1-009 | Edit date applied | Change date in edit mode | Date updates correctly | Persists after save |

#### 3.2.3 Kanban Board

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-P1-010 | All 6 columns visible | Load application | Wishlist, Applied, Follow-up, Interview, Offer, Rejected displayed | All columns present |
| TC-P1-011 | Column independent scrolling | Add 20+ jobs to one column | Column scrolls independently | Other columns unaffected |
| TC-P1-012 | Empty column state | No jobs in a column | Shows empty state message | Clear indication of empty state |
| TC-P1-013 | Status-specific visual accents | View jobs in different columns | Each column has distinct visual styling | Visual differentiation clear |

#### 3.2.4 UI/UX Requirements

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-P1-014 | Responsive layout - Desktop | View on 1920x1080 | All 6 columns visible horizontally | Full Kanban board visible |
| TC-P1-015 | Responsive layout - Tablet | View on 768x1024 | Columns stack or scroll horizontally | Usable on tablet |
| TC-P1-016 | Responsive layout - Mobile | View on 375x667 | Single column view or horizontal scroll | Usable on mobile |
| TC-P1-017 | Modal form behavior | Click "Add Job" | Modal opens with form | Modal closes on save/cancel |
| TC-P1-018 | Validation messages clarity | Submit empty form | Clear error messages displayed | Messages are descriptive |

---

### 3.3 P2 — Medium Priority (Optional Features)

#### 3.3.1 Light/Dark Mode

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-P2-001 | Toggle dark mode | Click dark mode toggle | UI switches to dark theme | All elements styled correctly |
| TC-P2-002 | Dark mode persistence | 1. Enable dark mode<br>2. Refresh browser | Dark mode remains active | Preference saved |
| TC-P2-003 | Light mode default | First application load | Light mode is default | Clean, professional appearance |

#### 3.3.2 Export/Import

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-P2-004 | Export jobs as JSON | Click Export button | Downloads JSON file with all jobs | File contains valid JSON |
| TC-P2-005 | Import valid JSON | 1. Click Import<br>2. Select valid JSON file | Jobs imported successfully | Jobs appear in correct columns |
| TC-P2-006 | Import invalid JSON | Import malformed JSON file | Error message displayed | No data corruption |
| TC-P2-007 | Import duplicate data | Import JSON with existing jobs | Confirmation prompt or merge behavior | User controls overwrite |
| TC-P2-008 | Export/Import round-trip | 1. Export jobs<br>2. Clear browser data<br>3. Import exported file | All jobs restored exactly | Data integrity maintained |

#### 3.3.3 Sorting

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-P2-009 | Sort by newest date | Click "Sort by Newest" | Jobs sorted by most recent application date | Correct chronological order |
| TC-P2-010 | Sort by oldest date | Click "Sort by Oldest" | Jobs sorted by oldest application date | Correct chronological order |
| TC-P2-011 | Sort persistence within session | Sort, then add new job | New job appears in correct sorted position | Sort maintained |

---

## 4. Error Handling & Edge Cases

### 4.1 IndexedDB Failures

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-ERR-001 | IndexedDB unavailable | Disable IndexedDB in browser settings | Graceful error message | User informed of storage issue |
| TC-ERR-002 | Storage quota exceeded | Fill storage to capacity | Error message, no silent failure | Data not lost silently |
| TC-ERR-003 | IndexedDB transaction failure | Simulate transaction error | Error handled gracefully | Application remains functional |

### 4.2 Data Integrity

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-ERR-004 | Concurrent edits | Open same job in two tabs | Last save wins or conflict resolution | No data corruption |
| TC-ERR-005 | Special characters in fields | Enter `<script>alert('test')</script>` in Company | Stored as text, not executed | XSS prevention |
| TC-ERR-006 | Very long text input | Enter 1000+ characters in Notes | Text truncated or scrollable | UI remains usable |
| TC-ERR-007 | Empty IndexedDB on first load | Fresh browser, no data | Shows empty Kanban with helpful message | No errors on load |

### 4.3 Drag-and-Drop Edge Cases

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-ERR-008 | Drag to same column | Drag job within same column | Job stays in place | No unnecessary updates |
| TC-ERR-009 | Rapid drag operations | Drag multiple jobs quickly | All operations complete correctly | No race conditions |
| TC-ERR-010 | Drag with scroll | Drag job while column is scrolling | Drag completes correctly | Smooth interaction |

---

## 5. Performance Testing

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-PERF-001 | Load with 50 jobs | Create 50 jobs, load app | App loads in < 3 seconds | No UI freezing |
| TC-PERF-002 | Load with 100 jobs | Create 100 jobs, load app | App loads in < 5 seconds | Acceptable performance |
| TC-PERF-003 | Search with 100 jobs | Search in app with 100 jobs | Results appear in < 1 second | Real-time filtering |
| TC-PERF-004 | Drag-and-drop with 50 jobs in column | Drag job in large column | Smooth drag animation | No lag or jank |
| TC-PERF-005 | Rapid CRUD operations | Create/edit/delete 10 jobs rapidly | All operations complete | No data loss |

---

## 6. Cross-Browser Testing

| ID | Browser | Version | Test Focus | Acceptance Criteria |
|----|---------|---------|------------|---------------------|
| TC-BROWSER-001 | Chrome | Latest | Full functionality | All features work |
| TC-BROWSER-002 | Firefox | Latest | Full functionality | All features work |
| TC-BROWSER-003 | Edge | Latest | Full functionality | All features work |
| TC-BROWSER-004 | Safari | Latest | Full functionality | All features work (if supported) |

---

## 7. Accessibility Testing

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-A11Y-001 | Keyboard navigation | Tab through all interactive elements | All elements focusable | Logical tab order |
| TC-A11Y-002 | Screen reader compatibility | Use screen reader (NVDA/VoiceOver) | All content announced | Proper ARIA labels |
| TC-A11Y-003 | Color contrast | Check all text/background combinations | WCAG AA compliant | Minimum 4.5:1 ratio |
| TC-A11Y-004 | Focus indicators | Tab to buttons/links | Visible focus outline | Clear focus state |

---

## 8. Security Testing

| ID | Scenario | Steps | Expected Result | Acceptance Criteria |
|----|----------|-------|-----------------|---------------------|
| TC-SEC-001 | XSS in Company field | Enter `<img src=x onerror=alert(1)>` | Stored as text | No script execution |
| TC-SEC-002 | XSS in Job Title field | Enter `<script>alert('xss')</script>` | Stored as text | No script execution |
| TC-SEC-003 | XSS in Notes field | Enter malicious HTML/JS | Stored as text | No script execution |
| TC-SEC-004 | Malicious URL in LinkedIn | Enter `javascript:alert(1)` | Rejected or sanitized | No code execution |

---

## 9. Test Execution Strategy

### 9.1 Test Environment Setup

1. **Development Environment**
   - Node.js 18+ installed
   - npm/yarn package manager
   - Modern browser (Chrome/Firefox/Edge)
   - Browser DevTools for IndexedDB inspection

2. **Test Data Preparation**
   - Sample job data for CRUD testing
   - Valid/invalid JSON files for import testing
   - Edge case data (special characters, long text)

### 9.2 Test Execution Order

```
Phase 1: Smoke Tests (P0)
├── Job Creation (TC-P0-001 to TC-P0-005)
├── Job Display (TC-P0-006 to TC-P0-009)
├── Job Editing (TC-P0-010 to TC-P0-012)
├── Job Deletion (TC-P0-013 to TC-P0-015)
├── Data Persistence (TC-P0-016 to TC-P0-018)
└── Drag-and-Drop (TC-P0-019 to TC-P0-022)

Phase 2: Feature Tests (P1)
├── Search & Filtering (TC-P1-001 to TC-P1-005)
├── Form Validation (TC-P1-006 to TC-P1-009)
├── Kanban Board (TC-P1-010 to TC-P1-013)
└── UI/UX (TC-P1-014 to TC-P1-018)

Phase 3: Optional Features (P2)
├── Dark Mode (TC-P2-001 to TC-P2-003)
├── Export/Import (TC-P2-004 to TC-P2-008)
└── Sorting (TC-P2-009 to TC-P2-011)

Phase 4: Non-Functional Tests
├── Error Handling (TC-ERR-001 to TC-ERR-010)
├── Performance (TC-PERF-001 to TC-PERF-005)
├── Cross-Browser (TC-BROWSER-001 to TC-BROWSER-004)
├── Accessibility (TC-A11Y-001 to TC-A11Y-004)
└── Security (TC-SEC-001 to TC-SEC-004)
```

### 9.3 Test Reporting

- **Pass/Fail Status**: Track per test case
- **Defect Logging**: Log bugs with severity, steps to reproduce, screenshots
- **Coverage Metrics**: Track percentage of requirements covered
- **Risk Assessment**: Flag high-risk areas for additional testing

---

## 10. Human Review Gate

### 10.1 Assumptions Requiring Validation

| # | Assumption | Validation Needed | Owner |
|---|------------|-------------------|-------|
| A1 | Case-insensitive search is acceptable | Confirm with product owner | PO |
| A2 | Cross-column drag-and-drop is desired | Confirm workflow requirements | PO |
| A3 | Single resume per job is sufficient | Confirm data model | PO |
| A4 | No artificial job limit needed | Confirm scalability requirements | PO |
| A5 | Chrome/Firefox/Edge are target browsers | Confirm browser support matrix | PO |

### 10.2 Open Questions Blocking Sign-Off

| # | Question | Impact | Resolution Required |
|---|----------|--------|---------------------|
| Q1 | What is the expected behavior for duplicate LinkedIn URLs? | Import validation logic | Before Phase 3 |
| Q2 | Should search match partial words or exact phrases? | Search implementation | Before Phase 2 |
| Q3 | What is the maximum character limit for Notes field? | Data model validation | Before Phase 1 |
| Q4 | Should the app support offline usage indicators? | UX requirements | Before Phase 3 |
| Q5 | What happens when two tabs have conflicting changes? | Data integrity | Before Phase 2 |

### 10.3 Sign-Off Checklist

- [ ] All P0 test cases executed and passed
- [ ] All P1 test cases executed and passed
- [ ] No critical or high-severity defects open
- [ ] Performance benchmarks met
- [ ] Cross-browser testing completed
- [ ] Accessibility requirements validated
- [ ] Security testing completed
- [ ] All open questions resolved
- [ ] Test coverage report reviewed
- [ ] Stakeholder approval obtained

---

## 11. Test Metrics & Success Criteria

### 11.1 Coverage Targets

- **Requirements Coverage**: 100% of P0 requirements
- **Test Case Coverage**: 95%+ of defined test cases executed
- **Code Coverage**: 80%+ unit test coverage (if applicable)

### 11.2 Defect Thresholds

| Severity | Maximum Allowed | Action |
|----------|-----------------|--------|
| Critical | 0 | Block release |
| High | 2 | Requires workaround |
| Medium | 5 | Document and track |
| Low | 10 | Accept for release |

### 11.3 Performance Benchmarks

- **Page Load**: < 3 seconds (50 jobs), < 5 seconds (100 jobs)
- **Search Response**: < 1 second
- **Drag-and-Drop**: 60fps smooth animation
- **CRUD Operations**: < 500ms response time

---

## 12. Appendix

### 12.1 Test Data Templates

**Valid Job Data:**
```json
{
  "company": "ABC Technologies",
  "jobTitle": "Senior QA Engineer",
  "linkedinUrl": "https://www.linkedin.com/jobs/view/123456",
  "resumeUsed": "QA_Lead_Resume",
  "dateApplied": "2026-08-23",
  "salaryRange": "₹20-25 LPA",
  "notes": "Referred by Rahul",
  "status": "Wishlist"
}
```

**Invalid Job Data (Missing Required Fields):**
```json
{
  "linkedinUrl": "https://linkedin.com/jobs/123",
  "resumeUsed": "Test_Resume",
  "notes": "Missing company and title"
}
```

**Import Test Data (Valid):**
```json
{
  "jobs": [
    {
      "id": "1",
      "company": "Tech Corp",
      "jobTitle": "Developer",
      "status": "Applied"
    }
  ]
}
```

**Import Test Data (Invalid):**
```json
{
  "invalid": "structure"
}
```

### 12.2 Browser DevTools Verification

**IndexedDB Inspection:**
1. Open DevTools (F12)
2. Go to Application tab
3. Expand IndexedDB
4. Verify JobTrackerDB database exists
5. Check jobs object store
6. Verify data persistence after operations

### 12.3 Responsive Testing Viewports

| Device | Width | Height | Orientation |
|--------|-------|--------|-------------|
| Mobile (iPhone 12) | 390 | 844 | Portrait |
| Tablet (iPad) | 810 | 1080 | Portrait |
| Tablet (iPad) | 1080 | 810 | Landscape |
| Desktop (HD) | 1920 | 1080 | Landscape |
| Desktop (4K) | 3840 | 2160 | Landscape |

---

## 13. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-08-23 | Test Architect | Initial test plan creation |

---

*This test plan should be reviewed and approved by the development team, product owner, and QA lead before test execution begins.*
