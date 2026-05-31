// ============================================================
//  TAG PRINT LOGIC
//  Dependencies: SheetJS (xlsx) — include via CDN:
//  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
//  *** NEW *** JsBarcode — include via CDN:
//  <script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.6/JsBarcode.all.min.js"></script>
//
//  Expected HTML hooks:
//    #upload-btn   — file input trigger button
//    #file-input   — <input type="file" accept=".xlsx" hidden>
//    #print-btn    — print button
//    #print-area   — container where tag rows are rendered
// ============================================================

(function () {

  // ----------------------------------------------------------
  // CONFIG — adjust tag sizes and layout here
  // ----------------------------------------------------------
  const SIZE_CONFIG = {
    medium: { label: 'M', cssClass: 'tag-medium' },
    small:  { label: 'S', cssClass: 'tag-small'  },
    large:  { label: 'L', cssClass: 'tag-large'  },
  };

  // *** NEW *** Barcode options per size (height scales with tag)
  const BARCODE_CONFIG = {
    large:  { height: 28, width: 1.8 },
    medium: { height: 22, width: 1.5 },
    small:  { height: 16, width: 1.2 },
  };

  // Column indices (0-based) in the spreadsheet
  const COL = {
    code:   0,  // šifra
    name:   1,  // product name
    price:  2,  // price
    medium: 3,  // col 4 — medium qty
    small:  4,  // col 5 — small qty
    large:  5,  // col 6 — large qty
  };

  // ----------------------------------------------------------
  // INIT — wire up buttons after DOM is ready
  // ----------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    const printBtn  = document.getElementById('print-btn');

    // Upload button opens the hidden file input
    uploadBtn.addEventListener('click', () => fileInput.click());

    // File selected — parse and render
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      parseExcel(file);
      // Show success message with filename
      const status = document.getElementById('upload-status');
      if (status) status.textContent = `✓ Spremno: ${file.name}`;
      // Reset so the same file can be re-uploaded if needed
      fileInput.value = '';
    });

    // Print button — reveal area, print, then hide again
    printBtn.addEventListener('click', () => {
      const printArea = document.getElementById('print-area');
      printArea.style.display = 'block';
      window.print();
      printArea.style.display = 'none';
    });
  });

  // ----------------------------------------------------------
  // PARSE EXCEL
  // ----------------------------------------------------------
  function parseExcel(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data     = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet    = workbook.Sheets[workbook.SheetNames[0]];
      const rows     = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      const products = parseRows(rows);
      renderTags(products);
    };

    reader.readAsArrayBuffer(file);
  }

  // ----------------------------------------------------------
  // PARSE ROWS — returns array of product objects
  // ----------------------------------------------------------
  function parseRows(rows) {
    const products = [];

    for (const row of rows) {
      const code   = row[COL.code];
      const name   = row[COL.name];
      const price  = row[COL.price];
      const qtyM   = parseInt(row[COL.medium], 10) || 0;
      const qtyS   = parseInt(row[COL.small],  10) || 0;
      const qtyL   = parseInt(row[COL.large],  10) || 0;

      // Skip rows with no qtys at all
      if (qtyM === 0 && qtyS === 0 && qtyL === 0) continue;

      // Skip rows missing essential data
      if (!code && !name) continue;

      products.push({ code, name, price, qtyM, qtyS, qtyL });
    }

    return products;
  }

  // ----------------------------------------------------------
  // RENDER TAGS
  //  Order: all mediums → all smalls → all larges
  //  Each product+size combo becomes one row of repeated tags
  // ----------------------------------------------------------
  function renderTags(products) {
    const printArea = document.getElementById('print-area');
    printArea.innerHTML = '';

    if (products.length === 0) {
      printArea.innerHTML = '<p class="no-data">No printable data found in the file.</p>';
      return;
    }

    // Build ordered list of rows: [{ product, size, qty }, ...]
    const sizeOrder = [
      { key: 'qtyM', size: 'medium' },
      { key: 'qtyS', size: 'small'  },
      { key: 'qtyL', size: 'large'  },
    ];

    const tagRows = [];

    for (const { key, size } of sizeOrder) {
      for (const product of products) {
        const qty = product[key];
        if (qty > 0) {
          tagRows.push({ product, size, qty });
        }
      }
    }

    // Render each row
    for (const { product, size, qty } of tagRows) {
      const rowEl = document.createElement('div');
      rowEl.className = `tag-row tag-row--${size}`;

      for (let i = 0; i < qty; i++) {
        const tag = buildTagElement(product, size);
        rowEl.appendChild(tag);
      }

      printArea.appendChild(rowEl);
    }
  }

  // ----------------------------------------------------------
  // BUILD A SINGLE TAG ELEMENT
  // ----------------------------------------------------------
  function buildTagElement(product, size) {
    const cfg = SIZE_CONFIG[size];

    const tag = document.createElement('div');
    tag.className = `tag ${cfg.cssClass}`;

    tag.innerHTML = `
      <div class="tag-code">šifra ${product.code}</div>
      <div class="tag-name">${product.name}</div>
      <div class="tag-price">${formatPrice(product.price)}</div>
      <div class="tag-barcode"></div>
    `;

    // *** NEW *** Generate barcode into the .tag-barcode container
    const barcodeContainer = tag.querySelector('.tag-barcode');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const bc  = BARCODE_CONFIG[size];

    JsBarcode(svg, String(product.code), {
      format:       'CODE128',
      displayValue: false,   // code is already shown in .tag-code above
      width:        bc.width,
      height:       bc.height,
      margin:       0,
      lineColor:    '#1a1a1a',
      background:   'transparent',
    });

    barcodeContainer.appendChild(svg);

    return tag;
  }

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------
  function formatPrice(value) {
    if (value === '' || value === null || value === undefined) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    // Format with comma as decimal separator (Serbian locale)
    return num.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

})();