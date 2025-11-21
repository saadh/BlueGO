//
//  NFCLinkingView.swift
//  BlueGOParent
//
//  View for linking NFC card to parent account
//

import SwiftUI
import CoreNFC

struct NFCLinkingView: View {
    @Environment(\.presentationMode) var presentationMode
    @ObservedObject var viewModel: ParentViewModel

    @State private var nfcCardId = ""
    @State private var isScanning = false

    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Icon
                Image(systemName: "wave.3.right.circle.fill")
                    .resizable()
                    .frame(width: 80, height: 80)
                    .foregroundColor(.blue)

                Text("Link NFC Card")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Link your NFC card to all your children. This allows automatic check-in when you scan your card at school.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)

                Divider()

                VStack(spacing: 16) {
                    // Manual entry
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Enter Card ID Manually")
                            .font(.headline)

                        TextField("NFC Card ID", text: $nfcCardId)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .autocapitalization(.allCharacters)

                        Button(action: linkCard) {
                            if viewModel.isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .frame(maxWidth: .infinity)
                            } else {
                                Text("Link Card")
                                    .fontWeight(.semibold)
                                    .frame(maxWidth: .infinity)
                            }
                        }
                        .frame(height: 50)
                        .background(nfcCardId.isEmpty ? Color.gray : Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                        .disabled(nfcCardId.isEmpty || viewModel.isLoading)
                    }

                    Text("OR")
                        .foregroundColor(.secondary)

                    // NFC Scan button
                    Button(action: startNFCScanning) {
                        HStack {
                            Image(systemName: "wave.3.right")
                            Text("Scan NFC Card")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    .disabled(!NFCNDEFReaderSession.readingAvailable || isScanning)

                    if !NFCNDEFReaderSession.readingAvailable {
                        Text("NFC scanning is not available on this device")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                }
                .padding()

                if let error = viewModel.errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }

                Spacer()
            }
            .padding()
            .navigationTitle("NFC Card")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }

    private func linkCard() {
        viewModel.linkNFCCard(nfcCardId: nfcCardId.uppercased())

        // Wait and dismiss if successful
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            if viewModel.errorMessage == nil {
                presentationMode.wrappedValue.dismiss()
            }
        }
    }

    private func startNFCScanning() {
        guard NFCNDEFReaderSession.readingAvailable else {
            viewModel.errorMessage = "NFC is not available on this device"
            return
        }

        isScanning = true
        let session = NFCNDEFReaderSession(
            delegate: NFCReaderDelegate { cardId in
                DispatchQueue.main.async {
                    self.nfcCardId = cardId
                    self.isScanning = false
                    // Automatically link after scanning
                    self.linkCard()
                }
            },
            queue: nil,
            invalidateAfterFirstRead: true
        )

        session.alertMessage = "Hold your NFC card near the top of your iPhone"
        session.begin()
    }
}

// MARK: - NFC Reader Delegate

class NFCReaderDelegate: NSObject, NFCNDEFReaderSessionDelegate {
    var onCardRead: (String) -> Void

    init(onCardRead: @escaping (String) -> Void) {
        self.onCardRead = onCardRead
    }

    func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {
        // Not used for tag reading
    }

    func readerSession(_ session: NFCNDEFReaderSession, didDetect tags: [NFCNDEFTag]) {
        guard let tag = tags.first else {
            session.invalidate(errorMessage: "No NFC tag detected")
            return
        }

        session.connect(to: tag) { error in
            if let error = error {
                session.invalidate(errorMessage: "Connection failed: \(error.localizedDescription)")
                return
            }

            // Get tag identifier
            tag.queryNDEFStatus { status, capacity, error in
                if let error = error {
                    session.invalidate(errorMessage: "Query failed: \(error.localizedDescription)")
                    return
                }

                // Read the tag's serial number/identifier
                // Note: The actual implementation depends on the NFC tag type
                // This is a simplified version
                let cardId = tag.identifier.map { String(format: "%02X", $0) }.joined()
                session.alertMessage = "Card detected!"
                session.invalidate()

                self.onCardRead(cardId)
            }
        }
    }

    func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {
        // Session ended
    }
}
