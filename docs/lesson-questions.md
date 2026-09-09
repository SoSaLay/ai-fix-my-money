# Lesson questions

The multiple-choice questions shown inside the lessons, one JSON block per lesson.
Generated from `src/lib/learning/tracks.ts` — that file is the source of truth, this
is a readable copy of it.

Final quizzes are not included. Three of the four tracks build their final quiz by
re-sampling these same lesson questions at run time (`finalFromLessons`), so a change
here changes those finals too.

In each block, `answer` is the zero-based index into `options` and `correctAnswer`
spells out the same option. `why` is the explanation revealed after answering, right
or wrong. `imageSrc`, where present, is the lesson diagram repeated beside the
question. `id` is what the spaced-review queue stores.

**4 tracks · 17 lessons · 74 questions**

## Contents

- [Accounts](#accounts) — 4 lessons, 16 questions
- [Income vs. Spending](#income-vs-spending) — 5 lessons, 19 questions
- [Savings](#savings) — 3 lessons, 10 questions
- [Investing](#investing) — 5 lessons, 29 questions

---

## Accounts

`accounts` · unlocks `/accounts` · 4 lessons · 16 questions

> You can name every account that holds your money or your debt, and say what each one is for.

### Account definition

`acc-1` · 30s read · 2 questions

```json
{
  "lessonId": "acc-1",
  "lessonTitle": "Account definition",
  "questions": [
    {
      "id": "acc-1-q1",
      "question": "What is an account, as defined here?",
      "options": [
        "A budget you set for yourself",
        "A record held by an institution of what you own with them, or what you owe them",
        "The limit on what you are allowed to spend",
        "Your credit score"
      ],
      "answer": 1,
      "correctAnswer": "A record held by an institution of what you own with them, or what you owe them",
      "why": "An account is a record held by an institution. Every number you enter on this platform comes off one of them."
    },
    {
      "id": "acc-1-q2",
      "question": "Every account falls into one of two groups. Which pair?",
      "options": [
        "Asset and liability",
        "Fixed and variable",
        "Income and expense",
        "Short-term and long-term"
      ],
      "answer": 0,
      "correctAnswer": "Asset and liability",
      "why": "An asset account holds money that belongs to you. A liability account records money you owe. There is no third kind."
    }
  ]
}
```

### Account types

`acc-2` · 60s read · 6 questions

```json
{
  "lessonId": "acc-2",
  "lessonTitle": "Account types",
  "questions": [
    {
      "id": "acc-2-q1",
      "question": "A credit card account shows a balance of $840. What does that number represent?",
      "options": [
        "Money available to you",
        "Money you owe",
        "Money already paid",
        "Your credit limit"
      ],
      "answer": 1,
      "correctAnswer": "Money you owe",
      "why": "On a liability account the balance is the amount still owed. On an asset account the same word means the opposite — money you hold."
    },
    {
      "id": "acc-2-q2",
      "question": "Which of these is an asset account?",
      "options": [
        "Auto loan",
        "Mortgage",
        "Money market",
        "Store credit card"
      ],
      "answer": 2,
      "correctAnswer": "Money market",
      "why": "A money market account holds money that belongs to you. The other three are records of money owed to a lender."
    },
    {
      "id": "acc-2-q3",
      "question": "Which retirement account is sponsored by an employer?",
      "options": [
        "IRA",
        "Brokerage account",
        "401(k)",
        "High-yield savings account"
      ],
      "answer": 2,
      "correctAnswer": "401(k)",
      "why": "A 401(k) is sponsored by an employer, who often contributes alongside you. An IRA is the retirement account held in your own name instead."
    },
    {
      "id": "acc-2-q4",
      "question": "Which liability lets you borrow again after you have repaid it?",
      "options": [
        "Credit card",
        "Auto loan",
        "Student loan",
        "Mortgage"
      ],
      "answer": 0,
      "correctAnswer": "Credit card",
      "why": "A credit card revolves — the amount available goes back up as you repay. The other three are borrowed once and the balance only goes down."
    },
    {
      "id": "acc-2-q5",
      "question": "Two accounts hold $5,000 each: a checking account and a certificate of deposit. What differs?",
      "options": [
        "Nothing — the amount is the same",
        "The rules on getting the money out, which come with the account type",
        "Only the institution",
        "Only the interest rate"
      ],
      "answer": 1,
      "correctAnswer": "The rules on getting the money out, which come with the account type",
      "why": "Access, fees, and tax treatment attach to the type of account, not to the amount in it. The CD is locked for a term; the checking account is not."
    },
    {
      "id": "acc-2-q6",
      "question": "What backs an auto loan that does not back a personal loan?",
      "options": [
        "Your income",
        "The car itself",
        "Your credit score",
        "Nothing"
      ],
      "answer": 1,
      "correctAnswer": "The car itself",
      "why": "The car secures the loan, which is why the rate is usually lower. A personal loan has nothing behind it, so it typically costs more to borrow."
    }
  ]
}
```

### Credit

`acc-4` · 60s read · 6 questions

```json
{
  "lessonId": "acc-4",
  "lessonTitle": "Credit",
  "questions": [
    {
      "id": "acc-4-q1",
      "question": "You owe $450 on a card with a $1,500 limit. What is your utilisation on that card?",
      "options": [
        "4.5%",
        "30%",
        "45%",
        "15%"
      ],
      "answer": 1,
      "correctAnswer": "30%",
      "imageSrc": "/learning/accounts-utilisation.svg",
      "why": "450 ÷ 1500 = 0.30, so 30%. Utilisation is always balance divided by limit, not balance divided by income or spending."
    },
    {
      "id": "acc-4-q2",
      "question": "Which of these creates a hard inquiry on your credit report?",
      "options": [
        "Checking your own score",
        "Applying for a new credit card",
        "Paying a card off",
        "Logging into your bank"
      ],
      "answer": 1,
      "correctAnswer": "Applying for a new credit card",
      "why": "Applying for credit produces a hard inquiry. Checking your own report is a soft inquiry and is not recorded the same way."
    },
    {
      "id": "acc-4-q3",
      "question": "What does a credit score directly measure?",
      "options": [
        "How much money you have",
        "Your income",
        "Information in your credit report about borrowing and repayment",
        "Your net worth"
      ],
      "answer": 2,
      "correctAnswer": "Information in your credit report about borrowing and repayment",
      "why": "The score is calculated only from credit report data. Income, savings, and assets are not in the report."
    },
    {
      "id": "acc-4-q4",
      "question": "Someone has never borrowed money. What is the likely state of their credit score?",
      "options": [
        "Perfect",
        "Zero",
        "They may have no score at all",
        "Average"
      ],
      "answer": 2,
      "correctAnswer": "They may have no score at all",
      "why": "Scoring models need a history to score. With no credit accounts there may be nothing to calculate from."
    },
    {
      "id": "acc-4-q5",
      "question": "Which balance do you pay in full to avoid being charged interest?",
      "options": [
        "The current balance",
        "The statement balance from the last cycle close",
        "The minimum payment",
        "Whatever keeps you under 30% utilisation"
      ],
      "answer": 1,
      "correctAnswer": "The statement balance from the last cycle close",
      "why": "The statement balance is what you owed when the cycle closed, and paying it in full by the due date is what avoids interest. The current balance also includes charges from the new cycle, which are not due yet."
    },
    {
      "id": "acc-4-q6",
      "question": "Which factor carries the most weight in a credit score?",
      "options": [
        "Payment history",
        "Credit utilisation",
        "Length of history",
        "Inquiries"
      ],
      "answer": 0,
      "correctAnswer": "Payment history",
      "why": "Paying on time is the largest single factor. The other three matter, but none of them moves the score the way a missed payment does."
    }
  ]
}
```

### Net worth

`acc-5` · 30s read · 2 questions

```json
{
  "lessonId": "acc-5",
  "lessonTitle": "Net worth",
  "questions": [
    {
      "id": "acc-5-q1",
      "question": "You have $4,000 across your accounts and owe $9,500. What is your net worth?",
      "options": [
        "$13,500",
        "−$5,500",
        "$5,500",
        "−$9,500"
      ],
      "answer": 1,
      "correctAnswer": "−$5,500",
      "imageSrc": "/learning/accounts-net-worth.svg",
      "why": "4,000 − 9,500 = −5,500. Negative net worth simply means recorded debts currently exceed recorded assets."
    },
    {
      "id": "acc-5-q2",
      "question": "What does net worth NOT tell you?",
      "options": [
        "What you own",
        "What you owe",
        "Whether you can cover this month’s bills",
        "The difference between the two"
      ],
      "answer": 2,
      "correctAnswer": "Whether you can cover this month’s bills",
      "why": "Net worth is a stock measure. Covering monthly bills is about cash flow, which is a different measurement entirely."
    }
  ]
}
```

---

## Income vs. Spending

`spending` · unlocks `/spending` · 5 lessons · 19 questions

> You can say where your money actually went last month, and whether more came in than went out.

### Income

`spd-1` · 30s read · 3 questions

```json
{
  "lessonId": "spd-1",
  "lessonTitle": "Income",
  "questions": [
    {
      "id": "spd-1-q1",
      "question": "Which figure describes money that has actually reached your account?",
      "options": [
        "Gross income",
        "Net income",
        "Annual salary",
        "Base pay"
      ],
      "answer": 1,
      "correctAnswer": "Net income",
      "imageSrc": "/learning/spending-gross-net.svg",
      "why": "Net income is what remains after deductions. It is the only figure you can actually spend or move."
    },
    {
      "id": "spd-1-q2",
      "question": "Why do deductions make gross income a poor planning number?",
      "options": [
        "Gross income changes monthly",
        "Deductions can remove a substantial share before the money arrives",
        "Gross income is taxed twice",
        "It is not — gross is more accurate"
      ],
      "answer": 1,
      "correctAnswer": "Deductions can remove a substantial share before the money arrives",
      "why": "Taxes and withholdings can take a large fraction of gross pay. Planning against gross assumes money you never receive."
    },
    {
      "id": "spd-1-q3",
      "question": "Which of these counts as income?",
      "options": [
        "Transferring $200 from savings into checking",
        "Interest paid into your savings account",
        "An increase in your credit card limit",
        "A charge you put on your credit card"
      ],
      "answer": 1,
      "correctAnswer": "Interest paid into your savings account",
      "why": "Income is money you receive. Interest and dividends are on that list alongside pay, tips and side work — moving your own money between accounts is not, and neither is being allowed to borrow more."
    }
  ]
}
```

### Increasing income

`spd-intro` · 60s read · 4 questions

```json
{
  "lessonId": "spd-intro",
  "lessonTitle": "Increasing income",
  "questions": [
    {
      "id": "spd-intro-q1",
      "question": "Which of the three is described as the one that starts your money?",
      "options": [
        "Business",
        "Career",
        "Investing",
        "Saving"
      ],
      "answer": 1,
      "correctAnswer": "Career",
      "imageSrc": "/learning/spending-three-ways.svg",
      "why": "A career is what most people begin with, and it is usually what funds the other two. Its strength is reliability, not ceiling."
    },
    {
      "id": "spd-intro-q2",
      "question": "What is the tradeoff that comes with a business rather than a career?",
      "options": [
        "It always pays more, with no added risk",
        "A higher ceiling, but the highest failure rate of the three",
        "A lower ceiling, but far more reliable income",
        "It grows without any time or money going in"
      ],
      "answer": 1,
      "correctAnswer": "A higher ceiling, but the highest failure rate of the three",
      "imageSrc": "/learning/spending-three-ways.svg",
      "why": "Ownership removes the cap on what you can earn and removes the guarantee at the same time. Most small businesses do not survive; that risk is the price of the ceiling."
    },
    {
      "id": "spd-intro-q3",
      "question": "What single idea connects all three?",
      "options": [
        "How much tax each one attracts",
        "How much of the thing you own",
        "How many hours each one takes",
        "How soon each one pays out"
      ],
      "answer": 1,
      "correctAnswer": "How much of the thing you own",
      "why": "Career, business and investing are three positions on one axis. Owning more raises what you can earn and raises what you can lose."
    },
    {
      "id": "spd-intro-q4",
      "question": "What does the table give as the cost of investing?",
      "options": [
        "More hours than a career takes",
        "The slowest of the three, and nothing is guaranteed",
        "A lower ceiling than a career",
        "You have to own a business first"
      ],
      "answer": 1,
      "correctAnswer": "The slowest of the three, and nothing is guaranteed",
      "why": "Investing grows money without your hours, which is its strength. Time and the absence of any guarantee are what you pay for it."
    }
  ]
}
```

### Fixed costs

`spd-2` · 60s read · 4 questions

```json
{
  "lessonId": "spd-2",
  "lessonTitle": "Fixed costs",
  "questions": [
    {
      "id": "spd-2-q1",
      "question": "Which is a fixed cost?",
      "options": [
        "Groceries",
        "Car insurance premium",
        "Eating out",
        "Petrol"
      ],
      "answer": 1,
      "correctAnswer": "Car insurance premium",
      "why": "An insurance premium arrives on a schedule at a set amount. The others change with what you do that month."
    },
    {
      "id": "spd-2-q2",
      "question": "What does the total of your fixed costs tell you?",
      "options": [
        "How much you can save",
        "The minimum a month costs you before any choices",
        "Your net worth",
        "Your credit utilisation"
      ],
      "answer": 1,
      "correctAnswer": "The minimum a month costs you before any choices",
      "why": "Fixed costs are the floor. They arrive regardless of how carefully you spend on everything else."
    },
    {
      "id": "spd-2-q3",
      "question": "Does \"fixed\" mean the cost can never change?",
      "options": [
        "Yes, it is locked permanently",
        "No — it means changing it takes a deliberate decision, not a monthly one",
        "Only for rent",
        "Only for loans"
      ],
      "answer": 1,
      "correctAnswer": "No — it means changing it takes a deliberate decision, not a monthly one",
      "why": "Fixed describes the rhythm, not permanence. These costs change through decisions like moving or switching providers."
    },
    {
      "id": "spd-2-q4",
      "question": "A subscription costs $12.99 a month. What is the annual commitment?",
      "options": [
        "$129.90",
        "$155.88",
        "$142.89",
        "$168.00"
      ],
      "answer": 1,
      "correctAnswer": "$155.88",
      "why": "12.99 × 12 = 155.88. Monthly pricing makes recurring costs feel smaller than the yearly figure they actually represent."
    }
  ]
}
```

### Variable spending

`spd-3` · 60s read · 4 questions

```json
{
  "lessonId": "spd-3",
  "lessonTitle": "Variable spending",
  "questions": [
    {
      "id": "spd-3-q1",
      "question": "Why group spending into categories rather than listing transactions?",
      "options": [
        "It looks better",
        "Category totals reveal patterns that individual charges hide",
        "Banks require it",
        "It reduces the number of transactions"
      ],
      "answer": 1,
      "correctAnswer": "Category totals reveal patterns that individual charges hide",
      "why": "A pattern is only visible in aggregate. Individual charges each look reasonable in isolation — that is why they are hard to notice."
    },
    {
      "id": "spd-3-q2",
      "question": "Which spending is hardest to notice accurately?",
      "options": [
        "A single large annual charge",
        "Rent",
        "Many small frequent charges",
        "A car payment"
      ],
      "answer": 2,
      "correctAnswer": "Many small frequent charges",
      "why": "Small frequent charges are individually forgettable and collectively large. Size makes something memorable; frequency does not."
    },
    {
      "id": "spd-3-q3",
      "question": "What separates a variable cost from a fixed one?",
      "options": [
        "The amount",
        "Whether it changes with your choices during the month",
        "Which account it comes from",
        "Whether it is essential"
      ],
      "answer": 1,
      "correctAnswer": "Whether it changes with your choices during the month",
      "why": "Variability, not size or necessity, is the dividing line. Groceries are essential and still variable."
    },
    {
      "id": "spd-3-q4",
      "question": "Each purchase in a category is small, but the category total is large. What does that tell you to look at?",
      "options": [
        "The size of each purchase",
        "How often you buy, since the total comes from the count",
        "Which account the charges came from",
        "Nothing — small purchases cannot add up"
      ],
      "answer": 1,
      "correctAnswer": "How often you buy, since the total comes from the count",
      "why": "The total is the amount multiplied by the count. Where each purchase is already small, the count is the part with room to move."
    }
  ]
}
```

### Cash flow

`spd-5` · 30s read · 4 questions

```json
{
  "lessonId": "spd-5",
  "lessonTitle": "Cash flow",
  "questions": [
    {
      "id": "spd-5-q1",
      "question": "Income $3,400. Fixed $1,900. Variable $1,150. Subscriptions $95. What is net cash flow?",
      "options": [
        "+$255",
        "−$255",
        "+$350",
        "+$1,500"
      ],
      "answer": 0,
      "correctAnswer": "+$255",
      "imageSrc": "/learning/spending-cash-flow.svg",
      "why": "3,400 − (1,900 + 1,150 + 95) = 255. Every outflow category has to be included or the figure flatters you."
    },
    {
      "id": "spd-5-q2",
      "question": "Cash flow is negative every month. What is necessarily happening?",
      "options": [
        "Nothing — it balances out",
        "The gap is being covered by savings or borrowing",
        "Income is being under-reported",
        "Spending is being over-reported"
      ],
      "answer": 1,
      "correctAnswer": "The gap is being covered by savings or borrowing",
      "why": "The money has to come from somewhere. A persistent gap is drawing down reserves or adding debt by definition."
    },
    {
      "id": "spd-5-q3",
      "question": "Why does cash flow come before saving and investing?",
      "options": [
        "It does not; they are independent",
        "Surplus is what funds them — without it they are funded by debt or reserves",
        "Banks require it",
        "It is a legal requirement"
      ],
      "answer": 1,
      "correctAnswer": "Surplus is what funds them — without it they are funded by debt or reserves",
      "why": "Saving out of a deficit moves money without creating any. The surplus is the actual source."
    },
    {
      "id": "spd-5-q4",
      "question": "What separates cash flow from net worth?",
      "options": [
        "Cash flow covers one month; net worth covers everything you own and owe",
        "Cash flow counts debt and net worth does not",
        "They are two names for the same figure",
        "Net worth is measured monthly and cash flow yearly"
      ],
      "answer": 0,
      "correctAnswer": "Cash flow covers one month; net worth covers everything you own and owe",
      "why": "Cash flow is one month of money moving. Net worth is the standing total behind you, and positive cash flow every month is what grows it over years."
    }
  ]
}
```

---

## Savings

`savings` · unlocks `/savings` · 3 lessons · 10 questions

> You can explain what each pool of your savings is for, and how much of your surplus is going to it.

### Savings

`sav-1` · 30s read · 2 questions

```json
{
  "lessonId": "sav-1",
  "lessonTitle": "Savings",
  "questions": [
    {
      "id": "sav-1-q1",
      "question": "What is the practical difference between unspent money and saved money?",
      "options": [
        "The amount",
        "Saved money is structurally separated from everyday access",
        "Saved money earns interest",
        "There is no difference"
      ],
      "answer": 1,
      "correctAnswer": "Saved money is structurally separated from everyday access",
      "why": "Separation is the distinction. Money in a spending account is available to be spent regardless of intention."
    },
    {
      "id": "sav-1-q2",
      "question": "Why is it worth choosing where you save, not just that you save?",
      "options": [
        "Only some accounts allow transfers out",
        "Some savings accounts pay a higher interest rate than others",
        "Banks charge a fee to open a savings account",
        "Money only counts as saved in certain accounts"
      ],
      "answer": 1,
      "correctAnswer": "Some savings accounts pay a higher interest rate than others",
      "why": "The same money earns different amounts depending on which account is holding it. That difference is what makes the choice of account worth making."
    }
  ]
}
```

### Types of savings

`sav-2` · 30s read · 4 questions

```json
{
  "lessonId": "sav-2",
  "lessonTitle": "Types of savings",
  "questions": [
    {
      "id": "sav-2-q1",
      "question": "What is the difference between a savings account and a CD?",
      "options": [
        "There is no difference",
        "A CD locks your money in for a set term in exchange for a higher rate",
        "A CD cannot earn interest",
        "A savings account is only for emergencies"
      ],
      "answer": 1,
      "correctAnswer": "A CD locks your money in for a set term in exchange for a higher rate",
      "why": "A CD trades access for a better rate. A savings account keeps your money reachable at any time."
    },
    {
      "id": "sav-2-q2",
      "question": "An emergency fund and a sinking fund are best described as which?",
      "options": [
        "Separate account types offered by banks",
        "Methods — ways of using an account, not accounts themselves",
        "Investment products",
        "The same thing with different names"
      ],
      "answer": 1,
      "correctAnswer": "Methods — ways of using an account, not accounts themselves",
      "why": "Neither is a special account. Both are money set aside for a purpose, usually held in an ordinary savings account."
    },
    {
      "id": "sav-2-q3",
      "question": "Which is a sinking fund for, rather than an emergency fund?",
      "options": [
        "A sudden job loss",
        "An urgent medical bill",
        "An annual insurance premium you know is coming",
        "An unexpected car repair"
      ],
      "answer": 2,
      "correctAnswer": "An annual insurance premium you know is coming",
      "why": "A known, scheduled cost is predictable. That is what a sinking fund handles — an emergency fund is for the unpredictable ones."
    },
    {
      "id": "sav-2-q4",
      "question": "What can a money market account ask for in return for its rate?",
      "options": [
        "A fixed term your money is locked in for",
        "A higher minimum balance",
        "A credit check every month",
        "Giving up withdrawals entirely"
      ],
      "answer": 1,
      "correctAnswer": "A higher minimum balance",
      "why": "A money market account often pays more than a basic savings account, but may require a higher minimum balance to avoid fees or earn that rate. The fixed term is the CD."
    }
  ]
}
```

### Interest

`sav-3` · 60s read · 4 questions

```json
{
  "lessonId": "sav-3",
  "lessonTitle": "Interest",
  "questions": [
    {
      "id": "sav-3-q1",
      "question": "What does compounding mean?",
      "options": [
        "Interest is paid more often",
        "Interest is calculated on a balance that already includes past interest",
        "The rate increases over time",
        "Interest is tax-free"
      ],
      "answer": 1,
      "correctAnswer": "Interest is calculated on a balance that already includes past interest",
      "imageSrc": "/learning/savings-compounding.svg",
      "why": "The base itself grows. That is why the effect accelerates rather than staying linear."
    },
    {
      "id": "sav-3-q2",
      "question": "Why is APY usually the more informative figure on a savings account?",
      "options": [
        "It is always higher",
        "It accounts for compounding, so it reflects actual yearly earnings",
        "It excludes fees",
        "It is set by regulators"
      ],
      "answer": 1,
      "correctAnswer": "It accounts for compounding, so it reflects actual yearly earnings",
      "why": "APY builds compounding into the number. A nominal rate alone does not tell you what a year actually produces."
    },
    {
      "id": "sav-3-q3",
      "question": "Does compounding apply to credit card balances?",
      "options": [
        "No, only to savings",
        "Yes — carried balances compound the same way",
        "Only above a certain amount",
        "Only on business cards"
      ],
      "answer": 1,
      "correctAnswer": "Yes — carried balances compound the same way",
      "why": "The mechanism is neutral. Applied to debt it grows what you owe on exactly the same principle."
    },
    {
      "id": "sav-3-q4",
      "question": "Does having a credit card mean you pay interest?",
      "options": [
        "Yes — interest is the cost of holding the card",
        "No — pay the full statement balance by the due date and you are charged none",
        "Only if the card charges an annual fee",
        "Only on the portion above your limit"
      ],
      "answer": 1,
      "correctAnswer": "No — pay the full statement balance by the due date and you are charged none",
      "why": "Interest is the cost of carrying a balance past the due date, not the cost of having the card. Pay the statement in full each month and there is nothing for it to be charged on."
    }
  ]
}
```

---

## Investing

`investing` · unlocks `/investing` · 5 lessons · 29 questions

> You can explain what you own, why its value moves, how long it needs, and what each kind of investment risks.

### Investing

`inv-1` · 60s read · 5 questions

```json
{
  "lessonId": "inv-1",
  "lessonTitle": "Investing",
  "questions": [
    {
      "id": "inv-1-q1",
      "question": "When you buy a share, what have you actually bought?",
      "options": [
        "A loan to the government",
        "A unit of ownership in a business someone else runs",
        "A guarantee of future payments",
        "A savings account with a higher rate"
      ],
      "answer": 1,
      "correctAnswer": "A unit of ownership in a business someone else runs",
      "imageSrc": "/learning/investing-what-you-own.svg",
      "why": "A share is ownership. That is why the outcome depends on how the business performs rather than on a rate someone promised you."
    },
    {
      "id": "inv-1-q2",
      "question": "What are the two ways an ownership stake can return money to you?",
      "options": [
        "Interest and fees",
        "Growth in what it is worth, and income paid out of earnings",
        "Deposits and withdrawals",
        "Taxes and rebates"
      ],
      "answer": 1,
      "correctAnswer": "Growth in what it is worth, and income paid out of earnings",
      "why": "Either the slice becomes worth more, or the business pays part of its earnings out to owners. Nothing else is a return."
    },
    {
      "id": "inv-1-q3",
      "question": "What does risk mean in investing?",
      "options": [
        "The fee a brokerage charges to hold your investments",
        "The chance an investment’s value or income turns out differently than you expected, including losing money",
        "The tax you owe when you sell",
        "How long you have to hold before you are allowed to sell"
      ],
      "answer": 1,
      "correctAnswer": "The chance an investment’s value or income turns out differently than you expected, including losing money",
      "why": "Risk is the gap between what you expected and what actually happens. Losing money is one of the outcomes inside that gap."
    },
    {
      "id": "inv-1-q4",
      "question": "Why does investment risk exist at all?",
      "options": [
        "Brokerages are unregulated",
        "The future is uncertain and shaped by factors outside your control",
        "Investments are not recorded anywhere",
        "Prices are only set once a year"
      ],
      "answer": 1,
      "correctAnswer": "The future is uncertain and shaped by factors outside your control",
      "why": "The economy, interest rates, company performance, politics, supply and demand — none of them are yours to set. That is where the uncertainty comes from."
    },
    {
      "id": "inv-1-q5",
      "question": "Why does the possibility of growth come with the possibility of loss?",
      "options": [
        "Because brokerages require it",
        "Because growth means putting money into something whose future value is not guaranteed",
        "Because taxes reduce every return",
        "Because investments are insured against one but not the other"
      ],
      "answer": 1,
      "correctAnswer": "Because growth means putting money into something whose future value is not guaranteed",
      "why": "The two are one fact seen from either side. There is no version of this where the upside exists and the uncertainty does not."
    }
  ]
}
```

### Financial basics help growth

`inv-3` · 60s read · 5 questions

```json
{
  "lessonId": "inv-3",
  "lessonTitle": "Financial basics help growth",
  "questions": [
    {
      "id": "inv-3-q1",
      "question": "Why does high-interest debt usually sit ahead of investing in this ordering?",
      "options": [
        "Lenders require it",
        "Clearing it is a guaranteed saving that no investment can guarantee to beat",
        "Debt blocks you from opening a brokerage account",
        "Interest is not tax deductible"
      ],
      "answer": 1,
      "correctAnswer": "Clearing it is a guaranteed saving that no investment can guarantee to beat",
      "imageSrc": "/learning/investing-order.svg",
      "why": "A 24% interest rate you stop paying is a certain 24%. An investment return is never certain, so the guaranteed one is placed first."
    },
    {
      "id": "inv-3-q2",
      "question": "What is the employer 401(k) match?",
      "options": [
        "A loan from your employer",
        "Money your employer adds when you contribute",
        "A tax refund",
        "A bonus paid at retirement"
      ],
      "answer": 1,
      "correctAnswer": "Money your employer adds when you contribute",
      "why": "It is part of your compensation that only arrives if you contribute. Leaving it unclaimed leaves agreed pay on the table."
    },
    {
      "id": "inv-3-q3",
      "question": "Why is an emergency fund placed before investing rather than after?",
      "options": [
        "It earns a higher return",
        "It stops a bad month from forcing you to sell investments at a loss",
        "Brokers require proof of savings",
        "It is taxed more favourably"
      ],
      "answer": 1,
      "correctAnswer": "It stops a bad month from forcing you to sell investments at a loss",
      "why": "The fund is what lets the investment be left alone. Without it, an ordinary emergency turns into a forced sale at whatever price the market offers that week."
    },
    {
      "id": "inv-3-q4",
      "question": "How is a Roth IRA taxed, as described here?",
      "options": [
        "Contributions lower your taxable income today",
        "You contribute money already taxed, and qualified withdrawals — growth included — are tax-free",
        "Withdrawals are always taxed as ordinary income",
        "It is never taxed at any point"
      ],
      "answer": 1,
      "correctAnswer": "You contribute money already taxed, and qualified withdrawals — growth included — are tax-free",
      "why": "A Roth is funded with money you have already paid tax on, which is why qualified withdrawals come out tax-free. Lowering your taxable income today is what the traditional 401(k) contribution does instead."
    },
    {
      "id": "inv-3-q5",
      "question": "Why does the taxable brokerage sit at the top of the order rather than the bottom?",
      "options": [
        "It is the riskiest kind of account",
        "The steps below it either remove a guaranteed cost or come with a tax advantage or employer money",
        "Brokerages require the other accounts to exist first",
        "It charges the highest fees"
      ],
      "answer": 1,
      "correctAnswer": "The steps below it either remove a guaranteed cost or come with a tax advantage or employer money",
      "why": "Clearing debt is a guaranteed saving, savings removes a risk, and the retirement and health accounts carry a match or a tax advantage. The taxable account has none of those, so it comes after them."
    }
  ]
}
```

### Investment choices

`inv-6` · 60s read · 6 questions

```json
{
  "lessonId": "inv-6",
  "lessonTitle": "Investment choices",
  "questions": [
    {
      "id": "inv-6-q1",
      "question": "What is an index fund designed to do?",
      "options": [
        "Pick the companies most likely to outperform",
        "Track a market index instead of trying to pick individual winners",
        "Guarantee a set return each year",
        "Hold a single company at a time"
      ],
      "answer": 1,
      "correctAnswer": "Track a market index instead of trying to pick individual winners",
      "why": "It tracks the index rather than choosing between the companies in it. The diversification that comes with that is what spreads your risk across many companies."
    },
    {
      "id": "inv-6-q2",
      "question": "What are you doing when you buy a bond?",
      "options": [
        "Buying ownership in a company",
        "Lending money in exchange for interest",
        "Buying a contract on a future price",
        "Buying property directly"
      ],
      "answer": 1,
      "correctAnswer": "Lending money in exchange for interest",
      "why": "A bond is a loan you are making. It is generally less risky than owning stock — generally, not certainly, since you can still lose money."
    },
    {
      "id": "inv-6-q3",
      "question": "Why do individual stocks sit in a higher risk group than a broad ETF?",
      "options": [
        "Individual stocks cost more to buy",
        "Your money depends heavily on one company",
        "Individual stocks cannot pay dividends",
        "ETFs come with a guarantee"
      ],
      "answer": 1,
      "correctAnswer": "Your money depends heavily on one company",
      "why": "One company carries its own outcome alone, so you can lose a large portion of what you put in. A fund holding many spreads the same money out, so no single failure decides the result."
    },
    {
      "id": "inv-6-q4",
      "question": "What sets options and futures apart from everything in the lower-risk group?",
      "options": [
        "They cost less to hold",
        "Some strategies can lose more than you put in",
        "They pay a guaranteed income",
        "They cannot fall in value"
      ],
      "answer": 1,
      "correctAnswer": "Some strategies can lose more than you put in",
      "why": "Both sit in the highest-risk group for that reason. Leverage magnifies losses, and losing more than you invested is not something a fund can do to you."
    },
    {
      "id": "inv-6-q5",
      "question": "What does the table say about day trading?",
      "options": [
        "It becomes reliable with enough practice",
        "It is extremely high risk, and frequent traders can lose money quickly and consistently",
        "It carries the same risk as holding a broad fund",
        "Trading more often reduces the risk of each trade"
      ],
      "answer": 1,
      "correctAnswer": "It is extremely high risk, and frequent traders can lose money quickly and consistently",
      "why": "It sits in the highest-risk group. Trading more often does not make the outcome more certain — it makes the losses arrive faster."
    },
    {
      "id": "inv-6-q6",
      "question": "Read the pattern down the three tables. How does risk relate to certainty and time?",
      "options": [
        "The less certain and shorter-term an investment is, the more risk you take on",
        "The shorter-term an investment is, the less risk you take on",
        "Risk depends only on how much money you put in",
        "Longer-term investments always carry the most risk"
      ],
      "answer": 0,
      "correctAnswer": "The less certain and shorter-term an investment is, the more risk you take on",
      "why": "That is the pattern the three groups are ordered by. Certainty and time horizon are what separate the lower-risk rows from the highest-risk ones."
    }
  ]
}
```

### Your goals

`inv-4` · 60s read · 5 questions

```json
{
  "lessonId": "inv-4",
  "lessonTitle": "Your goals",
  "questions": [
    {
      "id": "inv-4-q1",
      "question": "Which input most changes how much short-term movement a plan can absorb?",
      "options": [
        "The account provider",
        "The time horizon",
        "The number of holdings",
        "The deposit day"
      ],
      "answer": 1,
      "correctAnswer": "The time horizon",
      "why": "Years are what let a bad stretch be recovered from. With enough of them, a fall is temporary; without them, it is the outcome."
    },
    {
      "id": "inv-4-q2",
      "question": "What is the required return in this list?",
      "options": [
        "The return a brokerage advertises",
        "The return you need to reach your goal, based on your time and savings",
        "The average return of the market",
        "The lowest return an investment is allowed to pay"
      ],
      "answer": 1,
      "correctAnswer": "The return you need to reach your goal, based on your time and savings",
      "why": "It falls out of the other inputs rather than being chosen. What the money has to be worth, by when, and how much you can add along the way is what sets it."
    },
    {
      "id": "inv-4-q3",
      "question": "Risk tolerance is how much of a drop you can handle without selling. What actually tests it?",
      "options": [
        "The score on a questionnaire",
        "What you do when the balance is well down",
        "How much you earn",
        "How many accounts you hold"
      ],
      "answer": 1,
      "correctAnswer": "What you do when the balance is well down",
      "why": "Tolerance shows up in behaviour under loss, not in an answer given on a calm day. A plan is only as good as what the person holding it does in the worst month."
    },
    {
      "id": "inv-4-q4",
      "question": "Maya, Jordan and Leo invest differently. What is the point of showing all three?",
      "options": [
        "One of them is right and the other two are mistakes",
        "The goal should decide what you invest for, how much risk you take, and when you use the money",
        "Higher risk reliably produces more money",
        "Everyone should hold some individual stocks"
      ],
      "answer": 1,
      "correctAnswer": "The goal should decide what you invest for, how much risk you take, and when you use the money",
      "why": "None of the three strategies is better in the abstract. What the money is for, and when it is needed, is what makes a plan fit or not fit."
    },
    {
      "id": "inv-4-q5",
      "question": "Leo keeps most of his money in diversified funds and a small portion in higher-risk positions. What is the stated tradeoff?",
      "options": [
        "There is none, because the core portfolio is protected",
        "The higher upside comes with a real possibility of losing some or all of that money",
        "His diversified funds can no longer fall",
        "The speculative portion is guaranteed to accelerate his wealth"
      ],
      "answer": 1,
      "correctAnswer": "The higher upside comes with a real possibility of losing some or all of that money",
      "why": "The speculative portion is money that can go to zero. Keeping it small is what makes that outcome survivable, not what prevents it."
    }
  ]
}
```

### Buy and manage investments

`inv-8` · 60s read · 8 questions

```json
{
  "lessonId": "inv-8",
  "lessonTitle": "Buy and manage investments",
  "questions": [
    {
      "id": "inv-8-q9",
      "question": "What is a brokerage account for?",
      "options": [
        "Holding cash at a fixed interest rate",
        "Buying, selling and holding investments like stocks, ETFs and bonds",
        "Borrowing money to cover expenses",
        "Paying your monthly bills"
      ],
      "answer": 1,
      "correctAnswer": "Buying, selling and holding investments like stocks, ETFs and bonds",
      "why": "It is the account investments live in. Which one you choose comes down to its fees, its features and what it lets you invest in."
    },
    {
      "id": "inv-8-q6",
      "question": "Why is trying to time the market difficult in practice?",
      "options": [
        "Brokers block it",
        "It requires being right about when to leave and when to return",
        "It is taxed at 100%",
        "Markets are closed most of the year"
      ],
      "answer": 1,
      "correctAnswer": "It requires being right about when to leave and when to return",
      "why": "Two correct calls are needed, not one. Investing regularly and staying invested is the alternative the lesson describes — it asks you to be right about neither."
    },
    {
      "id": "inv-8-q8",
      "question": "Someone owns twenty companies, all in one industry. What is the problem?",
      "options": [
        "Too many holdings to track",
        "They are concentrated — one industry shock hits all twenty at once",
        "Fees are higher",
        "Nothing, twenty is diversified"
      ],
      "answer": 1,
      "correctAnswer": "They are concentrated — one industry shock hits all twenty at once",
      "why": "A diversified mix is about exposure, not the number of holdings. Twenty positions that move together behave like one."
    },
    {
      "id": "inv-8-q7",
      "question": "What does rebalancing do?",
      "options": [
        "Adds money to the account",
        "Returns a portfolio to its intended split after the market has moved it",
        "Removes all risk",
        "Locks in a guaranteed return"
      ],
      "answer": 1,
      "correctAnswer": "Returns a portfolio to its intended split after the market has moved it",
      "imageSrc": "/learning/investing-allocation.svg",
      "why": "Whatever grew fastest becomes an oversized share of the total. Rebalancing trims it back and tops up what lagged, so the mix still matches your goals and risk tolerance."
    },
    {
      "id": "inv-8-q0",
      "question": "What is an expense ratio?",
      "options": [
        "A one-off charge when you buy",
        "An annual percentage of your balance taken by the fund",
        "The tax on your gains",
        "The fund’s return"
      ],
      "answer": 1,
      "correctAnswer": "An annual percentage of your balance taken by the fund",
      "imageSrc": "/learning/investing-fees.svg",
      "why": "It is charged every year on whatever the balance is, in good years and bad. That is why fees are one of the things worth comparing before you choose where to invest."
    },
    {
      "id": "inv-8-q2",
      "question": "When does selling an investment create a tax bill?",
      "options": [
        "Every time you sell, in any account",
        "When you sell at a profit in a taxable account — holding longer can qualify for more favourable treatment",
        "Only when you withdraw the cash to your bank",
        "Never — investment gains are not taxed"
      ],
      "answer": 1,
      "correctAnswer": "When you sell at a profit in a taxable account — holding longer can qualify for more favourable treatment",
      "why": "Selling for a profit in a taxable account is a taxable event, and how long you held it affects the rate. Where you invest — taxable, 401(k), IRA or HSA — changes the treatment."
    },
    {
      "id": "inv-8-q1",
      "question": "Why does avoiding major losses matter more than finding big wins?",
      "options": [
        "Losses are taxed at a higher rate",
        "Recovering from a loss takes a larger percentage gain, and being wiped out ends the compounding",
        "Wins are guaranteed and losses are not",
        "Brokers penalise losses"
      ],
      "answer": 1,
      "correctAnswer": "Recovering from a loss takes a larger percentage gain, and being wiped out ends the compounding",
      "why": "The maths is asymmetric and the consequence is final. Money that is gone cannot compound, however good the next idea turns out to be."
    },
    {
      "id": "inv-8-q4",
      "question": "What is the single idea this track keeps returning to?",
      "options": [
        "Trade often to find the best entry",
        "You bought a piece of a business someone else runs, and businesses grow over years",
        "Higher risk always means higher return",
        "Fees do not matter at small balances"
      ],
      "answer": 1,
      "correctAnswer": "You bought a piece of a business someone else runs, and businesses grow over years",
      "why": "Everything else follows from it. The biggest advantage most investors have is not predicting the market — it is staying invested long enough to compound."
    }
  ]
}
```
