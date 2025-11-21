//
//  ContentView.swift
//  BlueGOParent
//
//  Root navigation controller that shows login or dashboard based on auth state
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authViewModel: AuthViewModel

    var body: some View {
        NavigationView {
            if authViewModel.isAuthenticated {
                ParentDashboardView()
            } else {
                AuthView()
            }
        }
        .onAppear {
            authViewModel.checkAuthStatus()
        }
    }
}
