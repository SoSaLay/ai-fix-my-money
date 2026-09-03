# Roadmap

Work that is agreed and specified but not yet built. Each item is written so it
can be picked up cold.

---

## 1. Disclaimer page behind the info icon

**Where:** `src/components/learning/disclaimer-bar.tsx` — the ⓘ icon beside
"Educational content only — not financial, investment, tax, or legal advice."

**What to build**

- Turn the icon into a real, obvious icon button (it currently reads as
  decoration) and make the whole bar clickable.
- Route it to a dedicated disclosures page, e.g. `/learning/disclosures`.
- The page content is **not decided yet** — to be specified later.

**Notes**

- Long-form copy already exists in `src/lib/learning/disclaimer.ts`
  (`DISCLAIMER_MEDIUM`, `DISCLAIMER_INVESTING`, `ACKNOWLEDGMENT_POINTS`) and is
  the natural starting point for the page.
- The bar appears on every learning screen, so the page has to stand on its own
  without conversational context.

---

## 2. Reference images in lessons and questions

**Status:** plumbing is in place; the art is not.

**Already built**

- `LessonImage` type on `Lesson` in `src/lib/learning/tracks.ts`
  (`src`, `alt`, optional `caption`).
- `src/components/learning/lesson-images.tsx` renders the right column and
  returns nothing when a lesson has no images, so the material takes the full
  width until art exists.
- Lesson layout is already content-left / images-right, with the timer and then
  the questions below both.

**What is left**

- Produce the images and drop them under `public/`.
- Add an `images: [...]` array to each lesson that needs one.
- Let questions reference a lesson image, so a learner can check the picture
  rather than re-reading the text. This needs a field on `QuizQuestion`
  (e.g. `imageSrc`) and rendering inside `question-stack.tsx`.
- Highest value on the concrete, visual concepts: statement vs. current vs.
  available balance, credit utilisation as a ratio, and the assets-minus-debts
  net worth split.

---

## 3. Interactive final quiz — video sources and free-form answers

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
