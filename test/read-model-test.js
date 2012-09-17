var buster = require('buster');
var bls = require("../backbone.localstoragesync");
var Backbone = require('backbone');
var Deferred = require("simply-deferred").Deferred;

var assert = buster.assertions.assert;
var refute = buster.assertions.refute;
var CLASSNAME = 'someClassName';
var ID = 'someModelId';
var PROP = 'foo';
var VAL = 'bar';
var ALTVAL = 'foobar';
var OBJ = {};
OBJ[PROP] = VAL;

function populateLocalStorage() {
    var obj = {};
    obj.id = ID;
    obj[PROP] = VAL;
    localStorage.setItem(ID, JSON.stringify(obj));
}

buster.testCase('Read Model', {
    setUp: function () {
        localStorage = require('localStorage');
        localStorage.clear();

        this.sync = this.stub(Backbone, 'sync', Deferred);

        var model = Backbone.Model.extend({
            urlRoot: '/someUrl',
            sync: new bls(this.sync, CLASSNAME)
        });
        this.model = new model({ id: ID });
    },

    "Requests model from backend if no entry in the localStorage": function () {
        this.model.sync =  new bls(this.sync, CLASSNAME);

        this.model.fetch();

        assert.calledOnce(this.sync);
        assert.calledWith(this.sync, 'read', this.model);
    },

    "Return model from localStorage": function (done) {
        populateLocalStorage();
        var model = this.model;
        model.sync =  new bls(this.sync, CLASSNAME);

        refute.defined(model.get(PROP));
        model.fetch().done(function (result) {
            assert.equals(result[PROP], VAL);
            assert.equals(model.get(PROP), VAL);
            done();
        });
    },

    "Requests model from backend even after localStorage hit and updates the entry": function () {
        populateLocalStorage();
        var model = this.model;
        var deferred = new Deferred();
        var sync = function () { return deferred; };
        model.sync =  new bls(sync, CLASSNAME);

        model.fetch();
        deferred.resolve({foo: ALTVAL});

        assert.equals(model.get(PROP), ALTVAL);
        assert.same(localStorage.getItem(ID), JSON.stringify(model.toJSON()));
    },


    "Doesn't request from backend if alwaysUpdate is off": function () {
        populateLocalStorage();
        this.model.sync =  new bls(this.sync, CLASSNAME, {alwaysUpdate: false});

        this.model.fetch();

        refute.called(this.sync);
    }
});
