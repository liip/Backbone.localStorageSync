# Backbone localStorage Sync

[![Build Status](https://secure.travis-ci.org/liip/Backbone.localStorageSync.png)](http://travis-ci.org/liip/Backbone.localStorageSync)

An extension to **Backbone** providing localStorage caching for sync operations



# TODO
* Test usage examples
* Implement Create
* Implement Update
* Implement Delete

# API

    Backbone.localStorageSync(originalSyncLayer, uniqueNameForCollections, options)

## Configuration Options
The provided values are the defaults.

    {
        alwaysUpdate: true, //Fetch the model from original Sync even if it was available in the localStorage
        prefix: '' //Used in front of all localStorage keys
    }

## Usage

### With RequireJS

    require(['backbone', 'backbone.localstoragesync'], function(Backbone, localStorageSync) {
        var model = new Backbone.Model({
            sync: new localStorageSync(Backbone.sync)
        });

        model.fetch().done(function () {
            //Use as normal
        });

        var collection = new Backbone.Collection({
            sync: new localStorageSync(Backbone.sync, 'MyCollection')
        });
        collection.fetch();
    });

### Without RequireJS
Add the `script` after Backbone. Then you get a global as `Backbone.localStorageSync` and can use it like this:

    var model = new Backbone.Model({
        sync: new Backbone.localStorageSync(Backbone.sync)
    });

    model.fetch().done(function () {
        //Use as normal
    });

    var collection = new Backbone.Collection({
        sync: new localStorageSync(Backbone.sync, 'MyCollection')
    });
    collection.fetch();


## Dependencies
* [backbone](http://documentcloud.github.com/backbone)
* [underscore](http://underscorejs.org/)
* [simply-deferred](https://github.com/sudhirj/simply-deferred)

When you use an AMD loader you need to have those libraries available under the stated name. If you use RequireJS and have trouble check the [shim config](http://requirejs.org/docs/api.html#config-shim).

`localStorage` and `JSON` have to be globaly available otherwise the provided Sync layer will be returned.

###Optional
[require.js](http://requirejs.org/)

# License

Backbone.localStorageSync is Copyright (C) 2012 Liip AG.
It is distributed under the MIT license.

It is inspired by:
[Backbone.cachingSync](https://raw.github.com/ggozad/Backbone.cachingSync)
[Backbone.localStorage](https://github.com/ggozad/Backbone.cachingSync)
