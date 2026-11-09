"""
TraceDoc – Synthetic Dataset & Adversarial Mutation Generator (Prompt 22)
Generates:
1. Clean hard-negative bundle: Split salary credits (40k + 25k) testing restraint
2. Tampered bundle: Salary slip manipulated from 65k to 95k with font/text modification
"""
import json
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def make_pdf(filename: str, title: str, rows: list[list[str]], subtitle: str = ""):
    doc = SimpleDocTemplate(filename, pagesize=letter, leftMargin=40, rightMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()

    t_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#0f172a"),
    )
    sub_style = ParagraphStyle(
        "DocSub",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#64748b"),
    )
    cell_style = ParagraphStyle(
        "CellText",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#1e293b"),
    )

    story = [
        Paragraph(f"<b>{title}</b>", t_style),
        Paragraph(subtitle or "SYNTHETIC TEST DATASET — FOR DEMONSTRATION PURPOSES ONLY", sub_style),
        Spacer(1, 15),
    ]

    table_data = []
    for r in rows:
        table_data.append([Paragraph(f"<b>{r[0]}</b>", cell_style), Paragraph(str(r[1]), cell_style)])

    t = Table(table_data, colWidths=[200, 320])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(t)
    doc.build(story)


def generate_clean_bundle(output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Application Form
    make_pdf(
        str(output_dir / "01_application_form.pdf"),
        "Personal Loan Application Form",
        [
            ["Applicant Name", "Rohan Mehta"],
            ["Employer Name", "Northstar Components Pvt Ltd"],
            ["Monthly Declared Income", "INR 65,000"],
            ["Loan Amount Requested", "INR 5,00,000"],
            ["Application Date", "2026-09-05"],
        ],
        "Northstar Financial Services - Application Document",
    )

    # 2. Salary Slip (Clean: Net Pay INR 65,000)
    make_pdf(
        str(output_dir / "02_salary_slip.pdf"),
        "Northstar Components Pvt Ltd - Payslip",
        [
            ["Employee Name", "Rohan Mehta"],
            ["Employer Name", "Northstar Components Pvt Ltd"],
            ["Pay Period Month", "September 2026"],
            ["Gross Pay", "INR 78,000"],
            ["Total Deductions", "INR 13,000"],
            ["Net Pay", "INR 65,000"],
        ],
        "Confidential Salary Statement",
    )

    # 3. Bank Statement (Split credits: 40k + 25k = 65k)
    make_pdf(
        str(output_dir / "03_bank_statement.pdf"),
        "Apex National Bank - Statement of Account",
        [
            ["Account Holder", "Rohan Mehta"],
            ["Statement Period", "01-Sep-2026 to 30-Sep-2026"],
            ["Opening Balance", "INR 12,450.00"],
            ["Credit Transaction 1", "02-Sep-2026 NORTHSTAR SAL 40,000.00 CR"],
            ["Credit Transaction 2", "04-Sep-2026 NORTHSTAR SAL PART2 25,000.00 CR"],
            ["Closing Balance", "INR 77,450.00"],
        ],
        "Account Statement (Verified Electronic Copy)",
    )

    # 4. Employer Declaration
    make_pdf(
        str(output_dir / "04_employer_declaration.pdf"),
        "Employment & Compensation Verification Certificate",
        [
            ["Employee Name", "Rohan Mehta"],
            ["Employer Name", "Northstar Components Pvt Ltd"],
            ["Designation", "Senior Systems Engineer"],
            ["Employment Period", "January 2024 to Present"],
            ["Monthly Net Pay", "INR 65,000"],
            ["Certification Date", "2026-09-02"],
        ],
        "Issued by HR Department, Northstar Components Pvt Ltd",
    )

    gt = {
        "bundle_type": "clean_hard_negative",
        "description": "Clean case with split salary payment (40,000 + 25,000) reconciling payslip net pay INR 65,000.",
        "expected_findings": [],
        "expected_hypothesis_outcomes": {
            "split_credit": "SUPPORTED",
            "posting_delay": "SUPPORTED",
        },
        "expected_status": "observation",
        "expected_residual_inr": 0.0,
    }
    (output_dir / "ground_truth.json").write_text(json.dumps(gt, indent=2), encoding="utf-8")


def generate_tampered_bundle(output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Application Form (Declares INR 95,000)
    make_pdf(
        str(output_dir / "01_application_form.pdf"),
        "Personal Loan Application Form",
        [
            ["Applicant Name", "Rohan Mehta"],
            ["Employer Name", "Northstar Components Pvt Ltd"],
            ["Monthly Declared Income", "INR 95,000"],
            ["Loan Amount Requested", "INR 8,00,000"],
            ["Application Date", "2026-09-05"],
        ],
        "Northstar Financial Services - Application Document",
    )

    # 2. Tampered Salary Slip (Net pay manipulated to INR 95,000, creating INR 30,000 conflict)
    make_pdf(
        str(output_dir / "02_salary_slip.pdf"),
        "Northstar Components Pvt Ltd - Payslip",
        [
            ["Employee Name", "Rohan Mehta"],
            ["Employer Name", "Northstar Components Pvt Ltd"],
            ["Pay Period Month", "September 2026"],
            ["Gross Pay", "INR 78,000"],
            ["Total Deductions", "INR 13,000"],
            ["Net Pay", "INR 95,000"],  # Mutated field
        ],
        "Confidential Salary Statement",
    )

    # 3. Bank Statement (Authentic bank statement showing genuine credits of INR 40,000 + INR 25,000 = INR 65,000)
    make_pdf(
        str(output_dir / "03_bank_statement.pdf"),
        "Apex National Bank - Statement of Account",
        [
            ["Account Holder", "Rohan Mehta"],
            ["Statement Period", "01-Sep-2026 to 30-Sep-2026"],
            ["Opening Balance", "INR 12,450.00"],
            ["Credit Transaction 1", "02-Sep-2026 NORTHSTAR SAL 40,000.00 CR"],
            ["Credit Transaction 2", "04-Sep-2026 NORTHSTAR SAL PART2 25,000.00 CR"],
            ["Closing Balance", "INR 77,450.00"],
        ],
        "Account Statement (Verified Electronic Copy)",
    )

    # 4. Employer Declaration (Authentic declaration showing net pay INR 65,000)
    make_pdf(
        str(output_dir / "04_employer_declaration.pdf"),
        "Employment & Compensation Verification Certificate",
        [
            ["Employee Name", "Rohan Mehta"],
            ["Employer Name", "Northstar Components Pvt Ltd"],
            ["Designation", "Senior Systems Engineer"],
            ["Employment Period", "January 2024 to Present"],
            ["Monthly Net Pay", "INR 65,000"],
            ["Certification Date", "2026-09-02"],
        ],
        "Issued by HR Department, Northstar Components Pvt Ltd",
    )

    gt = {
        "bundle_type": "tampered_positive",
        "description": "Manipulated payslip (Net Pay INR 95,000) conflicting with authentic bank statement (INR 65,000) and employer declaration (INR 65,000). Leaves INR 30,000 unexplained.",
        "expected_conflicts": ["RULE-PAYSLIP-ARITH-01", "RULE-CROSS-EMP-01", "RULE-CROSS-BANK-01"],
        "expected_residual_inr": 30000.0,
        "expected_hypothesis_outcomes": {
            "split_credit": "REJECTED",
            "posting_delay": "REJECTED",
            "gross_net_confusion": "REJECTED",
        },
        "expected_status": "potential_manipulation",
        "mutation_manifest": [
            {
                "document": "02_salary_slip.pdf",
                "field": "net_pay",
                "original_value": "INR 65,000",
                "tampered_value": "INR 95,000",
                "mutation_type": "arithmetic_and_context_alteration",
            }
        ],
    }
    (output_dir / "ground_truth.json").write_text(json.dumps(gt, indent=2), encoding="utf-8")


if __name__ == "__main__":
    base_data = Path(__file__).resolve().parent
    clean_dir = base_data / "clean_bundle"
    tampered_dir = base_data / "tampered_bundle"

    generate_clean_bundle(clean_dir)
    generate_tampered_bundle(tampered_dir)
    print("Bundles generated successfully.")
