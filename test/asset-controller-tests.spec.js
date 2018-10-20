const app = require('../server');
const chai = require('chai');
const request = require('supertest');
const path = require('path');
const expect = chai.expect;

describe('Simple asset uploader Tests', function() {
  describe('#POST /asset', function() {
    it('should successfully create new asset', function(done) {
      request(app)
        .post('/asset')
        .end(function(err, res) {
          expect(res.statusCode).to.equal(200);
          done();
        });
    });
    it('on success response sould contain signed s3 url', function(done) {
      request(app)
        .post('/asset')
        .end(function(err, res) {
          expect(res.body).to.be.an('object');
          expect(res.body['upload_url']).to.not.be.empty;
          done();
        });
    });
    it('on success response sould contain asset id', function(done) {
      request(app)
        .post('/asset')
        .end(function(err, res) {
          expect(res.body).to.be.an('object');
          expect(res.body.id).to.not.be.empty;
          done();
        });
    });
    it('on success response sould contain both asset id and signed url', function(done) {
      request(app)
        .post('/asset')
        .end(function(err, res) {
          expect(res.body).to.be.an('object');
          expect(res.body.id).to.not.be.empty;
          expect(res.body['upload_url']).to.not.be.empty;
          done();
        });
    });
  });
  it('user should be able to make put call on signed url', function(done) {
    this.slow = 5000;
    request(app)
      .post('/asset')
      .end(function(err, res) {
        request(res.body['upload_url'])
          .put('')
          .attach('../aws-config.json')
          .end(function(error, response) {
            expect(response.statusCode).to.equal(200);
            done();
          });
      });
  });
  it('post/get call on the signed url should fail', function(done) {
    this.slow = 10000;
    request(app)
      .post('/asset')
      .end(function(err, res) {
        request(res.body['upload_url'])
          .post('')
          .attach('../aws-config.json')
          .end(function(error, response) {
            expect(response.statusCode).to.not.equal(200);
            done();
          });
      });
  });
});
describe('#PUT /asset/:id', function() {
  it('should succeed for given asset id', function(done) {
    this.slow(10000);
    request(app)
      .post('/asset')
      .end(function(err, res) {
        request(app)
          .put(`/asset/${res.body.id}`)
          .end(function(error, response) {
            expect(res.statusCode).to.equal(200);
            done();
          });
      });
  });
  it('should fail when asset id is missing', function(done) {
    this.slow(10000);
    request(app)
      .put('/asset')
      .end(function(err, res) {
        expect(res.statusCode).to.equal(400);
        done();
      });
  });
});

