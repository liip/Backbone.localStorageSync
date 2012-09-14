(function(root, factory) {
    if (typeof require === 'function' && typeof define !== 'function') {
        var define = require('amdefine')(module);
    }

    if (typeof define === 'function' && define.amd) {
        define(['backbone', 'underscore', 'simply-deferred'], function(Backbone, _, Deferred) {
            return factory(root, Backbone, _, Deferred);
        });
    } else {
        root.Backbone.localStorageSync = factory(root, root.Backbone, root._, root.Deferred);
    }
})(this, function(root, Backbone, _, Deferred) {
    /**
     * **Backbone.localStorageSync* provides `localStorage` caching for your models and collections.
     * In order us use it you have to overwrite the sync property of the instance you want to use it on.
     * For example `Model.sync = Backbone.localStorageSync(Backbone.sync, '<ModelName>');
     *
     * `localStorage` and `JSON need to be globals and available. Otherwise it will just return the original Syncing layer.
     *
     * @param Object originalSync The backend sync method you want to use.
     * @param String className A unique name you want to use to store your model in the localStorage.
     * @param Objects config If you want different options than default. Consult the README.md for details.
     * @return Object A wrapped instance of your sync layer that will return the results from localStorage before updating from the backend.
     **/
    return function (originalSync, className, config) {
        config = config || {};
        if (_.isUndefined(config.alwaysUpdate)) { config.alwaysUpdate = true; }

        if (_.isUndefined(JSON)) {
            return originalSync;
        }
        //This part is from Modernizr. Just return the original sync if localStorage is not available.
        try {
            var testForLocalStorage = 'strgTest';
            localStorage.setItem(testForLocalStorage, testForLocalStorage);
            localStorage.removeItem(testForLocalStorage);
        } catch(e) {
            return originalSync;
        }

        function getItem(model) {
            return JSON.parse(localStorage.getItem(className + model.id));
        }

        function setItem(model) {
            localStorage.setItem(className + model.id, model.toJSON());
        }

        function find(model, options) {
            var deferred = new Deferred.Deferred();
            var item = getItem(model);
            var needsFetch = true;

            if (null !== item) {
                deferred.resolve(item);
                needsFetch = config.alwaysUpdate; //No fetching requires if we don't always update
            }

            if (needsFetch) {
                var originalReturn = originalSync('read', model, options);
                originalReturn.done(function (result) {
                    model.set(result);
                    setItem(model);
                });

                //If we couldn't return anything from the cache resolve when the original sync layer does.
                if (null === item) {
                    originalReturn.done(deferred.resolve).fail(deferred.reject);
                }
            }

            return deferred.promise();
        }

        function findAll(model, options) {
            originalSync('read', model, options);
        }

        function create(model, options) {
            notImplemented('create');
        }

        function update(model, options) {
            notImplemented('update');
        }

        function destroy(model, options) {
            notImplemented('delete');
        }

        function notImplemented(method) {
            console.log('Function ' + method + ' not yet implemented. This model will only be in the local Storage');
        }

        return function (method, model, options) {
            // See http://backbonejs.org/#Sync
            options = options || {};
            var operation;

            switch (method) {
                case 'read':
                    if (_.isUndefined(model.id)) {
                        operation = findAll(model, options);
                    } else {
                        operation = find(model, options);
                    }
                    break;
                case 'create':
                    operation = create(model, optionas);
                    break;
                case 'update':
                    operation = update(model, options);
                    break;
                case 'delete':
                    operation = destroy(model, options);
                    break;
            }

            if (options.success) operation.done(options.success);
            if (options.error) operation.fail(options.error);

            return operation;
        };
    };
});
