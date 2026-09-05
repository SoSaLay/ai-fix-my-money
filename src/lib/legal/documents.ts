// ============================================================================
// Legal documents
//
// The disclosures hub and its subpages read from here, so the wording lives in
// one place the same way DISCLAIMER_SHORT does. Nothing in this file is styled
// or laid out — `LegalDocumentView` does that.
//
// FILL THESE IN before the platform is public: everything in `OPERATOR` below
// is a placeholder. The documents interpolate it, so setting it once is enough.
//
// These documents were drafted against the common requirements for an
// educational finance platform. They are a starting point, not a substitute
// for review by a lawyer licensed in your jurisdiction.
// ============================================================================

export const OPERATOR = {
  /** Product name, as learners see it. */
  product: 'AI Fix My Money',
  /** Registered entity that operates the product. */
  entity: '[Legal entity name]',
  /** Where legal notices go. */
  email: '[legal@yourdomain.com]',
  /** Postal address, required by several privacy statutes. */
  address: '[Street, City, State ZIP]',
  /** Governs the terms, and where disputes are heard. */
  state: '[State]',
  country: 'United States',
  /** Shown at the top of every document. */
  updated: 'September 5, 2026',
} as const

// ─── Shape ───────────────────────────────────────────────────────────────────

export interface LegalClause {
  /** Optional lead-in shown in bold, e.g. the thing being defined. */
  term?: string
  text: string
}

export interface LegalSection {
  heading: string
  body?: string
  bullets?: LegalClause[]
  /** Set apart in a filled box. Used for the line that matters most. */
  callout?: string
}

