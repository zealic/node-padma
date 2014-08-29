var chai = require("chai");
var expect = chai.expect;
chai.should();

var parse = require('../lib/annotation').parse;

describe('annotation', function() {
  it("parse function params", function() {
    var result = parse(function(a, b, c, d) {});

    result.should.be.to.deep.equal(['a', 'b', 'c', 'd']);
  });

  it("parse function params with annoate name", function() {
    var result = parse(function(/* G */a, /* E */b, /* C */c, /* K */d) {});

    result.should.be.to.deep.equal(['G', 'E', 'C', 'K']);
  });

  it("parse function params with special name", function() {
    var result = parse(function(
      /* jack/rose */a,
      /* hammer.star */b,
      /* Y|N */c,
      /* ~# */d) {});

    result.should.be.to.deep.equal(['jack/rose', 'hammer.star', 'Y|N', '~#']);
  });
});
