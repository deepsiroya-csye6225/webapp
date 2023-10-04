const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("./index.js");
const expect = chai.expect;
const app = require("./index"); // Import the Express app

chai.use(chaiHttp);

describe("/GET healthz", () => {
  it("it should GET healthz status", async () => {
    chai
      .request(server)
      .get("/healthz")
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });
});
