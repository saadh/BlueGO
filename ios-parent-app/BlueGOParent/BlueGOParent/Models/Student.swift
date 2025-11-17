//
//  Student.swift
//  BlueGOParent
//
//  Student model representing a child
//

import Foundation

struct Student: Codable, Identifiable {
    let id: String
    let parentId: String
    let name: String
    let studentId: String?
    let organizationId: String
    let classId: String?
    let grade: String?
    let `class`: String?
    let gender: String?
    let nfcCardId: String?
    let avatarUrl: String?
    let createdAt: String?
    let updatedAt: String?

    // Computed property for display
    var gradeClass: String {
        if let grade = grade, let className = `class` {
            return "Grade \(grade) - \(className)"
        } else if let grade = grade {
            return "Grade \(grade)"
        } else {
            return "No class assigned"
        }
    }

    var hasNFCLinked: Bool {
        nfcCardId != nil && !nfcCardId!.isEmpty
    }
}

struct StudentCreateRequest: Codable {
    let name: String
    let studentId: String
    let organizationId: String
    let grade: String
    let `class`: String
    let gender: String
}

struct StudentUpdateRequest: Codable {
    let name: String?
    let studentId: String?
    let grade: String?
    let `class`: String?
    let gender: String?
    let avatarUrl: String?
}
