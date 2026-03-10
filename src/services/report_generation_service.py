from datetime import datetime
from typing import Optional, Dict, Any, List
from io import BytesIO
import os
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
    PageBreak,
    Image as RLImage,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from reportlab.graphics.charts.piecharts import Pie

from sqlalchemy.orm import Session

from src.models.analytics import GeneratedReport, ReportStatus
from src.models.institution import Institution
from src.schemas.analytics import (
    ReportType,
    AnalyticsQueryParams,
    StudentMetrics,
    ClassMetrics,
    InstitutionMetrics,
    ExamAnalytics,
    YoYComparison,
    StudentPerformanceComparison,
)
from src.services.analytics_service import AnalyticsService


class ReportGenerationService:
    def __init__(self, db: Session, redis_client: Any = None):
        self.db = db
        self.analytics_service = AnalyticsService(db, redis_client)
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self) -> None:
        self.styles.add(
            ParagraphStyle(
                name="ReportTitle",
                parent=self.styles["Heading1"],
                fontSize=24,
                textColor=colors.HexColor("#1e3a8a"),
                spaceAfter=30,
                alignment=TA_CENTER,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="SectionTitle",
                parent=self.styles["Heading2"],
                fontSize=16,
                textColor=colors.HexColor("#2563eb"),
                spaceAfter=12,
                spaceBefore=12,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="MetricLabel",
                parent=self.styles["Normal"],
                fontSize=10,
                textColor=colors.HexColor("#64748b"),
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="MetricValue",
                parent=self.styles["Normal"],
                fontSize=14,
                textColor=colors.HexColor("#0f172a"),
                fontName="Helvetica-Bold",
            )
        )

    async def generate_report(
        self,
        institution_id: int,
        report_type: ReportType,
        report_title: str,
        parameters: AnalyticsQueryParams,
        generated_by_id: int,
        include_charts: bool = True,
    ) -> int:
        report = GeneratedReport(
            institution_id=institution_id,
            report_type=report_type,
            report_title=report_title,
            report_description=f"Generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}",
            generated_by_id=generated_by_id,
            parameters=parameters.json(),
            status=ReportStatus.PENDING,
        )
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)

        try:
            report.status = ReportStatus.PROCESSING
            report.started_at = datetime.utcnow()
            self.db.commit()

            pdf_buffer = await self._generate_pdf_report(
                institution_id, report_type, report_title, parameters, include_charts
            )

            file_path = self._save_report_file(
                report.id, institution_id, pdf_buffer
            )

            report.file_path = file_path
            report.file_size = len(pdf_buffer.getvalue())
            report.status = ReportStatus.COMPLETED
            report.completed_at = datetime.utcnow()
            self.db.commit()

        except Exception as e:
            report.status = ReportStatus.FAILED
            report.error_message = str(e)
            self.db.commit()
            raise

        return report.id

    def _save_report_file(
        self, report_id: int, institution_id: int, pdf_buffer: BytesIO
    ) -> str:
        reports_dir = Path("reports") / str(institution_id)
        reports_dir.mkdir(parents=True, exist_ok=True)

        file_name = f"report_{report_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        file_path = reports_dir / file_name

        with open(file_path, "wb") as f:
            f.write(pdf_buffer.getvalue())

        return str(file_path)

    async def _generate_pdf_report(
        self,
        institution_id: int,
        report_type: ReportType,
        report_title: str,
        parameters: AnalyticsQueryParams,
        include_charts: bool,
    ) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5 * inch)
        story = []

        institution = (
            self.db.query(Institution)
            .filter(Institution.id == institution_id)
            .first()
        )

        story.append(Paragraph(institution.name, self.styles["ReportTitle"]))
        story.append(Paragraph(report_title, self.styles["Heading2"]))
        story.append(
            Paragraph(
                f"Generated on: {datetime.utcnow().strftime('%B %d, %Y at %H:%M')}",
                self.styles["Normal"],
            )
        )
        story.append(Spacer(1, 0.3 * inch))

        if report_type == ReportType.STUDENT_PERFORMANCE:
            await self._add_student_performance_content(
                story, institution_id, parameters, include_charts
            )
        elif report_type == ReportType.CLASS_PERFORMANCE:
            await self._add_class_performance_content(
                story, institution_id, parameters, include_charts
            )
        elif report_type == ReportType.INSTITUTION_PERFORMANCE:
            await self._add_institution_performance_content(
                story, institution_id, parameters, include_charts
            )
        elif report_type == ReportType.EXAM_ANALYSIS:
            await self._add_exam_analysis_content(
                story, institution_id, parameters, include_charts
            )
        elif report_type == ReportType.YOY_COMPARISON:
            await self._add_yoy_comparison_content(
                story, institution_id, parameters, include_charts
            )

        doc.build(story)
        buffer.seek(0)
        return buffer

    async def _add_student_performance_content(
        self,
        story: List,
        institution_id: int,
        parameters: AnalyticsQueryParams,
        include_charts: bool,
    ) -> None:
        story.append(Paragraph("Student Performance Report", self.styles["SectionTitle"]))

        if not parameters.student_ids:
            story.append(Paragraph("No students selected.", self.styles["Normal"]))
            return

        for student_id in parameters.student_ids:
            try:
                metrics = await self.analytics_service.get_student_metrics(
                    institution_id, student_id, parameters
                )
                self._add_student_metrics_section(story, metrics, include_charts)
                story.append(Spacer(1, 0.2 * inch))
            except Exception as e:
                story.append(
                    Paragraph(
                        f"Error loading data for student {student_id}: {str(e)}",
                        self.styles["Normal"],
                    )
                )

    def _add_student_metrics_section(
        self, story: List, metrics: StudentMetrics, include_charts: bool
    ) -> None:
        story.append(
            Paragraph(f"Student: {metrics.student_name}", self.styles["Heading3"])
        )

        data = [
            ["Metric", "Value"],
            ["Average Percentage", f"{metrics.average_percentage}%"],
            ["Attendance Percentage", f"{metrics.attendance_percentage}%"],
            ["Exams Passed", f"{metrics.exams_passed}/{metrics.total_exams}"],
            ["Assignments Submitted", f"{metrics.assignments_submitted}/{metrics.total_assignments}"],
        ]

        if metrics.rank_in_class:
            data.append(["Rank in Class", str(metrics.rank_in_class)])
        if metrics.average_assignment_score:
            data.append(["Assignment Score", f"{metrics.average_assignment_score}%"])

        table = Table(data, colWidths=[3 * inch, 2 * inch])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563eb")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 12),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )
        story.append(table)

        if include_charts:
            chart = self._create_student_performance_chart(metrics)
            if chart:
                story.append(Spacer(1, 0.2 * inch))
                story.append(chart)

    def _create_student_performance_chart(self, metrics: StudentMetrics) -> Optional[Drawing]:
        try:
            drawing = Drawing(400, 200)
            chart = VerticalBarChart()
            chart.x = 50
            chart.y = 50
            chart.height = 125
            chart.width = 300
            chart.data = [
                [
                    metrics.average_percentage,
                    metrics.attendance_percentage,
                    metrics.average_assignment_score or 0,
                ]
            ]
            chart.categoryAxis.categoryNames = [
                "Exam %",
                "Attendance %",
                "Assignment %",
            ]
            chart.valueAxis.valueMin = 0
            chart.valueAxis.valueMax = 100
            chart.bars[0].fillColor = colors.HexColor("#2563eb")
            drawing.add(chart)
            return drawing
        except Exception:
            return None

    async def _add_class_performance_content(
        self,
        story: List,
        institution_id: int,
        parameters: AnalyticsQueryParams,
        include_charts: bool,
    ) -> None:
        story.append(Paragraph("Class Performance Report", self.styles["SectionTitle"]))

        if not parameters.section_ids:
            story.append(Paragraph("No classes selected.", self.styles["Normal"]))
            return

        for section_id in parameters.section_ids:
            try:
                metrics = await self.analytics_service.get_class_metrics(
                    institution_id, section_id, parameters
                )
                self._add_class_metrics_section(story, metrics, include_charts)
                story.append(Spacer(1, 0.3 * inch))
            except Exception as e:
                story.append(
                    Paragraph(
                        f"Error loading data for class {section_id}: {str(e)}",
                        self.styles["Normal"],
                    )
                )

    def _add_class_metrics_section(
        self, story: List, metrics: ClassMetrics, include_charts: bool
    ) -> None:
        story.append(
            Paragraph(
                f"Class: {metrics.section_name} ({metrics.grade_name})",
                self.styles["Heading3"],
            )
        )

        data = [
            ["Metric", "Value"],
            ["Total Students", str(metrics.total_students)],
            ["Active Students", str(metrics.active_students)],
            ["Average Exam %", f"{metrics.average_exam_percentage}%"],
            ["Pass Percentage", f"{metrics.pass_percentage}%"],
            ["Average Attendance %", f"{metrics.average_attendance_percentage}%"],
            ["Assignment Submission Rate", f"{metrics.assignment_submission_rate}%"],
        ]

        if metrics.highest_exam_percentage:
            data.append(["Highest Exam %", f"{metrics.highest_exam_percentage}%"])
        if metrics.lowest_exam_percentage:
            data.append(["Lowest Exam %", f"{metrics.lowest_exam_percentage}%"])

        table = Table(data, colWidths=[3 * inch, 2 * inch])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563eb")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 12),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )
        story.append(table)

        if include_charts:
            chart = self._create_class_performance_chart(metrics)
            if chart:
                story.append(Spacer(1, 0.2 * inch))
                story.append(chart)

    def _create_class_performance_chart(self, metrics: ClassMetrics) -> Optional[Drawing]:
        try:
            drawing = Drawing(400, 200)
            chart = VerticalBarChart()
            chart.x = 50
            chart.y = 50
            chart.height = 125
            chart.width = 300
            chart.data = [
                [
                    metrics.average_exam_percentage,
                    metrics.pass_percentage,
                    metrics.average_attendance_percentage,
                ]
            ]
            chart.categoryAxis.categoryNames = [
                "Avg Exam %",
                "Pass %",
                "Attendance %",
            ]
            chart.valueAxis.valueMin = 0
            chart.valueAxis.valueMax = 100
            chart.bars[0].fillColor = colors.HexColor("#10b981")
            drawing.add(chart)
            return drawing
        except Exception:
            return None

    async def _add_institution_performance_content(
        self,
        story: List,
        institution_id: int,
        parameters: AnalyticsQueryParams,
        include_charts: bool,
    ) -> None:
        story.append(
            Paragraph("Institution Performance Report", self.styles["SectionTitle"])
        )

        try:
            metrics = await self.analytics_service.get_institution_metrics(
                institution_id, parameters
            )
            self._add_institution_metrics_section(story, metrics, include_charts)
        except Exception as e:
            story.append(
                Paragraph(
                    f"Error loading institution data: {str(e)}", self.styles["Normal"]
                )
            )

    def _add_institution_metrics_section(
        self, story: List, metrics: InstitutionMetrics, include_charts: bool
    ) -> None:
        data = [
            ["Metric", "Value"],
            ["Total Students", str(metrics.total_students)],
            ["Active Students", str(metrics.active_students)],
            ["Total Teachers", str(metrics.total_teachers)],
            ["Total Classes", str(metrics.total_classes)],
            ["Overall Average %", f"{metrics.overall_average_percentage}%"],
            ["Overall Pass %", f"{metrics.overall_pass_percentage}%"],
            ["Overall Attendance %", f"{metrics.overall_attendance_percentage}%"],
            ["Total Exams Conducted", str(metrics.total_exams_conducted)],
            ["Total Assignments", str(metrics.total_assignments_created)],
            ["Assignment Submission Rate", f"{metrics.assignment_submission_rate}%"],
        ]

        table = Table(data, colWidths=[3 * inch, 2 * inch])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563eb")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 12),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )
        story.append(table)

        if include_charts:
            chart = self._create_institution_performance_chart(metrics)
            if chart:
                story.append(Spacer(1, 0.2 * inch))
                story.append(chart)

    def _create_institution_performance_chart(
        self, metrics: InstitutionMetrics
    ) -> Optional[Drawing]:
        try:
            drawing = Drawing(400, 200)
            chart = Pie()
            chart.x = 150
            chart.y = 50
            chart.width = 100
            chart.height = 100
            chart.data = [
                metrics.overall_pass_percentage,
                100 - metrics.overall_pass_percentage,
            ]
            chart.labels = ["Pass", "Fail"]
            chart.slices[0].fillColor = colors.HexColor("#10b981")
            chart.slices[1].fillColor = colors.HexColor("#ef4444")
            drawing.add(chart)
            return drawing
        except Exception:
            return None

    async def _add_exam_analysis_content(
        self,
        story: List,
        institution_id: int,
        parameters: AnalyticsQueryParams,
        include_charts: bool,
    ) -> None:
        story.append(Paragraph("Exam Analysis Report", self.styles["SectionTitle"]))
        story.append(
            Paragraph(
                "Exam analysis requires exam_id in parameters.", self.styles["Normal"]
            )
        )

    async def _add_yoy_comparison_content(
        self,
        story: List,
        institution_id: int,
        parameters: AnalyticsQueryParams,
        include_charts: bool,
    ) -> None:
        story.append(
            Paragraph("Year-over-Year Comparison Report", self.styles["SectionTitle"])
        )

        try:
            comparisons = await self.analytics_service.get_yoy_comparison(
                institution_id, parameters
            )
            self._add_yoy_comparison_section(story, comparisons, include_charts)
        except Exception as e:
            story.append(
                Paragraph(f"Error loading YoY data: {str(e)}", self.styles["Normal"])
            )

    def _add_yoy_comparison_section(
        self, story: List, comparisons: List[YoYComparison], include_charts: bool
    ) -> None:
        data = [["Metric", "Current Year", "Previous Year", "Change %", "Trend"]]

        for comp in comparisons:
            data.append(
                [
                    comp.metric_name,
                    f"{comp.current_year_value:.2f}",
                    f"{comp.previous_year_value:.2f}" if comp.previous_year_value else "N/A",
                    f"{comp.change_percentage:.2f}%" if comp.change_percentage else "N/A",
                    comp.trend.capitalize(),
                ]
            )

        table = Table(data, colWidths=[2 * inch, 1.2 * inch, 1.2 * inch, 1 * inch, 1 * inch])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563eb")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )
        story.append(table)

        if include_charts:
            chart = self._create_yoy_comparison_chart(comparisons)
            if chart:
                story.append(Spacer(1, 0.2 * inch))
                story.append(chart)

    def _create_yoy_comparison_chart(
        self, comparisons: List[YoYComparison]
    ) -> Optional[Drawing]:
        try:
            drawing = Drawing(400, 250)
            chart = VerticalBarChart()
            chart.x = 50
            chart.y = 50
            chart.height = 150
            chart.width = 300

            current_values = [c.current_year_value for c in comparisons[:5]]
            previous_values = [
                c.previous_year_value if c.previous_year_value else 0
                for c in comparisons[:5]
            ]

            chart.data = [current_values, previous_values]
            chart.categoryAxis.categoryNames = [c.metric_name[:15] for c in comparisons[:5]]
            chart.bars[0].fillColor = colors.HexColor("#2563eb")
            chart.bars[1].fillColor = colors.HexColor("#94a3b8")
            drawing.add(chart)
            return drawing
        except Exception:
            return None

    def get_report(self, institution_id: int, report_id: int) -> Optional[GeneratedReport]:
        return (
            self.db.query(GeneratedReport)
            .filter(
                GeneratedReport.id == report_id,
                GeneratedReport.institution_id == institution_id,
            )
            .first()
        )

    def list_reports(
        self,
        institution_id: int,
        report_type: Optional[ReportType] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[GeneratedReport]:
        query = self.db.query(GeneratedReport).filter(
            GeneratedReport.institution_id == institution_id
        )

        if report_type:
            query = query.filter(GeneratedReport.report_type == report_type)

        return query.order_by(GeneratedReport.created_at.desc()).limit(limit).offset(offset).all()
