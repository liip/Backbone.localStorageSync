var buster = require('buster');
var bls = require("../backbone.localstoragesync");
var Backbone = require('backbone');
var Deferred = require("simply-deferred").Deferred;

var assert = buster.assertions.assert;
var refute = buster.assertions.refute;
var CLASSNAME = 'someClassName';
var COLLID = 'someCollection';
var ID = 'someModel';
var MODEL = new Backbone.Model({
    id: ID,
    foo: 'bar'
});
var ALTMODEL = new Backbone.Model({
    id: ID + '2',
    foo: 'foobar'
});

function populateLocalStorage() {
    localStorage.setItem(CLASSNAME, JSON.stringify([ID]));
    localStorage.setItem(ID, JSON.stringify(MODEL.toJSON()));
}

buster.testCase('Read Model', {
    setUp: function () {
        localStorage = require('localStorage');
        localStorage.clear();

        this.sync = this.stub(Backbone, 'sync', Deferred);

        var collection = Backbone.Collection.extend({
            model: Backbone.Model,
            url: '/someUrl'
        });
        this.collection = new collection();
    },

    "Requests collection from backend if no entry in the localStorage": function () {
        this.collection.sync =  new bls(this.sync, CLASSNAME);

        this.collection.fetch();

        assert.calledOnce(this.sync);
        assert.calledWith(this.sync, 'read', this.collection);
    },

    "Return model from localStorage": function (done) {
        populateLocalStorage();
        var collection = this.collection;
        collection.sync = new bls(this.sync, CLASSNAME);

        assert.equals(collection.length, 0);
        collection.fetch().done(function (result) {
            assert.equals(collection.length, 1);
            assert.equals(result[0].toJSON(), MODEL.toJSON());
            assert.equals(collection.get(ID).toJSON(), MODEL.toJSON());
            done();
        });
    },

    "Requests model from backend even after localStorage hit and updates the entry": function () {
        populateLocalStorage();
        var collection = this.collection;
        var deferred = new Deferred();
        var sync = function () { return deferred; };
        collection.sync =  new bls(sync, CLASSNAME);

        collection.fetch();
        deferred.resolve([ALTMODEL]);

        assert.equals(collection.length, 1);
        assert.equals(collection.get(ID + '2').toJSON(), ALTMODEL.toJSON());
        assert.equals(localStorage.getItem(CLASSNAME), JSON.stringify([ALTMODEL]));
    },


    "Doesn't request from backend if alwaysUpdate is off": function () {
        populateLocalStorage();
        this.collection.sync =  new bls(this.sync, CLASSNAME, {alwaysUpdate: false});

        this.collection.fetch();

        refute.called(this.sync);
    }
});
