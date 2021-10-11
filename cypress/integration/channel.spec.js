describe('Create Test Group', () => {
    it('Creates a new group to test in', () => {
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

describe('Create Test Channel', () => {
    it('Creates a new channel to message in', () => {
        cy.visit('/')

        // Open the test group
        cy.contains('TG').click()

        // Click the new channel button
        cy.get('#channel-list > .btn').click()

        // Type in the channel name
        cy.get('#channelNameInput').type("Test Channel")

        // Submit it
        cy.get('.btn-primary').click()
    })
})

describe('Send Test Message', () => {
    it('Sends a message in the channel', () => {
        cy.visit('/')

        // Open the test group
        cy.contains('TG').click()

        // Open the test channel
        cy.contains('Test Channel').click()

        // Type in the message
        cy.get('#message-box').type("Test Message")

        // Submit it
        cy.contains('Send').click()

        // Check the chat history for sent message
        cy.contains('Test Message')
    })
})

describe('Delete Test Group', () => {
    it('Deletes the group for cleanup', () => {
        cy.visit('/')

        // Open the test group
        cy.contains('TG').click()

        // Click the config button
        cy.get('#group-heading > .btn').click()

        // Click the delete group button
        cy.get('.modal-footer > .btn-danger').click()
    })
})