export interface LegalDocument {
  id: string
  /** Route under /learning/disclosures. Empty string is the hub itself. */
  slug: string
  title: string
  /** One line under the title. */
  tagline: string
  /** Opening paragraph, before the numbered sections. */
  intro: string
  sections: LegalSection[]
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. DISCLOSURES — the hub, and the page the ⓘ on every learning screen opens
// ─────────────────────────────────────────────────────────────────────────────

export const DISCLOSURES: LegalDocument = {
  id: 'disclosures',
  slug: '',
  title: 'Disclosures',
  tagline: 'What this platform is, what it deliberately is not, and the terms you are using it under.',
  intro:
    'You reached this page from the line that sits on every learning screen. That line is short because it has to fit; this page is the whole of it. Read the first two sections if you read nothing else — they are the ones that describe the limits of what this platform does.',
  sections: [
    {
      heading: 'This is an educational platform',
      body: `${OPERATOR.product} exists to explain how money, accounts, credit, and markets work, so that you can make your own decisions with a clearer picture of the mechanics. The material is general and impersonal: every learner sees the same lessons, in the same order, regardless of who they are or what their finances look like.`,
      bullets: [
        { term: 'General', text: 'Nothing on the platform is written for your situation, your balances, your income, or your goals.' },
        { term: 'Impersonal', text: 'The lessons and quizzes do not read the numbers you enter in order to tell you what to do with them. The tools show your figures back to you; they do not judge them.' },
        { term: 'Explanatory', text: 'Content describes how a thing works and what the tradeoffs are. It stops short of telling you which side of a tradeoff to take.' },
      ],
      callout:
        'Educational content only — not financial, investment, tax, or legal advice.',
    },
    {
      heading: 'What this platform is not',
      body: 'This is the part that matters legally, so it is stated flatly rather than politely.',
      bullets: [
        { term: 'Not an investment adviser', text: `${OPERATOR.entity} is not a registered investment adviser, and no one associated with the platform is acting as one. Nothing here is a recommendation to buy, sell, or hold any security, fund, or other financial product.` },
        { term: 'Not a broker or dealer', text: 'The platform does not execute, arrange, solicit, or facilitate any transaction, and it holds no money or securities on your behalf.' },
        { term: 'Not a tax or legal professional', text: 'Tax and legal rules vary by jurisdiction and by individual circumstance. Nothing here is a tax return position, a legal opinion, or a substitute for one.' },
        { term: 'Not a credit repair or debt relief service', text: 'The credit material explains what is being measured and why. It does not dispute, negotiate, consolidate, or settle anything on your behalf.' },
        { term: 'Not a bank or a money transmitter', text: 'No account here holds funds. Balances you enter are figures you have typed, not money the platform can move.' },
        { term: 'Not a fiduciary', text: 'Using this platform creates no advisory relationship, no client relationship, and no duty of care running from us to you.' },
      ],
    },
    {
      heading: 'Decisions about your money remain yours',
      body: 'You are the only person on this platform who knows your full circumstances, and you are the one who bears the outcome of any decision you take. Before you act on anything you learn here — particularly anything involving debt, taxes, retirement accounts, or investing — consider speaking with a licensed professional who can look at your actual situation.',
      bullets: [
        { text: 'If you are in financial distress, a non-profit credit counselling agency can help in ways this platform cannot.' },
        { text: 'If the question is about tax treatment, ask a CPA or an enrolled agent about your own filing.' },
        { text: 'If the question is about whether an investment suits you, that is exactly the personalised question the platform is designed not to answer.' },
      ],
    },
    {
      heading: 'Investing carries risk',
      body: 'Investing involves risk, including the possible loss of the entire amount you put in. Past performance does not indicate future results, and no strategy, allocation, or account type removes that risk.',
      bullets: [
        { text: 'Figures used in the lessons are illustrative. Round numbers are chosen because they are easy to follow, not because they are typical or achievable.' },
        { text: 'Any projection or compounding example is arithmetic on assumptions you supply or that the lesson states. It is not a forecast.' },
        { text: 'Deposit accounts, investment accounts, and retirement accounts each carry different protections. The lessons describe those differences; they do not guarantee them.' },
      ],
    },
    {
      heading: 'Accuracy, and the limits of it',
      body: 'The material is written carefully and reviewed, but rules change, institutions differ, and errors survive review. Content is provided as-is and without warranty of accuracy, completeness, or currency.',
      bullets: [
        { text: 'Rules described here are general and mostly reflect United States practice. Your institution, state, or country may work differently.' },
        { text: 'Nothing on the platform is updated on a schedule tied to regulatory or market events.' },
        { text: 'If a lesson conflicts with what your own bank, lender, or plan administrator tells you about your account, they are describing your account and the lesson is not.' },
      ],
    },
    {
      heading: 'AI-assisted features',
      body: 'Parts of the platform use automated systems to generate feedback on written answers. Where that happens, it is labelled.',
      bullets: [
        { text: 'Automated feedback assesses whether an answer matches the material it was drawn from. It does not assess your finances and is not permitted to advise you about them.' },
        { text: 'Automated systems can be confidently wrong. Treat the reasoning shown alongside a verdict as an explanation to check, not an authority.' },
        { text: 'Where a feature sends text to a third-party model to produce that feedback, the Privacy Policy says so and says what is sent.' },
      ],
    },
    {
      heading: 'Third-party content',
      body: 'Some material may embed or link to content published by third parties, including video hosted on outside platforms.',
      bullets: [
        { text: 'Third-party content is included because it is instructive, not because it is endorsed, verified, or sponsored.' },
        { text: 'Views expressed in third-party content are the publisher’s own, and may include opinions that this platform would not state itself.' },
        { text: 'Outside platforms have their own terms and their own privacy practices, which govern your use of them.' },
      ],
    },
    {
      heading: 'Your data stays on your device',
      body: 'Everything you enter — accounts, balances, spending, goals, and your progress through the tracks — is stored in your own browser and is not uploaded to a server. Clearing your browser data deletes it, and there is no copy anywhere else. The Privacy Policy sets this out in full.',
    },
    {
      heading: 'Who may use this platform',
      body: `The platform is intended for people aged 13 and over, and is written for a ${OPERATOR.country} audience. It is not directed at children under 13, and it does not knowingly collect anything from them.`,
    },
    {
      heading: 'Questions about any of this',
      body: `Write to ${OPERATOR.email}. Notices to ${OPERATOR.entity} can be sent to ${OPERATOR.address}.`,
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TERMS OF SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const TERMS: LegalDocument = {
  id: 'terms',
  slug: 'terms',
  title: 'Terms of Service',
  tagline: 'The agreement between you and the operator of this platform.',
  intro: `These terms are a contract between you and ${OPERATOR.entity} (“we”, “us”), covering your use of ${OPERATOR.product} and everything on it. They are written to be read, so the language is plainer than it usually is, but they are still the operative terms.`,
  sections: [
    {
      heading: '1. Accepting these terms',
      body: 'By opening the platform, starting a track, or entering data into any tool, you accept these terms and the Privacy Policy. If you do not accept them, do not use the platform.',
      bullets: [
        { text: 'If you are between 13 and the age of majority where you live, you may use the platform only with the consent of a parent or guardian, who accepts these terms with you.' },
        { text: 'If you are using the platform on behalf of an organisation, you confirm that you are authorised to bind it.' },
      ],
    },
    {
      heading: '2. What the service is',
      body: 'The platform provides educational material on personal finance, together with local tools for recording your own figures. It is not financial, investment, tax, or legal advice, and it creates no advisory or fiduciary relationship. The Disclosures page sets out the full scope of that limitation and forms part of these terms.',
      callout:
        'Nothing on this platform is a recommendation to buy, sell, or hold any financial product, or to take any particular action with your money.',
    },
    {
      heading: '3. Eligibility',
      body: 'You may use the platform if you are at least 13 years old and are not barred from doing so under applicable law. We may decline access to anyone, at any time, and for any reason.',
    },
    {
      heading: '4. Your data and your device',
      body: 'The platform stores what you enter in your browser rather than on our servers. That has consequences worth stating plainly.',
      bullets: [
        { term: 'You hold the only copy', text: 'We cannot recover your data, restore it, or transfer it to another device. Clearing site data, using private browsing, or switching browsers loses it.' },
        { term: 'You are responsible for your device', text: 'Anyone with access to your browser profile has access to what you have entered. Securing the device is your responsibility, not ours.' },
        { term: 'No backups', text: 'We do not take backups of your data, because we do not have it.' },
      ],
    },
    {
      heading: '5. Acceptable use',
      body: 'Use the platform for learning. Do not do any of the following.',
      bullets: [
        { text: 'Present the material as your own, resell it, or redistribute it commercially.' },
        { text: 'Scrape, crawl, or bulk-download the content, or use automated means to complete assessments.' },
        { text: 'Reverse engineer, decompile, or interfere with the platform, or attempt to circumvent the gating between tracks and tools other than by passing the assessments.' },
        { text: 'Probe, scan, or test the security of the platform, or attempt to gain access to any part of it you were not given.' },
        { text: 'Upload or submit anything unlawful, infringing, malicious, or designed to manipulate an automated grader.' },
        { text: 'Use the platform, or anything generated by it, to give financial advice to other people as though it were professional advice.' },
      ],
    },
    {
      heading: '6. Intellectual property',
      body: `The lessons, questions, imagery, code, design, and structure of the platform belong to ${OPERATOR.entity} or its licensors, and are protected by copyright and other laws.`,
      bullets: [
        { text: 'You get a personal, non-exclusive, non-transferable, revocable licence to use the platform for your own learning.' },
        { text: 'That licence does not include any right to copy, adapt, publish, or create derivative works from the material.' },
        { text: 'Names, logos, and marks used on the platform may not be used without written permission.' },
      ],
    },
    {
      heading: '7. What you submit',
      body: 'Answers you write, figures you record, and feedback you send remain yours. Where a feature needs to process something you submit in order to work — grading a written answer, for example — you grant us the limited right to process it for that purpose and no other.',
    },
    {
      heading: '8. Third-party content and services',
      body: 'The platform may embed or link to material published elsewhere. We do not control it, do not endorse it, and are not responsible for it. Your use of a third-party service is governed by that service’s own terms and privacy policy.',
    },
    {
      heading: '9. Automated feedback',
      body: 'Some assessments are graded by an automated system rather than by a person.',
      bullets: [
        { text: 'A verdict from an automated grader is an assessment of your written answer against source material. It is not an evaluation of your finances or your judgement.' },
        { text: 'Automated systems make mistakes. A pass is not a certification of competence, and a fail is not a statement about you.' },
        { text: 'We may change, retrain, or withdraw an automated feature at any time, which can change how the same answer is graded.' },
      ],
    },
    {
      heading: '10. No warranties',
      body: 'The platform is provided “as is” and “as available”, without warranty of any kind, express or implied. To the fullest extent permitted by law, we disclaim the implied warranties of merchantability, fitness for a particular purpose, title, and non-infringement.',
      bullets: [
        { text: 'We do not warrant that the platform will be uninterrupted, secure, or error-free.' },
        { text: 'We do not warrant that the content is accurate, complete, current, or applicable to your circumstances.' },
        { text: 'We do not warrant any particular outcome, financial or otherwise, from using the platform.' },
      ],
    },
    {
      heading: '11. Limitation of liability',
      body: 'To the fullest extent permitted by law, we are not liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost savings, lost data, or financial losses arising from decisions you make, whether or not we were advised such damages were possible.',
      bullets: [
        { text: 'Our total aggregate liability arising out of or relating to the platform is limited to the greater of the amount you paid us in the twelve months before the claim, or one hundred United States dollars.' },
        { text: 'Some jurisdictions do not allow certain exclusions or limitations. Where that is so, the exclusions above apply only to the extent permitted, and nothing here limits liability for fraud, or for death or personal injury caused by negligence.' },
      ],
    },
    {
      heading: '12. Indemnification',
      body: 'You agree to indemnify and hold harmless ' + OPERATOR.entity + ', its officers, employees, and contractors from any claim, loss, liability, or expense (including reasonable legal fees) arising from your use of the platform, your breach of these terms, or your violation of any law or third-party right.',
    },
    {
      heading: '13. Changes to the platform',
      body: 'We may add, change, suspend, or discontinue any part of the platform at any time, including tracks, tools, and assessments, with or without notice. We are not liable to you for doing so.',
    },
    {
      heading: '14. Termination',
      body: 'You may stop using the platform at any time; clearing your browser data removes everything you have entered. We may suspend or terminate your access if you breach these terms. Sections that by their nature should survive termination — intellectual property, disclaimers, liability, indemnity, and governing law — do survive it.',
    },
    {
      heading: '15. Changes to these terms',
      body: 'We may update these terms. The date at the top of this page changes when we do, and material changes will be signalled in the platform. Continuing to use the platform after a change means you accept the updated terms.',
    },
    {
      heading: '16. Resolving disputes',
      body: 'Before starting any formal proceeding, contact us and give us thirty days to resolve the matter informally. Most disputes end there.',
      bullets: [
        { text: `If informal resolution fails, disputes are subject to the exclusive jurisdiction of the courts located in ${OPERATOR.state}, ${OPERATOR.country}, and each party consents to that jurisdiction.` },
        { text: 'Claims must be brought individually, not as a class, consolidated, or representative action.' },
        { text: 'Any claim must be brought within one year of the events giving rise to it, or it is permanently barred, to the extent applicable law allows.' },
      ],
    },
    {
      heading: '17. Governing law',
      body: `These terms are governed by the laws of ${OPERATOR.state}, ${OPERATOR.country}, without regard to conflict-of-laws rules. Where mandatory consumer-protection law in your country of residence gives you stronger rights, that law applies to the extent of the conflict.`,
    },
    {
      heading: '18. General',
      bullets: [
        { term: 'Entire agreement', text: 'These terms, the Disclosures page, and the Privacy Policy are the whole agreement between us about the platform.' },
        { term: 'Severability', text: 'If any provision is held unenforceable, the rest stays in force and the unenforceable part is narrowed to the minimum extent needed.' },
        { term: 'No waiver', text: 'Not enforcing a provision on one occasion does not waive it.' },
        { term: 'Assignment', text: 'You may not assign these terms. We may assign them in connection with a merger, acquisition, or sale of assets.' },
      ],
    },
    {
      heading: '19. Contact',
      body: `${OPERATOR.entity}, ${OPERATOR.address}. Email ${OPERATOR.email}.`,
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PRIVACY POLICY
// ─────────────────────────────────────────────────────────────────────────────

export const PRIVACY: LegalDocument = {
  id: 'privacy',
  slug: 'privacy',
  title: 'Privacy Policy',
  tagline: 'What is stored, where it lives, and what leaves your device.',
  intro:
    'This policy describes how the platform handles information. It is short in the places where most policies are long, for one reason: the platform is built so that the data you enter never leaves your browser.',
  sections: [
    {
      heading: '1. The short version',
      bullets: [
        { text: 'Your financial data is stored in your own browser and is not sent to us.' },
        { text: 'We do not have accounts, so there is nothing to sign in to and no profile held about you.' },
        { text: 'We do not sell or share personal information, and we do not use it for cross-context behavioural advertising.' },
        { text: 'Deleting everything is one action you take yourself: clear this site’s data in your browser.' },
      ],
      callout:
        'Everything you enter is stored locally in your own browser. It is never uploaded anywhere.',
    },
    {
      heading: '2. What is stored, and where',
      body: 'The platform uses your browser’s local storage. That is a store on your own device, readable only by this site, in the browser profile you are using.',
      bullets: [
        { term: 'Accounts and balances', text: 'The account names, types, and figures you enter.' },
        { term: 'Spending and income', text: 'Categories, limits, and amounts you record.' },
        { term: 'Savings goals', text: 'Goal names, targets, and progress.' },
        { term: 'Learning progress', text: 'Which lessons you have answered, quiz results and attempts, your review queue, and whether you have acknowledged the disclosures.' },
        { term: 'Preferences', text: 'Small settings that make the interface behave the way you left it.' },
      ],
    },
    {
      heading: '3. What we do not collect',
      bullets: [
        { text: 'We do not ask for your name, email address, phone number, or postal address.' },
        { text: 'We do not connect to your bank and we never see your credentials, because there is nothing to connect to.' },
        { text: 'We do not collect government identifiers, card numbers, or account numbers.' },
        { text: 'We do not build a profile of you, and we do not run advertising.' },
      ],
    },
    {
      heading: '4. Cookies and similar technologies',
      body: 'The platform does not use advertising or tracking cookies. Local storage is used for the purposes listed above and is strictly necessary for the platform to function — it is what makes your progress and your figures persist between visits.',
    },
    {
      heading: '5. Analytics and logs',
      body: 'Where the platform is hosted, the host may record standard server logs — IP address, user agent, timestamp, and the page requested — for security and reliability. Those logs are not combined with anything you enter, because we do not receive anything you enter.',
    },
    {
      heading: '6. Third-party processing',
      body: 'Some features work by sending text to an outside service. Where a feature does this, it is stated here and labelled in the interface.',
      bullets: [
        { term: 'Automated answer feedback', text: 'When a feature grades a written answer, the question, the source material it was drawn from, and the answer you typed are sent to a language-model provider so a verdict and reasoning can be produced. Your accounts, balances, and goals are not sent.' },
        { term: 'Embedded video', text: 'When a lesson embeds video hosted elsewhere, the embed loads from that platform, which will see the request and may set its own cookies under its own policy.' },
        { term: 'Hosting', text: 'The site is served by a hosting provider, which processes requests on our behalf.' },
      ],
    },
    {
      heading: '7. Deleting your data',
      body: 'Because the data is on your device, deletion is in your hands and takes effect immediately.',
      bullets: [
        { text: 'Clear this site’s data from your browser’s settings, or use the reset option in the app’s settings where one is offered.' },
        { text: 'Uninstalling or switching browsers, or clearing history with site data included, has the same effect.' },
        { text: 'Deletion is permanent. There is no server copy for us to restore.' },
      ],
    },
    {
      heading: '8. Security',
      body: 'The platform is served over HTTPS, and local storage is scoped so that only this site can read it. No system is perfectly secure, and data held on your device is only as protected as the device is.',
    },
    {
      heading: '9. Children’s privacy',
      body: 'The platform is not directed at children under 13, and we do not knowingly collect personal information from them. If you believe a child under 13 has provided information to us, contact ' + OPERATOR.email + ' and we will act on it.',
    },
    {
      heading: '10. If you are in the EU or UK',
      body: 'Where the GDPR or UK GDPR applies, our lawful basis for the minimal processing described above is legitimate interest in operating and securing the platform. You have rights of access, rectification, erasure, restriction, portability, and objection.',
      bullets: [
        { text: 'For data held in your browser, you can exercise every one of those rights directly, without asking us, because you hold the data.' },
        { text: 'For anything we do hold — correspondence you send us, or server logs — write to ' + OPERATOR.email + '.' },
        { text: 'You have the right to lodge a complaint with your local supervisory authority.' },
      ],
    },
    {
      heading: '11. If you are in California',
      body: 'Under the CCPA as amended by the CPRA, you have the right to know, delete, correct, and opt out of sale or sharing, and the right not to be discriminated against for exercising them.',
      bullets: [
        { text: 'We do not sell personal information and we do not share it for cross-context behavioural advertising. We have not done so in the preceding twelve months.' },
        { text: 'The categories described in section 2 are stored on your device rather than collected by us, and are deleted by you at any time.' },
        { text: 'To make a request about anything else, write to ' + OPERATOR.email + '.' },
      ],
    },
    {
      heading: '12. International use',
      body: `The platform is operated from the ${OPERATOR.country} and written for a ${OPERATOR.country} audience. If you use it from elsewhere, you do so on your own initiative and are responsible for compliance with local law.`,
    },
    {
      heading: '13. Changes to this policy',
      body: 'We may update this policy. The date at the top of the page changes when we do, and material changes will be signalled in the platform.',
    },
    {
      heading: '14. Contact',
      body: `${OPERATOR.entity}, ${OPERATOR.address}. Email ${OPERATOR.email}.`,
    },
  ],
}

// ─── Index ───────────────────────────────────────────────────────────────────

/** The subpages listed on the hub, in the order they appear there. */
export const LEGAL_SUBPAGES: LegalDocument[] = [TERMS, PRIVACY]

export const LEGAL_ROOT = '/learning/disclosures'

/** Full route for a document, hub included. */
export function legalHref(doc: LegalDocument): string {
  return doc.slug ? `${LEGAL_ROOT}/${doc.slug}` : LEGAL_ROOT
}
