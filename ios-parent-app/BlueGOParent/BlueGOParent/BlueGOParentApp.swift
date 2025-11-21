//
//  BlueGOParentApp.swift
//  BlueGOParent
//
//  Main app entry point for BlueGO Parent iOS app
//

import SwiftUI

@main
struct BlueGOParentApp: App {
    @StateObject private var authViewModel = AuthViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authViewModel)
        }
    }
}
