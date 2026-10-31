Here is the revised STAR framework focused only on adding missing field-length validation steps to existing test cases, with the Transaction ID example included.

# STAR Framework Prompt: Add Missing Field-Length Validation Steps to Existing Test Cases

## S – Situation

We have existing field-level API test cases, but some field-length validation steps, such as minimum length, maximum length, below-minimum length, and above-maximum length, have not been added because these steps were not included in the original test cases.

## T – Task

Identify existing test cases that require additional field-length validation steps based on the BRD or Data Table.

Follow these rules:

- Add missing field-length validation steps **below the last existing step** of the relevant test case.
- Add field-length validation steps only when the field length or its minimum/maximum limits are specified in the BRD or Data Table.
- Do not add field-length validation steps if the field length is not specified.
- Do not modify, delete, reorder, or rewrite any existing test cases or steps.
- Preserve the original Test Case ID, Test Scenario, Expected Result, and Type.
- Continue step numbering sequentially from the last existing step.
- Add only missing field-length validation steps. Do not duplicate steps already covered.
- Do not modify existing data-type, mandatory-field, or allowed-value validation steps.

## A – Action

Analyze the BRD or Data Table and compare the documented field-length constraints with the existing test cases. Identify and add only the missing field-length validation steps.

### Field-Length Validation Rules

For a field with a defined length range of 5–10 digits or characters, as applicable:

- **Positive validation:** Verify the minimum allowed length.
- **Positive validation:** Verify the maximum allowed length.
- **Positive validation:** Verify a valid length within the allowed range, if not already covered.
- **Negative validation:** Verify a value below the minimum allowed length.
- **Negative validation:** Verify a value above the maximum allowed length.

Add these steps to the existing positive or negative test case, as appropriate. Do not create new test cases when the existing test cases can accommodate the missing steps.

### Example: Transaction ID Field

**Field definition from the BRD/Data Table**

| Field Name     | Data Type | Mandatory | Field Length |
| -------------- | --------- | --------- | ------------ |
| Transaction ID | Number    | Yes       | 5–15 digits  |

**Existing test cases with field-length validation steps added**

| TC ID | Test Scenario                                                                           | Step | Test Steps                                                      | Expected Result                        | Type     |
| ----- | --------------------------------------------------------------------------------------- | ---- | --------------------------------------------------------------- | -------------------------------------- | -------- |
| TC001 | To verify the Transaction ID field for API Initiate Transaction with a valid request    | 1    | Enter a valid 5-digit Transaction ID                            | System should give a valid response    | Positive |
| <br>  | <br>                                                                                    | 2    | Enter a valid 15-digit Transaction ID                           | System should give a valid response    | <br>     |
| <br>  | <br>                                                                                    | 3    | Enter a valid numeric value within the allowed 5–15 digit range | System should give a valid response    | <br>     |
| TC002 | To verify the Transaction ID field for API Initiate Transaction with an invalid request | 1    | Enter a 4-digit numeric value                                   | System should give an invalid response | Negative |
| <br>  | <br>                                                                                    | 2    | Enter a 16-digit numeric value                                  | System should give an invalid response | <br>     |

**Important:** The above Transaction ID steps are an example of the expected output format. When processing actual test cases, preserve existing steps and add only those field-length validation steps that are missing.

## R – Result

Return the complete existing test cases in the original table format, with only the missing field-length validation steps added below the last existing step of the relevant test case.

Final requirements:

- Preserve all existing test case content exactly as written.
- Add only missing field-length validation steps supported by the BRD or Data Table.
- Maintain sequential step numbering.
- Do not add field-length validation for fields whose length constraints are not documented.
- Do not change or add data-type, mandatory-field, or allowed-value validation steps.
- Do not invent undocumented field-length constraints or expected results.

Clarify the source inputs requiredDefine handling for missing test cases