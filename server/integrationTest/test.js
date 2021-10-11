var assert = require('assert')
var app = require('../server.js')
let chai = require('chai')
let chaiHttp = require('chai-http')
let should = chai.should();
let expect = chai.expect;
chai.use(chaiHttp);

describe('Server Routes Test', function () {
    describe('Route: /api/auth', () => {
        describe('Logging in with valid details', () => {
            it('Should login successfully', (done) => {
                chai.request(app).post('/api/auth').type('form').send({'email': "test@email.com", 'password': "123"}).end((err, res) => {
                    res.body.should.have.property('ok', true);
                    res.body.should.have.property('user');
                    done();
                })
            })
        });
    
        describe('Logging in with invalid details', () => {
            it('Should return an error message', (done) => {
                chai.request(app).post('/api/auth').type('form').send({'email': "fake@email.com", 'password': "fake"}).end((err, res) => {
                    res.body.should.have.property('ok', false);
                    res.body.should.have.property('errors');
                    done();
                })
            })
        });
    });
    
    describe('Route: /api/uploadAvatar', () => {
        describe('Upload an avatar image', () => {
            it('Should upload and set the avatar successfully', (done) => {
                chai.request(app).post('/api/uploadAvatar').type('form').attach('image', './integrationTest/test-image.png', 'test.png').end((err, res) => {
                    res.body.should.have.property('result', 'OK');
                    res.body.should.have.property('message', 'Upload successful');
                    done();
                })
            })
        });
    })
    
    describe('Route: /api/uploadAttachment', () => {
        describe('Upload an attachment', () => {
            it('Should upload and return filename successfully', (done) => {
                chai.request(app).post('/api/uploadAttachment').type('form').attach('image', './integrationTest/test-image.png', 'test.png').end((err, res) => {
                    res.body.should.have.property('result', 'OK');
                    res.body.should.have.property('data');
                    res.body.should.have.property('message', 'Upload successful');
                    done();
                })
            })
        })
    });
})
