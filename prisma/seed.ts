import { PrismaClient, type AccountKind } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const EMAIL = 'kava@kava.com';
const PASSWORD = 'Kava@123';
const FULL_NAME = 'Kava Sharma';

const date = (y: number, m: number, d: number) => new Date(y, m - 1, d);
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: 'income' as const, icon: 'briefcase', color: '#10B981' },
  { name: 'Freelance', type: 'income' as const, icon: 'laptop', color: '#3B82F6' },
  { name: 'Investments', type: 'income' as const, icon: 'trending-up', color: '#8B5CF6' },
  { name: 'Food & Dining', type: 'expense' as const, icon: 'utensils', color: '#F59E0B' },
  { name: 'Transport', type: 'expense' as const, icon: 'car', color: '#EF4444' },
  { name: 'Shopping', type: 'expense' as const, icon: 'shopping-bag', color: '#EC4899' },
  { name: 'Bills & Utilities', type: 'expense' as const, icon: 'receipt', color: '#6366F1' },
  { name: 'Healthcare', type: 'expense' as const, icon: 'heart', color: '#14B8A6' },
  { name: 'Entertainment', type: 'expense' as const, icon: 'film', color: '#F97316' },
  { name: 'Other', type: 'expense' as const, icon: 'tag', color: '#6B7280' },
];

const DEFAULT_BANKS = [
  { name: 'HDFC Bank', ifscPrefix: 'HDFC' },
  { name: 'ICICI Bank', ifscPrefix: 'ICIC' },
  { name: 'State Bank of India', ifscPrefix: 'SBIN' },
  { name: 'Axis Bank', ifscPrefix: 'UTIB' },
  { name: 'Kotak Mahindra Bank', ifscPrefix: 'KKBK' },
];

async function clearDatabase() {
  await prisma.documentReminder.deleteMany();
  await prisma.documentLink.deleteMany();
  await prisma.document.deleteMany();
  await prisma.goalFunding.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.recurringRule.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.creditCard.deleteMany();
  await prisma.walletAccount.deleteMany();
  await prisma.cashAccount.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.bank.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}

async function registerAccount(userId: number, kind: AccountKind, referenceId: number) {
  return prisma.account.create({ data: { userId, kind, referenceId } });
}

