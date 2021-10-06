// process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
let api = require('../api');
let should = chai.should();
let expect = chai.expect;

const testObj = {
    username: 'h@gmail.com',
    password: 'test1',
    first_name: 'harshika',
    last_name: 'gupta',
    id: '1',
    account_created: new Date(),
    account_updated: new Date()
}
chai.use(chaiHttp);
describe('api.js tests', () => {
    describe('post user api', () => {
        it('should return email already in use request', (done) => {
            chai.request(api)
            .post('/v1/user')
            .send(testObj)
              .end((err, res) => {
                console.log(err, 'err', res.body);

                expect(res.body.msg).to.equal('Email already in use');
                res.should.have.status(400);
            done();
          });
        });
        it('should return created user', (done) => {
            chai.request(api)
            .post('/v1/user')
            .send({...testObj, username: 'test@gmail.com'})
              .end((err, res) => {
                console.log(err, 'err', res.body);

                // expect(res.body.msg).to.equal('Email already in use');
                res.should.have.status(200);
            done();
          });
        });
    });
    describe('get users Test', () => {
        it('should return forbidden request', (done) => {
            chai.request(api)
            .get('/v1/user/self')
            .end((err, res) => {
                // console.log(err, 'err', res.body);
                res.should.have.status(403);
            done();
          });
        });
        // it('should return user', (done) => {
        //     chai.request(api)
        //     .get('/v1/user/self')
        //     .set({ "Authorization": {Username: 'test', Password: 'test'} })
        //     .end((err, res) => {
        //         console.log(err, 'err', res.body);
        //         res.should.have.status(403);
        //     done();
        //   });
        // });
    });
});
