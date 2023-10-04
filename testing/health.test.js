const chai = require("chai");
const chaiHttp = require("chai-http");
const expect = chai.expect;
const server = require("../index.js"); 

chai.use(chaiHttp);


describe("/GET healthz", () => {
    it("it should GET healthz status", (done) => { 
      chai
        .request(server)
        .get("/healthz")
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
  });
});