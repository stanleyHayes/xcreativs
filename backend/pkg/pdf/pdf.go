// Package pdf produces simple, single-page text PDFs with no external
// dependencies. It is intentionally minimal — enough for one-page summaries
// (e.g. the engagement readiness diagnostic) — and keeps the platform free of
// third-party PDF libraries, in line with the project's sovereignty goals.
package pdf

import (
	"bytes"
	"fmt"
	"strings"
)

// Line is a single rendered line of text.
type Line struct {
	Text string
	Size float64 // font size in points; 0 defaults to body size
	Bold bool
	Gap  float64 // extra vertical space (points) before this line
}

// Document is a one-page text document.
type Document struct {
	Title string
	Lines []Line
}

const (
	pageWidth  = 612.0 // US Letter, points
	pageHeight = 792.0
	marginX    = 72.0
	marginTop  = 720.0
	bodySize   = 11.0
	titleSize  = 20.0
	maxLineLen = 95 // rough character wrap for Helvetica 11pt within the margins
)

// escape encodes a string for use inside a PDF literal string.
func escape(s string) string {
	var b strings.Builder
	for _, r := range s {
		switch r {
		case '\\':
			b.WriteString(`\\`)
		case '(':
			b.WriteString(`\(`)
		case ')':
			b.WriteString(`\)`)
		case '\r', '\n':
			b.WriteByte(' ')
		default:
			if r < 32 || r > 126 {
				// Drop non-WinAnsi/control characters to keep the stream valid.
				continue
			}
			b.WriteRune(r)
		}
	}
	return b.String()
}

// wrap splits a long string into lines no longer than limit characters,
// breaking on spaces where possible.
func wrap(s string, limit int) []string {
	s = strings.TrimSpace(s)
	if s == "" {
		return []string{""}
	}
	words := strings.Fields(s)
	var out []string
	cur := ""
	for _, w := range words {
		switch {
		case cur == "":
			cur = w
		case len(cur)+1+len(w) <= limit:
			cur += " " + w
		default:
			out = append(out, cur)
			cur = w
		}
	}
	if cur != "" {
		out = append(out, cur)
	}
	return out
}

type renderItem struct {
	text string
	size float64
	bold bool
	gap  float64
}

// Render builds the PDF bytes for the document.
func (d Document) Render() []byte {
	// Flatten the document into a single ordered list of lines to draw.
	var items []renderItem
	if d.Title != "" {
		items = append(items, renderItem{text: d.Title, size: titleSize, bold: true})
	}
	for _, ln := range d.Lines {
		size := ln.Size
		if size == 0 {
			size = bodySize
		}
		for i, seg := range wrap(ln.Text, maxLineLen) {
			gap := 0.0
			if i == 0 {
				gap = ln.Gap
			}
			items = append(items, renderItem{text: seg, size: size, bold: ln.Bold, gap: gap})
		}
	}

	// Build the content stream. The text cursor is positioned ONCE with an
	// absolute Td, then every subsequent line moves with a RELATIVE Td (Td is
	// always relative to the current line matrix in PDF).
	var content bytes.Buffer
	content.WriteString("BT\n")
	content.WriteString(fmt.Sprintf("%.0f %.0f Td\n", marginX, marginTop))

	y := marginTop
	for idx, it := range items {
		font := "F1"
		if it.bold {
			font = "F2"
		}
		content.WriteString(fmt.Sprintf("/%s %.0f Tf\n", font, it.size))
		if idx > 0 {
			prev := items[idx-1]
			dy := prev.size*1.4 + it.gap
			content.WriteString(fmt.Sprintf("0 %.1f Td\n", -dy))
			y -= dy
		}
		content.WriteString(fmt.Sprintf("(%s) Tj\n", escape(it.text)))
		if y < 54 { // stop before running off the page bottom margin
			break
		}
	}
	content.WriteString("ET\n")

	// Assemble objects, tracking byte offsets for the xref table.
	var buf bytes.Buffer
	buf.WriteString("%PDF-1.4\n")
	buf.WriteString("%\xE2\xE3\xCF\xD3\n") // binary marker

	offsets := make([]int, 7) // indices 1..6 used
	writeObj := func(n int, body string) {
		offsets[n] = buf.Len()
		buf.WriteString(fmt.Sprintf("%d 0 obj\n", n))
		buf.WriteString(body)
		buf.WriteString("\nendobj\n")
	}

	writeObj(1, "<< /Type /Catalog /Pages 2 0 R >>")
	writeObj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
	writeObj(3, fmt.Sprintf(
		"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %.0f %.0f] "+
			"/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
		pageWidth, pageHeight))
	writeObj(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
	writeObj(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

	stream := content.String()
	offsets[6] = buf.Len()
	buf.WriteString("6 0 obj\n")
	buf.WriteString(fmt.Sprintf("<< /Length %d >>\nstream\n", len(stream)))
	buf.WriteString(stream)
	buf.WriteString("endstream\nendobj\n")

	// xref table.
	xrefStart := buf.Len()
	buf.WriteString("xref\n")
	buf.WriteString("0 7\n")
	buf.WriteString("0000000000 65535 f \n")
	for i := 1; i <= 6; i++ {
		buf.WriteString(fmt.Sprintf("%010d 00000 n \n", offsets[i]))
	}
	buf.WriteString("trailer\n")
	buf.WriteString("<< /Size 7 /Root 1 0 R >>\n")
	buf.WriteString("startxref\n")
	buf.WriteString(fmt.Sprintf("%d\n", xrefStart))
	buf.WriteString("%%EOF\n")

	return buf.Bytes()
}
