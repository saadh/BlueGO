//
//  ParentService.swift
//  BlueGOParent
//
//  Service for parent-specific operations (students, dismissals, NFC)
//

import Foundation

class ParentService {
    static let shared = ParentService()
    private let network = NetworkService.shared

    private init() {}

    // MARK: - Student Management

    func getStudents() async throws -> [Student] {
        return try await network.get(endpoint: "/api/students")
    }

    func createStudent(name: String, studentId: String, organizationId: String, grade: String, className: String, gender: String) async throws -> Student {
        let request = StudentCreateRequest(
            name: name,
            studentId: studentId,
            organizationId: organizationId,
            grade: grade,
            class: className,
            gender: gender
        )
        return try await network.post(endpoint: "/api/students", body: request)
    }

    func updateStudent(id: String, name: String?, studentId: String?, grade: String?, className: String?, gender: String?) async throws -> Student {
        let request = StudentUpdateRequest(
            name: name,
            studentId: studentId,
            grade: grade,
            class: className,
            gender: gender,
            avatarUrl: nil
        )
        return try await network.patch(endpoint: "/api/students/\(id)", body: request)
    }

    func deleteStudent(id: String) async throws {
        try await network.delete(endpoint: "/api/students/\(id)")
    }

    // MARK: - Organizations & Classes

    func getOrganizations() async throws -> [Organization] {
        return try await network.get(endpoint: "/api/parent/organizations")
    }

    func getClasses(organizationId: String) async throws -> [Class] {
        return try await network.get(endpoint: "/api/parent/classes/\(organizationId)")
    }

    // MARK: - Dismissals

    func requestPickup(studentId: String) async throws -> RequestPickupResponse {
        let request = RequestPickupRequest(studentId: studentId)
        return try await network.post(endpoint: "/api/parent/request-pickup", body: request)
    }

    func getDismissals() async throws -> [Dismissal] {
        return try await network.get(endpoint: "/api/parent/dismissals")
    }

    func confirmPickup(dismissalId: String) async throws -> Dismissal {
        struct EmptyBody: Codable {}
        return try await network.patch(endpoint: "/api/parent/dismissals/\(dismissalId)/confirm", body: EmptyBody())
    }

    // MARK: - NFC Card

    func linkNFCCard(nfcCardId: String) async throws -> User {
        struct NFCRequest: Codable {
            let nfcCardId: String
        }
        let request = NFCRequest(nfcCardId: nfcCardId)
        return try await network.post(endpoint: "/api/parent/nfc-card", body: request)
    }
}
