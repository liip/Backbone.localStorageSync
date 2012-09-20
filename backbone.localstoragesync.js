(function(root, factory) {
    if (typeof require === 'function') { //Has to be like this so the require.js optimizer will strip it out see http://requirejs.org/docs/node.html#nodeModules
        if (typeof define !== 'function') {
            var define = require('amdefine')(module);
        }
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
        if (_.isUndefined(config.prefix)) { config.prefix = ''; }

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

        /**
         * A helper method since the API is slightly different between node and browser
         * TODO: Fix this properly in simply-deferred
         *
         * @returns Object A new instance of simply deferred that can be used directly
         **/
        function getDeferred() {
            if (_.isFunction(Deferred)) {
                return new Deferred();
            }
            return new Deferred.Deferred();
        }

        /** A helper that checks if it has an ID
         *
         * @param Object The object that you want to test.
         * @returns Bool True if it has an ID, False otherwise.
         **/
        function hasId(model) {
            if (_.isUndefined(model.get) || _.isUndefined(model.get('id'))) {
                return false;
            }
            return true;
        }

        /**
         * Used to crate a completely qualified name to store and retreive from the local storage
         *
         * @param Mixed Can be a model or a string that you want to have the name for.
         * @return String The final name that is ready to use
         **/
        function getName(name) {
            var ret = config.prefix;
            if (_.isString(name)) {
                return ret + name;
            } else if (! hasId(name)) {
                return ret + className;
            }
            return ret + name.get('id');
        }

        /**
         * Returns the JSON Value from the localStorage. Automatically takes care of name prefixes etc.
         *
         * @param Mixed Id String or Model that you look for.
         * @return Object The model data.
         **/
        function getItem(model) {
            return JSON.parse(localStorage.getItem(getName(model)));
        }

        function setItem(model) {
            if (hasId(model)) {
                localStorage.setItem(getName(model), JSON.stringify(model.toJSON()));
            } else {
                localStorage.setItem(getName(model), JSON.stringify(model));
            }
        }

        function find(model, options) {
            var deferred = getDeferred();
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

        function findAll(collection, options) {
            var deferred = getDeferred();
            var ids = getItem(collection);
            var needsFetch = true;


            if (null !== ids) {
                var models = [];
                _.map(ids, function (id) {
                    var model = getItem(id);
                    if (model) {
                        models.push(new collection.model(model));
                    } else {
                        models.push(new collection.model({id: id}));
                    }
                });
                collection.reset(models);
                deferred.resolve(models);
                needsFetch = config.alwaysUpdate; //No fetching requires if we don't always update
            }

            if (needsFetch) {
                var originalReturn = originalSync('read', collection, options);
                originalReturn.done(function (result) {
                    var models = [];
                    _.each(result, function (model) {
                        model = new collection.model(model);
                        models.push(model);
                        setItem(model);
                    });
                    collection.reset(models);
                    setItem(_.compact(collection.pluck('id')));
                });

                //If we couldn't return anything from the cache resolve when the original sync layer does.
                if (null === ids) {
                    originalReturn.done(deferred.resolve).fail(deferred.reject);
                }
            }

            return deferred.promise();
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
                    if (! hasId(model)) {
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
