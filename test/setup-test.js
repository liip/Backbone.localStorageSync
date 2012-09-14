var buster = require('buster');
var assert = buster.assertions.assert;
var refute = buster.assertions.refute;
var bls = require("../backbone.localstoragesync");

buster.testCase('Setup', {
    'Is a function': function () {
        assert.isFunction(bls);
    },

    'Returns original sync without localStorage': function () {
        localStorage = undefined;
        var spy = this.spy();

        var sync = new bls(spy, 'someClass');

        assert.equals(localStorage, undefined);
        assert.equals(sync, spy);
    },

    'Returns wrapped sync with localStorage': function () {
        localStorage = require('localStorage');

        var spy = this.spy();

        var sync = new bls(spy, 'someClass');

        assert.isObject(localStorage);
        assert.isFunction(sync);
        refute.equals(sync, spy);
    }
});