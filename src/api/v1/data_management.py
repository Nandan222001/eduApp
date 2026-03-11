from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import csv
import io
import json
from enum import Enum

from src.database import get_db
from src.models.user import User
from src.api.v1.auth import get_current_active_user

router = APIRouter()


class TableEntity(str, Enum):
    students = "students"
    teachers = "teachers"
    attendance = "attendance"
    examinations = "examinations"
    assignments = "assignments"
    grades = "grades"
    subjects = "subjects"
    classes = "classes"


class ExportFormat(str, Enum):
    csv = "csv"
    excel = "excel"
    pdf = "pdf"


class ColumnDefinition:
    def __init__(self, id: str, label: str, type: str, required: bool = False, default_value: str = None):
        self.id = id
        self.label = label
        self.type = type
        self.required = required
        self.default_value = default_value


ENTITY_METADATA = {
    "students": {
        "display_name": "Students",
        "description": "Student records including personal and academic information",
        "columns": [
            ColumnDefinition("id", "ID", "number", False),
            ColumnDefinition("first_name", "First Name", "string", True),
            ColumnDefinition("last_name", "Last Name", "string", True),
            ColumnDefinition("email", "Email", "string", True),
            ColumnDefinition("phone", "Phone", "string", False),
            ColumnDefinition("date_of_birth", "Date of Birth", "date", False),
            ColumnDefinition("admission_number", "Admission Number", "string", True),
            ColumnDefinition("grade", "Grade", "string", True),
            ColumnDefinition("section", "Section", "string", False),
            ColumnDefinition("parent_email", "Parent Email", "string", False),
            ColumnDefinition("created_at", "Created At", "date", False),
        ],
    },
    "teachers": {
        "display_name": "Teachers",
        "description": "Teacher records and assignment information",
        "columns": [
            ColumnDefinition("id", "ID", "number", False),
            ColumnDefinition("first_name", "First Name", "string", True),
            ColumnDefinition("last_name", "Last Name", "string", True),
            ColumnDefinition("email", "Email", "string", True),
            ColumnDefinition("phone", "Phone", "string", False),
            ColumnDefinition("subject", "Subject", "string", False),
            ColumnDefinition("employee_id", "Employee ID", "string", True),
            ColumnDefinition("created_at", "Created At", "date", False),
        ],
    },
    "attendance": {
        "display_name": "Attendance",
        "description": "Student attendance records",
        "columns": [
            ColumnDefinition("id", "ID", "number", False),
            ColumnDefinition("student_id", "Student ID", "number", True),
            ColumnDefinition("date", "Date", "date", True),
            ColumnDefinition("status", "Status", "string", True),
            ColumnDefinition("marked_by", "Marked By", "number", False),
            ColumnDefinition("remarks", "Remarks", "string", False),
            ColumnDefinition("created_at", "Created At", "date", False),
        ],
    },
}


