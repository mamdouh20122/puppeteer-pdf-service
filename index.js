// index.js
const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// PDF Generation Endpoint
app.post("/generate-pdf", async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  let browser;
  try {
    // Launch Puppeteer with production-safe config
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--single-process"
      ],
      timeout: 120000 // 2 minutes
    });

    const page = await browser.newPage();
    
    // Configure timeouts
    await page.setDefaultNavigationTimeout(120000);
    await page.setDefaultTimeout(120000);

    // Navigate to page
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 120000
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm"
      }
    });

    // Close browser and send response
    await browser.close();
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="generated.pdf"`
    });
    res.send(pdfBuffer);

  } catch (error) {
    // Cleanup and error handling
    if (browser) await browser.close();
    console.error("PDF Generation Error:", error);
    res.status(500).json({
      error: "PDF generation failed",
      message: error.message
    });
  }
});

// Server Setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PDF service running on port ${PORT}`);
});