async function main() {
  console.log('Clearing existing data...');
  await clearDatabase();

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  console.log('Creating banks...');
  const banks = await Promise.all(
    DEFAULT_BANKS.map(b => prisma.bank.create({ data: { name: b.name, ifscPrefix: b.ifscPrefix } })),
  );
  const bankByName = (name: string) => banks.find(b => b.name === name)!;

  console.log('Creating user...');
  const user = await prisma.user.create({
    data: { email: EMAIL, passwordHash, fullName: FULL_NAME, role: 'admin' },
  });

  const categories = await Promise.all(
    DEFAULT_CATEGORIES.map(c =>
      prisma.category.create({
        data: {
          userId: user.id,
          name: c.name,
          type: c.type,
          icon: c.icon,
          color: c.color,
          is_default: true,
        },
      }),
    ),
  );

  const cat = (name: string) => categories.find(c => c.name === name)!;

  const hdfcSavingsRow = await prisma.bankAccount.create({
    data: {
      userId: user.id,
      bankId: bankByName('HDFC Bank').id,
      name: 'HDFC Bank Savings',
      accountNumber: 50100123456789n,
      ifscCode: 'HDFC0001234',
      balance: 245680,
      color: '#004C8F',
      icon: 'landmark',
    },
  });
  const hdfcSavings = await registerAccount(user.id, 'bank', hdfcSavingsRow.id);

  const iciciSavingsRow = await prisma.bankAccount.create({
    data: {
      userId: user.id,
      bankId: bankByName('ICICI Bank').id,
      name: 'ICICI Bank Savings',
      accountNumber: 60200123456789n,
      ifscCode: 'ICIC0001234',
      balance: 89420,
      color: '#F58220',
      icon: 'landmark',
    },
  });
  const iciciSavings = await registerAccount(user.id, 'bank', iciciSavingsRow.id);

  const sbiSavingsRow = await prisma.bankAccount.create({
    data: {
      userId: user.id,
      bankId: bankByName('State Bank of India').id,
      name: 'State Bank of India',
      accountNumber: 30100123456789n,
      ifscCode: 'SBIN0001234',
      balance: 156000,
      color: '#22409A',
      icon: 'landmark',
    },
  });
  const sbiSavings = await registerAccount(user.id, 'bank', sbiSavingsRow.id);

  const hdfcCreditRow = await prisma.creditCard.create({
    data: {
      userId: user.id,
      bankId: bankByName('HDFC Bank').id,
      name: 'HDFC Regalia Credit Card',
      cardNumber: '4111111111111234',
      cardHolderName: FULL_NAME,
      expiryDate: date(2028, 12, 31),
      creditLimit: 300000,
      outstandingBalance: 42850,
      statementStartDate: date(2026, 5, 16),
      statementEndDate: date(2026, 6, 15),
      dueDate: date(2026, 7, 5),
      minDue: 2142.5,
      color: '#1A1F71',
      icon: 'credit-card',
    },
  });
  const hdfcCredit = await registerAccount(user.id, 'credit_card', hdfcCreditRow.id);

  const iciciCreditRow = await prisma.creditCard.create({
    data: {
      userId: user.id,
      bankId: bankByName('ICICI Bank').id,
      name: 'ICICI Amazon Pay Credit Card',
      cardNumber: '4111111111115678',
      expiryDate: date(2027, 8, 31),
      creditLimit: 150000,
      outstandingBalance: 12680,
      statementStartDate: date(2026, 5, 20),
      statementEndDate: date(2026, 6, 19),
      dueDate: date(2026, 7, 10),
      minDue: 634,
      color: '#FF9900',
      icon: 'credit-card',
    },
  });
  const iciciCredit = await registerAccount(user.id, 'credit_card', iciciCreditRow.id);

  const phonepeRow = await prisma.walletAccount.create({
    data: {
      userId: user.id,
      name: 'PhonePe Wallet',
      provider: 'PhonePe',
      balance: 3420,
      color: '#5F259F',
      icon: 'smartphone',
    },
  });
  const phonepe = await registerAccount(user.id, 'wallet', phonepeRow.id);

  const cashRow = await prisma.cashAccount.create({
    data: {
      userId: user.id,
      name: 'Cash',
      balance: 8500,
      color: '#10B981',
      icon: 'banknote',
    },
  });
  const cash = await registerAccount(user.id, 'cash', cashRow.id);

  const accounts = { hdfcSavings, iciciSavings, sbiSavings, hdfcCredit, iciciCredit, phonepe, cash };

  let transferId1: number | null = null;
  let transferId2: number | null = null;

  const transactions = [
    { accountId: accounts.hdfcSavings.id, categoryId: cat('Salary').id, type: 'income' as const, amount: 125000, description: 'Infosys Ltd – June salary', date: date(2026, 6, 1) },
    { accountId: accounts.hdfcSavings.id, categoryId: cat('Freelance').id, type: 'income' as const, amount: 25000, description: 'Freelance – UI design project', date: date(2026, 6, 8) },
    { accountId: accounts.hdfcSavings.id, categoryId: cat('Food & Dining').id, type: 'expense' as const, amount: 1850, description: 'Swiggy – lunch orders', date: date(2026, 6, 3) },
    { accountId: accounts.hdfcSavings.id, categoryId: cat('Transport').id, type: 'expense' as const, amount: 3200, description: 'Uber & Ola rides', date: date(2026, 6, 5) },
    { accountId: accounts.hdfcSavings.id, categoryId: cat('Bills & Utilities').id, type: 'expense' as const, amount: 1499, description: 'Airtel postpaid bill', date: date(2026, 6, 10) },
    { accountId: accounts.hdfcSavings.id, categoryId: cat('Shopping').id, type: 'expense' as const, amount: 4599, description: 'Amazon – electronics', date: date(2026, 6, 12) },
    { accountId: accounts.iciciSavings.id, categoryId: cat('Investments').id, type: 'income' as const, amount: 4200, description: 'Dividend – HDFC Bank shares', date: date(2026, 6, 15) },
    { accountId: accounts.iciciSavings.id, categoryId: cat('Healthcare').id, type: 'expense' as const, amount: 2800, description: 'Apollo Pharmacy', date: date(2026, 6, 7) },
    { accountId: accounts.hdfcCredit.id, categoryId: cat('Food & Dining').id, type: 'expense' as const, amount: 3200, description: 'Zomato Dining – Barbeque Nation', date: date(2026, 6, 4) },
    { accountId: accounts.hdfcCredit.id, categoryId: cat('Shopping').id, type: 'expense' as const, amount: 12499, description: 'Flipkart – laptop accessories', date: date(2026, 6, 11) },
    { accountId: accounts.hdfcCredit.id, categoryId: cat('Entertainment').id, type: 'expense' as const, amount: 899, description: 'BookMyShow – movie tickets', date: date(2026, 6, 14) },
    { accountId: accounts.hdfcCredit.id, categoryId: cat('Bills & Utilities').id, type: 'income' as const, amount: 15000, description: 'Credit card payment from HDFC Savings', date: date(2026, 6, 18) },
    { accountId: accounts.iciciCredit.id, categoryId: cat('Shopping').id, type: 'expense' as const, amount: 3499, description: 'Amazon Pay – groceries', date: date(2026, 6, 6) },
    { accountId: accounts.phonepe.id, categoryId: cat('Transport').id, type: 'expense' as const, amount: 450, description: 'Rapido bike rides', date: date(2026, 6, 9) },
    { accountId: accounts.cash.id, categoryId: cat('Food & Dining').id, type: 'expense' as const, amount: 320, description: 'Local chai & snacks', date: date(2026, 6, 2) },
  ];

  const createdTx = await Promise.all(
    transactions.map(tx =>
      prisma.transaction.create({
        data: { userId: user.id, ...tx },
      }),
    ),
  );

  const transferOut1 = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: accounts.hdfcSavings.id,
      type: 'expense',
      amount: 50000,
      description: 'Transfer to ICICI Savings',
      date: date(2026, 6, 16),
    },
  });
  transferId1 = transferOut1.id;
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: accounts.iciciSavings.id,
      type: 'income',
      amount: 50000,
      description: 'Transfer from HDFC Bank Savings',
      date: date(2026, 6, 16),
      transfer_id: transferId1,
    },
  });
  await prisma.transaction.update({
    where: { id: transferId1 },
    data: { transfer_id: transferId1 },
  });

  const transferOut2 = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: accounts.sbiSavings.id,
      type: 'expense',
      amount: 10000,
      description: 'Transfer to PhonePe Wallet',
      date: date(2026, 6, 17),
    },
  });
  transferId2 = transferOut2.id;
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: accounts.phonepe.id,
      type: 'income',
      amount: 10000,
      description: 'Transfer from State Bank of India',
      date: date(2026, 6, 17),
      transfer_id: transferId2,
    },
  });
  await prisma.transaction.update({
    where: { id: transferId2 },
    data: { transfer_id: transferId2 },
  });

  const hdfcCcTx = createdTx[8];

  await prisma.budget.createMany({
    data: [
      { userId: user.id, categoryId: cat('Food & Dining').id, amount: 8000, period: 'monthly', start_date: date(2026, 6, 1), end_date: date(2026, 6, 30) },
      { userId: user.id, categoryId: cat('Transport').id, amount: 5000, period: 'monthly', start_date: date(2026, 6, 1), end_date: date(2026, 6, 30) },
      { userId: user.id, categoryId: cat('Shopping').id, amount: 15000, period: 'monthly', start_date: date(2026, 6, 1), end_date: date(2026, 6, 30) },
      { userId: user.id, categoryId: cat('Bills & Utilities').id, amount: 6000, period: 'monthly', start_date: date(2026, 6, 1), end_date: date(2026, 6, 30) },
    ],
  });

  const homeLoan = await prisma.loan.create({
    data: {
      userId: user.id,
      name: 'HDFC Home Loan',
      principal: 4500000,
      interest_rate: 8.5,
      tenure_months: 240,
      emi_amount: 39084,
      start_date: date(2022, 3, 1),
      accountId: accounts.hdfcSavings.id,
      categoryId: cat('Bills & Utilities').id,
      outstanding_balance: 3824560,
    },
  });

  const carLoan = await prisma.loan.create({
    data: {
      userId: user.id,
      name: 'SBI Car Loan – Hyundai Creta',
      principal: 1200000,
      interest_rate: 9.25,
      tenure_months: 60,
      emi_amount: 25012,
      start_date: date(2024, 8, 1),
      accountId: accounts.sbiSavings.id,
      categoryId: cat('Transport').id,
      outstanding_balance: 876540,
    },
  });

  await prisma.recurringRule.createMany({
    data: [
      { userId: user.id, name: 'Monthly Salary', type: 'income', frequency: 'monthly', amount: 125000, accountId: accounts.hdfcSavings.id, categoryId: cat('Salary').id, next_run_date: date(2026, 7, 1) },
      { userId: user.id, name: 'Airtel Postpaid', type: 'expense', frequency: 'monthly', amount: 1499, accountId: accounts.hdfcSavings.id, categoryId: cat('Bills & Utilities').id, next_run_date: date(2026, 7, 10) },
      { userId: user.id, name: 'Netflix Subscription', type: 'expense', frequency: 'monthly', amount: 649, accountId: accounts.hdfcCredit.id, categoryId: cat('Entertainment').id, next_run_date: date(2026, 7, 5) },
      { userId: user.id, name: 'SIP – Mirae Asset Large Cap', type: 'expense', frequency: 'monthly', amount: 10000, accountId: accounts.iciciSavings.id, categoryId: cat('Investments').id, next_run_date: date(2026, 7, 5) },
      { userId: user.id, name: 'HDFC Home Loan EMI', type: 'expense', frequency: 'monthly', amount: 39084, accountId: accounts.hdfcSavings.id, categoryId: cat('Bills & Utilities').id, loanId: homeLoan.id, next_run_date: date(2026, 7, 1) },
      { userId: user.id, name: 'SBI Car Loan EMI', type: 'expense', frequency: 'monthly', amount: 25012, accountId: accounts.sbiSavings.id, categoryId: cat('Transport').id, loanId: carLoan.id, next_run_date: date(2026, 7, 1) },
      { userId: user.id, name: 'Savings Transfer', description: 'Move surplus to ICICI', type: 'transfer', frequency: 'monthly', amount: 20000, fromAccountId: accounts.hdfcSavings.id, toAccountId: accounts.iciciSavings.id, next_run_date: date(2026, 7, 15) },
    ],
  });

  const vacationGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      name: 'Europe Vacation 2027',
      target_amount: 500000,
      target_date: date(2027, 6, 1),
      priority: 'high',
      status: 'active',
      notes: 'Paris, Amsterdam, and Switzerland trip for family of four.',
    },
  });

  const emergencyGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      name: 'Emergency Fund',
      target_amount: 1000000,
      target_date: date(2026, 12, 31),
      priority: 'high',
      status: 'active',
      notes: '6 months of living expenses.',
    },
  });

  const laptopGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      name: 'MacBook Pro Upgrade',
      target_amount: 180000,
      target_date: date(2026, 9, 15),
      priority: 'medium',
      status: 'active',
    },
  });

  const miraeFund = await prisma.investment.create({
    data: {
      userId: user.id,
      name: 'Mirae Asset Large Cap Fund – Direct Growth',
      type: 'mutual_fund',
      invested_amount: 250000,
      current_value: 312450,
      accountId: accounts.iciciSavings.id,
      start_date: new Date('2023-01-15T00:00:00Z'),
      notes: 'Monthly SIP of ₹10,000 since Jan 2023.',
    },
  });

  const sbiFd = await prisma.investment.create({
    data: {
      userId: user.id,
      name: 'SBI Fixed Deposit – 1 Year',
      type: 'fd',
      invested_amount: 500000,
      current_value: 535000,
      accountId: accounts.sbiSavings.id,
      start_date: new Date('2025-09-01T00:00:00Z'),
      notes: '7.1% p.a., matures Sep 2026.',
    },
  });

  await prisma.goalFunding.createMany({
    data: [
      { goalId: vacationGoal.id, userId: user.id, source_type: 'account', source_public_id: accounts.iciciSavings.publicId, allocated_amount: 125000 },
      { goalId: vacationGoal.id, userId: user.id, source_type: 'investment', source_public_id: miraeFund.publicId, allocated_amount: 50000 },
      { goalId: emergencyGoal.id, userId: user.id, source_type: 'account', source_public_id: accounts.sbiSavings.publicId, allocated_amount: 156000 },
      { goalId: emergencyGoal.id, userId: user.id, source_type: 'investment', source_public_id: sbiFd.publicId, allocated_amount: 500000 },
      { goalId: laptopGoal.id, userId: user.id, source_type: 'account', source_public_id: accounts.hdfcSavings.publicId, allocated_amount: 45000 },
    ],
  });

  const r2Base = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') ?? '';

  const hdfcStatement = await prisma.document.create({
    data: {
      userId: user.id,
      name: 'HDFC Bank Statement – June 2026',
      description: 'Monthly savings account statement',
      file_url: r2Base ? `${r2Base}/seed/hdfc-statement-jun-2026.pdf` : '/uploads/seed/hdfc-statement-jun-2026.pdf',
      file_type: 'pdf',
      file_extension: 'pdf',
      mime_type: 'application/pdf',
      file_size: 245760,
      tags: ['bank', 'statement', 'hdfc'],
      notes: 'Downloaded from HDFC NetBanking.',
    },
  });

  const insuranceDoc = await prisma.document.create({
    data: {
      userId: user.id,
      name: 'HDFC ERGO Health Insurance Policy',
      description: 'Family floater policy document',
      file_url: r2Base ? `${r2Base}/seed/hdfc-ergo-policy.pdf` : '/uploads/seed/hdfc-ergo-policy.pdf',
      file_type: 'pdf',
      file_extension: 'pdf',
      mime_type: 'application/pdf',
      file_size: 512000,
      tags: ['insurance', 'health', 'policy'],
    },
  });

  const homeLoanDoc = await prisma.document.create({
    data: {
      userId: user.id,
      name: 'HDFC Home Loan Sanction Letter',
      description: 'Original loan sanction and agreement',
      file_url: r2Base ? `${r2Base}/seed/hdfc-home-loan-sanction.pdf` : '/uploads/seed/hdfc-home-loan-sanction.pdf',
      file_type: 'pdf',
      file_extension: 'pdf',
      mime_type: 'application/pdf',
      file_size: 890000,
      tags: ['loan', 'home', 'hdfc'],
    },
  });

  const receiptDoc = await prisma.document.create({
    data: {
      userId: user.id,
      name: 'Amazon Invoice – Laptop Accessories',
      description: 'Flipkart order receipt for credit card purchase',
      file_url: r2Base ? `${r2Base}/seed/amazon-receipt-jun-2026.jpg` : '/uploads/seed/amazon-receipt-jun-2026.jpg',
      file_type: 'receipt',
      file_extension: 'jpg',
      mime_type: 'image/jpeg',
      file_size: 128000,
      tags: ['receipt', 'shopping'],
    },
  });

  await prisma.documentLink.createMany({
    data: [
      { documentId: hdfcStatement.id, userId: user.id, linked_entity_type: 'account', linked_entity_public_id: accounts.hdfcSavings.publicId },
      { documentId: homeLoanDoc.id, userId: user.id, linked_entity_type: 'loan', linked_entity_public_id: homeLoan.publicId },
      { documentId: receiptDoc.id, userId: user.id, linked_entity_type: 'transaction', linked_entity_public_id: hdfcCcTx.publicId },
      { documentId: hdfcStatement.id, userId: user.id, linked_entity_type: 'credit_card', linked_entity_public_id: accounts.hdfcCredit.publicId },
      { documentId: insuranceDoc.id, userId: user.id, linked_entity_type: 'investment', linked_entity_public_id: miraeFund.publicId },
    ],
  });

  await prisma.documentReminder.createMany({
    data: [
      { documentId: insuranceDoc.id, userId: user.id, reminder_type: 'policy_expiry', reminder_date: daysFromNow(45), title: 'Health Insurance Renewal', description: 'HDFC ERGO policy expires – review and renew.' },
      { documentId: hdfcStatement.id, userId: user.id, reminder_type: 'statement_due', reminder_date: daysFromNow(7), title: 'HDFC Credit Card Payment Due', description: 'Regalia card payment due on July 5.' },
      { documentId: homeLoanDoc.id, userId: user.id, reminder_type: 'document_validity', reminder_date: daysFromNow(90), title: 'Home Loan Annual Review', description: 'Schedule annual loan account review with HDFC.' },
      { documentId: receiptDoc.id, userId: user.id, reminder_type: 'document_validity', reminder_date: daysFromNow(14), title: 'Warranty Registration', description: 'Register laptop accessories warranty on brand website.', completed: false },
    ],
  });

  console.log('\n✅ Seed complete!\n');
  console.log('Login credentials:');
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`  Name:     ${FULL_NAME}`);
  console.log(`  Role:     admin`);
  console.log('\nData summary:');
  console.log(`  Banks:         ${banks.length}`);
  console.log(`  Accounts:      7 (3 banks, 2 credit cards, 1 wallet, 1 cash)`);
  console.log(`  Transactions:  ${createdTx.length + 4} (includes 2 transfers)`);
  console.log(`  Budgets:       4`);
  console.log(`  Loans:         2`);
  console.log(`  Recurring:     7 rules`);
  console.log(`  Goals:         3 with funding allocations`);
  console.log(`  Investments:   2`);
  console.log(`  Documents:     4 with links and reminders`);
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
