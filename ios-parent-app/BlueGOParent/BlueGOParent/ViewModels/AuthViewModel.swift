//
//  AuthViewModel.swift
//  BlueGOParent
//
//  View model for authentication state management
//

import Foundation
import SwiftUI

@MainActor
class AuthViewModel: ObservableObject {
    @Published var user: User?
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let authService = AuthService.shared

    func checkAuthStatus() {
        Task {
            isLoading = true
            defer { isLoading = false }

            do {
                let currentUser = try await authService.getCurrentUser()
                if currentUser.role == "parent" {
                    self.user = currentUser
                    self.isAuthenticated = true
                }
            } catch {
                // Not authenticated or session expired
                self.user = nil
                self.isAuthenticated = false
            }
        }
    }

    func login(emailOrPhone: String, password: String) {
        Task {
            isLoading = true
            errorMessage = nil
            defer { isLoading = false }

            do {
                let user = try await authService.login(emailOrPhone: emailOrPhone, password: password)
                if user.role == "parent" {
                    self.user = user
                    self.isAuthenticated = true
                } else {
                    errorMessage = "This account is not a parent account"
                }
            } catch let error as NetworkError {
                errorMessage = error.localizedDescription
            } catch {
                errorMessage = "Login failed: \(error.localizedDescription)"
            }
        }
    }

    func register(email: String?, phone: String?, password: String, firstName: String, lastName: String) {
        Task {
            isLoading = true
            errorMessage = nil
            defer { isLoading = false }

            // Validate that either email or phone is provided
            guard (email?.isEmpty == false) || (phone?.isEmpty == false) else {
                errorMessage = "Please provide either email or phone"
                return
            }

            do {
                let user = try await authService.register(
                    email: email,
                    phone: phone,
                    password: password,
                    firstName: firstName,
                    lastName: lastName
                )
                self.user = user
                self.isAuthenticated = true
            } catch let error as NetworkError {
                errorMessage = error.localizedDescription
            } catch {
                errorMessage = "Registration failed: \(error.localizedDescription)"
            }
        }
    }

    func logout() {
        Task {
            isLoading = true
            defer { isLoading = false }

            do {
                try await authService.logout()
                self.user = nil
                self.isAuthenticated = false
            } catch {
                // Even if logout fails, clear local state
                self.user = nil
                self.isAuthenticated = false
            }
        }
    }
}
