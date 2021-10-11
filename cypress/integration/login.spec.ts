describe('Successful Login Tests', () => {
  it('Login in with valid account details', () => {
    cy.window().then((win) => {
      win.sessionStorage.clear()
    })

    // Check the page
    cy.visit('/')
    cy.contains('Harmony')
    cy.url().should('include', '/login')

    // Type in the login details
    cy.get('#emailInput')
      .type('test@email.com')
      .should('have.value', 'test@email.com')

    cy.get('#passwordInput')
      .type('123')
      .should('have.value', '123')

    // Login
    cy.get('button').click()
  })
})

describe('Failed Login Test', () => {
  it('Login error with invalid account details', () => {
    cy.window().then((win) => {
      win.sessionStorage.clear()
    })
    
    // Check the page
    cy.visit('/')
    cy.contains('Harmony')
    cy.url().should('include', '/login')

    // Type in incorrect login details
    cy.get('#emailInput')
      .type('fake@email.com')
      .should('have.value', 'fake@email.com')

    cy.get('#passwordInput')
      .type('fake')
      .should('have.value', 'fake')

    // Login
    cy.get('button').click()

    // Get error message
    cy.get('.alert').contains('You have entered an invalid email or password')
  })
})

