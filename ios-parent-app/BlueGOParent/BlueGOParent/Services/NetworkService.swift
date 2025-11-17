//
//  NetworkService.swift
//  BlueGOParent
//
//  Core networking service for API calls
//

import Foundation

enum NetworkError: Error {
    case invalidURL
    case noData
    case decodingError
    case unauthorized
    case serverError(String)
    case unknown(Error)

    var localizedDescription: String {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .noData:
            return "No data received"
        case .decodingError:
            return "Failed to decode response"
        case .unauthorized:
            return "Unauthorized - please login again"
        case .serverError(let message):
            return message
        case .unknown(let error):
            return error.localizedDescription
        }
    }
}

struct ErrorResponse: Codable {
    let message: String
}

class NetworkService {
    static let shared = NetworkService()

    // IMPORTANT: Replace with your actual backend URL
    // For local development: http://localhost:5000
    // For production: your deployed backend URL
    private let baseURL = "http://localhost:5000"

    private var session: URLSession

    private init() {
        let config = URLSessionConfiguration.default
        config.httpShouldSetCookies = true
        config.httpCookieAcceptPolicy = .always
        config.httpShouldHandleCookies = true
        config.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: config)
    }

    // MARK: - Generic Request Methods

    func get<T: Decodable>(endpoint: String) async throws -> T {
        return try await request(endpoint: endpoint, method: "GET", body: nil)
    }

    func post<T: Decodable, B: Encodable>(endpoint: String, body: B) async throws -> T {
        return try await request(endpoint: endpoint, method: "POST", body: body)
    }

    func patch<T: Decodable, B: Encodable>(endpoint: String, body: B) async throws -> T {
        return try await request(endpoint: endpoint, method: "PATCH", body: body)
    }

    func delete(endpoint: String) async throws {
        let _: EmptyResponse = try await request(endpoint: endpoint, method: "DELETE", body: nil as String?)
    }

    private func request<T: Decodable, B: Encodable>(
        endpoint: String,
        method: String,
        body: B?
    ) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw NetworkError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
        }

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw NetworkError.noData
            }

            // Handle different status codes
            switch httpResponse.statusCode {
            case 200...299:
                // Success
                if T.self == EmptyResponse.self {
                    return EmptyResponse() as! T
                }
                return try JSONDecoder().decode(T.self, from: data)

            case 401:
                throw NetworkError.unauthorized

            case 400, 403, 404, 500:
                if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                    throw NetworkError.serverError(errorResponse.message)
                } else {
                    throw NetworkError.serverError("Server error: \(httpResponse.statusCode)")
                }

            default:
                throw NetworkError.serverError("Unexpected status code: \(httpResponse.statusCode)")
            }
        } catch let error as NetworkError {
            throw error
        } catch {
            throw NetworkError.unknown(error)
        }
    }
}

struct EmptyResponse: Codable {}
