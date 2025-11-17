//
//  StudentCardView.swift
//  BlueGOParent
//
//  Individual student card showing info and dismissal status
//

import SwiftUI

struct StudentCardView: View {
    let student: Student
    let dismissal: Dismissal?
    let onRequestPickup: () -> Void
    let onConfirmPickup: (String) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Student info
            HStack(spacing: 12) {
                // Avatar
                ZStack {
                    Circle()
                        .fill(Color.blue.opacity(0.2))
                        .frame(width: 60, height: 60)

                    if let avatarUrl = student.avatarUrl, !avatarUrl.isEmpty {
                        // TODO: Load actual image from URL
                        Image(systemName: "person.fill")
                            .resizable()
                            .frame(width: 30, height: 30)
                            .foregroundColor(.blue)
                    } else {
                        Text(student.name.prefix(1))
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                    }
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(student.name)
                        .font(.headline)
                        .fontWeight(.bold)

                    Text(student.gradeClass)
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    // NFC status
                    if student.hasNFCLinked {
                        HStack(spacing: 4) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                            Text("NFC Linked")
                                .font(.caption)
                                .foregroundColor(.green)
                        }
                    }
                }

                Spacer()
            }

            Divider()

            // Dismissal status and actions
            if let dismissal = dismissal {
                DismissalStatusView(
                    dismissal: dismissal,
                    onConfirmPickup: onConfirmPickup
                )
            } else {
                // No active dismissal - show request button
                Button(action: onRequestPickup) {
                    HStack {
                        Image(systemName: "car.fill")
                        Text("Request Pick-up")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                }
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

struct DismissalStatusView: View {
    let dismissal: Dismissal
    let onConfirmPickup: (String) -> Void

    var body: some View {
        VStack(spacing: 12) {
            // Status message
            HStack {
                statusIcon
                Text(dismissal.statusMessage)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Spacer()
            }

            // Action button based on status
            if dismissal.isReadyForPickup {
                Button(action: { onConfirmPickup(dismissal.id) }) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                        Text("Confirm I Received My Child")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                }
            } else if dismissal.isWaiting {
                HStack {
                    ProgressView()
                    Text("Waiting for teacher...")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 44)
            } else if dismissal.isConfirmed {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("Pick-up Confirmed")
                        .fontWeight(.medium)
                        .foregroundColor(.green)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 44)
            }
        }
    }

    private var statusIcon: some View {
        Group {
            if dismissal.isConfirmed {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
            } else if dismissal.isReadyForPickup {
                Image(systemName: "bell.fill")
                    .foregroundColor(.orange)
            } else if dismissal.isWaiting {
                Image(systemName: "clock.fill")
                    .foregroundColor(.blue)
            } else {
                Image(systemName: "circle.fill")
                    .foregroundColor(.gray)
            }
        }
    }
}
