export interface FeeStructure {
  id: number;
  institution_id: number;
  academic_year_id: number;
  grade_id: number;
  name: string;
  description?: string;
  category: string;
  amount: number;
  is_mandatory: boolean;
  is_recurring: boolean;
  recurrence_period?: string;
  due_date?: string;
  late_fee_applicable: boolean;
  late_fee_amount?: number;
  late_fee_percentage?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeePayment {
  id: number;
  institution_id: number;
  student_id: number;
  fee_structure_id: number;
  receipt_number: string;
  payment_date: string;
  amount_paid: number;
  late_fee: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  transaction_id?: string;
  remarks?: string;
  collected_by?: number;
  created_at: string;
  updated_at: string;
}

export interface FeeWaiver {
  id: number;
  institution_id: number;
  student_id: number;
  fee_structure_id: number;
  waiver_percentage: number;
  waiver_amount: number;
  reason: string;
  approved_by?: number;
  approved_at?: string;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentOutstandingDues {
  student_id: number;
  student_name: string;
  grade_name: string;
  total_fees: number;
  amount_paid: number;
  outstanding_amount: number;
  overdue_amount: number;
}

export interface FeeReceiptData {
  receipt_number: string;
  payment_date: string;
  student_name: string;
  grade_name: string;
  fee_structure_name: string;
  amount_paid: number;
  late_fee: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  collected_by_name?: string;
}
