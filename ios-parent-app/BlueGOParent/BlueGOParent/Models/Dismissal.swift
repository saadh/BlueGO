//
//  Dismissal.swift
//  BlueGOParent
//
//  Dismissal model representing a pickup request
//

import Foundation

struct Dismissal: Codable, Identifiable {
    let id: String
    let studentId: String
    let parentId: String
    let status: String
    let scannedAt: String?
    let calledAt: String?
    let completedAt: String?
    let confirmedByParentAt: String?
    let createdAt: String?
    let updatedAt: String?

    // UI State computed properties
    var isWaiting: Bool {
        status == "called" || status == "in_progress"
    }

    var isReadyForPickup: Bool {
        status == "completed" && completedAt != nil && confirmedByParentAt == nil
    }

    var isConfirmed: Bool {
        confirmedByParentAt != nil
    }

    var statusMessage: String {
        if isConfirmed {
            return "Pick-up Confirmed"
        } else if isReadyForPickup {
            return "Ready for Pick-up!"
        } else if isWaiting {
            return "Waiting for teacher..."
        } else {
            return "Processing..."
        }
    }
}

struct RequestPickupRequest: Codable {
    let studentId: String
}

struct RequestPickupResponse: Codable {
    let message: String
    let dismissal: Dismissal
}
