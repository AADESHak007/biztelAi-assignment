# BiztelAI Technologies Private Limited
## Full Stack Engineering Internship Assignment
### AI-Powered Workflow Automation System

## Problem Statement
Build a web application prototype that can digitize handwritten/semi-structured operational documents and convert them into structured, reviewable operational records with analytics and validation workflows. Think from the perspective of building a usable operational workflow product for a real manufacturing/B2B environment.

A link to the sample dataset containing handwritten manufacturing/operational documents is given at the end of this document.

## Core Requirements

### 1. Document Upload
Users should be able to:
- Upload images or PDFs
- Preview uploaded files
- View upload history

### 2. AI-Based Data Extraction
Extract structured information from uploaded documents using OCR/AI/LLM-based approaches.
Example fields may include:
- Date
- Shift
- Employee Number
- Operation Code
- Machine Number
- Work Order Number
- Quantity Produced
- Time Taken

You are free to define your own extraction schema and workflow.

### 3. Review Workflow
The extracted data should:
- Be displayed in editable format
- Allow manual correction/update
- Support saving reviewed records

### 4. Confidence Scoring
The system should assign confidence indicators/scores for extracted fields wherever applicable and clearly highlight uncertain fields.

### 5. Validation & Exception Handling
Implement meaningful validation/business rules for extracted operational data.
Examples:
- Missing mandatory fields
- Invalid shift values
- Incorrect machine code formats
- Suspicious numeric values
- Empty quantity fields
- Duplicate work order numbers

The system should clearly highlight records or fields requiring manual review.

### 6. Dashboard & Analytics
Create a simple dashboard showing operational insights such as:
- Total uploads
- Validation failures
- Shift-wise summaries
- Quantity summaries
- Machine-wise summaries
- Any additional operational insights you feel are useful

### 7. Search & History
Users should be able to:
- View previous uploads
- Search/filter records
- Open previously processed documents

---

## What We Care About
We care more about:
- Execution speed
- Product thinking
- Practical usability
- Ownership
- AI-native engineering workflows
- Operational thinking

than:
- Perfect architecture
- Framework-specific expertise
- Competitive coding knowledge
- Highly polished UI

Prioritize working end-to-end functionality and usability over excessive architecture or premature optimization.

---

## Submission Requirements
Please submit the following:

### 1. GitHub Repository
The repository should include:
- Complete source code
- README.md with setup instructions
- Architecture/workflow overview
- .env.example file
- Any assumptions/tradeoffs made during development

### 2. Demo Video (Mandatory)
Record a short walkthrough/demo covering:
- Product flow
- OCR/data extraction workflow
- Validation logic
- Dashboard/analytics
- Key technical and product decisions

Loom/YouTube/Drive links are acceptable.

### 3. AI Workflow Document (Strongly Preferred)
Include a short document such as:
- AGENTS.md
- AI_WORKFLOW.md

This should briefly explain:
- AI tools used (Claude Code, Cursor, Codex, GPT, etc.)
- How AI tools were used during development
- Prompting/debugging workflows
- Areas where AI helped most
- Areas requiring manual intervention

We are intentionally evaluating AI-assisted engineering workflows as part of this assignment.

### 4. Hosted Demo URL (Strongly Preferred)
Deploy and share a working version of the application if possible. Please ensure the hosted application is functional during the review process.

The hosted application should allow us to directly test:
- Document upload
- OCR extraction
- Review workflows
- Validation logic
- Dashboards and analytics

Free-tier deployment platforms are completely acceptable.

---

## Time Expectation
Please submit within 48 hours from the time the assignment is shared.
You are NOT expected to build a perfect production-grade system, but a working prototype.

We are evaluating:
- Speed
- Ownership
- Product instincts
- Execution quality
- AI-assisted engineering capability
- Ability to handle ambiguity

Candidates are free to use:
- open-source tools
- free-tier cloud services
- personal API credits
- any preferred technology stack

---

## Sample Dataset
The sample dataset for this assignment can be accessed here:
[BiztelAI_Assignment_Dataset](https://github.com/biztel-ai/internship-assignment-dataset)
