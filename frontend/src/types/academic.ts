export interface Grade {
  id: number;
  institution_id: number;
  name: string;
  display_order: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GradeCreate {
  name: string;
  display_order?: number;
  description?: string;
}

export interface GradeUpdate {
  name?: string;
  display_order?: number;
  description?: string;
  is_active?: boolean;
}

export interface Section {
  id: number;
  institution_id: number;
  grade_id: number;
  name: string;
  capacity?: number;
  current_strength?: number;
  class_teacher_id?: number;
  class_teacher_name?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SectionCreate {
  grade_id: number;
  name: string;
  capacity?: number;
  class_teacher_id?: number;
  description?: string;
}

export interface SectionUpdate {
  name?: string;
  capacity?: number;
  class_teacher_id?: number;
  description?: string;
  is_active?: boolean;
}

export interface Subject {
  id: number;
  institution_id: number;
  name: string;
  code: string;
  description?: string;
  is_elective: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubjectCreate {
  name: string;
  code: string;
  description?: string;
  is_elective?: boolean;
}

export interface SubjectUpdate {
  name?: string;
  code?: string;
  description?: string;
  is_elective?: boolean;
  is_active?: boolean;
}

export interface SubjectAssignment {
  id: number;
  institution_id: number;
  subject_id: number;
  subject_name: string;
  subject_code: string;
  grade_id: number;
  grade_name: string;
  section_id?: number;
  section_name?: string;
  teacher_id?: number;
  teacher_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubjectAssignmentCreate {
  subject_id: number;
  grade_id: number;
  section_id?: number;
  teacher_id?: number;
}

export interface SubjectAssignmentUpdate {
  teacher_id?: number;
  is_active?: boolean;
}

export interface Chapter {
  id: number;
  institution_id: number;
  subject_id: number;
  name: string;
  chapter_number: number;
  description?: string;
  learning_objectives?: string[];
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChapterCreate {
  subject_id: number;
  name: string;
  chapter_number: number;
  description?: string;
  learning_objectives?: string[];
  display_order?: number;
}

export interface ChapterUpdate {
  name?: string;
  chapter_number?: number;
  description?: string;
  learning_objectives?: string[];
  display_order?: number;
  is_active?: boolean;
}

export interface Topic {
  id: number;
  institution_id: number;
  chapter_id: number;
  name: string;
  description?: string;
  duration_hours?: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TopicCreate {
  chapter_id: number;
  name: string;
  description?: string;
  duration_hours?: number;
  display_order?: number;
}

export interface TopicUpdate {
  name?: string;
  description?: string;
  duration_hours?: number;
  display_order?: number;
  is_active?: boolean;
}

export interface Syllabus {
  id: number;
  institution_id: number;
  subject_id: number;
  grade_id: number;
  academic_year?: string;
  title: string;
  description?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SyllabusCreate {
  subject_id: number;
  grade_id: number;
  academic_year?: string;
  title: string;
  description?: string;
}

export interface SyllabusUpdate {
  title?: string;
  description?: string;
  academic_year?: string;
  is_active?: boolean;
}

export interface ClassTeacherAssignment {
  section_id: number;
  teacher_id: number;
}
