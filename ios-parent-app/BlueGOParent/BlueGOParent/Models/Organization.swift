//
//  Organization.swift
//  BlueGOParent
//
//  Organization (school) model
//

import Foundation

struct Organization: Codable, Identifiable {
    let id: String
    let name: String
    let slug: String
    let address: String?
    let city: String?
    let state: String?
    let zipCode: String?
    let phone: String?
    let email: String?
    let logoUrl: String?
    let createdAt: String?
}

struct Class: Codable, Identifiable {
    let id: String
    let organizationId: String
    let grade: String
    let section: String
    let teacherId: String?
    let createdAt: String?

    var displayName: String {
        "Grade \(grade) - \(section)"
    }
}
