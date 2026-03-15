import Foundation
import PDFKit
import Vision
import UIKit

struct ExtractedDocument: Sendable {
    let title: String
    let author: String?
    let chapters: [ExtractedChapter]
}

struct ExtractedChapter: Sendable {
    let title: String
    let body: String
    let position: Int
}

struct PDFExtractor: Sendable {

    /// Extract structured text from a PDF file.
    /// Uses PDFKit for native text and Vision OCR for scanned pages.
    func extract(fileURL: URL) async throws -> ExtractedDocument {
        guard let pdf = PDFDocument(url: fileURL) else {
            throw ExtractionError.cannotOpenFile
        }

        // Extract text from all pages
        var pageTexts: [(page: Int, text: String)] = []

        for i in 0..<pdf.pageCount {
            guard let page = pdf.page(at: i) else { continue }

            if let text = page.string,
               !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                pageTexts.append((i, text))
            } else {
                // Scanned page — OCR via Vision
                let ocrText = try await performOCR(on: page)
                if !ocrText.isEmpty {
                    pageTexts.append((i, ocrText))
                }
            }
        }

        guard !pageTexts.isEmpty else {
            throw ExtractionError.noTextContent
        }

        // Detect chapters via heading heuristics
        let chapters = detectChapters(pageTexts: pageTexts)

        // Extract title from PDF metadata or first heading
        let title = pdf.documentAttributes?[PDFDocumentAttribute.titleAttribute] as? String
            ?? chapters.first?.title
            ?? fileURL.deletingPathExtension().lastPathComponent

        let author = pdf.documentAttributes?[PDFDocumentAttribute.authorAttribute] as? String

        return ExtractedDocument(title: title, author: author, chapters: chapters)
    }

    // MARK: - OCR

    private func performOCR(on page: PDFPage) async throws -> String {
        let pageRect = page.bounds(for: .mediaBox)
        let scale: CGFloat = 2.0
        let imageSize = CGSize(width: pageRect.width * scale, height: pageRect.height * scale)

        let renderer = UIGraphicsImageRenderer(size: imageSize)
        let image = renderer.image { ctx in
            UIColor.white.setFill()
            ctx.fill(CGRect(origin: .zero, size: imageSize))
            ctx.cgContext.translateBy(x: 0, y: imageSize.height)
            ctx.cgContext.scaleBy(x: scale, y: -scale)
            page.draw(with: .mediaBox, to: ctx.cgContext)
        }

        guard let cgImage = image.cgImage else { return "" }

        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true

        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        try handler.perform([request])

        let observations = request.results ?? []
        return observations
            .compactMap { $0.topCandidates(1).first?.string }
            .joined(separator: "\n")
    }

    // MARK: - Chapter Detection

    private func detectChapters(pageTexts: [(page: Int, text: String)]) -> [ExtractedChapter] {
        var chapters: [ExtractedChapter] = []
        var currentTitle = "Introduction"
        var currentBody = ""
        var position = 0

        for (_, text) in pageTexts {
            let lines = text.components(separatedBy: .newlines)

            for line in lines {
                let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !trimmed.isEmpty else { continue }

                if isLikelyHeading(trimmed) {
                    // Save previous chapter if it has enough content
                    let body = currentBody.trimmingCharacters(in: .whitespacesAndNewlines)
                    if body.split(separator: " ").count > 30 {
                        chapters.append(ExtractedChapter(
                            title: currentTitle,
                            body: body,
                            position: position
                        ))
                        position += 1
                    }
                    currentTitle = trimmed
                    currentBody = ""
                } else {
                    currentBody += trimmed + "\n"
                }
            }
        }

        // Last chapter
        let body = currentBody.trimmingCharacters(in: .whitespacesAndNewlines)
        if body.split(separator: " ").count > 30 {
            chapters.append(ExtractedChapter(
                title: currentTitle,
                body: body,
                position: position
            ))
        }

        // If no headings were detected, treat entire text as one chapter
        if chapters.isEmpty {
            let allText = pageTexts.map(\.text).joined(separator: "\n\n")
            chapters.append(ExtractedChapter(
                title: "Full Document",
                body: allText,
                position: 0
            ))
        }

        return chapters
    }

    private func isLikelyHeading(_ line: String) -> Bool {
        let words = line.split(separator: " ")

        // Too long for a heading
        if words.count > 10 { return false }

        // ALL CAPS (more than one word)
        if words.count >= 2 && line == line.uppercased() && line != line.lowercased() {
            return true
        }

        // Short line with no terminal punctuation
        if words.count <= 8 {
            let lastChar = line.last
            let hasPunctuation = lastChar == "." || lastChar == "," ||
                lastChar == ";" || lastChar == ":" ||
                lastChar == "?" || lastChar == "!"

            if !hasPunctuation {
                let lowered = line.lowercased()
                let chapterPrefixes = [
                    "chapter", "part", "section", "introduction",
                    "conclusion", "epilogue", "prologue", "appendix",
                    "preface", "foreword", "afterword"
                ]
                for prefix in chapterPrefixes {
                    if lowered.hasPrefix(prefix) { return true }
                }

                // Numbered heading: "1.", "1.1", "I.", "IV."
                if let first = words.first {
                    let s = String(first)
                    if s.last == "." {
                        let num = s.dropLast()
                        if num.allSatisfy({ $0.isNumber || $0 == "." }) { return true }
                        if num.allSatisfy({ "IVXLCDM".contains($0) }) { return true }
                    }
                }
            }
        }

        return false
    }
}

enum ExtractionError: Error, LocalizedError {
    case cannotOpenFile
    case noTextContent
    case unsupportedFormat(String)

    var errorDescription: String? {
        switch self {
        case .cannotOpenFile: return "Could not open file"
        case .noTextContent: return "No readable text found"
        case .unsupportedFormat(let ext): return "Unsupported format: .\(ext)"
        }
    }
}
