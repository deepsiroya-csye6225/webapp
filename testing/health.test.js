const chai = require("chai");
const chaiHttp = require("chai-http");
const expect = chai.expect;
const server = require("../index.js"); 

chai.use(chaiHttp);


describe("/GET healthz", () => {
  it("it should GET healthz status", async () => {
    const res = await chai.request(server).get("/healthz")
    res.should.have.status(200);
  });
});