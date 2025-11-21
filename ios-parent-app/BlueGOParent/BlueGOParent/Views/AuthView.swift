//
//  AuthView.swift
//  BlueGOParent
//
//  Login and registration view
//

import SwiftUI

struct AuthView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var isLoginMode = true
    @State private var emailOrPhone = ""
    @State private var password = ""
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var useEmail = true

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Logo and Title
                VStack(spacing: 12) {
                    Image(systemName: "person.circle.fill")
                        .resizable()
                        .frame(width: 80, height: 80)
                        .foregroundColor(.blue)

                    Text("BlueGO Parent")
                        .font(.largeTitle)
                        .fontWeight(.bold)

                    Text(isLoginMode ? "Login to your account" : "Create a new account")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 40)

                // Form
                VStack(spacing: 16) {
                    if !isLoginMode {
                        TextField("First Name", text: $firstName)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .autocapitalization(.words)

                        TextField("Last Name", text: $lastName)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .autocapitalization(.words)

                        // Toggle between email and phone
                        Picker("Contact Method", selection: $useEmail) {
                            Text("Email").tag(true)
                            Text("Phone").tag(false)
                        }
                        .pickerStyle(SegmentedPickerStyle())
                    }

                    if isLoginMode || useEmail {
                        TextField("Email or Phone", text: $emailOrPhone)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .keyboardType(isLoginMode ? .default : .emailAddress)
                            .autocapitalization(.none)
                            .textContentType(.emailAddress)
                    } else {
                        TextField("Phone Number", text: $emailOrPhone)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .keyboardType(.phonePad)
                            .textContentType(.telephoneNumber)
                    }

                    SecureField("Password", text: $password)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .textContentType(.password)

                    // Error message
                    if let error = authViewModel.errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                            .multilineTextAlignment(.center)
                    }

                    // Submit button
                    Button(action: handleSubmit) {
                        if authViewModel.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .frame(maxWidth: .infinity)
                        } else {
                            Text(isLoginMode ? "Login" : "Register")
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .frame(height: 50)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                    .disabled(authViewModel.isLoading || !isFormValid)

                    // Toggle mode button
                    Button(action: {
                        isLoginMode.toggle()
                        authViewModel.errorMessage = nil
                    }) {
                        Text(isLoginMode ? "Don't have an account? Register" : "Already have an account? Login")
                            .font(.subheadline)
                            .foregroundColor(.blue)
                    }
                }
                .padding(.horizontal, 32)
            }
        }
        .navigationBarHidden(true)
    }

    private var isFormValid: Bool {
        if isLoginMode {
            return !emailOrPhone.isEmpty && !password.isEmpty
        } else {
            return !emailOrPhone.isEmpty && !password.isEmpty && !firstName.isEmpty && !lastName.isEmpty
        }
    }

    private func handleSubmit() {
        if isLoginMode {
            authViewModel.login(emailOrPhone: emailOrPhone, password: password)
        } else {
            let email = useEmail ? emailOrPhone : nil
            let phone = useEmail ? nil : emailOrPhone
            authViewModel.register(
                email: email,
                phone: phone,
                password: password,
                firstName: firstName,
                lastName: lastName
            )
        }
    }
}
