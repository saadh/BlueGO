//
//  ParentDashboardView.swift
//  BlueGOParent
//
//  Main dashboard showing all children and their dismissal status
//

import SwiftUI

struct ParentDashboardView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = ParentViewModel()
    @State private var showingAddStudent = false
    @State private var showingNFCLinking = false

    var body: some View {
        VStack {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Welcome back,")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Text(authViewModel.user?.firstName ?? "Parent")
                        .font(.title2)
                        .fontWeight(.bold)
                }
                Spacer()
                Menu {
                    Button(action: { showingNFCLinking = true }) {
                        Label("Link NFC Card", systemImage: "wave.3.right")
                    }
                    Button(action: { authViewModel.logout() }) {
                        Label("Logout", systemImage: "arrow.right.square")
                    }
                } label: {
                    Image(systemName: "person.circle.fill")
                        .resizable()
                        .frame(width: 40, height: 40)
                        .foregroundColor(.blue)
                }
            }
            .padding()

            // Error message
            if let error = viewModel.errorMessage {
                HStack {
                    Image(systemName: "exclamationmark.triangle")
                    Text(error)
                        .font(.caption)
                }
                .foregroundColor(.white)
                .padding()
                .background(Color.red)
                .cornerRadius(8)
                .padding(.horizontal)
            }

            // Students list or empty state
            if viewModel.students.isEmpty {
                EmptyStateView(showingAddStudent: $showingAddStudent)
            } else {
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(viewModel.students) { student in
                            StudentCardView(
                                student: student,
                                dismissal: viewModel.getDismissal(for: student.id),
                                onRequestPickup: {
                                    viewModel.requestPickup(studentId: student.id)
                                },
                                onConfirmPickup: { dismissalId in
                                    viewModel.confirmPickup(dismissalId: dismissalId)
                                }
                            )
                        }
                    }
                    .padding()
                }
            }

            // Add student button
            Button(action: { showingAddStudent = true }) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Add Child")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
            .padding()
        }
        .navigationBarHidden(true)
        .sheet(isPresented: $showingAddStudent) {
            AddStudentView(viewModel: viewModel)
        }
        .sheet(isPresented: $showingNFCLinking) {
            NFCLinkingView(viewModel: viewModel)
        }
        .onAppear {
            viewModel.fetchStudents()
            viewModel.fetchDismissals()
            viewModel.startDismissalPolling()
        }
        .onDisappear {
            viewModel.stopDismissalPolling()
        }
    }
}

struct EmptyStateView: View {
    @Binding var showingAddStudent: Bool

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "person.2.slash")
                .resizable()
                .frame(width: 80, height: 60)
                .foregroundColor(.gray)

            Text("No children added yet")
                .font(.title3)
                .fontWeight(.semibold)

            Text("Add your children to start managing their school pickup")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            Button(action: { showingAddStudent = true }) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Add Your First Child")
                        .fontWeight(.semibold)
                }
                .frame(width: 250, height: 50)
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
        }
    }
}
