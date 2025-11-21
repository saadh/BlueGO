//
//  AuthService.swift
//  BlueGOParent
//
//  Authentication service for login, register, and logout
//

import Foundation

struct LoginRequest: Codable {
    let emailOrPhone: String
    let password: String
}

struct RegisterRequest: Codable {
    let email: String?
    let phone: String?
    let password: String
    let firstName: String
    let lastName: String
}

class AuthService {
    static let shared = AuthService()
    private let network = NetworkService.shared

    private init() {}

    func login(emailOrPhone: String, password: String) async throws -> User {
        let request = LoginRequest(emailOrPhone: emailOrPhone, password: password)
        let user: User = try await network.post(endpoint: "/api/login", body: request)
        return user
    }

    func register(email: String?, phone: String?, password: String, firstName: String, lastName: String) async throws -> User {
        let request = RegisterRequest(
            email: email?.isEmpty == false ? email : nil,
            phone: phone?.isEmpty == false ? phone : nil,
            password: password,
            firstName: firstName,
            lastName: lastName
        )
        let user: User = try await network.post(endpoint: "/api/register", body: request)
        return user
    }

    func logout() async throws {
        struct EmptyBody: Codable {}
        let _: EmptyResponse = try await network.post(endpoint: "/api/logout", body: EmptyBody())
    }

    func getCurrentUser() async throws -> User {
        let user: User = try await network.get(endpoint: "/api/user")
        return user
    }
}
