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
  /** A worked example, set apart from the explanation. */
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
  /** One-line framing shown above the content. */
  intro: string
  sections: LessonSection[]
  /** Shown in the right column. Absent until reference art exists. */
  images?: LessonImage[]
  questions: QuizQuestion[]
}

/** The single step where the learner works in the real tool. */
export interface ActionStep {
  title: string
  prompt: string
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
  blurb: 'Where your money sits, where your debt is owed, and how credit is measured.',
  unlocks: '/accounts',
  status: 'available',
  lessons: [
    {
      id: 'acc-1',
      title: 'What an account actually is',
      readSeconds: 30,
      intro: 'Every account you have falls on one of two sides. Getting that split right is what makes everything after it work.',
      sections: [
        {
          heading: 'The definition',
          body: 'An account is a record held by an institution showing what you own with them, or what you owe them.',
        },
        {
          heading: 'The two sides',
          bullets: [
            { term: 'Asset account', text: 'Holds money that belongs to you. The balance is what you have — checking, savings, brokerage, retirement.' },
            { term: 'Liability account', text: 'Records money you owe. The balance is what you still have to pay back — credit cards, student loans, auto loans, mortgages.' },
          ],
        },
        {
          heading: 'Why the split matters',
          bullets: [
            { text: 'Adding an asset balance to a debt balance produces a meaningless number.' },
            { text: 'The word "balance" means opposite things on each side.' },
            { text: 'One institution can hold both kinds for you at the same time.' },
          ],
        },
      ],
      images: [
        {
          src: '/learning/accounts-two-sides.svg',
          alt: 'Two columns side by side. On the left, asset accounts — checking, savings, brokerage, retirement — each with a positive balance. On the right, liability accounts — credit card, student loan, auto loan, mortgage — each with an amount owed.',
          caption: 'Assets on one side, liabilities on the other. The same word — balance — points in opposite directions.',
        },
      ],
      questions: [
        {
          id: 'acc-1-q1',
          question: 'A credit card account shows a balance of $840. What does that number represent?',
          options: ['Money available to you', 'Money you owe', 'Money already paid', 'Your credit limit'],
          answer: 1,
          imageSrc: '/learning/accounts-two-sides.svg',
          why: 'On a liability account the balance is the amount still owed. On an asset account the same word means the opposite — money you hold.',
        },
        {
          id: 'acc-1-q2',
          question: 'Which of these is an asset account?',
          options: ['Auto loan', 'Mortgage', 'Savings account', 'Store credit card'],
          answer: 2,
          why: 'A savings account holds money that belongs to you. The other three are records of money owed to a lender.',
        },
        {
          id: 'acc-1-q3',
          question: 'Can one institution hold both an asset account and a liability account for the same person?',
          options: ['No, never', 'Yes — a bank can hold your checking account and your credit card', 'Only at credit unions', 'Only for business accounts'],
          answer: 1,
          why: 'Institution and account type are separate things. One bank commonly holds several of each for the same person.',
        },
      ],
    },
    {
      id: 'acc-2',
      title: 'Account types, and why the type changes the rules',
      readSeconds: 60,
      intro: 'The type of an account decides how money moves in and out, what it costs, and what protections apply.',
      sections: [
        {
          heading: 'Accounts that hold cash',
          bullets: [
            { term: 'Checking', text: 'Built for movement. Money goes in and out often. Usually pays little or no interest.' },
            { term: 'Savings / money market', text: 'Built for holding. Typically pays interest and may limit certain withdrawals.' },
          ],
        },
        {
          heading: 'Accounts that record debt',
          bullets: [
            { term: 'Credit card', text: 'A revolving line. You borrow up to a limit, repay, and can borrow again. Interest applies to balances carried past the due date.' },
            { term: 'Instalment loan', text: 'A fixed amount borrowed once and repaid on a schedule — auto, student, personal, mortgage. The balance only goes down.' },
          ],
        },
        {
          heading: 'Accounts that hold investments',
          bullets: [
            { term: 'Brokerage', text: 'Holds securities rather than cash. Cash sitting in it is usually waiting to be invested or withdrawn.' },
            { term: 'Retirement', text: 'Adds rules about when money can be withdrawn and how it is taxed.' },
          ],
        },
        {
          divider: true,
          heading: 'The practical consequence',
          body: 'Withdrawal rules, fees, and tax treatment attach to the account type, not to the amount.',
        },
      ],
      images: [
        {
          src: '/learning/accounts-types.svg',
          alt: 'Six account types laid out as cards: checking, savings, brokerage, retirement, credit card and instalment loan, each with a note on how it behaves and which side it sits on.',
          caption: 'The type is what sets the rules — access, interest, and whether the balance is yours or owed.',
        },
      ],
      questions: [
        {
          id: 'acc-2-q1',
          question: 'What makes a credit card "revolving" rather than an instalment loan?',
          options: [
            'It has a higher interest rate',
            'You can borrow, repay, and borrow again up to a limit',
            'It is issued by a bank',
            'It is repaid monthly',
          ],
          answer: 1,
          why: 'Revolving means the borrowed amount can go back up after you repay. An instalment loan is borrowed once and the balance only decreases.',
        },
        {
          id: 'acc-2-q2',
          question: 'Which account type is designed to hold investments rather than cash?',
          options: ['Checking', 'Money market', 'Brokerage', 'Certificate of deposit'],
          answer: 2,
          why: 'A brokerage account holds securities. The cash sitting in it is usually just waiting to be invested or withdrawn.',
        },
        {
          id: 'acc-2-q3',
          question: 'Why does account type matter when you want to move money out?',
          options: [
            'It does not — money is money',
            'Type determines the rules, costs, and possible penalties on withdrawal',
            'Only the balance matters',
            'Only the institution matters',
          ],
          answer: 1,
          why: 'Withdrawal rules, fees, and tax treatment are attached to the account type, not to the amount.',
        },
      ],
    },
    {
      id: 'acc-3',
      title: 'Balances: what the number is telling you',
      readSeconds: 30,
      intro: 'The number on the screen is not always the money you can use. Banks report several balances and they rarely match.',
      sections: [
        {
          heading: 'The balances you will see',
          bullets: [
            { term: 'Current balance', text: 'Everything that has settled, including transactions that may not have cleared.' },
            { term: 'Available balance', text: 'What you can actually spend right now — current balance minus holds and pending charges.' },
            { term: 'Pending transactions', text: 'Charges authorised but not settled. They cut available balance before appearing in your history.' },
            { term: 'Statement balance', text: 'On a credit card, what you owed at the close of the billing cycle. Interest and reporting are usually based on it.' },
          ],
        },
      ],
      images: [
        {
          src: '/learning/accounts-balances.svg',
          alt: 'One account shown three ways: a current balance of $1,200, pending charges of $150 subtracted from it, an available balance of $1,050, and a separate statement balance of $840 from the last closing date.',
          caption: 'Current, less what is pending, gives available. The statement balance is a separate, older number.',
        },
      ],
      questions: [
        {
          id: 'acc-3-q1',
          question: 'Which balance tells you what you can spend right now?',
          options: ['Current balance', 'Available balance', 'Statement balance', 'Opening balance'],
          answer: 1,
          imageSrc: '/learning/accounts-balances.svg',
          why: 'Available balance already accounts for pending charges and holds. Current balance does not.',
        },
        {
          id: 'acc-3-q2',
          question: 'Why can a credit card statement balance differ from its current balance?',
          options: [
            'One is in a different currency',
            'The statement balance is a snapshot at the end of the billing cycle; charges since then are not in it',
            'They are always the same',
            'The statement balance excludes interest',
          ],
          answer: 1,
          imageSrc: '/learning/accounts-balances.svg',
          why: 'The statement balance is frozen at the cycle close. Anything you spend afterwards shows in the current balance but not the statement.',
        },
        {
          id: 'acc-3-q3',
          question: 'A pending charge has not settled. What has it already affected?',
          options: ['Nothing', 'Your available balance', 'Your credit score', 'Your statement balance'],
          answer: 1,
          imageSrc: '/learning/accounts-balances.svg',
          why: 'Pending charges reduce what you can spend immediately, even though they have not posted to your transaction history.',
        },
      ],
    },
    {
      id: 'acc-4',
      title: 'Credit: what is being measured',
      readSeconds: 60,
      intro: 'A credit score is a summary of a credit report. Knowing what feeds it is different from being told what to do about it.',
      sections: [
        {
          heading: 'What the report is',
          body: 'A record kept by credit bureaus of your accounts, balances, payment history, and inquiries. The score is calculated from it.',
        },
        {
          heading: 'What feeds the score',
          bullets: [
            { term: 'Payment history', text: 'Whether payments were made on time. Widely described as the largest single factor in common scoring models.' },
            { term: 'Credit utilisation', text: 'Balance divided by credit limit on revolving accounts. A $300 balance on a $1,000 limit is 30%.' },
            { term: 'Length of history', text: 'How long accounts have been open. Closing an old account changes this.' },
            { term: 'Inquiries', text: 'A hard inquiry is recorded when you apply for credit. Checking your own score is a soft inquiry and is not.' },
          ],
        },
        {
          divider: true,
          heading: 'What a score is not',
          bullets: [
            { text: 'Not a measure of income, savings, or net worth — none of that is in the report.' },
            { text: 'Not universal. Someone with no borrowing history may have no score at all.' },
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
      title: 'Net worth: putting the two sides together',
      readSeconds: 30,
      intro: 'One number, and it only means anything because of the four steps before it.',
      sections: [
        {
          heading: 'The formula',
          body: 'Everything you own, minus everything you owe. That is the whole calculation.',
        },
        {
          heading: 'How to read it',
          bullets: [
            { term: 'It can be negative', text: 'Common, and a description rather than a verdict. A mortgage or student loans early on will often produce one.' },
            { term: 'It is a snapshot', text: 'It describes one moment. Direction over time carries more information than any single reading.' },
            { term: 'It hides cash flow', text: 'A high net worth with no accessible cash is a different situation from the same number sitting in savings.' },
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
      id: 'acc-f2',
      question: 'Your credit card shows a current balance of $1,120 and a statement balance of $780. What explains the gap?',
      options: [
        'Interest has been added',
        'You have spent $340 since the billing cycle closed',
        'The bank made an error',
        'The statement balance excludes fees',
      ],
      answer: 1,
      why: 'The statement balance is frozen at the cycle close. Spending after that date shows in the current balance only.',
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
      id: 'acc-f8',
      question: 'Your bank app shows $900 current and $610 available. What accounts for the difference?',
      options: [
        'Interest not yet paid',
        'Pending charges and holds',
        'A monthly fee',
        'Money in a different account',
      ],
      answer: 1,
      why: 'Available balance subtracts pending charges and holds from the current balance. That gap is money already committed.',
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

// ─────────────────────────────────────────────────────────────────────────────
// 2. SPENDING
// ─────────────────────────────────────────────────────────────────────────────

const SPENDING: Track = {
  id: 'spending',
  title: 'Spending',
  outcome: 'You can say where your money actually went last month, and whether more came in than went out.',
  blurb: 'Income, fixed and variable costs, subscription drift, and cash flow.',
  unlocks: '/spending',
  status: 'available',
  lessons: [
    {
      id: 'spd-intro',
      title: 'Where money comes from',
      readSeconds: 60,
      intro: 'There are three repeatable ways to increase what you have. Everything else in this app is about what happens to that money once it arrives.',
      sections: [
        {
          heading: 'The three',
          bullets: [
            { term: 'Career', text: 'Selling your time and skill to someone who owns the business. It starts your money.' },
            { term: 'Business', text: 'Owning the thing that does the selling. It increases your money.' },
            { term: 'Investing', text: 'Owning a slice of something someone else runs. It grows your money.' },
          ],
        },
        {
          heading: 'What each one asks of you',
          table: {
            columns: ['', 'Strongest for', 'Costs you'],
            rows: [
              [
                'Career',
                'Reliability. Pay arrives on a schedule, often with benefits like a 401(k) match.',
                'The hours themselves, and a ceiling someone else sets. Raises and bonuses move that ceiling; they do not remove it.',
              ],
              [
                'Business',
                'Ceiling. Ownership has no fixed cap on what it can return.',
                'The highest failure rate of the three, plus your money and time up front.',
              ],
              [
                'Investing',
                'Time. Money can grow without your hours going into it.',
                'The slowest of the three, and no return is guaranteed.',
              ],
            ],
          },
        },
        {
          divider: true,
          heading: 'One axis, three positions',
          body: 'All three are really a question of how much you own. A career rents your time to someone who owns; a business is owning the thing outright; investing is owning a slice of what someone else runs. Most people move along that line in order, because a career is usually what funds the other two.',
        },
        {
          body: 'This app is about managing and growing money once it reaches you, so it does not teach you how to pick a career or start a business. Investing gets its own track later.',
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
      id: 'spd-1',
      title: 'Income: the number most people get wrong',
      readSeconds: 30,
      intro: 'The figure worth planning around is what lands in your account, not what you are paid on paper.',
      sections: [
        {
          heading: 'Two different numbers',
          bullets: [
            { term: 'Gross income', text: 'Total pay before anything is taken out. The number in a job offer.' },
            { term: 'Net income', text: 'What arrives after taxes, insurance, and other deductions. The money you can actually move.' },
          ],
        },
        {
          heading: 'What people leave out',
          bullets: [
            { text: 'Side work, interest, benefits, and irregular payments all count.' },
            { text: 'Variable or seasonal income is usually described by its low months, because the low months are the constraint.' },
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
      id: 'spd-2',
      title: 'Fixed costs: the part that is already decided',
      readSeconds: 30,
      intro: 'Fixed costs arrive whether or not you think about them. They set the floor of what any month costs.',
      sections: [
        {
          heading: 'What counts as fixed',
          body: 'Roughly the same amount, on a schedule — rent or mortgage, insurance, loan payments, phone, steady utilities.',
        },
        {
          heading: 'Why they sit apart',
          bullets: [
            { text: 'They are not decisions you make each month.' },
            { term: 'Fixed is not permanent', text: 'Changing one takes a deliberate decision and usually notice — moving, refinancing, switching plans.' },
            { term: 'They are the floor', text: 'Income below your fixed total cannot be resolved by spending more carefully.' },
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
      title: 'Variable spending: where the money actually goes',
      readSeconds: 30,
      intro: 'This is where the gap between what people think they spend and what they spend usually lives.',
      sections: [
        {
          heading: 'What makes it variable',
          body: 'The amount changes with choices you make during the month — groceries, dining, transport, shopping, entertainment.',
        },
        {
          heading: 'Why categories matter',
          bullets: [
            { text: 'Fifty individual charges tell you nothing. Four category totals tell you a lot.' },
            { term: 'The estimate gap', text: 'Recalled spending is commonly well below the real total, because small frequent charges are easiest to forget.' },
            { term: 'Frequency beats size', text: 'One $200 charge is easy to notice. Twenty $10 charges are the same money and much harder to see.' },
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
      id: 'spd-4',
      title: 'Subscriptions and the drift problem',
      readSeconds: 30,
      intro: 'Recurring charges are structurally different: they were decided once and then continue without any further decision.',
      sections: [
        {
          heading: 'How drift happens',
          bullets: [
            { text: 'Starting a subscription is a decision. Continuing one is not.' },
            { text: 'The total rises without anything being actively chosen.' },
            { term: 'Trials', text: 'Free trials generally convert automatically. The charge appears without further action.' },
          ],
        },
        {
          heading: 'Seeing the real number',
          bullets: [
            { term: 'Annual framing', text: 'A monthly price times twelve is the actual commitment. $14/month is $168/year.' },
            { term: 'They are scattered', text: 'Spread across cards and app stores, which is why a full list rarely exists until someone builds it.' },
          ],
        },
      ],
      images: [
        {
          src: '/learning/spending-subscriptions.svg',
          alt: 'Five subscriptions listed with their monthly and annual cost side by side, totalling $76.96 a month and $923.52 a year.',
          caption: 'Each subscription is priced to be ignorable monthly. The annual column is the one that is hard to ignore.',
        },
      ],
      questions: [
        {
          id: 'spd-4-q1',
          question: 'A subscription costs $12.99 a month. What is the annual commitment?',
          options: ['$129.90', '$155.88', '$142.89', '$168.00'],
          answer: 1,
          why: '12.99 × 12 = 155.88. Monthly pricing makes recurring costs feel smaller than the yearly figure they represent.',
        },
        {
          id: 'spd-4-q2',
          question: 'Why do subscription totals tend to rise over time?',
          options: [
            'Prices always increase',
            'Starting one is a decision; continuing one is not',
            'Banks add fees',
            'They are usually annual',
          ],
          answer: 1,
          why: 'Nothing prompts a re-decision. The charge repeats by default, so the total only moves one way unless someone reviews it.',
        },
        {
          id: 'spd-4-q3',
          question: 'What typically happens at the end of a free trial?',
          options: [
            'It cancels automatically',
            'It converts to a paid subscription unless cancelled',
            'You are asked to confirm',
            'It pauses',
          ],
          answer: 1,
          why: 'Trials generally convert by default. The absence of a decision is what produces the charge.',
        },
      ],
    },
    {
      id: 'spd-5',
      title: 'Cash flow: the number that decides everything else',
      readSeconds: 30,
      intro: 'Income minus everything going out. It determines whether saving or investing is even possible yet.',
      sections: [
        {
          heading: 'The calculation',
          body: 'Income minus fixed costs, variable spending, and recurring charges, over one month.',
        },
        {
          heading: 'Reading the result',
          bullets: [
            { term: 'Positive', text: 'More arrived than left. The surplus is the only money available for anything else.' },
            { term: 'Negative', text: 'The gap is being covered by savings or borrowing, whether or not that was intended.' },
            { term: 'Order of operations', text: 'Saving out of a deficit moves money without creating any. The surplus is the actual source.' },
          ],
        },
        {
          divider: true,
          heading: 'A limit is a boundary, not a plan',
          body: 'A spending limit is a threshold you set for yourself so overspending becomes visible while the month is still running.',
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
      'Record every fixed cost that arrives on a schedule.',
      'Before you look: guess your three biggest variable categories. Then record the real totals and compare.',
      'Check every card and your phone’s subscription settings, and record each recurring charge.',
      'Read your net cash flow, then set a monthly spending limit you chose deliberately.',
    ],
    doneWhen: 'Your recorded income and outgoings match what your statements show, and you have seen your own cash flow figure.',
  },
  finalQuiz: [],
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SAVINGS
// ─────────────────────────────────────────────────────────────────────────────

const SAVINGS: Track = {
  id: 'savings',
  title: 'Savings',
  outcome: 'You can explain what each pool of your savings is for, and how much of your surplus is going to it.',
  blurb: 'Separating savings from spending, emergency funds, named goals, and how interest works.',
  unlocks: '/savings',
  status: 'available',
  lessons: [
    {
      id: 'sav-1',
      title: 'Why savings has to be separate',
      readSeconds: 30,
      intro: 'Money left in a spending account is not saved — it is unspent. The difference is structural.',
      sections: [
        {
          heading: 'Unspent versus saved',
          bullets: [
            { text: 'A surplus sitting in checking is available for anything, and usually gets used.' },
            { term: 'Friction', text: 'Moving money to a separate account adds a step before it can be spent. That step does most of the work.' },
            { term: 'Purpose', text: 'Savings with a name and a target behaves differently, because spending it means visibly taking from something.' },
          ],
        },
        {
          divider: true,
          heading: 'Timing changes the amount',
          body: 'Money separated when income arrives is not competing with the month’s spending. Money separated at month end is whatever survived.',
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
      title: 'The emergency fund',
      readSeconds: 60,
      intro: 'It exists to absorb unexpected costs without borrowing. Its defining feature is availability, not returns.',
      sections: [
        {
          heading: 'What it covers',
          body: 'Unpredictable, unavoidable costs — a job loss, a medical bill, a car repair. Not planned expenses that are simply infrequent.',
        },
        {
          heading: 'How it is usually sized',
          bullets: [
            { term: 'The common range', text: 'Three to six months of essential expenses is widely cited. It is a convention, not a rule.' },
            { term: 'Based on essentials', text: 'Sized against fixed costs rather than total income.' },
            { term: 'Liquidity first', text: 'It has to be reachable quickly. A fund locked in something hard to access is not doing the job.' },
          ],
        },
        {
          divider: true,
          heading: 'Why it comes up early',
          bullets: [
            { text: 'Without it, an unexpected cost is typically covered by credit, turning a one-time event into an ongoing balance.' },
            { text: 'A partial fund still absorbs partial shocks. Zero to something is the largest step in the range.' },
          ],
        },
      ],
      images: [
        {
          src: '/learning/savings-emergency-fund.svg',
          alt: 'Six month-blocks in a row with the first three filled, above essential monthly costs of $1,880 and a balance of $5,640.',
          caption: 'The unit is months of your own essential costs, which is why a dollar figure on its own says nothing.',
        },
      ],
      questions: [
        {
          id: 'sav-2-q1',
          question: 'The common three-to-six-month guideline is based on what?',
          options: ['Gross income', 'Essential monthly expenses', 'Net worth', 'Total debt'],
          answer: 1,
          imageSrc: '/learning/savings-emergency-fund.svg',
          why: 'The fund needs to cover what you must pay, not what you normally earn or spend. Essential costs are the relevant base.',
        },
        {
          id: 'sav-2-q2',
          question: 'What is the most important property of where an emergency fund is held?',
          options: ['Highest possible return', 'Tax advantages', 'Quick accessibility', 'Long-term growth'],
          answer: 2,
          why: 'The fund exists to be reached at short notice. Anything that delays access undermines its only function.',
        },
        {
          id: 'sav-2-q3',
          question: 'Which is NOT what an emergency fund is for?',
          options: [
            'An unexpected car repair',
            'A gap in income after job loss',
            'An annual insurance premium you know is coming',
            'An urgent medical bill',
          ],
          answer: 2,
          why: 'A known, scheduled cost is predictable. It is a planning item, not an emergency — that is what a sinking fund handles.',
        },
      ],
    },
    {
      id: 'sav-3',
      title: 'Sinking funds: planning for the predictable',
      readSeconds: 30,
      intro: 'A sinking fund converts an irregular expense into a regular one.',
      sections: [
        {
          heading: 'The mechanic',
          body: 'Divide the known cost by the months until it is due. That figure becomes a monthly amount instead of a sudden one.',
        },
        {
          heading: 'How it differs from an emergency fund',
          bullets: [
            { text: 'Emergencies are unpredictable. These costs are known in advance.' },
            { text: 'They only feel like emergencies because nothing was set aside.' },
            { term: 'Separate targets', text: 'Distinct funds stop one goal from quietly consuming another.' },
          ],
        },
      ],
      images: [
        {
          src: '/learning/savings-sinking-funds.svg',
          alt: 'Four sinking funds — car insurance, holiday travel, car maintenance and annual renewals — each with a target, a due date, a progress bar and a monthly amount, adding to $320 a month.',
          caption: 'A known cost divided by the months until it lands. None of these are emergencies.',
        },
      ],
      questions: [
        {
          id: 'sav-3-q1',
          question: 'A $1,400 expense is due in 7 months. What is the monthly sinking amount?',
          options: ['$140', '$175', '$200', '$233'],
          answer: 2,
          why: '1,400 ÷ 7 = 200. Dividing the known cost by the months available is the whole calculation.',
        },
        {
          id: 'sav-3-q2',
          question: 'What separates a sinking fund from an emergency fund?',
          options: [
            'The amount saved',
            'A sinking fund is for known, scheduled costs',
            'The interest rate',
            'Where it is held',
          ],
          answer: 1,
          why: 'Predictability is the distinction. A known cost can be divided across months; an unpredictable one cannot.',
        },
      ],
    },
    {
      id: 'sav-4',
      title: 'Interest and compounding, mechanically',
      readSeconds: 60,
      intro: 'Interest is the cost of money over time. It works identically whether it is paid to you or by you.',
      sections: [
        {
          heading: 'The vocabulary',
          bullets: [
            { term: 'Interest rate', text: 'A percentage applied to a balance over a period. On savings you receive it; on debt you pay it.' },
            { term: 'APY', text: 'Includes the effect of compounding, so it reflects what a year actually produces.' },
            { term: 'APR', text: 'The annualised rate before compounding effects are counted.' },
          ],
        },
        {
          heading: 'How compounding works',
          bullets: [
            { text: 'Interest is calculated on a balance that already includes past interest.' },
            { text: 'The base grows, so each period adds slightly more than the last.' },
            { term: 'Frequency matters', text: 'The same nominal rate compounded monthly produces more than compounded annually.' },
          ],
        },
        {
          divider: true,
          heading: 'It runs both ways',
          body: 'Carried credit card balances compound too. The same mechanism that grows savings grows debt.',
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
          id: 'sav-4-q1',
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
          id: 'sav-4-q2',
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
          id: 'sav-4-q3',
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
    {
      id: 'sav-5',
      title: 'Allocation: deciding before the month starts',
      readSeconds: 30,
      intro: 'Choosing what share of your surplus goes to savings in advance, rather than saving whatever remains.',
      sections: [
        {
          heading: 'Pay yourself first',
          body: 'Moving the savings amount when income arrives, before the month’s spending competes for it.',
        },
        {
          heading: 'Percentage or fixed amount',
          bullets: [
            { term: 'Percentage', text: 'Scales with irregular income — down in low months, up in high ones.' },
            { term: 'Fixed amount', text: 'Predictable, but can strain a low month.' },
            { term: 'Splitting', text: 'A surplus can be divided across several targets. The split is your decision.' },
          ],
        },
        {
          divider: true,
          heading: 'What "save what is left" actually produces',
          body: 'The amount is set by whatever the month happened to cost — which is to say, not decided at all.',
        },
      ],
      images: [
        {
          src: '/learning/savings-allocation.svg',
          alt: 'A single bar of $2,734 take-home split into fixed costs at 69 per cent, savings and sinking funds at 12 per cent, and variable spending at 19 per cent.',
          caption: 'Every dollar given a destination on day one. The percentages are illustrative, not recommended.',
        },
      ],
      questions: [
        {
          id: 'sav-5-q1',
          question: 'What does "pay yourself first" describe mechanically?',
          options: [
            'Spending on yourself before bills',
            'Moving savings out when income arrives, before spending',
            'Paying debts first',
            'Saving whatever remains at month end',
          ],
          answer: 1,
          why: 'It is about sequence. Separating the money first removes it from competition with the month’s spending.',
        },
        {
          id: 'sav-5-q2',
          question: 'Why does a percentage suit irregular income better than a fixed amount?',
          options: [
            'It is always larger',
            'It scales down automatically in low months and up in high ones',
            'Banks prefer it',
            'It compounds faster',
          ],
          answer: 1,
          why: 'A percentage adjusts to what actually arrived. A fixed amount stays the same regardless of whether the month supported it.',
        },
        {
          id: 'sav-5-q3',
          question: 'What determines how much gets saved under a "save what is left" approach?',
          options: [
            'A deliberate decision',
            'Whatever the month happened to cost',
            'Your income',
            'Your goals',
          ],
          answer: 1,
          why: 'The amount is a residual. It is an outcome of spending rather than a choice about saving.',
        },
      ],
    },
  ],
  action: {
    title: 'Build your own savings structure',
    prompt:
      'Turn the theory into named pools with real targets, sized from the numbers you recorded in the Spending track.',
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
// 4. INVESTING — content pending
// ─────────────────────────────────────────────────────────────────────────────

const INVESTING: Track = {
  id: 'investing',
  title: 'Investing',
  outcome: 'You can read your own positions and explain what you hold and why the value moves.',
  blurb: 'Account types versus assets, diversification, fees, risk, and time horizon.',
  unlocks: '/investing',
  status: 'coming-soon',
  lessons: [],
  action: null,
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
