describe('Access Control Panel', () => {
    it('Opens the control panel', () => {
        cy.window().then((win) => {
            win.sessionStorage.clear()
        })

        // Login
        cy.visit('/')
        cy.get('#emailInput').type('test@email.com')
        cy.get('#passwordInput').type('123')
        cy.get('button').click()

        // Open control panel
        cy.get('#controlPanel').click()
    })
})

describe('Create Example User', () => {
    it('Creates a user', () => {
        cy.visit('/')

        // Open control panel
        cy.get('#controlPanel').click()

        // Click new user
        cy.get('#control-panel > .btn').click()

        // Type in details
        cy.get('#emailInput').type("example@email.com")
        cy.get('#passwordInput').type("123")
        cy.get('#nameInput').type("Example")

        // Submit
        cy.get('.modal-footer > .btn-primary').click()
    })
})

describe('Delete Example User', () => {
    it('Deletes a user', () => {
        cy.visit('/')

        // Open control panel
        cy.get('#controlPanel').click()

        // Delete the example user
        cy.contains('Example').parent().parent().children('.btn-danger').click()
    })
})