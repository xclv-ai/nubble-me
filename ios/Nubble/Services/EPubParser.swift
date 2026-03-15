import Foundation
import SwiftSoup
import ZIPFoundation

struct EPubParser: Sendable {

    /// Parse an ePub file into an ExtractedDocument.
    /// Unzips the ePub, reads OPF metadata, and extracts chapter text via SwiftSoup.
    func parse(fileURL: URL) throws -> ExtractedDocument {
        // 1. Gain security-scoped access
        let accessing = fileURL.startAccessingSecurityScopedResource()
        defer { if accessing { fileURL.stopAccessingSecurityScopedResource() } }

        // 2. Unzip ePub to temp directory
        let epubDir = try unzipEPub(fileURL)
        defer { try? FileManager.default.removeItem(at: epubDir) }

        // 3. Find OPF path via META-INF/container.xml
        let containerURL = epubDir.appendingPathComponent("META-INF/container.xml")
        let containerXML = try String(contentsOf: containerURL, encoding: .utf8)
        let containerDoc = try SwiftSoup.parse(containerXML)
        guard let opfPath = try containerDoc.select("rootfile").first()?.attr("full-path"),
              !opfPath.isEmpty else {
            throw ExtractionError.cannotOpenFile
        }

        // 4. Parse OPF for metadata + spine order
        let opfURL = epubDir.appendingPathComponent(opfPath)
        let opfDir = opfURL.deletingLastPathComponent()
        let opfXML = try String(contentsOf: opfURL, encoding: .utf8)
        let opfDoc = try SwiftSoup.parse(opfXML)

        let title = try opfDoc.select("dc\\:title, title").first()?.text() ?? "Untitled"
        let author = try opfDoc.select("dc\\:creator, creator").first()?.text()

        // 5. Build manifest ID → href map
        let manifest = try opfDoc.select("manifest item")
        var idToHref: [String: String] = [:]
        for item in manifest {
            let id = try item.attr("id")
            let href = try item.attr("href")
            idToHref[id] = href
        }

        // 6. Parse chapters in spine order
        let spineItems = try opfDoc.select("spine itemref")
        var chapters: [ExtractedChapter] = []
        var position = 0

        for itemRef in spineItems {
            let idref = try itemRef.attr("idref")
            guard let href = idToHref[idref] else { continue }

            let chapterURL = opfDir.appendingPathComponent(href)
            guard FileManager.default.fileExists(atPath: chapterURL.path) else { continue }

            let chapterHTML = try String(contentsOf: chapterURL, encoding: .utf8)
            let chapterDoc = try SwiftSoup.parse(chapterHTML)

            // Extract chapter title from first heading
            let chapterTitle = try chapterDoc.select("h1, h2, h3").first()?.text()

            // Remove nav/TOC elements
            try chapterDoc.select("nav, .toc, #toc").remove()

            // Get plain text
            let plainText = try htmlToStructuredText(chapterDoc)

            // Skip very short chapters (cover pages, copyright, etc.)
            guard plainText.split(separator: " ").count > 30 else { continue }

            chapters.append(ExtractedChapter(
                title: chapterTitle ?? "Chapter \(position + 1)",
                body: plainText,
                position: position
            ))
            position += 1
        }

        return ExtractedDocument(title: title, author: author, chapters: chapters)
    }

    // MARK: - HTML → Structured Text

    /// Convert parsed HTML document to structured plain text preserving headings as markdown markers.
    func htmlToStructuredText(_ doc: Document) throws -> String {
        guard let body = doc.body() else { return try doc.text() }

        var result = ""
        for element in body.children() {
            let tag = element.tagName().lowercased()
            let text = try element.text().trimmingCharacters(in: .whitespacesAndNewlines)
            guard !text.isEmpty else { continue }

            switch tag {
            case "h1": result += "\n# \(text)\n\n"
            case "h2": result += "\n## \(text)\n\n"
            case "h3": result += "\n### \(text)\n\n"
            case "blockquote": result += "> \(text)\n\n"
            case "ul", "ol":
                for li in try element.select("li") {
                    result += "\u{2022} \(try li.text())\n"
                }
                result += "\n"
            default:
                result += "\(text)\n\n"
            }
        }
        return result.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    // MARK: - Unzip

    /// Unzip an ePub file to a temporary directory using AppleArchive/Compression.
    private func unzipEPub(_ fileURL: URL) throws -> URL {
        let tempDir = FileManager.default.temporaryDirectory
            .appendingPathComponent("nubble-epub-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)

        // ePub is a standard ZIP file — extract using ZipArchive (iOS 26+)
        let archive = try Archive(url: fileURL, accessMode: .read)
        for entry in archive {
            let entryPath = entry.path
            // Prevent path traversal
            guard !entryPath.contains("..") else { continue }

            let destURL = tempDir.appendingPathComponent(entryPath)

            if entry.type == .directory {
                try FileManager.default.createDirectory(
                    at: destURL, withIntermediateDirectories: true
                )
            } else {
                // Ensure parent directory exists
                let parentDir = destURL.deletingLastPathComponent()
                if !FileManager.default.fileExists(atPath: parentDir.path) {
                    try FileManager.default.createDirectory(
                        at: parentDir, withIntermediateDirectories: true
                    )
                }
                var data = Data()
                _ = try archive.extract(entry) { chunk in
                    data.append(chunk)
                }
                try data.write(to: destURL)
            }
        }

        return tempDir
    }
}
