import csv
import io
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session, joinedload

from src.models.institution import Institution
from src.models.school_admin import (
    PayrollPaymentStatus,
    StaffDepartment,
    StaffMember,
    StaffPayroll,
    StaffStatus,
)


class StaffService:
    def __init__(self, db: Session):
        self.db = db

    def create_staff(
        self,
        institution_id: int,
        employee_id: str,
        first_name: str,
        last_name: str,
        department: str,
        email: str | None = None,
        phone: str | None = None,
        designation: str | None = None,
        date_of_birth: date | None = None,
        gender: str | None = None,
        address: str | None = None,
        qualification: str | None = None,
        joining_date: date | None = None,
        bank_account_number: str | None = None,
        bank_name: str | None = None,
        ifsc_code: str | None = None,
        pan_number: str | None = None,
        aadhar_number: str | None = None,
        basic_salary: Decimal | None = None,
        photo_url: str | None = None,
        status: str = StaffStatus.ACTIVE.value,
    ) -> StaffMember:
        existing = self.db.query(StaffMember).filter(
            StaffMember.institution_id == institution_id,
            or_(
                StaffMember.employee_id == employee_id,
                and_(StaffMember.email == email, email is not None),
            ),
        ).first()

        if existing:
            if existing.employee_id == employee_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Staff with this employee ID already exists",
                )
            if existing.email == email and email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Staff with this email already exists",
                )

        staff = StaffMember(
            institution_id=institution_id,
            employee_id=employee_id,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            designation=designation,
            department=department,
            date_of_birth=date_of_birth,
            gender=gender,
            address=address,
            qualification=qualification,
            joining_date=joining_date,
            bank_account_number=bank_account_number,
            bank_name=bank_name,
            ifsc_code=ifsc_code,
            pan_number=pan_number,
            aadhar_number=aadhar_number,
            basic_salary=basic_salary,
            photo_url=photo_url,
            status=status,
            is_active=status == StaffStatus.ACTIVE.value,
        )

        self.db.add(staff)
        self.db.commit()
        self.db.refresh(staff)
        return staff

    def update_staff(
        self, staff_id: int, update_data: dict[str, Any]
    ) -> StaffMember | None:
        staff = self.db.query(StaffMember).filter(StaffMember.id == staff_id).first()
        if not staff:
            return None

        if "employee_id" in update_data and update_data["employee_id"] != staff.employee_id:
            existing = (
                self.db.query(StaffMember)
                .filter(
                    StaffMember.institution_id == staff.institution_id,
                    StaffMember.employee_id == update_data["employee_id"],
                    StaffMember.id != staff_id,
                )
                .first()
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Staff with this employee ID already exists",
                )

        if "email" in update_data and update_data["email"] != staff.email:
            existing = (
                self.db.query(StaffMember)
                .filter(
                    StaffMember.institution_id == staff.institution_id,
                    StaffMember.email == update_data["email"],
                    StaffMember.id != staff_id,
                )
                .first()
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Staff with this email already exists",
                )

        for key, value in update_data.items():
            if hasattr(staff, key):
                setattr(staff, key, value)

        if "status" in update_data:
            staff.is_active = update_data["status"] == StaffStatus.ACTIVE.value

        self.db.commit()
        self.db.refresh(staff)
        return staff

    def list_staff(
        self,
        institution_id: int,
        skip: int = 0,
        limit: int = 100,
        department: str | None = None,
        status: str | None = None,
        search: str | None = None,
    ) -> tuple[list[StaffMember], int]:
        query = self.db.query(StaffMember).filter(
            StaffMember.institution_id == institution_id
        )

        if department:
            query = query.filter(StaffMember.department == department)

        if status:
            query = query.filter(StaffMember.status == status)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    StaffMember.first_name.ilike(search_pattern),
                    StaffMember.last_name.ilike(search_pattern),
                    StaffMember.email.ilike(search_pattern),
                    StaffMember.employee_id.ilike(search_pattern),
                    StaffMember.phone.ilike(search_pattern),
                )
            )

        total = query.count()
        staff_members = (
            query.order_by(StaffMember.first_name, StaffMember.last_name)
            .offset(skip)
            .limit(limit)
            .all()
        )

        return staff_members, total

    def get_staff_profile(self, staff_id: int) -> StaffMember | None:
        return (
            self.db.query(StaffMember)
            .options(joinedload(StaffMember.institution))
            .filter(StaffMember.id == staff_id)
            .first()
        )

    def bulk_import_staff(
        self, institution_id: int, file: UploadFile
    ) -> dict[str, Any]:
        if not file.filename.endswith(".csv"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only CSV files are supported",
            )

        contents = file.file.read()
        csv_file = io.StringIO(contents.decode("utf-8"))
        csv_reader = csv.DictReader(csv_file)

        created_count = 0
        error_count = 0
        errors = []

        for row_num, row in enumerate(csv_reader, start=2):
            try:
                staff_data = {
                    "institution_id": institution_id,
                    "employee_id": row.get("employee_id", "").strip(),
                    "first_name": row.get("first_name", "").strip(),
                    "last_name": row.get("last_name", "").strip(),
                    "email": row.get("email", "").strip() or None,
                    "phone": row.get("phone", "").strip() or None,
                    "designation": row.get("designation", "").strip() or None,
                    "department": row.get("department", StaffDepartment.NON_TEACHING.value).strip(),
                    "qualification": row.get("qualification", "").strip() or None,
                    "gender": row.get("gender", "").strip() or None,
                    "address": row.get("address", "").strip() or None,
                    "bank_account_number": row.get("bank_account_number", "").strip() or None,
                    "bank_name": row.get("bank_name", "").strip() or None,
                    "ifsc_code": row.get("ifsc_code", "").strip() or None,
                    "pan_number": row.get("pan_number", "").strip() or None,
                    "aadhar_number": row.get("aadhar_number", "").strip() or None,
                    "status": row.get("status", StaffStatus.ACTIVE.value).strip(),
                }

                if row.get("date_of_birth"):
                    try:
                        staff_data["date_of_birth"] = datetime.strptime(
                            row["date_of_birth"].strip(), "%Y-%m-%d"
                        ).date()
                    except ValueError:
                        pass

                if row.get("joining_date"):
                    try:
                        staff_data["joining_date"] = datetime.strptime(
                            row["joining_date"].strip(), "%Y-%m-%d"
                        ).date()
                    except ValueError:
                        pass

                if row.get("basic_salary"):
                    try:
                        staff_data["basic_salary"] = Decimal(row["basic_salary"].strip())
                    except (ValueError, TypeError):
                        pass

                existing = (
                    self.db.query(StaffMember)
                    .filter(
                        StaffMember.institution_id == institution_id,
                        StaffMember.employee_id == staff_data["employee_id"],
                    )
                    .first()
                )

                if existing:
                    errors.append(
                        {
                            "row": row_num,
                            "error": f"Employee ID {staff_data['employee_id']} already exists",
                        }
                    )
                    error_count += 1
                    continue

                staff = StaffMember(**staff_data)
                staff.is_active = staff.status == StaffStatus.ACTIVE.value
                self.db.add(staff)
                created_count += 1

            except Exception as e:
                errors.append({"row": row_num, "error": str(e)})
                error_count += 1

        self.db.commit()

        return {
            "created_count": created_count,
            "error_count": error_count,
            "errors": errors,
        }

    def generate_monthly_payroll(
        self, institution_id: int, month: int, year: int
    ) -> dict[str, Any]:
        if month < 1 or month > 12:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid month. Must be between 1 and 12",
            )

        existing_payrolls = (
            self.db.query(StaffPayroll)
            .filter(
                StaffPayroll.institution_id == institution_id,
                StaffPayroll.month == month,
                StaffPayroll.year == year,
            )
            .first()
        )

        if existing_payrolls:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payroll for {month}/{year} has already been generated",
            )

        active_staff = (
            self.db.query(StaffMember)
            .filter(
                StaffMember.institution_id == institution_id,
                StaffMember.status == StaffStatus.ACTIVE.value,
                StaffMember.is_active is True,
                StaffMember.basic_salary.isnot(None),
            )
            .all()
        )

        if not active_staff:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active staff members with salary information found",
            )

        payrolls_created = 0

        for staff in active_staff:
            basic_salary = staff.basic_salary or Decimal("0")

            hra = basic_salary * Decimal("0.40")
            da = basic_salary * Decimal("0.15")
            ta = basic_salary * Decimal("0.10")
            special_allowance = basic_salary * Decimal("0.05")

            gross_salary = basic_salary + hra + da + ta + special_allowance

            pf_deduction = basic_salary * Decimal("0.12")
            esi_deduction = (
                gross_salary * Decimal("0.0075") if gross_salary <= Decimal("21000") else Decimal("0")
            )
            professional_tax = Decimal("200") if gross_salary > Decimal("15000") else Decimal("0")
            tds = Decimal("0")
            other_deductions = Decimal("0")

            net_salary = gross_salary - (
                pf_deduction + esi_deduction + professional_tax + tds + other_deductions
            )

            payroll = StaffPayroll(
                institution_id=institution_id,
                staff_id=staff.id,
                month=month,
                year=year,
                basic_salary=basic_salary,
                hra=hra,
                da=da,
                ta=ta,
                special_allowance=special_allowance,
                pf_deduction=pf_deduction,
                esi_deduction=esi_deduction,
                professional_tax=professional_tax,
                tds=tds,
                other_deductions=other_deductions,
                gross_salary=gross_salary,
                net_salary=net_salary,
                payment_status=PayrollPaymentStatus.PENDING.value,
            )

            self.db.add(payroll)
            payrolls_created += 1

        self.db.commit()

        return {
            "success": True,
            "message": f"Payroll generated for {payrolls_created} staff members",
            "month": month,
            "year": year,
            "payrolls_created": payrolls_created,
        }

    def process_payroll(
        self,
        institution_id: int,
        month: int,
        year: int,
        staff_ids: list[int] | None = None,
        payment_date: date | None = None,
        transaction_reference: str | None = None,
    ) -> dict[str, Any]:
        query = self.db.query(StaffPayroll).filter(
            StaffPayroll.institution_id == institution_id,
            StaffPayroll.month == month,
            StaffPayroll.year == year,
            StaffPayroll.payment_status == PayrollPaymentStatus.PENDING.value,
        )

        if staff_ids:
            query = query.filter(StaffPayroll.staff_id.in_(staff_ids))

        payrolls = query.all()

        if not payrolls:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No pending payrolls found for the specified criteria",
            )

        processed_count = 0
        payment_date = payment_date or date.today()

        for payroll in payrolls:
            payroll.payment_status = PayrollPaymentStatus.PAID.value
            payroll.payment_date = payment_date
            payroll.transaction_reference = transaction_reference
            processed_count += 1

        self.db.commit()

        return {
            "success": True,
            "processed_count": processed_count,
            "payment_date": payment_date.isoformat(),
            "transaction_reference": transaction_reference,
        }

    def get_payroll_report(
        self, institution_id: int, month: int, year: int
    ) -> dict[str, Any]:
        payrolls = (
            self.db.query(
                StaffPayroll,
                StaffMember.department,
                StaffMember.first_name,
                StaffMember.last_name,
            )
            .join(StaffMember, StaffPayroll.staff_id == StaffMember.id)
            .filter(
                StaffPayroll.institution_id == institution_id,
                StaffPayroll.month == month,
                StaffPayroll.year == year,
            )
            .all()
        )

        if not payrolls:
            return {
                "month": month,
                "year": year,
                "total_staff": 0,
                "total_gross_salary": 0,
                "total_deductions": 0,
                "total_net_salary": 0,
                "department_wise": {},
                "month_over_month": {},
            }

        department_wise = {}
        total_gross = Decimal("0")
        total_deductions = Decimal("0")
        total_net = Decimal("0")

        for payroll, department, _first_name, _last_name in payrolls:
            if department not in department_wise:
                department_wise[department] = {
                    "staff_count": 0,
                    "total_gross_salary": Decimal("0"),
                    "total_deductions": Decimal("0"),
                    "total_net_salary": Decimal("0"),
                }

            deductions = (
                payroll.pf_deduction
                + payroll.esi_deduction
                + payroll.professional_tax
                + payroll.tds
                + payroll.other_deductions
            )

            department_wise[department]["staff_count"] += 1
            department_wise[department]["total_gross_salary"] += payroll.gross_salary
            department_wise[department]["total_deductions"] += deductions
            department_wise[department]["total_net_salary"] += payroll.net_salary

            total_gross += payroll.gross_salary
            total_deductions += deductions
            total_net += payroll.net_salary

        for dept in department_wise:
            department_wise[dept]["total_gross_salary"] = float(
                department_wise[dept]["total_gross_salary"]
            )
            department_wise[dept]["total_deductions"] = float(
                department_wise[dept]["total_deductions"]
            )
            department_wise[dept]["total_net_salary"] = float(
                department_wise[dept]["total_net_salary"]
            )

        prev_month = month - 1 if month > 1 else 12
        prev_year = year if month > 1 else year - 1

        prev_payrolls = (
            self.db.query(
                func.sum(StaffPayroll.gross_salary).label("total_gross"),
                func.sum(StaffPayroll.net_salary).label("total_net"),
                func.count(StaffPayroll.id).label("staff_count"),
            )
            .filter(
                StaffPayroll.institution_id == institution_id,
                StaffPayroll.month == prev_month,
                StaffPayroll.year == prev_year,
            )
            .first()
        )

        mom_comparison = {}
        if prev_payrolls and prev_payrolls.staff_count:
            prev_gross = prev_payrolls.total_gross or Decimal("0")
            prev_net = prev_payrolls.total_net or Decimal("0")

            gross_change = (
                ((total_gross - prev_gross) / prev_gross * 100) if prev_gross else 0
            )
            net_change = ((total_net - prev_net) / prev_net * 100) if prev_net else 0
            staff_change = len(payrolls) - prev_payrolls.staff_count

            mom_comparison = {
                "previous_month": f"{prev_month}/{prev_year}",
                "previous_total_gross": float(prev_gross),
                "previous_total_net": float(prev_net),
                "previous_staff_count": prev_payrolls.staff_count,
                "gross_salary_change_percent": float(gross_change),
                "net_salary_change_percent": float(net_change),
                "staff_count_change": staff_change,
            }

        return {
            "month": month,
            "year": year,
            "total_staff": len(payrolls),
            "total_gross_salary": float(total_gross),
            "total_deductions": float(total_deductions),
            "total_net_salary": float(total_net),
            "department_wise": department_wise,
            "month_over_month": mom_comparison,
        }

    def get_payroll_slip(
        self, institution_id: int, staff_id: int, month: int, year: int
    ) -> dict[str, Any] | None:
        payroll = (
            self.db.query(StaffPayroll)
            .join(StaffMember, StaffPayroll.staff_id == StaffMember.id)
            .filter(
                StaffPayroll.institution_id == institution_id,
                StaffPayroll.staff_id == staff_id,
                StaffPayroll.month == month,
                StaffPayroll.year == year,
            )
            .first()
        )

        if not payroll:
            return None

        staff = payroll.staff_member
        institution = (
            self.db.query(Institution)
            .filter(Institution.id == institution_id)
            .first()
        )

        earnings = {
            "basic_salary": float(payroll.basic_salary),
            "hra": float(payroll.hra),
            "da": float(payroll.da),
            "ta": float(payroll.ta),
            "special_allowance": float(payroll.special_allowance),
        }

        deductions = {
            "pf_deduction": float(payroll.pf_deduction),
            "esi_deduction": float(payroll.esi_deduction),
            "professional_tax": float(payroll.professional_tax),
            "tds": float(payroll.tds),
            "other_deductions": float(payroll.other_deductions),
        }

        return {
            "institution_name": institution.name if institution else "",
            "month": month,
            "year": year,
            "staff": {
                "id": staff.id,
                "employee_id": staff.employee_id,
                "name": f"{staff.first_name} {staff.last_name}",
                "designation": staff.designation,
                "department": staff.department,
                "bank_account_number": staff.bank_account_number,
                "bank_name": staff.bank_name,
                "pan_number": staff.pan_number,
            },
            "earnings": earnings,
            "deductions": deductions,
            "gross_salary": float(payroll.gross_salary),
            "total_deductions": float(sum(deductions.values())),
            "net_salary": float(payroll.net_salary),
            "payment_status": payroll.payment_status,
            "payment_date": payroll.payment_date.isoformat() if payroll.payment_date else None,
            "transaction_reference": payroll.transaction_reference,
        }
