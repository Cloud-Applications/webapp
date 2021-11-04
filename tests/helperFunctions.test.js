let chai = require('chai');
let chaiHttp = require('chai-http');
const {validateEmail} = require('../helperFunctions');
let should = chai.should();
let expect = chai.expect;

describe('Basic Mocha String Test', function () {
    it("Returns is email is validate", function(){
        // Running the function
        test0 = validateEmail('harshika@gmail.com')
        test1 = validateEmail('test')
        console.log(test0);
        expect(test0).to.equal(true);
        expect(test1).to.equal(false);
    })
});
