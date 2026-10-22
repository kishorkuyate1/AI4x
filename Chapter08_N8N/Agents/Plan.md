# Chapter 08 n8n Screenshot-to-Bug Reporter plan

## Goal
Build a workflow that accepts a screenshot upload (and optional error logs), analyzes the image, and creates a Jira bug with a structured reproduction report.

## Cheaper model research
We checked the current model pricing and availability relevant to your setup:

- OpenRouter `z-ai/glm-5.3-flash` is the cheapest practical vision option for a low-cost screenshot triage workflow.
- OpenRouter `minimax/minimax-m3:free` is useful for testing or zero-cost dev runs, but it is not the right production default for a business workflow.
- Groq is faster but materially more expensive for this use case. For example, Groq Qwen vision models are typically in the ~$0.80 input / $4.00 output per 1M token range, which is much higher than the cheapest OpenRouter routing options.
- The model choice should therefore be:
  - Production default: OpenRouter `z-ai/glm-5.3-flash` (best cost/performance balance)
  - Zero-cost dev/test: OpenRouter `minimax/minimax-m3:free`
  - Groq fallback only if latency is more important than cost

### Recommended decision
Use OpenRouter for the main workflow because it keeps the per-report cost low while still handling image + text inputs.

Groq should only be used if:
- your requirement is ultra-fast turnaround,
- you are okay paying more for speed, or
- your Groq account already has a specific model quota that fits the workflow.

## Recommended architecture
1. Webhook or Form Trigger receives image upload and optional text logs.
2. Normalize input so the image is converted into a consistent binary field and the logs are optional text.
3. Send the image and logs to a vision-capable model with a tight JSON response schema.
4. Parse the result into a strict bug-report object.
5. Create a Jira issue with:
   - summary
   - environment
   - steps to reproduce
   - expected result
   - actual result
   - visual observations
   - suggested component
   - severity
   - confidence
6. Attach the original screenshot to the ticket if needed.

## Prompting strategy
Keep the AI task bounded to one job: "look at the screenshot, decide whether it shows a defect, and output a single JSON object." Do not use a free-form AI agent node for the actual analysis; use deterministic n8n nodes around a single model call.

The model prompt should:
- decide whether the screenshot actually contains a defect,
- avoid inventing on-screen data,
- quote exact visible text only,
- keep steps to reproduce realistic,
- return a strict JSON schema.

## Implementation plan for this chapter
1. Create the workflow file `08_Screenshot_To_Bug_Reporter_AIAgent.json` under the `Agents` folder.
2. Use a Form or Webhook trigger for file upload input.
3. Add a Code node to normalize the binary image into a stable field like `screenshot`.
4. Add a model node using the cheaper provider plan.
5. Add a structured-output parsing node or schema-validation node.
6. Add a Jira node to create the issue.
7. Add optional attachments and a final success branch.

## Open questions before building
1. Should this workflow target Jira only, or should it optionally support GitHub Issues/another tracker?
2. Do you want the issue to be created in a specific Jira project, or should we keep the workflow generic and let you choose the project during execution?
3. Are we building a form-based demo (simple upload) or a webhook-based API flow for a custom UI?

## Suggested default
The default build should use:
- provider: OpenRouter
- model: `z-ai/glm-5.3-flash`
- tracker: Jira
- trigger: Form + optional Webhook variant later

This keeps cost low while matching the brief and the existing Jira workflow pattern from the earlier chapters.
