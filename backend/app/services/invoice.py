import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from app.models import Order

def generate_invoice_pdf(order: Order) -> io.BytesIO:
    buffer = io.BytesIO()
    
    # Page setup - 0.75 in (54 pt) margins
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0066ff'),
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'InvoiceSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#555555')
    )
    
    header_right_style = ParagraphStyle(
        'HeaderRight',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        alignment=2,  # Right-aligned
        textColor=colors.HexColor('#111111')
    )
    
    label_style = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#777777')
    )
    
    value_style = ParagraphStyle(
        'Value',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#111111')
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )
    
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#111111')
    )
    
    table_cell_bold_style = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#111111')
    )

    # 1. Header (Brand & Metadata)
    header_data = [
        [
            Paragraph("Mr_Laptop.lk", title_style),
            Paragraph(f"INVOICE<br/><font size=9 color='#777777'>Invoice #: {order.invoice_number or 'N/A'}</font>", header_right_style)
        ],
        [
            Paragraph(
                "99/A, Kalpitiya Road, Thanneerkuda,<br/>Ettalai, Puttalam, Sri Lanka<br/>Phone: +94 78 978 8848<br/>Email: aakilmohammed213@gmail.com",
                subtitle_style
            ),
            Paragraph(
                f"Date: {order.created_at.strftime('%Y-%m-%d')}<br/>Order #: {order.order_number}<br/>Payment: {order.payment_method}",
                value_style
            )
        ]
    ]
    
    header_table = Table(header_data, colWidths=[270, 234])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 20))
    
    # 2. Customer details section
    billing_data = [
        [Paragraph("BILL TO:", label_style), Paragraph("SHIP TO:", label_style)],
        [
            Paragraph(
                f"<b>{order.customer_name}</b><br/>"
                f"Email: {order.customer_email}<br/>"
                f"Phone: {order.customer_phone}",
                value_style
            ),
            Paragraph(
                f"<b>{order.customer_name}</b><br/>"
                f"{order.shipping_address}<br/>"
                f"{order.city}, {order.district}, {order.postal_code}",
                value_style
            )
        ]
    ]
    
    billing_table = Table(billing_data, colWidths=[250, 254])
    billing_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f9f9f9')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#eeeeee')),
        ('PADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,0), 2),
    ]))
    story.append(billing_table)
    story.append(Spacer(1, 20))
    
    # 3. Items Table
    items_data = [
        [
            Paragraph("Product Name", table_header_style),
            Paragraph("Unit Price", table_header_style),
            Paragraph("Qty", table_header_style),
            Paragraph("Total Amount", table_header_style)
        ]
    ]
    
    for item in order.items:
        items_data.append([
            Paragraph(item.product_name, table_cell_style),
            Paragraph(f"LKR {item.unit_price:,.2f}", table_cell_style),
            Paragraph(str(item.quantity), table_cell_style),
            Paragraph(f"LKR {item.total_price:,.2f}", table_cell_bold_style)
        ])
        
    items_table = Table(items_data, colWidths=[254, 100, 50, 100])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0066ff')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e0e0e0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#fcfcfc')]),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 15))
    
    # 4. Totals Block
    totals_data = [
        [Paragraph("Subtotal:", label_style), Paragraph(f"LKR {order.subtotal:,.2f}", value_style)],
        [Paragraph("Discount:", label_style), Paragraph(f"LKR {order.discount:,.2f}", value_style)],
        [Paragraph("Shipping:", label_style), Paragraph(f"LKR {order.shipping_fee:,.2f}", value_style)],
        [Paragraph("Grand Total:", label_style), Paragraph(f"LKR {order.total_amount:,.2f}", header_right_style)],
        [Paragraph("Status / Payment Status:", label_style), Paragraph(f"<b>{order.order_status}</b> / <b>{order.payment_status}</b>", value_style)]
    ]
    
    totals_table = Table(totals_data, colWidths=[384, 120])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,-1), (-1,-1), 0),
    ]))
    story.append(totals_table)
    
    # 5. Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer
