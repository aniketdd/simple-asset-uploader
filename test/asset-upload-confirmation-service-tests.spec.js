const chai = require('chai');
const expect = chai.expect;

const {
  confirmUpload
} = require('../services/asset-upload-confirmation-service');
const incompleteAssets = new Map();
const completeAssets = new Set();

describe('asset upload confirmation service tests', function() {
  it('when status is uploaded it should remove asset from incomplete and move it to completeAssets', function(done) {
    this.timeout(10000);
    incompleteAssets.set('11', 'someurl');
    const result = confirmUpload(
      '11',
      'uploaded',
      incompleteAssets,
      completeAssets
    );
    expect(incompleteAssets.get('11')).to.be.undefined;
    expect(completeAssets.has('11')).to.be.true;
    expect(result.status).to.be.equal(200);
    done();
  });
});
