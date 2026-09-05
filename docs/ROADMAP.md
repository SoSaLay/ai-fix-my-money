# Roadmap

Work that is agreed and specified but not yet built. Each item is written so it
can be picked up cold.

---

## 1. Interactive final quiz — video sources and free-form answers

The current final quiz is 10 multiple-choice questions with a fixed answer key.
The target is a richer assessment.

**Target shape**

1. **Question one — a scenario.** A short, realistic situation of the kind used
   in college practicals, answered multiple choice. Sets the context for what
   follows.
2. **Every question after that — video-based and free-form.**
   - Financial content is pulled from online platforms through an API the
     project owner is supplying.
   - Videos play **inside the app** — the learner does not leave.
   - Questions are open-ended text, not multiple choice.
   - The learner's written answer is evaluated by AI against the video
     transcript and the question.
   - AI returns pass or fail **with its reasoning shown to the learner**.

**What this needs**

- An in-app video player, and a way to fetch and cache transcripts.
- A free-form answer input, replacing the option list for these questions.
- An evaluation endpoint that takes transcript + question + answer and returns
  a verdict with reasoning.
- A `QuizQuestion` variant for free-form items — the type is currently
  multiple-choice only (`options` + `answer` index).
- Scoring that mixes a multiple-choice question with AI-graded ones, and still
  resolves to the 80% pass mark in `passMark()`.
- Guardrails: the AI grades an answer against a transcript. It must not drift
  into advising the learner about their own money.

**Owner note:** the API for pulling platform content is being provided
separately.

**Already written for it.** The disclosures and legal documents added
below already cover AI-assisted grading and embedded third-party video —
`DISCLOSURES` has an "AI-assisted features" and a "Third-party content" section,
`TERMS` has "Automated feedback", and `PRIVACY` has a "Third-party processing"
section naming what is sent to a model. Those sections were written ahead of the
feature; check them against what actually ships and correct anything that drifts.

---

## Done, with follow-ups

### Disclosures page behind the info icon — built

`/learning/disclosures`, with `/terms` and `/privacy` beneath it. The bar in
`src/components/learning/disclaimer-bar.tsx` is now the whole control and opens
the hub; the acknowledgment gate and the learning hub link there too.

Content lives in `src/lib/legal/documents.ts` and renders through
`src/components/legal/legal-document-view.tsx`.

**Still to do**

- Fill in `OPERATOR` at the top of `src/lib/legal/documents.ts` — legal entity
  name, contact email, postal address, and governing state are all placeholders,
  and they are interpolated throughout all three documents.
- Have a lawyer review the documents before the platform is public. They were
  drafted against the common requirements for an educational finance platform
  and are a starting point, not advice.
- Decide whether the documents should also be reachable from the marketing page
  footer, not only from inside `/learning`.

### Reference images in lessons and questions — built

Every lesson in Accounts, Spending, and Savings has a diagram in the right-hand
column, and ten questions point back at one through the new `imageSrc` field on
`QuizQuestion`. Spaced review shows the same diagram beside a question that used
it.

**Still to do**

- The 15 files in `public/learning/` are hand-drawn SVG diagrams built to hold
  the layout and be legible on their own. Swap in final art whenever it exists —
  the `images` arrays in `src/lib/learning/tracks.ts` are the only thing that
  needs to change, and `LessonImages` and `QuestionImage` already fall back to
  the optimizer for raster formats.
- The Investing track has no lessons yet, so it has no imagery either.
