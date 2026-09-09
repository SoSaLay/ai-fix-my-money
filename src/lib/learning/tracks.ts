// ============================================================================
// Learning tracks
//
// Shape of a track: several lesson steps, then one action step where the
// learner records their own data in the real tool, then a final quiz. Passing
// the final quiz is what unlocks the section permanently.
//
// Each lesson gives the reader a fixed window to read, then puts its questions
// in front of them. Answering is required; being right is not — wrong answers
// feed spaced review instead of blocking progress.
//
// Content rule: every lesson describes how something works and what the
// tradeoffs are. Nothing here tells a learner what to choose. See DISCLAIMER.
// ============================================================================

import { DISCLAIMER_INVESTING } from '@/lib/learning/disclaimer'

export type TrackId = 'accounts' | 'spending' | 'savings' | 'investing'

/** Portion of the final quiz that must be correct to pass. */
export const PASS_THRESHOLD = 0.8

export interface QuizQuestion {
  /** Stable id — used by the spaced-review queue. */
  id: string
  question: string
  options: string[]
  /** Index into `options`. */
  answer: number
  /**
   * A `LessonImage.src` from the same lesson. When set, the question shows that
   * picture beside it, so checking the diagram never means scrolling back up.
   */
  imageSrc?: string
  /** Shown after answering, right or wrong. This is the feedback step. */
  why: string
}

// ─── Lesson content ──────────────────────────────────────────────────────────

export interface Bullet {
  /** Optional lead-in shown in bold, e.g. a term being defined. */
  term?: string
  text: string
  /** Nested points, indented under this one. For a caveat or a how-to. */
  sub?: string[]
}

/**
 * A comparison laid out in columns. Reach for this only where the point IS the
 * comparison — three options against the same two or three criteria. Prose is
 * better at everything else.
 */
export interface LessonTable {
  columns: string[]
  /** Each row has one cell per column. The first cell is the row's label. */
  rows: string[][]
}

export interface LessonSection {
  heading?: string
  /** A short paragraph. Kept to two sentences or fewer wherever possible. */
  body?: string
  bullets?: Bullet[]
  table?: LessonTable
  /**
   * The same data drawn as a fully ruled card, the way a spreadsheet draws one.
   * Use it for reference rows you scan across and compare; `table` is the
   * lighter, underline-only style that reads as part of the prose.
   */
  gridTable?: LessonTable
  /** Rule above this section. Used sparingly, only to separate ideas. */
  divider?: boolean
}

/** Reference imagery shown beside a lesson, and reusable by its questions. */
export interface LessonImage {
  /** Path under /public, or a data URI. */
  src: string
  alt: string
  caption?: string
}

export interface Lesson {
  id: string
  title: string
  /** Reading window in seconds before the questions appear. */
  readSeconds: 30 | 60
  /** One-line framing shown above the content. Omit where it would repeat. */
  intro?: string
  sections: LessonSection[]
  /** Shown in the right column. Absent until reference art exists. */
  images?: LessonImage[]
  questions: QuizQuestion[]
}

/** The single step where the learner works in the real tool. */
export interface ActionStep {
  title: string
  /**
   * What the step is called in the rail and above the heading. Defaults to
   * "Your turn". Set it where the step also carries teaching material, so the
   * label says what the learner is walking into.
   */
  label?: string
  prompt: string
  /**
   * Material the learner needs while they work, shown above the task list.
   * This is for content that only earns its place next to the doing — a lesson
   * they read ten minutes ago and then have to apply belongs here instead.
   */
  brief?: LessonSection[]
  /** Concrete things to do while in the tool. */
  tasks: string[]
  doneWhen: string
}

