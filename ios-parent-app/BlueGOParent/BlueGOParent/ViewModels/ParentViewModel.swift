//
//  ParentViewModel.swift
//  BlueGOParent
//
//  View model for parent dashboard and operations
//

import Foundation
import SwiftUI

@MainActor
class ParentViewModel: ObservableObject {
    @Published var students: [Student] = []
    @Published var dismissals: [Dismissal] = []
    @Published var organizations: [Organization] = []
    @Published var classes: [Class] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let parentService = ParentService.shared
    private var pollingTimer: Timer?

    // MARK: - Student Management

    func fetchStudents() {
        Task {
            isLoading = true
            errorMessage = nil
            defer { isLoading = false }

            do {
                students = try await parentService.getStudents()
            } catch let error as NetworkError {
                errorMessage = error.localizedDescription
            } catch {
                errorMessage = "Failed to fetch students: \(error.localizedDescription)"
            }
        }
    }

    func addStudent(name: String, studentId: String, organizationId: String, grade: String, className: String, gender: String) {
        Task {
            isLoading = true
            errorMessage = nil
            defer { isLoading = false }

            do {
                let newStudent = try await parentService.createStudent(
                    name: name,
                    studentId: studentId,
                    organizationId: organizationId,
                    grade: grade,
                    className: className,
                    gender: gender
                )
                students.append(newStudent)
            } catch let error as NetworkError {
                errorMessage = error.localizedDescription
            } catch {
                errorMessage = "Failed to add student: \(error.localizedDescription)"
            }
        }
    }

    func deleteStudent(id: String) {
        Task {
            isLoading = true
            errorMessage = nil
            defer { isLoading = false }

            do {
                try await parentService.deleteStudent(id: id)
                students.removeAll { $0.id == id }
            } catch let error as NetworkError {
                errorMessage = error.localizedDescription
            } catch {
                errorMessage = "Failed to delete student: \(error.localizedDescription)"
            }
        }
    }

    // MARK: - Organizations & Classes

    func fetchOrganizations() {
        Task {
            do {
                organizations = try await parentService.getOrganizations()
            } catch {
                errorMessage = "Failed to fetch schools: \(error.localizedDescription)"
            }
        }
    }

    func fetchClasses(organizationId: String) {
        Task {
            do {
                classes = try await parentService.getClasses(organizationId: organizationId)
            } catch {
                errorMessage = "Failed to fetch classes: \(error.localizedDescription)"
            }
        }
    }

    // MARK: - Dismissals

    func requestPickup(studentId: String) {
        Task {
            isLoading = true
            errorMessage = nil
            defer { isLoading = false }

            do {
                let response = try await parentService.requestPickup(studentId: studentId)
                // Add or update dismissal in list
                if let index = dismissals.firstIndex(where: { $0.id == response.dismissal.id }) {
                    dismissals[index] = response.dismissal
                } else {
                    dismissals.append(response.dismissal)
                }
                // Start polling for updates
                startDismissalPolling()
            } catch let error as NetworkError {
                errorMessage = error.localizedDescription
            } catch {
                errorMessage = "Failed to request pickup: \(error.localizedDescription)"
            }
        }
    }

    func fetchDismissals() {
        Task {
            do {
                dismissals = try await parentService.getDismissals()
            } catch {
                // Silently fail for polling requests
                print("Failed to fetch dismissals: \(error)")
            }
        }
    }

    func confirmPickup(dismissalId: String) {
        Task {
            isLoading = true
            errorMessage = nil
            defer { isLoading = false }

            do {
                let updatedDismissal = try await parentService.confirmPickup(dismissalId: dismissalId)
                if let index = dismissals.firstIndex(where: { $0.id == dismissalId }) {
                    dismissals[index] = updatedDismissal
                }
            } catch let error as NetworkError {
                errorMessage = error.localizedDescription
            } catch {
                errorMessage = "Failed to confirm pickup: \(error.localizedDescription)"
            }
        }
    }

    // MARK: - NFC Card

    func linkNFCCard(nfcCardId: String) {
        Task {
            isLoading = true
            errorMessage = nil
            defer { isLoading = false }

            do {
                let _ = try await parentService.linkNFCCard(nfcCardId: nfcCardId)
                // Refresh students to see updated NFC status
                fetchStudents()
            } catch let error as NetworkError {
                errorMessage = error.localizedDescription
            } catch {
                errorMessage = "Failed to link NFC card: \(error.localizedDescription)"
            }
        }
    }

    // MARK: - Real-time Updates (Polling)

    func startDismissalPolling() {
        // Stop existing timer if any
        stopDismissalPolling()

        // Poll every 2 seconds
        pollingTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { [weak self] _ in
            self?.fetchDismissals()
        }
    }

    func stopDismissalPolling() {
        pollingTimer?.invalidate()
        pollingTimer = nil
    }

    // MARK: - Helper Methods

    func getDismissal(for studentId: String) -> Dismissal? {
        return dismissals.first { $0.studentId == studentId }
    }
}