@router.get("/data-management/entities")
async def get_entity_metadata(
    entity: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this feature")

    if entity and entity in ENTITY_METADATA:
        metadata = ENTITY_METADATA[entity]
        return [{
            "entity": entity,
            "displayName": metadata["display_name"],
            "description": metadata["description"],
            "columns": [
                {
                    "id": col.id,
                    "label": col.label,
                    "type": col.type,
                    "required": col.required,
                    "defaultValue": col.default_value,
                }
                for col in metadata["columns"]
            ],
        }]
    
    return [
        {
            "entity": key,
            "displayName": value["display_name"],
            "description": value["description"],
            "columns": [
                {
                    "id": col.id,
                    "label": col.label,
                    "type": col.type,
                    "required": col.required,
                    "defaultValue": col.default_value,
                }
                for col in value["columns"]
            ],
        }
        for key, value in ENTITY_METADATA.items()
    ]


@router.post("/data-management/export/preview")
async def get_export_preview(
    config: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this feature")

    entity = config.get("entity")
    columns = config.get("columns", [])
    
    sample_data = {
        "students": [
            {"id": 1, "first_name": "John", "last_name": "Doe", "email": "john@example.com", "grade": "10", "section": "A"},
            {"id": 2, "first_name": "Jane", "last_name": "Smith", "email": "jane@example.com", "grade": "10", "section": "B"},
        ],
        "teachers": [
            {"id": 1, "first_name": "Robert", "last_name": "Johnson", "email": "robert@example.com", "subject": "Mathematics"},
            {"id": 2, "first_name": "Emily", "last_name": "Davis", "email": "emily@example.com", "subject": "Science"},
        ],
    }
    
    data = sample_data.get(entity, [])
    
    filtered_data = []
    for row in data[:10]:
        filtered_row = {col: row.get(col, "") for col in columns}
        filtered_data.append(filtered_row)
    
    return {
        "columns": columns,
        "rows": filtered_data,
        "totalCount": len(data),
    }


@router.post("/data-management/export")
async def export_data(
    config: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this feature")

    entity = config.get("entity")
    format_type = config.get("format", "csv")
    columns = config.get("columns", [])
    
    sample_data = {
        "students": [
            {"id": 1, "first_name": "John", "last_name": "Doe", "email": "john@example.com", "grade": "10", "section": "A"},
            {"id": 2, "first_name": "Jane", "last_name": "Smith", "email": "jane@example.com", "grade": "10", "section": "B"},
        ],
    }
    
    data = sample_data.get(entity, [])
    
    if format_type == "csv":
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=columns)
        writer.writeheader()
        for row in data:
            filtered_row = {col: row.get(col, "") for col in columns}
            writer.writerow(filtered_row)
        
        content = output.getvalue()
        return StreamingResponse(
            io.BytesIO(content.encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={entity}_export.csv"}
        )
    
    raise HTTPException(status_code=400, detail="Unsupported format")


@router.get("/data-management/scheduled-exports")
async def get_scheduled_exports(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this feature")
    
    return []


@router.post("/data-management/scheduled-exports")
async def create_scheduled_export(
    config: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this feature")
    
    return config


@router.delete("/data-management/scheduled-exports/{export_id}")
async def delete_scheduled_export(
    export_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this feature")
    
    return {"status": "deleted"}


@router.post("/data-management/import/detect-columns")
async def detect_columns(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this feature")
    
    content = await file.read()
    
    if file.filename.endswith('.csv'):
        csv_file = io.StringIO(content.decode('utf-8'))
        reader = csv.reader(csv_file)
        columns = next(reader)
        return {"columns": columns}
    
    raise HTTPException(status_code=400, detail="Unsupported file format")


@router.post("/data-management/import/validate")
async def validate_import(
    file: UploadFile = File(...),
    entity: str = Form(...),
    column_mappings: str = Form(...),
    skip_first_row: bool = Form(True),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this feature")
    
    content = await file.read()
    mappings = json.loads(column_mappings)
    
    csv_file = io.StringIO(content.decode('utf-8'))
    reader = csv.DictReader(csv_file)
    
    rows = list(reader)
    errors = []
    warnings = []
    
    for idx, row in enumerate(rows[:5]):
        if not row.get('email'):
            errors.append({
                "row": idx + 1,
                "column": "email",
                "value": "",
                "error": "Email is required",
                "severity": "error"
            })
    
    return {
        "valid": len(errors) == 0,
        "totalRows": len(rows),
        "validRows": len(rows) - len(errors),
        "errors": errors,
        "warnings": warnings,
        "preview": rows[:5],
    }


@router.post("/data-management/import")
async def import_data(
    file: UploadFile = File(...),
    entity: str = Form(...),
    column_mappings: str = Form(...),
    skip_first_row: bool = Form(True),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this feature")
    
    content = await file.read()
    mappings = json.loads(column_mappings)
    
    csv_file = io.StringIO(content.decode('utf-8'))
    reader = csv.DictReader(csv_file)
    
    rows = list(reader)
    
    import_id = f"IMP_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    return {
        "success": True,
        "importedRows": len(rows),
        "failedRows": 0,
        "errors": [],
        "importId": import_id,
    }


@router.get("/data-management/import/history")
async def get_import_history(
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this feature")
    
    history = [
        {
            "id": "IMP_20240101120000",
            "entity": "students",
            "filename": "students_import.csv",
            "importedBy": f"{current_user.first_name} {current_user.last_name}",
            "importedAt": (datetime.now() - timedelta(days=1)).isoformat(),
            "totalRows": 150,
            "successfulRows": 148,
            "failedRows": 2,
            "status": "completed",
            "canRollback": True,
        },
    ]
    
    return history


@router.post("/data-management/import/{import_id}/rollback")
async def rollback_import(
    import_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this feature")
    
    return {"status": "rolled_back"}


@router.get("/data-management/import/{import_id}/errors")
async def download_import_errors(
    import_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this feature")
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Row", "Column", "Value", "Error"])
    writer.writerow([1, "email", "", "Email is required"])
    
    content = output.getvalue()
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=import_errors_{import_id}.csv"}
    )
