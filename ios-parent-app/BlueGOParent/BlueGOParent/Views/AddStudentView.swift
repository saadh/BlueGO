//
//  AddStudentView.swift
//  BlueGOParent
//
//  Dialog to add a new student/child
//

import SwiftUI

struct AddStudentView: View {
    @Environment(\.presentationMode) var presentationMode
    @ObservedObject var viewModel: ParentViewModel

    @State private var name = ""
    @State private var studentId = ""
    @State private var selectedOrganization: Organization?
    @State private var selectedClass: Class?
    @State private var selectedGender = "male"

    let genders = ["male", "female"]

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Student Information")) {
                    TextField("Full Name", text: $name)
                        .autocapitalization(.words)

                    TextField("Student ID", text: $studentId)
                        .autocapitalization(.none)

                    Picker("Gender", selection: $selectedGender) {
                        ForEach(genders, id: \.self) { gender in
                            Text(gender.capitalized).tag(gender)
                        }
                    }
                }

                Section(header: Text("School")) {
                    Picker("Select School", selection: $selectedOrganization) {
                        Text("Select a school").tag(nil as Organization?)
                        ForEach(viewModel.organizations) { org in
                            Text(org.name).tag(org as Organization?)
                        }
                    }
                    .onChange(of: selectedOrganization) { org in
                        if let org = org {
                            viewModel.fetchClasses(organizationId: org.id)
                            selectedClass = nil
                        }
                    }
                }

                if let _ = selectedOrganization, !viewModel.classes.isEmpty {
                    Section(header: Text("Class")) {
                        Picker("Select Class", selection: $selectedClass) {
                            Text("Select a class").tag(nil as Class?)
                            ForEach(viewModel.classes) { cls in
                                Text(cls.displayName).tag(cls as Class?)
                            }
                        }
                    }
                }

                if let error = viewModel.errorMessage {
                    Section {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Add Child")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add") {
                        addStudent()
                    }
                    .disabled(!isFormValid || viewModel.isLoading)
                }
            }
            .onAppear {
                viewModel.fetchOrganizations()
            }
        }
    }

    private var isFormValid: Bool {
        !name.isEmpty &&
        !studentId.isEmpty &&
        selectedOrganization != nil &&
        selectedClass != nil
    }

    private func addStudent() {
        guard let organization = selectedOrganization,
              let cls = selectedClass else {
            return
        }

        viewModel.addStudent(
            name: name,
            studentId: studentId,
            organizationId: organization.id,
            grade: cls.grade,
            className: cls.section,
            gender: selectedGender
        )

        // Wait a moment for the async operation
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            if viewModel.errorMessage == nil {
                presentationMode.wrappedValue.dismiss()
            }
        }
    }
}
