# Philadelphia example screener

This seed is built from scratch for new accounts. The three tax benefits use
check configurations derived from the library API 0.9.0 OpenAPI benefit
compositions. Each enrollment check binds `personId` to the form's `client` ID.
Philly Cash is fictional and has exactly two checks: Philadelphia residence and
wanting extra cash. Its custom extra-cash check includes a working draft and published
1.0.0 versions, with a description, annotation, and diagram layout.
Residence reuses the library check. The form binds the custom question to
`custom.wantsExtraCash`; the evaluator passes the contents of `custom` to the
DMN, whose input is named `wantsExtraCash`.

The form demonstrates boolean Yes/No fields, explicit None of these enrollment
answers, date fields, conditional spouse details, shared question keys, and
Markdown guidance. Descriptions explain aliases, parameters, version pinning,
editing, previewing, and publishing. Publishing remains a user action so each
new account can explore and edit its own working copy first.

Try these scenarios in Preview:

- Explore all four: residence Yes, wants cash Yes, owner-occupant Yes, delinquency
  Yes, abatement No, enrollments None of these, applicant born over 65 years ago.
- Only cash passes: residence Yes, wants cash Yes, owner-occupant No.
- Cash fails: residence No or wants cash No.
- Cash is unknown: residence Yes, extra-cash answer blank.
- Spouse age: applicant under 65, spouse Yes with birth date over 65 years ago.
- Existing enrollment: select one program to fail only its enrollment check.

The current library returns unknown for an empty enrollment list, even when
None of these is explicitly selected. The form explains this behavior rather
than changing library rules. Selecting an existing program makes that program
fail and allows the other enrollment checks to pass.

Run `mvn test -Dtest=ExampleScreenerImportServiceTest,ExampleScreenerSeedTest`
in builder-api to check account import, resource integrity, and custom DMN
validation/evaluation. See the editing-example-screener documentation for UI
editing. The supported export is the app's Export Example Screener action,
which writes this bundled manifest format through the builder API.
