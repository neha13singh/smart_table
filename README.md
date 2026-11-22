# Smart Table Maker

A simple website for non-technical users: type data, choose a calculation, and get a neat table you can copy or download. No Excel formulas, no account, no internet needed.

## Open it

Double-click `index.html` (or open it in any browser). That's it — there is nothing to install.

The app opens with the sample **electrical quotation** pre-loaded, so you can see how a finished table looks right away. Press **↺ Reset** at any time to get it back.

The sample is an exact structural match of `MG_Quotation_3MLD_Electrical.docx`: GSTIN and company name, the `Ref. No. / Dated` line, underlined `Quotation` heading, `To… / Date :-` block, site line, `SR | Particulars | Qty | Unit | Rate | Amount` table, and `G.Total / GST 18% / R/O / Total` rows. Decimal places follow the document — quantities 0, rates and amounts 2 — and there is no currency symbol unless you add one. The GST line cuts off extra paise (414,366.75 × 18% → 74,586.01) and the round-off is written as `+0.24`, giving the document's final total of 488,953.00. Uncheck **Cut extra paise** in step 4 if you prefer ordinary rounding.

## How to use it

1. **Pick a format** — Quotation / Bill, Simple list, or Blank table.
2. **Fill the details on top** (optional) — company name, GSTIN, "To", date, site, etc. They appear on the generated table.
3. **Set your columns.** For each column choose what it contains:
   - *Type text myself* — you type the words.
   - *Enter a number* — you type a number.
   - *Auto number* — 1, 2, 3… filled in for you.
   - *Calculate with a function* — pick **Multiply, Add, Subtract, Divide** or **Percentage**, then pick which columns to use. Example: `Amount = Qty × Rate`.
   You can also choose decimal places and whether to show the currency symbol.
4. **Total & tax** — switch on Grand Total, GST %, Round Off and Final Total as needed.
5. **Enter your data** in the boxes on the left. Blue cells are calculated automatically and cannot be typed into.
6. **Copy or download** the table from the right-hand side.

Your work is saved automatically in the browser, so a refresh will not erase it.

**On a phone**, the page shows two tabs — **Edit data** and **See table** — so you are not endlessly scrolling between the form and the result. The final total stays pinned at the top in both tabs, buttons are finger-sized, and wide tables scroll sideways inside their own box. Use **👀 See my table** at the bottom of the form to jump to the result, and **✏️ Back to editing** to return.

## Copy / download options

| Button | Use it for |
| --- | --- |
| **For Word / Docs** | Copies a styled table with borders — paste straight into Word or Google Docs. |
| **For Excel** | Copies tab-separated values — paste into cell A1 and Excel splits it into columns. |
| **Markdown** | Copies a Markdown table for notes, README files, Chat, etc. |
| **Excel (.xls)** | Downloads a spreadsheet file. |
| **Word (.doc)** | Downloads a document you can edit further. |
| **CSV** | Downloads for Excel, Google Sheets or accounting software. |
| **HTML** | Downloads a styled web page. |
| **PDF** | Opens the print dialog — choose "Save as PDF". |

## Files

- `index.html` — page structure
- `styles.css` — appearance and print layout
- `app.js` — calculations, table generation, copy/download logic

Everything runs locally in the browser. No server or build step is required.