export interface Track {
  id: TrackId
  title: string
  /** One sentence: what you can DO when this is finished. */
  outcome: string
  blurb: string
  /** The app section this track unlocks. */
  unlocks: string
  status: 'available' | 'coming-soon'
  lessons: Lesson[]
  action: ActionStep | null
  finalQuiz: QuizQuestion[]
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ACCOUNTS
// ─────────────────────────────────────────────────────────────────────────────

const ACCOUNTS: Track = {
  id: 'accounts',
  title: 'Accounts',
  outcome: 'You can name every account that holds your money or your debt, and say what each one is for.',
  blurb: 'What each of your accounts is for, and how credit is measured.',
  unlocks: '/accounts',
  status: 'available',
  lessons: [
    {
      id: 'acc-1',
      title: 'Account definition',
      readSeconds: 30,
      sections: [
        {
          body: 'Why start here? Accounts are how you manage your money, and every number you enter on this platform comes off one. An account is a record held by an institution showing what you own with them, or what you owe them.',
        },
        {
          heading: 'Every account is either:',
          bullets: [
            { term: 'Asset account', text: 'Holds money that belongs to you.' },
            { term: 'Liability account', text: 'Records money you owe.' },
          ],
        },
      ],
      // No questions. This lesson is one definition and the split that follows
      // from it — there is nothing here to test that acc-2 does not test better
      // against the actual list of accounts.
      questions: [],
    },
    {
      id: 'acc-2',
      title: 'Account types',
      readSeconds: 60,
      sections: [
        {
          gridTable: {
            columns: ['Asset account', 'What it is'],
            rows: [
              ['Checking', 'Everyday money moving in and out. Usually pays little or no interest.'],
              ['Savings', 'Money set aside, earning a little interest while it sits. May limit certain withdrawals.'],
              ['High-yield savings', 'The same thing paying a much higher rate. Usually online-only, and transfers out take a day or two.'],
              ['Money market', 'A savings account that typically pays more, and may come with a card or cheques.'],
              ['Certificate of deposit', 'Money locked in for a fixed term at a fixed rate. Taking it out early costs a penalty.'],
              ['Brokerage', 'Holds investments rather than cash. Cash sitting in it is usually waiting to be invested or withdrawn.'],
              ['401(k)', 'A retirement account sponsored by an employer, who often contributes alongside you. Rules apply to when money can come out.'],
              ['IRA', 'A retirement account held in your own name, independent of any employer.'],
              ['HSA', 'Paired with a high-deductible health plan. Untaxed going in, and coming out for qualifying medical costs.'],
            ],
          },
        },
        {
          gridTable: {
            columns: ['Liability account', 'What it is'],
            rows: [
              ['Credit card', 'Revolving: borrow up to a limit, repay, and borrow again. Interest applies to balances carried past the due date.'],
              ['Personal loan', 'A fixed amount borrowed once and repaid on a schedule. Nothing backs it, so the rate is usually higher.'],
              ['Auto loan', 'Borrowed to buy a car and repaid on a schedule. The car backs the loan.'],
              ['Student loan', 'Borrowed to pay for education. Repayment usually starts after leaving school.'],
              ['Mortgage', 'Borrowed to buy property, repaid over decades. The property backs the loan.'],
            ],
          },
        },
      ],
      questions: [
        {
          id: 'acc-2-q1',
          question: 'A credit card account shows a balance of $840. What does that number represent?',
          options: ['Money available to you', 'Money you owe', 'Money already paid', 'Your credit limit'],
          answer: 1,
          why: 'On a liability account the balance is the amount still owed. On an asset account the same word means the opposite — money you hold.',
        },
        {
          id: 'acc-2-q2',
          question: 'Which of these is an asset account?',
          options: ['Auto loan', 'Mortgage', 'Money market', 'Store credit card'],
          answer: 2,
          why: 'A money market account holds money that belongs to you. The other three are records of money owed to a lender.',
        },
        {
          id: 'acc-2-q3',
          question: 'Which retirement account is sponsored by an employer?',
          options: ['IRA', 'Brokerage account', '401(k)', 'High-yield savings account'],
          answer: 2,
          why: 'A 401(k) is sponsored by an employer, who often contributes alongside you. An IRA is the retirement account held in your own name instead.',
        },
        {
          id: 'acc-2-q4',
          question: 'Which liability lets you borrow again after you have repaid it?',
          options: ['Credit card', 'Auto loan', 'Student loan', 'Mortgage'],
          answer: 0,
          why: 'A credit card revolves — the amount available goes back up as you repay. The other three are borrowed once and the balance only goes down.',
        },
        {
          id: 'acc-2-q5',
          question: 'Two accounts hold $5,000 each: a checking account and a certificate of deposit. What differs?',
          options: [
            'Nothing — the amount is the same',
            'The rules on getting the money out, which come with the account type',
            'Only the institution',
            'Only the interest rate',
          ],
          answer: 1,
          why: 'Access, fees, and tax treatment attach to the type of account, not to the amount in it. The CD is locked for a term; the checking account is not.',
        },
        {
          id: 'acc-2-q6',
          question: 'What backs an auto loan that does not back a personal loan?',
          options: ['Your income', 'The car itself', 'Your credit score', 'Nothing'],
          answer: 1,
          why: 'The car secures the loan, which is why the rate is usually lower. A personal loan has nothing behind it, so it typically costs more to borrow.',
        },
      ],
    },
    {
      id: 'acc-4',
      title: 'Credit',
      readSeconds: 60,
      sections: [
        {
          body: 'Credit is money you borrow with a promise to repay it. Credit accounts are then reported to credit bureaus, creating your credit report. This is a record lenders, landlords, and sometimes employers use to assess your financial reliability and interest rates. Your credit score summarizes that report as a single number.',
        },
        {
          heading: 'Credit score components',
          bullets: [
            { term: 'Payment history', text: 'Paying on time. The largest factor.' },
            { term: 'Credit utilisation', text: 'What you owe divided by your limit. Keep it at 30% or lower.' },
            { term: 'Length of history', text: 'How long your accounts have been open. No history means no score.' },
            { term: 'Inquiries', text: 'Applying for credit leaves a mark. Checking your own score does not.' },
          ],
        },
        {
          heading: 'Pay your credit card',
          bullets: [
            { term: 'Current balance', text: 'Everything you owe today.' },
            { term: 'Statement balance', text: 'What you owed at the cycle close. Pay this in full to avoid interest.' },
            { term: 'What paying it does', text: 'Raises your score, so you get approved for big purchases at a lower rate.' },
          ],
        },
      ],
      images: [
        {
          src: '/learning/accounts-utilisation.svg',
          alt: 'Two progress bars. Card A has a $5,000 limit with $1,500 used, filling 30 per cent. Card B has a $2,000 limit with the same $1,500 used, filling 75 per cent.',
          caption: 'The same $1,500 is 30% on one card and 75% on another. Utilisation is the ratio, never the amount.',
        },
      ],
      questions: [
        {
          id: 'acc-4-q1',
          question: 'You owe $450 on a card with a $1,500 limit. What is your utilisation on that card?',
          options: ['4.5%', '30%', '45%', '15%'],
          answer: 1,
          imageSrc: '/learning/accounts-utilisation.svg',
          why: '450 ÷ 1500 = 0.30, so 30%. Utilisation is always balance divided by limit, not balance divided by income or spending.',
        },
        {
          id: 'acc-4-q2',
          question: 'Which of these creates a hard inquiry on your credit report?',
          options: [
            'Checking your own score',
            'Applying for a new credit card',
            'Paying a card off',
            'Logging into your bank',
          ],
          answer: 1,
          why: 'Applying for credit produces a hard inquiry. Checking your own report is a soft inquiry and is not recorded the same way.',
        },
        {
          id: 'acc-4-q3',
          question: 'What does a credit score directly measure?',
          options: [
            'How much money you have',
            'Your income',
            'Information in your credit report about borrowing and repayment',
            'Your net worth',
          ],
          answer: 2,
          why: 'The score is calculated only from credit report data. Income, savings, and assets are not in the report.',
        },
        {
          id: 'acc-4-q4',
          question: 'Someone has never borrowed money. What is the likely state of their credit score?',
          options: ['Perfect', 'Zero', 'They may have no score at all', 'Average'],
          answer: 2,
          why: 'Scoring models need a history to score. With no credit accounts there may be nothing to calculate from.',
        },
      ],
    },
    {
      id: 'acc-5',
      title: 'Net worth',
      readSeconds: 30,
      sections: [
        {
          body: 'Everything you own, minus everything you owe. That is the whole calculation.',
        },
        {
          heading: 'Calculation',
          bullets: [
            { term: 'Assets', text: 'Cash, savings, investments, property — everything you own.' },
            { term: 'Liabilities', text: 'Cards, loans, mortgage — everything you owe.' },
            { term: 'The result', text: 'You want to own more than you owe, that starts with managing your income and spending — our very next track!' },
          ],
        },
      ],
      images: [
        {
          src: '/learning/accounts-net-worth.svg',
          alt: 'A block of assets worth $11,470, minus a block of debts worth $28,090, equals a net worth of negative $16,620.',
          caption: 'Assets minus debts. One subtraction, and the answer is allowed to be negative.',
        },
      ],
      questions: [
        {
          id: 'acc-5-q1',
          question: 'You have $4,000 across your accounts and owe $9,500. What is your net worth?',
          options: ['$13,500', '−$5,500', '$5,500', '−$9,500'],
          answer: 1,
          imageSrc: '/learning/accounts-net-worth.svg',
          why: '4,000 − 9,500 = −5,500. Negative net worth simply means recorded debts currently exceed recorded assets.',
        },
        {
          id: 'acc-5-q2',
          question: 'What does net worth NOT tell you?',
          options: [
            'What you own',
            'What you owe',
            'Whether you can cover this month’s bills',
            'The difference between the two',
          ],
          answer: 2,
          why: 'Net worth is a stock measure. Covering monthly bills is about cash flow, which is a different measurement entirely.',
        },
      ],
    },
  ],
  action: {
    title: 'Map your own accounts',
    prompt:
      'Everything above was the theory. Now build the actual picture — every account you have, in one place, entered by hand. Typing them out is how you find the ones you had forgotten.',
    tasks: [
      'Pull out your phone and open your banking app. Work from what is on the screen, not from memory.',
      'Add every account you can think of — checking, savings, credit cards, loans, brokerage, retirement, cash apps.',
      'Scroll your phone’s app list and your email for anything you missed. Old accounts and payment apps hide there.',
      'Set the correct type on each one. The type is printed on the statement if you are unsure.',
      'Read the real balance off your phone for each account and record it. Do not estimate.',
      'For credit cards, tap into the card details for the credit limit and add it alongside the balance.',
      'Read the net worth figure at the bottom and check it against what you expected.',
    ],
    doneWhen: 'Every account you have is recorded with a type and a real balance, and you cannot think of one you have missed.',
  },
  finalQuiz: [
    {
      id: 'acc-f1',
      question: 'Which pair correctly separates an asset account from a liability account?',
      options: [
        'Savings account / brokerage account',
        'Checking account / auto loan',
        'Credit card / mortgage',
        'Money market / certificate of deposit',
      ],
      answer: 1,
      why: 'A checking account holds money that is yours; an auto loan records money owed. The other pairs are two of the same kind.',
    },
    {
      id: 'acc-f3',
      question: 'You owe $1,800 across cards with a combined limit of $6,000. What is your overall utilisation?',
      options: ['18%', '30%', '33%', '60%'],
      answer: 1,
      why: '1,800 ÷ 6,000 = 0.30. Utilisation is always the balance divided by the limit.',
    },
    {
      id: 'acc-f4',
      question: 'Which action would show up on a credit report as a hard inquiry?',
      options: [
        'Checking your own credit score',
        'Making a card payment',
        'Applying for an auto loan',
        'Opening a savings account',
      ],
      answer: 2,
      why: 'Applying for credit produces a hard inquiry. Checking your own report is soft, and a savings account is not a credit product.',
    },
    {
      id: 'acc-f5',
      question: 'A friend has $8,000 in savings, no debt, and has never used credit. What can you say about their credit score?',
      options: [
        'It will be excellent because they have savings',
        'It will be poor because they have no debt',
        'They may not have a score at all',
        'It will be exactly average',
      ],
      answer: 2,
      why: 'Savings are not on a credit report. With no borrowing history there may be nothing for a scoring model to calculate from.',
    },
    {
      id: 'acc-f6',
      question: 'Your accounts total $6,400 and your debts total $11,900. What is your net worth?',
      options: ['$18,300', '−$5,500', '$5,500', '−$11,900'],
      answer: 1,
      why: '6,400 − 11,900 = −5,500. Assets minus debts, and the result can legitimately be negative.',
    },
    {
      id: 'acc-f7',
      question: 'What is the practical difference between a revolving account and an instalment loan?',
      options: [
        'Revolving accounts charge no interest',
        'The balance on a revolving account can go back up after you repay',
        'Instalment loans have no fixed schedule',
        'Only instalment loans appear on a credit report',
      ],
      answer: 1,
      why: 'Revolving credit can be borrowed again up to the limit. An instalment loan is borrowed once and only decreases.',
    },
    {
      id: 'acc-f9',
      question: 'Why does moving $500 out of a retirement account differ from moving $500 out of checking?',
      options: [
        'Retirement accounts have lower balances',
        'The rules, taxes, and possible penalties attach to the account type',
        'Checking accounts charge higher fees',
        'There is no difference',
      ],
      answer: 1,
      why: 'Withdrawal rules and tax treatment come from the account type, not the amount being moved.',
    },
    {
      id: 'acc-f10',
      question: 'Someone has a high net worth but cannot cover this month’s rent. Is that possible?',
      options: [
        'No — high net worth means available money',
        'Yes — net worth says nothing about accessible cash',
        'Only if they have debt',
        'Only if they are self-employed',
      ],
      answer: 1,
      why: 'Net worth is a stock measure. Wealth locked in property or retirement accounts is not cash available this month.',
    },
  ],
}

const SPENDING: Track = {
  id: 'spending',
  title: 'Income vs. Spending',
  outcome: 'You can say where your money actually went last month, and whether more came in than went out.',
  blurb: 'Where your money goes each month, and whether more comes in than goes out.',
  unlocks: '/spending',
  status: 'available',
  lessons: [
    {
      id: 'spd-1',
      title: 'Income',
      readSeconds: 30,
      sections: [
        {
          body: 'Income is any money you receive.',
        },
        {
          heading: 'Two different numbers',
          bullets: [
            { term: 'Gross income', text: 'Your pay before anything is taken out. The number on a job offer.' },
            { term: 'Net income', text: 'Your pay after taxes and deductions. The number that reaches your account.' },
          ],
        },
        {
          heading: 'Alternative income forms:',
          bullets: [
            { text: 'Side gigs, freelance work, tips, bonuses, business profit, rental income, interest and dividends, money from selling investments.' },
          ],
        },
      ],
      images: [
        {
          src: '/learning/spending-gross-net.svg',
          alt: 'Gross pay of $4,000 with four deductions listed beneath it — tax, payroll tax, health insurance and a retirement contribution — leaving take-home pay of $2,734.',
          caption: 'Gross pay, less tax and deductions, gives take-home. Take-home is the figure the month runs on.',
        },
      ],
      questions: [
        {
          id: 'spd-1-q1',
          question: 'Which figure describes money that has actually reached your account?',
          options: ['Gross income', 'Net income', 'Annual salary', 'Base pay'],
          answer: 1,
          imageSrc: '/learning/spending-gross-net.svg',
          why: 'Net income is what remains after deductions. It is the only figure you can actually spend or move.',
        },
        {
          id: 'spd-1-q2',
          question: 'Why do deductions make gross income a poor planning number?',
          options: [
            'Gross income changes monthly',
            'Deductions can remove a substantial share before the money arrives',
            'Gross income is taxed twice',
            'It is not — gross is more accurate',
          ],
          answer: 1,
          why: 'Taxes and withholdings can take a large fraction of gross pay. Planning against gross assumes money you never receive.',
        },
        {
          id: 'spd-1-q3',
          question: 'Someone earns between $2,000 and $4,500 a month depending on work volume. Which figure best describes their constraint?',
          options: ['The average, $3,250', 'The high month, $4,500', 'The low month, $2,000', 'The yearly total'],
          answer: 2,
          why: 'Obligations still arrive in the low months. The floor, not the average, is what has to be covered.',
        },
      ],
    },
    {
      id: 'spd-intro',
      title: 'Increasing income',
      readSeconds: 60,
      sections: [
        {
          body: 'Increasing your income solves a lot of money problems at once — it gives you more freedom and more room to decide where your money goes. There are three repeatable ways to increase what you have.',
        },
        {
          heading: 'The three',
          bullets: [
            { term: 'Career', text: 'Selling your time and skill to someone who owns the business. It starts your money.' },
            { term: 'Business', text: 'Owning the thing that does the selling. It increases your money.' },
            { term: 'Investing', text: 'Owning a slice of something someone else runs. It grows your money.' },
          ],
        },
        {
          table: {
            columns: ['', 'Strongest for', 'Costs you'],
            rows: [
              [
                'Career',
                'Reliability. The same pay for the same hours, every week.',
                'Your hours, and a cap someone else sets. A raise moves the cap; it does not remove it.',
              ],
              [
                'Business',
                'No cap. Solve a problem people pay for and there is no limit on what you can earn.',
                'The highest failure rate, competitive, and your money, effort, and time go in first.',
              ],
              [
                'Investing',
                'Using money to make money. It grows without your physical effort or hours. More often than not, time is what makes its value increase.',
                'The slowest of the three, and nothing is guaranteed.',
              ],
            ],
          },
        },
        {
          divider: true,
          heading: 'How they relate',
          body: 'A career is you working for a business. That business grows because people like you work in it. Other people then want a piece of those businesses, through the stock market or private markets — and that is investing. People use income from jobs, businesses, and investments to fund new businesses that solve evolving problems. Creating new jobs and investment opportunities—and the cycle continually repeats.',
        },
      ],
      images: [
        {
          src: '/learning/spending-three-ways.svg',
          alt: 'Three ways to increase money arranged along an ownership axis: career at the left with no ownership, investing in the middle owning a slice, and business at the right owning the whole thing. Each is labelled with what it is strongest for and what it costs.',
          caption: 'The three sit on one axis: how much of the thing you own. Ownership is what raises the ceiling, and what raises the risk.',
        },
      ],
      questions: [
        {
          id: 'spd-intro-q1',
          question: 'Which of the three is described as the one that starts your money?',
          options: ['Business', 'Career', 'Investing', 'Saving'],
          answer: 1,
          imageSrc: '/learning/spending-three-ways.svg',
          why: 'A career is what most people begin with, and it is usually what funds the other two. Its strength is reliability, not ceiling.',
        },
        {
          id: 'spd-intro-q2',
          question: 'What is the tradeoff that comes with a business rather than a career?',
          options: [
            'It always pays more, with no added risk',
            'A higher ceiling, but the highest failure rate of the three',
            'A lower ceiling, but far more reliable income',
            'It grows without any time or money going in',
          ],
          answer: 1,
          imageSrc: '/learning/spending-three-ways.svg',
          why: 'Ownership removes the cap on what you can earn and removes the guarantee at the same time. Most small businesses do not survive; that risk is the price of the ceiling.',
        },
        {
          id: 'spd-intro-q3',
          question: 'What single idea connects all three?',
          options: [
            'How much tax each one attracts',
            'How much of the thing you own',
            'How many hours each one takes',
            'How soon each one pays out',
          ],
          answer: 1,
          why: 'Career, business and investing are three positions on one axis. Owning more raises what you can earn and raises what you can lose.',
        },
      ],
    },
    {
      id: 'spd-2',
      title: 'Fixed costs',
      readSeconds: 60,
      sections: [
        {
          body: 'Fixed costs are the bills you have already committed to — rent or mortgage, insurance, loan payments, phone, utilities. They arrive on a schedule whether you think about them or not.',
        },
        {
          heading: 'Important to know',
          bullets: [
            { term: 'Fixed is not permanent', text: 'You can change them, but it takes a real decision — moving, refinancing, switching plans.' },
            { term: 'They take the first bite', text: 'Like taxes, fixed costs come off your income before you get to choose anything. What is left is the money you actually decide about.' },
          ],
        },
        {
          divider: true,
          heading: 'Subscriptions',
          body: 'Like phone and utilities, subscriptions are a fixed cost — people just do not think of them that way. Most of us now pay for a handful of apps and tools, and they add up quietly.',
          bullets: [
            { term: 'Recurring by default', text: 'Decided once, then charged again with no further decision from you.' },
            { term: 'The real number', text: 'Sites advertise a low monthly price but bill you for the year. That is a fixed cost for the next twelve months.' },
            { term: 'Before you subscribe', text: 'Whatever you keep becomes a fixed cost. Commit only to what you will use.' },
          ],
        },
      ],
      images: [
        {
          src: '/learning/spending-fixed-costs.svg',
          alt: 'A bar showing $1,880 of fixed costs against $854 left over, with the fixed block broken out into rent, car payment, phone, insurance, utilities and a loan minimum.',
          caption: 'Fixed costs are committed before the month begins. What remains is the part you can steer.',
        },
      ],
      questions: [
        {
          id: 'spd-2-q1',
          question: 'Which is a fixed cost?',
          options: ['Groceries', 'Car insurance premium', 'Eating out', 'Petrol'],
          answer: 1,
          why: 'An insurance premium arrives on a schedule at a set amount. The others change with what you do that month.',
        },
        {
          id: 'spd-2-q2',
          question: 'What does the total of your fixed costs tell you?',
          options: [
            'How much you can save',
            'The minimum a month costs you before any choices',
            'Your net worth',
            'Your credit utilisation',
          ],
          answer: 1,
          why: 'Fixed costs are the floor. They arrive regardless of how carefully you spend on everything else.',
        },
        {
          id: 'spd-2-q4',
          question: 'A subscription costs $12.99 a month. What is the annual commitment?',
          options: ['$129.90', '$155.88', '$142.89', '$168.00'],
          answer: 1,
          why: '12.99 × 12 = 155.88. Monthly pricing makes recurring costs feel smaller than the yearly figure they actually represent.',
        },
        {
          id: 'spd-2-q3',
          question: 'Does "fixed" mean the cost can never change?',
          options: [
            'Yes, it is locked permanently',
            'No — it means changing it takes a deliberate decision, not a monthly one',
            'Only for rent',
            'Only for loans',
          ],
          answer: 1,
          why: 'Fixed describes the rhythm, not permanence. These costs change through decisions like moving or switching providers.',
        },
      ],
    },
    {
      id: 'spd-3',
      title: 'Variable spending',
      readSeconds: 60,
      sections: [
        {
          body: 'Variable spending is everything you decide to buy during the month — groceries, eating out, transport, shopping, entertainment. It is variable because the amount changes with the choices you make.',
        },
        {
          heading: 'Important to know',
          bullets: [
            { term: 'This is where budgets break', text: 'Your fixed costs are set, variable spending has no set amount, which makes it the spending that go over budget.' },
            { term: 'Frequency', text: 'purchase can be small, so the total comes from how often you buy. Cutting how many times you spend can do more than cutting what you spend.' },
            { term: 'Categories', text: 'Most banks and credit cards sort your charges for you. That is the fastest way to see where it went.' },
          ],
        },
      ],
      images: [
        {
          src: '/learning/spending-variable.svg',
          alt: 'Five horizontal bars for variable categories — groceries $412, eating out $326, transport $187, shopping $146 and fun $93 — totalling $1,164.',
          caption: 'Categories turn one unexplained total into a short list of numbers worth looking at.',
        },
      ],
      questions: [
        {
          id: 'spd-3-q1',
          question: 'Why group spending into categories rather than listing transactions?',
          options: [
            'It looks better',
            'Category totals reveal patterns that individual charges hide',
            'Banks require it',
            'It reduces the number of transactions',
          ],
          answer: 1,
          why: 'A pattern is only visible in aggregate. Individual charges each look reasonable in isolation — that is why they are hard to notice.',
        },
        {
          id: 'spd-3-q2',
          question: 'Which spending is hardest to notice accurately?',
          options: [
            'A single large annual charge',
            'Rent',
            'Many small frequent charges',
            'A car payment',
          ],
          answer: 2,
          why: 'Small frequent charges are individually forgettable and collectively large. Size makes something memorable; frequency does not.',
        },
        {
          id: 'spd-3-q3',
          question: 'What separates a variable cost from a fixed one?',
          options: [
            'The amount',
            'Whether it changes with your choices during the month',
            'Which account it comes from',
            'Whether it is essential',
          ],
          answer: 1,
          why: 'Variability, not size or necessity, is the dividing line. Groceries are essential and still variable.',
        },
      ],
    },
    {
      id: 'spd-5',
      title: 'Cash flow',
      readSeconds: 30,
      sections: [
        {
          body: 'Everything you earn, minus everything you spend, in one month. That is the whole calculation. It decides whether there is anything left to save or invest.',
        },
        {
          heading: 'Cash flow is not net worth',
          bullets: [
            { term: 'Cash flow', text: 'Your money over one month. What came in, minus what you spent.' },
            { term: 'Net worth', text: 'Your money over your whole life so far. Everything you own, minus everything you owe.' },
            { term: 'The link', text: 'Positive cash flow every month is what grows net worth over years. Increasing your income or setting a spending limit is how you get there.' },
          ],
        },
        {
          heading: 'Reading the result',
          bullets: [
            { term: 'Positive cash flow', text: 'You earned more than you spent. What is left over is the money you can save or invest.' },
            { term: 'Negative cash flow', text: 'You spent more than you earned. The difference came out of your savings or went onto a card.' },
          ],
        },
      ],
      images: [
        {
          src: '/learning/spending-cash-flow.svg',
          alt: 'Take-home pay of $2,734 in, fixed costs of $1,880 and variable spending of $1,164 out, leaving cash flow of negative $310.',
          caption: 'Money in, less money out. The sign of that number decides what everything else is made of.',
        },
      ],
      questions: [
        {
          id: 'spd-5-q1',
          question: 'Income $3,400. Fixed $1,900. Variable $1,150. Subscriptions $95. What is net cash flow?',
          options: ['+$255', '−$255', '+$350', '+$1,500'],
          answer: 0,
          imageSrc: '/learning/spending-cash-flow.svg',
          why: '3,400 − (1,900 + 1,150 + 95) = 255. Every outflow category has to be included or the figure flatters you.',
        },
        {
          id: 'spd-5-q2',
          question: 'Cash flow is negative every month. What is necessarily happening?',
          options: [
            'Nothing — it balances out',
            'The gap is being covered by savings or borrowing',
            'Income is being under-reported',
            'Spending is being over-reported',
          ],
          answer: 1,
          why: 'The money has to come from somewhere. A persistent gap is drawing down reserves or adding debt by definition.',
        },
        {
          id: 'spd-5-q3',
          question: 'Why does cash flow come before saving and investing?',
          options: [
            'It does not; they are independent',
            'Surplus is what funds them — without it they are funded by debt or reserves',
            'Banks require it',
            'It is a legal requirement',
          ],
          answer: 1,
          why: 'Saving out of a deficit moves money without creating any. The surplus is the actual source.',
        },
      ],
    },
  ],
  action: {
    title: 'Record your own month',
    prompt:
      'Build the real picture of a month — what came in, what was already committed, and what you chose to spend. Pull the figures from statements rather than memory.',
    tasks: [
      'Record each source of income at the amount that actually lands in your account.',
      'Record every fixed cost that arrives on a schedule, as a monthly amount — convert anything billed annually or quarterly first.',
      'Before you look: guess what you spend per month on each of your three biggest variable categories. Then record the real monthly totals and compare.',
      'Check every card and your phone’s subscription settings, and record each recurring charge.',
      'Read your net cash flow, then set a monthly spending limit you chose deliberately.',
    ],
    doneWhen: 'Your recorded income and outgoings match what your statements show, and you have seen your own cash flow figure.',
  },
  finalQuiz: [],
}

const SAVINGS: Track = {
  id: 'savings',
  title: 'Savings',
  outcome: 'You can explain what each pool of your savings is for, and how much of your surplus is going to it.',
  blurb: 'How to keep savings separate and give every pool a job.',
  unlocks: '/savings',
  status: 'available',
  lessons: [
    {
      id: 'sav-1',
      title: 'Savings',
      readSeconds: 30,
      sections: [
        {
          body: 'Savings is money you set aside instead of spend, to use later. Sometimes the best thing you can do with money is not spend it. It holds its value while it waits for the right opportunity.',
        },
        {
          heading: 'Unspent versus Saved',
          bullets: [
            { text: 'Your regular accounts move money in and out. A savings account is a separate account you move money into on purpose.' },
            { text: "Some savings accounts pay you a higher interest rate than others for keeping your money there. It's worth choosing where you save, not just that you save." },
          ],
        },
      ],
      images: [
        {
          src: '/learning/savings-separate.svg',
          alt: 'The same $1,800 shown two ways: as one account where savings and spending share a balance, and as two accounts where moving the savings takes a transfer.',
          caption: 'The same total either way. Separating it does not add willpower — it adds a step.',
        },
      ],
      questions: [
        {
          id: 'sav-1-q1',
          question: 'What is the practical difference between unspent money and saved money?',
          options: [
            'The amount',
            'Saved money is structurally separated from everyday access',
            'Saved money earns interest',
            'There is no difference',
          ],
          answer: 1,
          why: 'Separation is the distinction. Money in a spending account is available to be spent regardless of intention.',
        },
        {
          id: 'sav-1-q2',
          question: 'Why does naming a savings pool change behaviour?',
          options: [
            'It earns more interest',
            'Spending it means visibly taking from a stated purpose',
            'Banks charge less',
            'It is required',
          ],
          answer: 1,
          why: 'A named target makes the tradeoff explicit at the moment of spending. An unnamed balance presents no tradeoff.',
        },
      ],
    },
    {
      id: 'sav-2',
      title: 'Types of savings',
      readSeconds: 30,
      sections: [
        {
          heading: 'Accounts:',
          bullets: [
            { term: 'Savings account', text: 'A basic account for money you are not spending right now.' },
            { term: 'High-yield savings account', text: 'The same idea, but specific banks incentivize you with a higher interest rate to keep your money there.' },
            { term: 'Money market account', text: 'Similar to a savings account and often pays more, can require a higher minimum balance to avoid fees or earn that rate.' },
            { term: 'CD (certificate of deposit)', text: 'Pays more, but your money is locked in for a set term.' },
          ],
        },
        {
          heading: 'Methods:',
          bullets: [
            { term: 'Emergency fund', text: 'Money set aside for unpredictable costs — a job loss, a medical bill, a car repair.' },
            { term: 'Sinking fund', text: 'Money set aside a little at a time for a specific cost you already know is coming.' },
          ],
        },
      ],
      questions: [
        {
          id: 'sav-2-q1',
          question: 'What is the difference between a savings account and a CD?',
          options: [
            'There is no difference',
            'A CD locks your money in for a set term in exchange for a higher rate',
            'A CD cannot earn interest',
            'A savings account is only for emergencies',
          ],
          answer: 1,
          why: 'A CD trades access for a better rate. A savings account keeps your money reachable at any time.',
        },
        {
          id: 'sav-2-q2',
          question: 'An emergency fund and a sinking fund are best described as which?',
          options: [
            'Separate account types offered by banks',
            'Methods — ways of using an account, not accounts themselves',
            'Investment products',
            'The same thing with different names',
          ],
          answer: 1,
          why: 'Neither is a special account. Both are money set aside for a purpose, usually held in an ordinary savings account.',
        },
        {
          id: 'sav-2-q3',
          question: 'Which is a sinking fund for, rather than an emergency fund?',
          options: [
            'A sudden job loss',
            'An urgent medical bill',
            'An annual insurance premium you know is coming',
            'An unexpected car repair',
          ],
          answer: 2,
          why: 'A known, scheduled cost is predictable. That is what a sinking fund handles — an emergency fund is for the unpredictable ones.',
        },
      ],
    },
    {
      id: 'sav-3',
      title: 'Interest',
      readSeconds: 60,
      sections: [
        {
          body: 'So far, this course has only mentioned interest with credit cards—the cost of borrowing money when you don’t pay it back on time. With savings, the same mechanism works in your favor: banks pay you interest for keeping your money with them.',
        },
        {
          body: 'We’re not recommending a specific bank or rate. That’s something you’ll need to research, but many banks compete for your money by offering higher interest rates.',
        },
        {
          heading: 'The good versus the bad',
          bullets: [
            {
              term: 'Bad interest',
              text: 'What a credit card or loan charges you to borrow. The longer you carry a balance, the more it costs you.',
              sub: [
                'Having a credit card does not mean you pay interest. Pay your full statement balance by the due date every month and you are charged none at all.',
              ],
            },
            { term: 'Good interest', text: 'What a savings account pays you to keep your money there. The longer it sits, the more you earn.' },
          ],
        },
        {
          divider: true,
          heading: 'Compounding',
          bullets: [
            { term: 'What it is', text: 'You earn interest on your interest. It grows your savings. But this can also be detrimental, because if you owe money and that interest is compounding, the amount you owe keeps growing too.' },
            { term: 'APY', text: 'Interest rates are given per year. APY is the yearly rate with compounding counted, what you actually earn or actually owe.' },
          ],
        },
      ],
      images: [
        {
          src: '/learning/savings-compounding.svg',
          alt: 'A chart over twenty years comparing a straight dashed line reaching $10,000 with a curve reaching $13,266, from the same $5,000 at 5 per cent.',
          caption: 'Illustration only. The gap opens because each year’s interest joins the balance and earns in its own right.',
        },
      ],
      questions: [
        {
          id: 'sav-3-q1',
          question: 'What does compounding mean?',
          options: [
            'Interest is paid more often',
            'Interest is calculated on a balance that already includes past interest',
            'The rate increases over time',
            'Interest is tax-free',
          ],
          answer: 1,
          imageSrc: '/learning/savings-compounding.svg',
          why: 'The base itself grows. That is why the effect accelerates rather than staying linear.',
        },
        {
          id: 'sav-3-q2',
          question: 'Why is APY usually the more informative figure on a savings account?',
          options: [
            'It is always higher',
            'It accounts for compounding, so it reflects actual yearly earnings',
            'It excludes fees',
            'It is set by regulators',
          ],
          answer: 1,
          why: 'APY builds compounding into the number. A nominal rate alone does not tell you what a year actually produces.',
        },
        {
          id: 'sav-3-q3',
          question: 'Does compounding apply to credit card balances?',
          options: [
            'No, only to savings',
            'Yes — carried balances compound the same way',
            'Only above a certain amount',
            'Only on business cards',
          ],
          answer: 1,
          why: 'The mechanism is neutral. Applied to debt it grows what you owe on exactly the same principle.',
        },
      ],
    },
  ],
  action: {
    title: 'Build your own savings structure',
    prompt:
      'Allocation: decide what you will save each month based on your income and spending. You need an actual number in mind, not just an intention, so you know how much you are actually saving.',
    tasks: [
      'Create one savings goal with a name and a target — something you actually want.',
      'Use your recorded fixed costs to work out three and six months of essentials, and set an emergency fund target.',
      'Add a sinking fund for one predictable cost coming in the next year, and divide it by the months left.',
      'Look up the APY on the account holding your savings, and the APR on any card you carry a balance on.',
      'Set the share of your net cash flow that goes to savings.',
    ],
    doneWhen: 'Every pool has a name and a target you chose from your own numbers, and your allocation is set.',
  },
  finalQuiz: [],
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. INVESTING
//
// The hardest track, and the one most likely to be read wrong. The through-line
// is deliberately repeated in every lesson: investing is buying a piece of
// something someone else already started, which means the return depends on
// that business growing, which takes years. Nothing here describes a way to
// make money quickly, because there is no such thing to describe.
//
// The order-of-operations lesson and the instrument menu both describe common
// practice and the reasoning behind it. Neither tells the learner what to pick.
// ─────────────────────────────────────────────────────────────────────────────

const INVESTING: Track = {
  id: 'investing',
  title: 'Investing',
  outcome: 'You can explain what you own, why its value moves, how long it needs, and what each kind of investment risks.',
  blurb: 'What you actually own, why it takes years, and what each kind of investment risks.',
  unlocks: '/investing',
  status: 'available',
  lessons: [
    {
      id: 'inv-1',
      title: 'Investing',
      readSeconds: 60,
      sections: [
        {
          body: 'Investing is buying a piece of something someone else already started. Specifically, you are buying a solution. Every business you can think of solves a problem at scale and gets paid for solving it. When you invest, you are investing in that solution, and in most cases many solutions at once.',
        },
        {
          heading: 'Risk',
          body: 'You cannot talk about investing without talking about risk. Nothing you buy is guaranteed.',
          bullets: [
            { text: 'Risk is the chance that an investment’s value or income turns out differently than you expected—including losing money.' },
            { text: 'It happens because the future is uncertain, and factors outside your control. The economy, interest rates, company performance, politics, supply and demand to name a few.' },
          ],
        },
        {
          heading: 'The link',
          body: 'You invest to grow your money, and every investment carries risk because growth requires putting money into something whose future value is not guaranteed. The possibility of loss is the trade-off for the possibility of earning a return.',
        },
        {
          // The standing risk language, pulled from one place so the lesson and
          // the disclosures page can never drift apart.
          body: DISCLAIMER_INVESTING,
        },
      ],
      images: [
        {
          src: '/learning/investing-what-you-own.svg',
          alt: 'A business represented as one whole block divided into many small slices, with one slice highlighted as the share you own, and arrows showing the two ways value reaches an owner: growth in what the slice is worth, and income paid out from earnings.',
          caption: 'You own a slice of an operating business. Its result is your result — and someone else decides what it does.',
        },
      ],
      questions: [
        {
          id: 'inv-1-q1',
          question: 'When you buy a share, what have you actually bought?',
          options: [
            'A loan to the government',
            'A unit of ownership in a business someone else runs',
            'A guarantee of future payments',
            'A savings account with a higher rate',
          ],
          answer: 1,
          imageSrc: '/learning/investing-what-you-own.svg',
          why: 'A share is ownership. That is why the outcome depends on how the business performs rather than on a rate someone promised you.',
        },
        {
          id: 'inv-1-q2',
          question: 'What are the two ways an ownership stake can return money to you?',
          options: [
            'Interest and fees',
            'Growth in what it is worth, and income paid out of earnings',
            'Deposits and withdrawals',
            'Taxes and rebates',
          ],
          answer: 1,
          why: 'Either the slice becomes worth more, or the business pays part of its earnings out to owners. Nothing else is a return.',
        },
        {
          id: 'inv-1-q4',
          question: 'Who makes the day-to-day decisions in a business you own shares in?',
          options: [
            'The shareholders, by vote',
            'Management — even the largest shareholders do not run the company',
            'Whoever owns the most shares',
            'The brokerage that holds your shares',
          ],
          answer: 1,
          why: 'Ownership is not control. Large holders can vote and press for change, but the operating decisions stay with the people running the business.',
        },
        {
          id: 'inv-1-q5',
          question: 'Where does the underlying risk in owning a share come from?',
          options: [
            'Brokerage fees',
            'Your return depends on decisions other people make, over years you cannot skip',
            'The share price changing during the day',
            'Having to file taxes on it',
          ],
          answer: 1,
          why: 'You have handed money to an operation you do not run. Everything that decides the outcome — the decisions, the market, the years it takes — sits outside your control.',
        },
        {
          id: 'inv-1-q3',
          question: 'A company’s share price falls 6% in one afternoon on no news. What most likely changed?',
          options: [
            'The business lost 6% of its customers that afternoon',
            'What buyers and sellers were willing to pay for the same business',
            'The company issued a refund to owners',
            'The company’s earnings dropped 6%',
          ],
          answer: 1,
          why: 'Price is what people will pay today. The underlying business almost never changes at the speed the price does.',
        },
      ],
    },
    {
      id: 'inv-2',
      title: 'Money growth or loss',
      readSeconds: 30,
      sections: [
        {
          body: 'Once your money is invested it only moves in two directions. Here is what pushes it each way.',
        },
        {
          heading: 'How you can grow your money investing',
          bullets: [
            { term: 'Growth', text: 'It is worth more later than what you paid, so your slice sells for more.' },
            { term: 'Income', text: 'The business hands part of its earnings to owners as a dividend, or a borrower pays you interest.' },
          ],
        },
        {
          divider: true,
          heading: 'How you can lose your money investing',
          bullets: [
            { term: 'It loses value', text: 'It is worth less than what you paid. Selling at that point is what turns it into a real loss.' },
            { term: 'It fails', text: 'A business can go under, and a stake in it can end up worth nothing.' },
            { term: 'The income stops', text: 'A dividend is not promised. It can be cut or stopped at any time.' },
          ],
        },
        {
          divider: true,
          heading: 'The link',
          body: 'Both sides come from the same place. The business you bought into either does well or it does not, and your money follows it either way. You do not get access to one side without accepting the other.',
        },
      ],
      questions: [
        {
          id: 'inv-2-q1',
          question: 'What are the two ways an investment can return money to you?',
          options: [
            'Interest and fees',
            'Growth in what it is worth, and income paid out of earnings',
            'Deposits and withdrawals',
            'Taxes and rebates',
          ],
          answer: 1,
          why: 'Either it becomes worth more than you paid, or it pays part of its earnings out to you. Nothing else is a return.',
        },
        {
          id: 'inv-2-q2',
          question: 'Your investment is worth less than you paid. When does that become a real loss?',
          options: [
            'Immediately',
            'When you sell it at that price',
            'At the end of the tax year',
            'It never does',
          ],
          answer: 1,
          why: 'Until you sell, the fall is on paper. Selling is what turns the lower price into money you no longer have.',
        },
        {
          id: 'inv-2-q3',
          question: 'Which is true of a dividend?',
          options: [
            'It is guaranteed once it starts',
            'It can be cut or stopped at any time',
            'It rises every year by law',
            'It is paid even if the business fails',
          ],
          answer: 1,
          why: 'A dividend is a decision the business makes each time. Nothing obliges it to keep paying one.',
        },
        {
          id: 'inv-2-q4',
          question: 'Why can you not have the upside without the downside?',
          options: [
            'Brokers require it',
            'Both come from the same business doing well or badly',
            'It is a tax rule',
            'You can, with the right account',
          ],
          answer: 1,
          why: 'One business, one outcome. The thing that can grow your money is the same thing that can lose it.',
        },
      ],
    },
    {
      id: 'inv-3',
      title: 'Financial basics help growth',
      readSeconds: 60,
      sections: [
        {
          body: 'Investing doesn’t have to be complicated. There are a few simple steps you can take to start investing wisely and have a solid foundation for growing your money.',
        },
        {
          body: 'The accounts mentioned here are specific to the United States employers/employees.',
        },
        {
          heading: 'Where Your Money Goes, in Order',
          bullets: [
            { term: '1. Pay off high-interest debt', text: 'Eliminate expensive debt first. Paying off a 24% balance is like earning a guaranteed 24% return.' },
            { term: '2. Build 3–6 months of savings', text: 'Keep enough cash to cover 3–6 months of your expenses so emergencies don’t push you back into debt or force you to sell investments at a bad time.' },
            { term: '3. Get the full 401(k) match', text: 'Contribute enough to get all the free money your employer offers. Don’t leave part of your compensation unclaimed.' },
            { term: '4. Fund a Roth IRA', text: 'Invest for retirement with money you’ve already paid taxes on. Qualified withdrawals, including your growth, are tax-free.' },
            { term: '5. Keep funding your 401(k)', text: 'After getting the match, keep contributing. Traditional 401(k) contributions can lower your taxable income today and grow tax-deferred.' },
            { term: '6. Fund an HSA', text: 'If you have an eligible high-deductible health plan, use the HSA for medical costs. Contributions and growth are tax-free, and qualified medical withdrawals are tax-free.' },
            { term: '7. Invest in a taxable brokerage', text: 'This is probably the kind of investing you picture: you open an account, choose what to invest in, and buy and sell a wide range of investments. You pay taxes on your investment gains and dividends.' },
          ],
        },
      ],
      images: [
        {
          src: '/learning/investing-order.svg',
          alt: 'Seven numbered rungs from high-interest debt at the bottom up to a taxable brokerage at the top, each labelled with the reason it sits at that height.',
          caption: 'Ordered by guaranteed return and by risk removed, not by excitement.',
        },
      ],
      questions: [
        {
          id: 'inv-3-q1',
          question: 'Why does high-interest debt usually sit ahead of investing in this ordering?',
          options: [
            'Lenders require it',
            'Clearing it is a guaranteed saving that no investment can guarantee to beat',
            'Debt blocks you from opening a brokerage account',
            'Interest is not tax deductible',
          ],
          answer: 1,
          imageSrc: '/learning/investing-order.svg',
          why: 'A 24% interest rate you stop paying is a certain 24%. An investment return is never certain, so the guaranteed one is placed first.',
        },
        {
          id: 'inv-3-q2',
          question: 'What is the employer 401(k) match?',
          options: [
            'A loan from your employer',
            'Money your employer adds when you contribute',
            'A tax refund',
            'A bonus paid at retirement',
          ],
          answer: 1,
          why: 'It is part of your compensation that only arrives if you contribute. Leaving it unclaimed leaves agreed pay on the table.',
        },
        {
          id: 'inv-3-q3',
          question: 'Why is an emergency fund placed before investing rather than after?',
          options: [
            'It earns a higher return',
            'It stops a bad month from forcing you to sell investments at a loss',
            'Brokers require proof of savings',
            'It is taxed more favourably',
          ],
          answer: 1,
          why: 'The fund is what lets the investment be left alone. Without it, an ordinary emergency turns into a forced sale at whatever price the market offers that week.',
        },
      ],
    },
    {
      id: 'inv-6',
      title: 'Investment choices',
      readSeconds: 60,
      sections: [
        {
          body: 'What you can buy is not all equivalent. The differences are mostly about risk and how much skill each one demands.',
        },
        {
          heading: 'Built to be held',
          bullets: [
            { term: 'Index ETFs', text: 'One purchase tracking a whole market. Broad by default, cheap to hold, trades like a share. Falls when the market falls — that is the risk, and it is the honest one.' },
            { term: 'Mutual funds', text: 'The same pooling idea, priced once a day. Actively managed ones cost more and most do not beat the plain index over long periods.' },
            { term: 'Bonds and bond funds', text: 'Lending for interest. Lower expected return, and they lose value when interest rates rise.' },
            { term: 'REITs', text: 'Pooled property. Income-oriented, and exposed to property markets and rates.' },
          ],
        },
        {
          divider: true,
          heading: 'Higher risk, more depends on you',
          bullets: [
            { term: 'Individual stocks', text: 'A single company can lose most of its value and not come back. Requires real work to research and a tolerance for being wrong.' },
            { term: 'Crypto', text: 'Extremely volatile, weakly regulated, and with no earnings underneath it. Falls of 70% or more have happened repeatedly. Held in a taxable brokerage, and treated as property for tax.' },
          ],
        },
        {
          divider: true,
          heading: 'Technical instruments where losing money is the common outcome',
          bullets: [
            { term: 'Options', text: 'Contracts on the price of something else, with expiry dates. Most expire worthless. Some strategies can lose more than you put in.' },
            { term: 'Futures', text: 'Leveraged contracts to buy or sell later. Leverage magnifies losses as readily as gains, and can be called in.' },
            { term: 'Day trading', text: 'Buying and selling within the day. Study after study finds the large majority of day traders lose money over time, and the ones who persist mostly lose more.' },
            { text: 'These are not forbidden and they are not secrets. They are specialist tools that require skill, time and a tolerance for total loss.' },
          ],
        },
        {
          divider: true,
          heading: 'Read the pattern',
          body: 'Risk rises as the thing being bought moves further from part-ownership of an operating business and closer to a bet on a price. The long-term case gets weaker in the same direction.',
        },
      ],
      images: [
        {
          src: '/learning/investing-menu.svg',
          alt: 'A ladder of investment types ordered by risk, from broad index funds and bond funds at the low end through individual stocks and crypto to options, futures and day trading at the high end, each annotated with its main risk.',
          caption: 'Ordered by how much can go wrong and how much skill it demands.',
        },
      ],
      questions: [
        {
          id: 'inv-6-q1',
          question: 'What is the main risk of a broad index ETF?',
          options: [
            'The fund manager can take your shares',
            'It falls when the market it tracks falls',
            'It can expire worthless',
            'It has no risk',
          ],
          answer: 1,
          imageSrc: '/learning/investing-menu.svg',
          why: 'It holds the market, so it takes the market’s falls. That is a real risk — it is simply not the risk of a single company failing.',
        },
        {
          id: 'inv-6-q2',
          question: 'Which is true of options as a category?',
          options: [
            'They are a safer version of stocks',
            'They carry expiry dates and most expire worthless',
            'They guarantee income',
            'They cannot lose more than you paid, ever',
          ],
          answer: 1,
          why: 'An option is a time-limited contract. When the expiry passes without the price moving as needed, the contract is worth nothing.',
        },
        {
          id: 'inv-6-q3',
          question: 'What does the research consistently find about day trading?',
          options: [
            'Most day traders beat the market',
            'The large majority lose money over time',
            'It is risk-free with enough practice',
            'Results are the same as index investing',
          ],
          answer: 1,
          why: 'The evidence is unusually consistent on this. Frequent trading adds costs and demands skill most people do not have, and the majority end up behind.',
        },
        {
          id: 'inv-6-q4',
          question: 'What broadly happens to risk as you move down the menu from index funds toward futures?',
          options: [
            'Risk falls',
            'Risk rises as the purchase moves from owning a business to betting on a price',
            'Risk stays the same',
            'Risk disappears with leverage',
          ],
          answer: 1,
          why: 'Ownership of a real business has earnings underneath it. A contract on a price does not, so its outcome depends entirely on the price moving your way in time.',
        },
      ],
    },
    {
      id: 'inv-8',
      title: 'Buying/selling investments',
      readSeconds: 60,
      intro: 'The investors who do well are usually the ones still there decades later. Not losing everything is the precondition for everything else.',
      sections: [
        {
          heading: 'Where the buying happens',
          body: 'All of this is bought through a brokerage account — an account that holds investments rather than cash and places your buy and sell orders. We are not naming or recommending any particular one; which broker to use is research you do yourself.',
        },
        {
          heading: 'What it costs to hold',
          body: 'Brokers and funds differ mostly in what they charge: a fund’s expense ratio is an annual percentage of your balance taken whether it gains or loses, and 1% instead of 0.05% quietly removes a large share of a lifetime of growth.',
        },
        {
          divider: true,
          body: 'Allocation is the act of taking money you have earned or saved and actually putting it into assets. There are a number of ways to do it, depending on what you decided to buy off the back of your own thinking and research.',
        },
        {
          heading: 'Allocation versus diversification',
          bullets: [
            { term: 'Allocation', text: 'The split between classes — how much in stocks, how much in bonds, how much in cash.' },
            { term: 'Diversification', text: 'Not concentrating within a class. Twenty companies in one industry is one bet wearing a disguise.' },
            { term: 'Rebalancing', text: 'Periodically returning to your intended split. It mechanically trims what has run up and adds to what has not.' },
          ],
        },
        {
          divider: true,
          heading: 'Contributing on a schedule',
          bullets: [
            { term: 'Dollar-cost averaging', text: 'Investing a fixed amount at a fixed interval regardless of price. You buy more units when prices are low and fewer when they are high.' },
            { term: 'Automation', text: 'A standing transfer removes the monthly decision, which is where most plans break down.' },
            { term: 'Timing the market', text: 'Getting out and back in requires being right twice. Missing a small number of the strongest days does most of the damage to a long-run result.' },
          ],
        },
        {
          divider: true,
          heading: 'Protecting the capital you have',
          bullets: [
            { term: 'Risk what you can lose', text: 'Size a position against your whole portfolio, not against how confident you feel.' },
            { term: 'Do not try to lose more than you are trying to make', text: 'The riskier the play, the larger both outcomes get. The downside is the one that ends the run.' },
            { term: 'Know what you own', text: 'If you cannot explain what a holding is and how it makes money, you cannot judge what would go wrong.' },
          ],
        },
        {
          divider: true,
          heading: 'Reviewing, without fiddling',
          bullets: [
            { term: 'Review annually', text: 'Check that the split still matches your goal, horizon and tolerance. Life changes are the usual reason to adjust.' },
            { term: 'Rebalance when it has drifted', text: 'Move back to the intended split rather than reacting to the last few months.' },
            { term: 'Do not chase last year’s winner', text: 'Buying whatever performed best recently is a reliable way to buy high.' },
            { term: 'Decide in advance', text: 'Rules set on a calm day are what carry you through a bad one. Decisions made mid-fall are made by fear.' },
          ],
        },
        {
          divider: true,
          heading: 'What you keep is after tax',
          bullets: [
            { term: 'After-tax value is the real number', text: 'A balance you have not paid tax on yet is not entirely yours.' },
            { term: 'Asset location', text: 'Which account holds which investment changes the tax bill, separately from what you hold.' },
            { term: 'Rebalancing inside tax-advantaged accounts', text: 'Selling to rebalance in a taxable account can trigger a taxable gain; inside a 401(k) or IRA it generally does not.' },
            { term: 'Roth versus traditional', text: 'A Roth is taxed going in and generally not on the way out. A traditional account is the reverse. Which is better depends on your tax rate now against later — a question about you, not about markets.' },
          ],
        },
        {
          divider: true,
          heading: 'The whole track in one line',
          body: 'You bought a piece of something someone else already started, and still runs. Businesses take years to grow, so your plan has to be built on your own goal, horizon and tolerance — and then left alone long enough to work.',
        },
      ],
      images: [
        {
          src: '/learning/investing-fees.svg',
          alt: 'Two ending balances from the same contributions and the same return, one charged a 0.05% annual expense ratio and one charged 1%, with the gap between them shaded and labelled as fees.',
          caption: 'The same contributions and the same return. The only difference is the annual fee.',
        },
        {
          src: '/learning/investing-allocation.svg',
          alt: 'One portfolio shown split across fixed income, large cap, mid and small cap and foreign holdings, beside a drifted version of the same portfolio and an arrow labelled rebalancing returning it to the intended split.',
          caption: 'Allocation is the split. Rebalancing is returning to it after the market moves it.',
        },
      ],
      questions: [
        {
          id: 'inv-8-q0',
          question: 'What is an expense ratio?',
          options: [
            'A one-off charge when you buy',
            'An annual percentage of your balance taken by the fund',
            'The tax on your gains',
            'The fund’s return',
          ],
          answer: 1,
          imageSrc: '/learning/investing-fees.svg',
          why: 'It is charged every year on whatever the balance is, in good years and bad. That is why a small difference compounds into a large one.',
        },
        {
          id: 'inv-8-q7',
          question: 'What does rebalancing do?',
          options: [
            'Adds money to the account',
            'Returns a portfolio to its intended split after the market has moved it',
            'Removes all risk',
            'Locks in a guaranteed return',
          ],
          answer: 1,
          imageSrc: '/learning/investing-allocation.svg',
          why: 'Whatever grew fastest becomes an oversized share of the total. Rebalancing trims it back and tops up what lagged.',
        },
        {
          id: 'inv-8-q8',
          question: 'Someone owns twenty companies, all in one industry. What is the problem?',
          options: [
            'Too many holdings to track',
            'They are concentrated — one industry shock hits all twenty at once',
            'Fees are higher',
            'Nothing, twenty is diversified',
          ],
          answer: 1,
          why: 'Diversification is about exposure, not the number of tickers. Twenty holdings that move together behave like one holding.',
        },
        {
          id: 'inv-8-q5',
          question: 'What does dollar-cost averaging mean?',
          options: [
            'Buying only when prices fall',
            'Investing a fixed amount at a fixed interval regardless of price',
            'Averaging your account fees',
            'Selling half your holdings each year',
          ],
          answer: 1,
          why: 'The amount is fixed, so the number of units bought varies with price — more when prices are low, fewer when they are high.',
        },
        {
          id: 'inv-8-q6',
          question: 'Why is trying to time the market difficult in practice?',
          options: [
            'Brokers block it',
            'It requires being right about when to leave and when to return',
            'It is taxed at 100%',
            'Markets are closed most of the year',
          ],
          answer: 1,
          why: 'Two correct calls are needed, not one. Being out during a handful of the strongest days is enough to undo years of otherwise ordinary results.',
        },
        {
          id: 'inv-8-q1',
          question: 'Why does avoiding large losses matter more than finding large wins?',
          options: [
            'Losses are taxed higher',
            'Recovering from a loss requires a larger percentage gain, and being wiped out ends the compounding',
            'Wins are guaranteed',
            'Brokers penalise losses',
          ],
          answer: 1,
          why: 'The maths is asymmetric and the consequence is final. Capital that is gone cannot compound, however good the next idea is.',
        },
        {
          id: 'inv-8-q2',
          question: 'Why does rebalancing inside a 401(k) or IRA differ from doing it in a taxable brokerage?',
          options: [
            'It is not allowed in a 401(k)',
            'Selling to rebalance in a taxable account can trigger a taxable gain',
            'Fees are higher in retirement accounts',
            'There is no difference',
          ],
          answer: 1,
          why: 'A sale in a taxable account is a taxable event. Inside a tax-advantaged account the same trade generally is not, which is why rebalancing is often done there.',
        },
        {
          id: 'inv-8-q3',
          question: 'Whether a Roth or a traditional account works out better depends mainly on what?',
          options: [
            'Which fund you buy',
            'Your tax rate now compared with your tax rate later',
            'The broker you use',
            'How often you trade',
          ],
          answer: 1,
          why: 'One is taxed going in and one coming out. The comparison is between the rate you pay now and the rate you expect then — a fact about you, not about markets.',
        },
        {
          id: 'inv-8-q4',
          question: 'What is the single idea this track keeps returning to?',
          options: [
            'Trade often to find the best entry',
            'You bought a piece of a business someone else runs, and businesses grow over years',
            'Higher risk always means higher return',
            'Fees do not matter at small balances',
          ],
          answer: 1,
          why: 'Everything else follows from it. The return depends on a real business growing, and that is measured in years rather than days.',
        },
      ],
    },
  ],
  action: {
    title: 'Write down your own investing plan',
    label: 'Your turn + goals',
    prompt:
      'Pick the archetype that sounds like you, set the share of your income that goes to investing, and record the plan behind it — the goal, the horizon and what you would do in a bad year — using the figures you already recorded in the earlier tracks.',
    // The six inputs used to be a lesson of their own, read and then set aside.
    // They are reference material for exactly this step, so they sit next to
    // the work rather than ten minutes behind it.
    brief: [
      {
        heading: 'The six inputs',
        bullets: [
          { term: 'The goal', text: 'What the money is for, and roughly how much it needs to be.' },
          { term: 'The time horizon', text: 'How many years until you need it. Each year’s return joins the base that earns the next year, so the number of years matters more than any single year’s result.' },
          { term: 'The savings rate', text: 'What you can add regularly. Saving more lowers the return you need; saving less raises it.' },
          { term: 'Risk tolerance', text: 'How large a fall you can watch without selling. A plan you abandon in a bad year was the wrong plan.' },
          { term: 'The required return', text: 'What annual return the goal, the horizon and the savings rate actually imply.' },
          { term: 'Inflation', text: 'Prices rise, so a return that does not beat inflation is a loss in what the money buys.' },
        ],
      },
      {
        divider: true,
        heading: 'Why the horizon does the heavy lifting',
        bullets: [
          { text: 'A long horizon leaves time to recover from a bad stretch, so a wider range of outcomes is survivable.' },
          { text: 'A short horizon does not. Money needed in two years cannot wait out a three-year drawdown.' },
          { term: 'The usual consequence', text: 'The closer a goal gets, the more people move that money toward things that move less.' },
        ],
      },
      {
        divider: true,
        heading: 'Risk tolerance is behavioural, not theoretical',
        body: 'The real test is not what you would accept on paper. It is what you actually do in the month your balance is down a third.',
      },
    ],
    tasks: [
      'Name the goal this money is for, and roughly what it needs to be worth.',
      'Write down the time horizon in years, and note whether that leaves room to recover from a bad stretch.',
      'Check where you currently sit on the ordering from lesson three, and note the rung you are on.',
      'Turn over the archetype cards and pick the one that honestly sounds like you, not the one that sounds impressive. Read what it says you are accepting.',
      'Look at the asset classes that archetype points at, and read the risk noted against each one.',
      'Set the share of your monthly income that goes to investing, alongside what is already committed to spending and savings.',
      'Write down, in advance, what you will do if the balance falls by a third — before it does.',
    ],
    doneWhen: 'Your archetype is chosen, your investing allocation is set from your own numbers, and the goal, horizon and bad-year rule are written down.',
  },
  finalQuiz: [],
}

// ─────────────────────────────────────────────────────────────────────────────
// Final quizzes for tracks that do not define their own
//
// Rather than invent new material, the final draws on the questions the track
// already taught, re-identified so review scheduling stays separate.
// ─────────────────────────────────────────────────────────────────────────────

function finalFromLessons(track: Track, count = 10): QuizQuestion[] {
  const pool = track.lessons.flatMap(l => l.questions)
  if (pool.length === 0) return []

  // Even spread across the track rather than the first N from lesson one.
  const step = pool.length / Math.min(count, pool.length)
  const picked: QuizQuestion[] = []
  for (let i = 0; picked.length < Math.min(count, pool.length); i++) {
    const q = pool[Math.floor(i * step)]
    if (q && !picked.includes(q)) picked.push(q)
  }
  return picked.map(q => ({ ...q, id: `${q.id}-final` }))
}

SPENDING.finalQuiz = finalFromLessons(SPENDING)
SAVINGS.finalQuiz = finalFromLessons(SAVINGS)
INVESTING.finalQuiz = finalFromLessons(INVESTING, 12)

// ─────────────────────────────────────────────────────────────────────────────

/** Tracks in the order they must be completed. The gate is strict. */
export const TRACKS: Track[] = [ACCOUNTS, SPENDING, SAVINGS, INVESTING]

export const TRACK_ORDER: TrackId[] = TRACKS.map(t => t.id)

export function getTrack(id: string): Track | undefined {
  return TRACKS.find(t => t.id === id)
}

/** Map an app route back to the track that unlocks it. */
export function trackForRoute(pathname: string): Track | undefined {
  return TRACKS.find(t => pathname.startsWith(t.unlocks))
}

/**
 * The subject of a title, without the explanatory tail after a colon or comma.
 * "Credit: what is being measured" → "Credit". Used where a title is a label
 * rather than a heading, such as the back button.
 */
export function shortTitle(title: string): string {
  return title.split(/[:,]/)[0].trim()
}

/** Lessons + the action step + the final quiz. */
export function totalSteps(track: Track): number {
  if (track.lessons.length === 0) return 0
  return track.lessons.length + (track.action ? 1 : 0) + (track.finalQuiz.length > 0 ? 1 : 0)
}

/** Minutes of reading, rounded up. */
export function readingMinutes(track: Track): number {
  const seconds = track.lessons.reduce((s, l) => s + l.readSeconds, 0)
  return Math.max(1, Math.round(seconds / 60))
}

/** How many correct answers the final quiz requires. */
export function passMark(track: Track): number {
  return Math.ceil(track.finalQuiz.length * PASS_THRESHOLD)
}

/**
 * Reference art by its src, across every track. Review pulls questions out of
 * their lesson, so it needs a way back to the picture a question points at.
 */
export function findLessonImage(src: string): LessonImage | undefined {
  for (const track of TRACKS) {
    for (const lesson of track.lessons) {
      const hit = lesson.images?.find(image => image.src === src)
      if (hit) return hit
    }
  }
  return undefined
}
