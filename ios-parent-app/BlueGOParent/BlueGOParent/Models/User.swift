//
//  User.swift
//  BlueGOParent
//
//  User model representing a parent account
//

import Foundation

struct User: Codable, Identifiable {
    let id: String
    let email: String?
    let phone: String?
    let firstName: String
    let lastName: String
    let role: String
    let nfcCardId: String?
    let createdAt: String?
    let updatedAt: String?

    var fullName: String {
        "\(firstName) \(lastName)"
    }

    var displayIdentifier: String {
        email ?? phone ?? "Unknown"
    }
}
