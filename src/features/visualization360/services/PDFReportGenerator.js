/**
 * PDF Report Generation Service
 * Creates professional PDF reports with visualizations, measurements, and estimates
 * Phase 2 Feature
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class PDFReportGenerator {
  constructor() {
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 20;
    this.lineHeight = 7;
    this.currentY = this.margin;
  }

  /**
   * Generate complete project report
   */
  async generateReport(projectData) {
    const pdf = new jsPDF('p', 'mm', 'a4');
    this.currentY = this.margin;

    // Page 1: Cover Page
    await this.addCoverPage(pdf, projectData);

    // Page 2: Project Overview
    pdf.addPage();
    this.currentY = this.margin;
    await this.addProjectOverview(pdf, projectData);

    // Page 3: Visualizations (Before/After)
    pdf.addPage();
    this.currentY = this.margin;
    await this.addVisualizations(pdf, projectData);

    // Page 4: Measurements & Specifications
    pdf.addPage();
    this.currentY = this.margin;
    this.addMeasurements(pdf, projectData);

    // Page 5: Product Details
    pdf.addPage();
    this.currentY = this.margin;
    this.addProductDetails(pdf, projectData);

    // Page 6: Cost Estimate
    pdf.addPage();
    this.currentY = this.margin;
    this.addCostEstimate(pdf, projectData);

    // Footer on all pages
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      this.addFooter(pdf, i, totalPages, projectData);
    }

    return pdf;
  }

  /**
   * Add cover page
   */
  addCoverPage(pdf, data) {
    // Company Logo/Header
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 64, 175); // Blue
    pdf.text('Project Visualization Report', this.pageWidth / 2, 60, { align: 'center' });

    // Project Title
    pdf.setFontSize(18);
    pdf.setTextColor(50, 50, 50);
    pdf.text(data.projectName || 'Roof & Exterior Project', this.pageWidth / 2, 80, { align: 'center' });

    // Customer Info
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Customer: ${data.customerName || 'N/A'}`, this.pageWidth / 2, 100, { align: 'center' });
    pdf.text(`Address: ${data.address || 'N/A'}`, this.pageWidth / 2, 110, { align: 'center' });

    // Date
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, this.pageWidth / 2, 130, { align: 'center' });

    // Decorative line
    pdf.setDrawColor(30, 64, 175);
    pdf.setLineWidth(0.5);
    pdf.line(this.margin, 150, this.pageWidth - this.margin, 150);

    // Company Info
    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    const companyInfo = [
      'Powered by Rime + Malarkey',
      'AI-Driven Visualization Technology',
      'Contact: sales@rimehq.net',
      'www.rimehq.net'
    ];

    let y = 170;
    companyInfo.forEach(line => {
      pdf.text(line, this.pageWidth / 2, y, { align: 'center' });
      y += 7;
    });

    // Branding Image (if available)
    // pdf.addImage(logoImage, 'PNG', this.pageWidth / 2 - 25, 200, 50, 50);
  }

  /**
   * Add project overview
   */
  async addProjectOverview(pdf, data) {
    this.addSectionTitle(pdf, 'Project Overview');

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);

    const overview = [
      { label: 'Project Type', value: data.projectType || 'Roof Replacement & Lighting' },
      { label: 'Property Address', value: data.address || 'N/A' },
      { label: 'Customer', value: data.customerName || 'N/A' },
      { label: 'Project Date', value: new Date().toLocaleDateString() },
      { label: 'Estimated Duration', value: data.duration || '3-5 days' },
      { label: 'Warranty', value: data.warranty || '25 years (Malarkey)' }
    ];

    overview.forEach(item => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${item.label}:`, this.margin, this.currentY);

      pdf.setFont('helvetica', 'normal');
      pdf.text(item.value, this.margin + 50, this.currentY);

      this.currentY += this.lineHeight;
    });

    this.currentY += 10;

    // Project Description
    this.addSectionTitle(pdf, 'Description', 14);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const description = data.description ||
      'This project includes complete roof replacement with Malarkey Legacy shingles, ' +
      'Rime permanent lighting installation, and enhanced curb appeal visualization.';

    const lines = pdf.splitTextToSize(description, this.pageWidth - 2 * this.margin);
    lines.forEach(line => {
      pdf.text(line, this.margin, this.currentY);
      this.currentY += 6;
    });
  }

  /**
   * Add before/after visualizations
   */
  async addVisualizations(pdf, data) {
    this.addSectionTitle(pdf, 'Visual Comparison');

    const imageWidth = (this.pageWidth - 3 * this.margin) / 2;
    const imageHeight = 80;

    // Before Image
    if (data.images?.before) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Before', this.margin, this.currentY);
      this.currentY += 7;

      try {
        // Capture current view as image
        const beforeCanvas = await this.captureVisualization(data.images.before);
        const beforeImage = beforeCanvas.toDataURL('image/jpeg', 0.9);

        pdf.addImage(beforeImage, 'JPEG', this.margin, this.currentY, imageWidth, imageHeight);
      } catch (error) {
        console.error('Failed to add before image:', error);
      }
    }

    // After Image
    if (data.images?.after || data.images?.before) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('After', this.margin + imageWidth + 10, this.currentY - 7);

      try {
        const afterCanvas = await this.captureVisualization(data.images.after || data.images.before, data);
        const afterImage = afterCanvas.toDataURL('image/jpeg', 0.9);

        pdf.addImage(afterImage, 'JPEG', this.margin + imageWidth + 10, this.currentY, imageWidth, imageHeight);
      } catch (error) {
        console.error('Failed to add after image:', error);
      }
    }

    this.currentY += imageHeight + 15;

    // Key Changes
    this.addSectionTitle(pdf, 'Key Improvements', 14);

    const improvements = [
      `✓ ${data.shingleColor || 'Premium'} Malarkey Legacy Shingles`,
      '✓ Rime Permanent LED Lighting System',
      '✓ Enhanced Curb Appeal',
      '✓ Energy-Efficient Materials',
      '✓ 25-Year Warranty Coverage'
    ];

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    improvements.forEach(item => {
      pdf.text(item, this.margin + 5, this.currentY);
      this.currentY += 6;
    });
  }

  /**
   * Add measurements section
   */
  addMeasurements(pdf, data) {
    this.addSectionTitle(pdf, 'Measurements & Specifications');

    const measurements = data.measurements || {};

    // Measurements Table
    const tableData = [
      ['Measurement', 'Value', 'Notes'],
      ['Roof Area', `${measurements.roofArea || 'TBD'} sq ft`, 'Total coverage area'],
      ['Roof Pitch', `${measurements.pitch || 'TBD'}°`, 'Average slope'],
      ['Perimeter', `${measurements.perimeter || 'TBD'} ft`, 'Total edge length'],
      ['Lighting Length', `${measurements.lightingLength || 'TBD'} ft`, 'Rime track length'],
      ['Ridge Length', `${measurements.ridgeLength || 'TBD'} ft`, 'Peak ventilation'],
      ['Gutter Length', `${measurements.gutterLength || 'TBD'} ft`, 'Drainage system']
    ];

    this.addTable(pdf, tableData);

    this.currentY += 10;

    // Specifications
    this.addSectionTitle(pdf, 'Technical Specifications', 14);

    pdf.setFontSize(10);
    const specs = [
      'Roofing System: Malarkey Legacy Series',
      'Underlayment: Synthetic, ice & water barrier',
      'Ventilation: Ridge vent + soffit vents',
      'Lighting: Rime permanent LED (RGBW)',
      'Control: WiFi-enabled smart control',
      'Installation: Professional certified crew'
    ];

    specs.forEach(spec => {
      pdf.text(`• ${spec}`, this.margin + 5, this.currentY);
      this.currentY += 6;
    });
  }

  /**
   * Add product details
   */
  addProductDetails(pdf, data) {
    this.addSectionTitle(pdf, 'Product Details');

    // Malarkey Shingles
    this.addProductSection(pdf, 'Malarkey Legacy Shingles', {
      color: data.shingleColor || 'Weathered Wood',
      warranty: '25 Years Limited',
      class: 'Class 4 Impact Resistance',
      windRating: '130 MPH',
      features: ['Algae resistant', 'Energy Star rated', 'Recycled content']
    });

    this.currentY += 5;

    // Rime Lighting
    this.addProductSection(pdf, 'Rime Permanent Lighting', {
      type: 'RGBW LED System',
      control: 'WiFi + Mobile App',
      colors: '16 million+ colors',
      warranty: '5 Years',
      features: ['Weather resistant', 'Energy efficient', 'Programmable patterns']
    });

    this.currentY += 5;

    // Additional Products
    if (data.additionalProducts && data.additionalProducts.length > 0) {
      this.addSectionTitle(pdf, 'Additional Products', 14);

      data.additionalProducts.forEach(product => {
        pdf.setFontSize(10);
        pdf.text(`• ${product.name}: ${product.description}`, this.margin + 5, this.currentY);
        this.currentY += 6;
      });
    }
  }

  /**
   * Add cost estimate
   */
  addCostEstimate(pdf, data) {
    this.addSectionTitle(pdf, 'Cost Estimate');

    const estimate = data.estimate || {};

    // Cost breakdown table
    const costData = [
      ['Item', 'Quantity', 'Unit Price', 'Total'],
      ['Malarkey Shingles', `${estimate.shingleSquares || 'TBD'} sq`, `$${estimate.shinglePrice || '0'}`, `$${estimate.shingleTotal || '0'}`],
      ['Underlayment', `${estimate.underlaymentSq || 'TBD'} sq`, `$${estimate.underlaymentPrice || '0'}`, `$${estimate.underlaymentTotal || '0'}`],
      ['Rime Lighting', `${estimate.lightingFt || 'TBD'} ft`, `$${estimate.lightingPrice || '0'}`, `$${estimate.lightingTotal || '0'}`],
      ['Labor - Roofing', 'Flat rate', '-', `$${estimate.laborRoof || '0'}`],
      ['Labor - Lighting', 'Flat rate', '-', `$${estimate.laborLighting || '0'}`],
      ['Permit & Disposal', 'Flat rate', '-', `$${estimate.permits || '0'}`]
    ];

    this.addTable(pdf, costData, true);

    // Totals
    this.currentY += 5;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');

    const subtotal = estimate.subtotal || 0;
    const tax = estimate.tax || 0;
    const total = estimate.total || 0;

    pdf.text(`Subtotal:`, this.pageWidth - this.margin - 60, this.currentY, { align: 'left' });
    pdf.text(`$${subtotal.toLocaleString()}`, this.pageWidth - this.margin, this.currentY, { align: 'right' });
    this.currentY += 7;

    pdf.text(`Tax (${estimate.taxRate || 7}%):`, this.pageWidth - this.margin - 60, this.currentY, { align: 'left' });
    pdf.text(`$${tax.toLocaleString()}`, this.pageWidth - this.margin, this.currentY, { align: 'right' });
    this.currentY += 7;

    pdf.setFontSize(13);
    pdf.setTextColor(30, 64, 175);
    pdf.text(`Total Estimate:`, this.pageWidth - this.margin - 60, this.currentY, { align: 'left' });
    pdf.text(`$${total.toLocaleString()}`, this.pageWidth - this.margin, this.currentY, { align: 'right' });

    // Payment terms
    this.currentY += 15;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);

    const terms = [
      'Payment Terms: 50% deposit, 50% upon completion',
      'Estimate valid for 30 days',
      'Final cost may vary based on site conditions',
      'All warranties as stated by manufacturers'
    ];

    terms.forEach(term => {
      pdf.text(term, this.margin, this.currentY);
      this.currentY += 5;
    });
  }

  /**
   * Add section title
   */
  addSectionTitle(pdf, title, fontSize = 16) {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 64, 175);
    pdf.text(title, this.margin, this.currentY);

    this.currentY += fontSize === 16 ? 10 : 8;

    // Underline
    pdf.setDrawColor(30, 64, 175);
    pdf.setLineWidth(0.3);
    pdf.line(this.margin, this.currentY - 2, this.margin + pdf.getTextWidth(title), this.currentY - 2);

    this.currentY += 5;
  }

  /**
   * Add product section
   */
  addProductSection(pdf, title, details) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(40, 40, 40);
    pdf.text(title, this.margin, this.currentY);
    this.currentY += 7;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);

    Object.entries(details).forEach(([key, value]) => {
      if (key === 'features' && Array.isArray(value)) {
        pdf.text(`${key}:`, this.margin + 5, this.currentY);
        this.currentY += 5;

        value.forEach(feature => {
          pdf.text(`  • ${feature}`, this.margin + 10, this.currentY);
          this.currentY += 5;
        });
      } else {
        pdf.text(`${key}: ${value}`, this.margin + 5, this.currentY);
        this.currentY += 5;
      }
    });
  }

  /**
   * Add table
   */
  addTable(pdf, data, isFinancial = false) {
    const colWidths = isFinancial ? [80, 30, 30, 30] : [60, 50, 50];
    const startX = this.margin;
    let y = this.currentY;

    data.forEach((row, rowIdx) => {
      let x = startX;

      row.forEach((cell, colIdx) => {
        // Header row
        if (rowIdx === 0) {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setFillColor(230, 230, 230);
          pdf.rect(x, y - 5, colWidths[colIdx], 7, 'F');
        } else {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
        }

        pdf.text(cell, x + 2, y, { maxWidth: colWidths[colIdx] - 4 });
        x += colWidths[colIdx];
      });

      y += 7;
    });

    this.currentY = y + 5;
  }

  /**
   * Add footer to page
   */
  addFooter(pdf, pageNum, totalPages, data) {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);

    const footerY = this.pageHeight - 10;

    // Page number
    pdf.text(
      `Page ${pageNum} of ${totalPages}`,
      this.pageWidth / 2,
      footerY,
      { align: 'center' }
    );

    // Company info
    pdf.text(
      'Powered by Rime + Malarkey • www.rimehq.net',
      this.margin,
      footerY
    );
  }

  /**
   * Capture visualization as canvas
   */
  async captureVisualization(imageUrl, overlayData = null) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    return new Promise((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Add overlays if provided
        if (overlayData) {
          // Draw shingle overlays, lighting, etc.
        }

        resolve(canvas);
      };

      img.src = imageUrl;
    });
  }

  /**
   * Save PDF
   */
  async save(projectData, filename = 'project-report.pdf') {
    const pdf = await this.generateReport(projectData);
    pdf.save(filename);
  }

  /**
   * Get PDF as blob
   */
  async getBlob(projectData) {
    const pdf = await this.generateReport(projectData);
    return pdf.output('blob');
  }
}

// Singleton instance
export const pdfReportGenerator = new PDFReportGenerator();