describe('#GET /asset/:id', function() {
  it('should fail for random asset id', function(done) {
    this.slow(10000);
    request(app)
      .get('/asset/hui')
      .end(function(err, res) {
        expect(res.statusCode).to.equal(400);
        done();
      });
  });

  it('should fail when asset id is missing', function(done) {
    this.slow(10000);
    request(app)
      .get('/asset')
      .end(function(err, res) {
        expect(res.statusCode).to.equal(400);
        done();
      });
  });

  it('should fail when asset is new', function(done) {
    this.slow(10000);
    request(app)
      .post('/asset')
      .end(function(err, res) {
        request(app)
          .get(`/asset/${res.body.id}`)
          .end(function(error, response) {
            expect(response.statusCode).to.equal(400);
            done();
          });
      });
  });

  it('should fail when asset is not uploaded', function(done) {
    this.slow(10000);
    request(app)
      .post('/asset')
      .end(function(err, res) {
        request(app)
          .put(`/asset/${res.body.id}`)
          .send({ status: 'uploading' })
          .end(function(e, r) {
            request(app)
              .get(`/asset/${res.body.id}`)
              .end(function(error, response) {
                expect(response.statusCode).to.equal(400);
                done();
              });
          });
      });
  });

  it('should succeed when asset is uploaded', function(done) {
    this.slow(10000);
    request(app)
      .post('/asset')
      .end(function(err, res) {
        request(app)
          .put(`/asset/${res.body.id}`)
          .send({ status: 'uploaded' })
          .end(function(e, r) {
            request(app)
              .get(`/asset/${res.body.id}`)
              .end(function(error, response) {
                expect(response.statusCode).to.equal(200);
                done();
              });
          });
      });
  });

  it('response should contain download_url for uploaded asset', function(done) {
    this.slow(10000);
    request(app)
      .post('/asset')
      .end(function(err, res) {
        request(app)
          .put(`/asset/${res.body.id}`)
          .send({ status: 'uploaded' })
          .end(function(e, r) {
            request(app)
              .get(`/asset/${res.body.id}`)
              .end(function(error, response) {
                expect(response.body['download_url']).to.be.not.empty;
                done();
              });
          });
      });
  });

  it('get call on download_url should succeed', function(done) {
    this.timeout(10000);
    request(app)
      .post('/asset')
      .end(function(err, res) {
        request(res.body['upload_url'])
          .put('')
          .attach('file', path.join(__dirname, '..', 'aws-config.json'))
          .end(function(uploadError, uploadResponse) {
            expect(uploadResponse.statusCode).to.equal(200);
            request(app)
              .put(`/asset/${res.body.id}`)
              .send({ status: 'uploaded' })
              .end(function(e, r) {
                request(app)
                  .get(`/asset/${res.body.id}`)
                  .end(function(error, response) {
                    request('')
                      .get(response.body['download_url'])
                      .end(function(getError, getResponse) {
                        expect(getResponse.statusCode).to.equal(200);
                        done();
                      });
                  });
              });
          });
      });
  });

  it('post/put call on download_url should fail', function(done) {
    this.timeout(10000);
    request(app)
      .post('/asset')
      .end(function(err, res) {
        request(res.body['upload_url'])
          .put('')
          .attach('file', path.join(__dirname, '..', 'aws-config.json'))
          .end(function(uploadError, uploadResponse) {
            expect(uploadResponse.statusCode).to.equal(200);
            request(app)
              .put(`/asset/${res.body.id}`)
              .send({ status: 'uploaded' })
              .end(function(e, r) {
                request(app)
                  .get(`/asset/${res.body.id}`)
                  .end(function(error, response) {
                    request('')
                      .post(response.body['download_url'])
                      .end(function(getError, getResponse) {
                        expect(getResponse.statusCode).to.equal(403);
                        done();
                      });
                  });
              });
          });
      });
  });

  it('get call on download url after specified timeout should fail', function(done) {
    this.timeout(10000);
    request(app)
      .post('/asset')
      .end(function(err, res) {
        request(res.body['upload_url'])
          .put('')
          .attach('file', path.join(__dirname, '..', 'aws-config.json'))
          .end(function(uploadError, uploadResponse) {
            expect(uploadResponse.statusCode).to.equal(200);
            request(app)
              .put(`/asset/${res.body.id}`)
              .send({ status: 'uploaded' })
              .end(function(e, r) {
                request(app)
                  .get(`/asset/${res.body.id}?timeout=2`)
                  .end(function(error, response) {
                    setTimeout(() => {
                      request('')
                        .get(response.body['download_url'])
                        .end(function(getError, getResponse) {
                          expect(getResponse.statusCode).to.equal(403);
                          done();
                        });
                    }, 3000);
                  });
              });
          });
      });
  });

  it('should assume default timeout of 60 seconds when not provided, call made after that should fail', function(done) {
    this.timeout(65000);
    request(app)
      .post('/asset')
      .end(function(err, res) {
        request(res.body['upload_url'])
          .put('')
          .attach('file', path.join(__dirname, '..', 'aws-config.json'))
          .end(function(uploadError, uploadResponse) {
            expect(uploadResponse.statusCode).to.equal(200);
            request(app)
              .put(`/asset/${res.body.id}`)
              .send({ status: 'uploaded' })
              .end(function(e, r) {
                request(app)
                  .get(`/asset/${res.body.id}`)
                  .end(function(error, response) {
                    setTimeout(() => {
                      request('')
                        .get(response.body['download_url'])
                        .end(function(getError, getResponse) {
                          expect(getResponse.statusCode).to.equal(403);
                          done();
                        });
                    }, 61000);
                  });
              });
          });
      });
  });

  it('should assume default timeout of 60 seconds when not provided, call made timeout should succeed', function(done) {
    this.timeout(65000);
    request(app)
      .post('/asset')
      .end(function(err, res) {
        request(res.body['upload_url'])
          .put('')
          .attach('file', path.join(__dirname, '..', 'aws-config.json'))
          .end(function(uploadError, uploadResponse) {
            expect(uploadResponse.statusCode).to.equal(200);
            request(app)
              .put(`/asset/${res.body.id}`)
              .send({ status: 'uploaded' })
              .end(function(e, r) {
                request(app)
                  .get(`/asset/${res.body.id}`)
                  .end(function(error, response) {
                    setTimeout(() => {
                      request('')
                        .get(response.body['download_url'])
                        .end(function(getError, getResponse) {
                          expect(getResponse.statusCode).to.equal(200);
                          done();
                        });
                    }, 58000);
                  });
              });
          });
      });
  });
});
