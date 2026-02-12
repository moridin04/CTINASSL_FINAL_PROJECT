// server/routes/adminReports.js

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const authAdmin = require('../middlewares/authAdmin');
const { createObjectCsvWriter } = require('csv-writer');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const crypto = require('crypto');
const Movie = require('../models/Movie');
const User = require('../models/User');
const Report = require('../models/Report');

router.use(authAdmin);

// --- Helper for PDF generation with table layout ---
function generatePDF({ filePath, reportTitle, fields, data }) {
  return new Promise(resolve => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Title
    doc.fontSize(18).text(reportTitle, { align: 'center' });
    doc.moveDown(2);

    // Table settings
    const tableTop = doc.y;
    const cellPadding = 5;
    const colWidths = fields.map(() => 240); // Auto width for all columns

    // Draw header row
    doc.font('Helvetica-Bold').fontSize(12);
    fields.forEach((field, i) => {
      doc.rect(40 + (i * colWidths[i]), tableTop, colWidths[i], 24).stroke();
      doc.text(field.title, 40 + (i * colWidths[i]) + cellPadding, tableTop + cellPadding, {
        width: colWidths[i] - cellPadding * 2,
        align: 'left'
      });
    });

    // Draw data rows
    doc.font('Helvetica').fontSize(11);
    let rowY = tableTop + 24;
    data.forEach(row => {
      fields.forEach((field, i) => {
        let value = row[field.id];
        if (value instanceof Date) value = value.toISOString();
        if (!value) value = '';
        doc.rect(40 + (i * colWidths[i]), rowY, colWidths[i], 20).stroke();
        doc.text(value.toString(), 40 + (i * colWidths[i]) + cellPadding, rowY + cellPadding, {
          width: colWidths[i] - cellPadding * 2,
          align: 'left'
        });
      });
      rowY += 20;
    });

    doc.end();
    stream.on('finish', resolve);
  });
}

// --- Helper for XLSX generation ---
async function generateXLSX({ filePath, reportTitle, fields, data }) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportTitle);

  // Header row
  worksheet.addRow(fields.map(f => f.title));

  // Data rows
  data.forEach(row => {
    worksheet.addRow(fields.map(f => {
      let value = row[f.id];
      if (value instanceof Date) value = value.toISOString();
      return value ? value.toString() : '';
    }));
  });

  // Style header
  worksheet.getRow(1).font = { bold: true };

  await workbook.xlsx.writeFile(filePath);
}

// --- GET /api/admin/reports - get report history ---
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).limit(20);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
});

// --- GET /api/admin/reports/movies-per-month ---
router.get('/movies-per-month', async (req, res) => {
  try {
    const result = await Movie.aggregate([
      { $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    res.json(result.map(r => ({ month: r._id, count: r.count })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch movies per month.' });
  }
});

// --- GET /api/admin/reports/user-growth ---
router.get('/user-growth', async (req, res) => {
  try {
    const result = await User.aggregate([
      { $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    res.json(result.map(r => ({ month: r._id, count: r.count })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user growth.' });
  }
});

// --- GET /api/admin/reports/top-rated-movies ---
router.get('/top-rated-movies', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ rating: -1 }).limit(10);
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch top rated movies.' });
  }
});

// --- POST /api/admin/reports/generate ---
router.post('/generate', async (req, res) => {
  try {
    const { type, startDate, endDate, format } = req.body;

    let data = [];
    let fields = [];
    let reportTitle = '';
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    // Prepare data according to type
    if (type === 'top-rated-movies') {
      data = await Movie.find({ createdAt: { $gte: sDate, $lte: eDate } })
        .sort({ rating: -1 })
        .limit(50)
        .lean();
      fields = [
        { id: 'title', title: 'Title' },
        { id: 'rating', title: 'Rating' },
        { id: 'createdAt', title: 'Created At' }
      ];
      reportTitle = 'Top Rated Movies';
    } else if (type === 'user-activity') {
      data = await User.find({ createdAt: { $gte: sDate, $lte: eDate } })
        .sort({ lastLogin: -1 })
        .limit(50)
        .lean();
      fields = [
        { id: 'email', title: 'Email' },
        { id: 'lastLogin', title: 'Last Login' },
        { id: 'createdAt', title: 'Created At' }
      ];
      reportTitle = 'User Activity';
    } else if (type === 'movies-added') {
      data = await Movie.find({ createdAt: { $gte: sDate, $lte: eDate } })
        .sort({ createdAt: -1 })
        .lean();
      fields = [
        { id: 'title', title: 'Title' },
        { id: 'createdAt', title: 'Created At' }
      ];
      reportTitle = 'Movies Added';
    } else if (type === 'user-growth') {
      data = await User.find({ createdAt: { $gte: sDate, $lte: eDate } })
        .sort({ createdAt: -1 })
        .lean();
      fields = [
        { id: 'email', title: 'Email' },
        { id: 'createdAt', title: 'Created At' }
      ];
      reportTitle = 'User Growth';
    } else {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    // Parse format from dropdown value (case-insensitive)
    const formatLower = format.toLowerCase();
    let ext, formatKey;
    if (formatLower.includes('pdf')) {
      ext = 'pdf';
      formatKey = 'pdf';
    } else if (formatLower.includes('csv')) {
      ext = 'csv';
      formatKey = 'csv';
    } else if (formatLower.includes('xlsx')) {
      ext = 'xlsx';
      formatKey = 'xlsx';
    } else {
      return res.status(400).json({ error: 'Invalid format' });
    }

    // Generate file name and path
    const reportId = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString('hex');
    const fileName = `${reportId}.${ext}`;
    const reportsDir = path.join(__dirname, '../public/reports');
    const filePath = path.join(reportsDir, fileName);
    const fileUrl = `/reports/${fileName}`;

    fs.mkdirSync(reportsDir, { recursive: true });

    // --- Generate file by format ---
    if (formatKey === 'csv') {
      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: fields
      });
      await csvWriter.writeRecords(data);
    } else if (formatKey === 'pdf') {
      await generatePDF({ filePath, reportTitle, fields, data });
    } else if (formatKey === 'xlsx') {
      await generateXLSX({ filePath, reportTitle, fields, data });
    } else {
      return res.status(400).json({ error: 'Invalid format' });
    }

    // --- Save report metadata to DB ---
    const report = await Report.create({
      name: `${reportTitle} report`,
      type,
      date: new Date(),
      format: ext.toUpperCase(),
      status: 'Ready',
      fileUrl,
    });

    res.json({
      success: true,
      report: {
        id: report._id,
        name: report.name,
        date: report.date,
        format: report.format,
        status: report.status
      }
    });
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ error: 'Failed to generate report.' });
  }
});

// --- GET /api/admin/reports/download/:id ---
router.get('/download/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const absPath = path.join(__dirname, '../public', report.fileUrl);
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ error: 'Report file missing' });
    }
    res.download(absPath, path.basename(absPath));
  } catch (err) {
    res.status(500).json({ error: 'Failed to download report.' });
  }
});

// --- DELETE /api/admin/reports/:id ---
// Batch delete supported by calling this endpoint multiple times
router.delete('/:id', async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    // Optionally: Delete file from disk
    const absPath = path.join(__dirname, '../public', report.fileUrl);
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete report.' });
  }
});

module.exports = router;
