export interface BookCategory {
  id: number;
  institution_id: number;
  name: string;
  description?: string;
  code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: number;
  institution_id: number;
  category_id?: number;
  title: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  publication_year?: number;
  edition?: string;
  accession_number: string;
  call_number?: string;
  total_copies: number;
  available_copies: number;
  description?: string;
  language?: string;
  pages?: number;
  price?: number;
  location?: string;
  rack_number?: string;
  status: string;
  cover_image_url?: string;
  is_reference_only: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookIssue {
  id: number;
  institution_id: number;
  book_id: number;
  student_id: number;
  issue_date: string;
  due_date: string;
  return_date?: string;
  status: string;
  fine_amount: number;
  fine_paid: boolean;
  fine_payment_date?: string;
  issued_by?: number;
  returned_to?: number;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface BookIssueWithDetails extends BookIssue {
  book_title: string;
  book_author?: string;
  student_name: string;
  student_roll_number?: string;
  days_overdue: number;
}

export interface LibrarySettings {
  id: number;
  institution_id: number;
  max_books_per_student: number;
  issue_duration_days: number;
  fine_per_day: number;
  max_fine_amount?: number;
  allow_renewals: boolean;
  max_renewals: number;
  working_days: string;
  created_at: string;
  updated_at: string;
}

export interface OverdueBookReport {
  issue_id: number;
  student_id: number;
  student_name: string;
  book_title: string;
  issue_date: string;
  due_date: string;
  days_overdue: number;
  fine_amount: number;
}
