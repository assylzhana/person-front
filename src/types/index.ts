// Auth
export interface AuthResponse {
  userId: number;
  email: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// User
export interface UserProfile {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  privacyType: 'PUBLIC' | 'PRIVATE';
  createdAt: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  bio?: string;
  avatarUrl?: string;
  privacyType?: 'PUBLIC' | 'PRIVATE';
}

// Friend full profile (GET /users/{userId}/full-profile)
export interface UserFullProfile {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  memberSince: string;

  level: number;
  levelTitle: string;
  xp: number;
  xpToNextLevel: number;

  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  failedGoals: number;
  completionRate: number;
  avgProgress: number;

  avgMotivationLevel: number;
  avgProductivityLevel: number;
  avgStressLevel: number;
  overallStatus: string;
  totalTestsTaken: number;
}

// Friendship
export interface FriendRecord {
  id: number;
  requesterId: number;
  addresseeId: number;
  status: 'PENDING' | 'ACCEPTED';
  friend: {
    id: number;
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    bio: string | null;
    avatarUrl: string | null;
    privacyType: 'PUBLIC' | 'PRIVATE';
  };
  createdAt: string;
}

// Tests
export interface TestOption {
  id: number;
  optionText: string;
}

export interface TestQuestion {
  id: number;
  questionText: string;
  orderIndex: number;
  options: TestOption[];
}

export interface PsychTest {
  id: number;
  title: string;
  description: string;
  questions: TestQuestion[];
}

export interface TestResult {
  id: number;
  testId: number;
  testTitle: string;
  stressLevel: number;
  motivationLevel: number;
  productivityLevel: number;
  recommendations: string[];
  createdAt: string;
}

export interface TestStats {
  avgStressLevel: number;
  avgMotivationLevel: number;
  avgProductivityLevel: number;
  totalTestsTaken: number;
  overallStatus: string;
}

// Goals
export type GoalCategory = 'HEALTH' | 'EDUCATION' | 'FINANCE' | 'CAREER' | 'PERSONAL' | 'SOCIAL' | 'OTHER';
export type GoalPeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED';

export interface Goal {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  category: GoalCategory;
  status: GoalStatus;
  periodType: GoalPeriodType;
  progressPercentage: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  category: GoalCategory;
  periodType: GoalPeriodType;
  deadline: string;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  category?: GoalCategory;
  deadline?: string;
  progressPercentage?: number;
}

export interface GoalStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  failedGoals: number;
  completionRate: number;
  avgProgressPercentage: number;
}

// Finance
export type IncomeType = 'SALARY' | 'FREELANCE' | 'INVESTMENT' | 'GIFT' | 'OTHER';
export type ExpenseCategory = 'FOOD' | 'TRANSPORT' | 'HOUSING' | 'HEALTHCARE' | 'EDUCATION' | 'ENTERTAINMENT' | 'CLOTHING' | 'SAVINGS' | 'OTHER';

export interface IncomeRecord {
  id: number;
  amount: number;
  type: IncomeType;
  description: string | null;
  date: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id: number;
  amount: number;
  category: ExpenseCategory;
  description: string | null;
  date: string;
  createdAt: string;
}

export interface MonthlyPlan {
  id: number;
  year: number;
  month: number;
  baseIncome: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  spentPercentage: number;
  expensesByCategory: Record<string, number>;
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
}

export interface FinanceStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  spentPercentage: number;
  overBudget: boolean;
}

// Analytics
export interface ChartData {
  labels: string[];
  values: number[];
  chartType: 'pie' | 'bar' | 'radar';
}

export interface GoalsAnalytics extends GoalStats {
  statusChart: ChartData;
}

export interface FinanceAnalytics extends FinanceStats {
  budgetChart: ChartData;
}

export interface ProductivityAnalytics {
  avgStressLevel: number;
  avgMotivationLevel: number;
  avgProductivityLevel: number;
  totalTestsTaken: number;
  overallStatus: string;
  developmentScore: number;
  productivityChart: ChartData;
}

export type DevelopmentLevel = 'STARTER' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';

export interface AnalyticsOverview {
  goals: GoalsAnalytics;
  finance: FinanceAnalytics;
  productivity: ProductivityAnalytics;
  overallDevelopmentScore: number;
  developmentLevel: DevelopmentLevel;
  recommendations: {
    recommendations: string[];
    source: string;
  };
}

// Notifications
export type NotificationType = 'GOAL_DEADLINE' | 'GOAL_EXPIRED' | 'GOAL_COMPLETED' | 'SYSTEM';
export type NotificationStatus = 'UNREAD' | 'READ';

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  referenceId: number | null;
  createdAt: string;
}

export interface ApiError {
  message: string;
  status: number;
}
