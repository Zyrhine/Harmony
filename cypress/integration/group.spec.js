describe('Create Group', () => {
    it('Creates a new group', () => {
        cy.window().then((win) => {
            win.sessionStorage.clear()
        })

        // Login
        cy.visit('/')
        cy.get('#emailInput').type('test@email.com')
        cy.get('#passwordInput').type('123')
        cy.get('button').click()

        // Open control panel
        cy.get('#createGroup').click()
        cy.get('#groupNameInput').type("Test Group")
        cy.get('#createGroupBtn').click()
    })
})

describe('Delete Group', () => {
    it('Deletes the test group', () => {
        cy.window().then((win) => {
            win.sessionStorage.clear()
        })

        // Login
        cy.visit('/')
        cy.get('#emailInput').type('test@email.com')
        cy.get('#passwordInput').type('123')
        cy.get('button').click()

        // Open the test group
        cy.contains('TG').click()

        // Click the config button
        cy.get('#group-heading > .btn').click()

        // Click the delete group button
        cy.get('.modal-footer > .btn-danger').click()
    })
})