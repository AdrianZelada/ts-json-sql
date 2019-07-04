import * as _ from 'lodash';
import {BaseDialect} from "./dialets/base";
import {SqliteDialect} from "./dialets/sqlite";

var dialectsHash = {
    base: BaseDialect,
    sqlite: SqliteDialect
};
export class Builder{
    options: any = {};
    dialect: any = {};
    _placeholderId: any;
    _values: any;
    _query: any = '';
    constructor(options) {
        options = _.defaults({}, options, {
            separatedValues: true,
            namedValues: true,
            valuesPrefix: '$',
            dialect: 'base',
            wrappedIdentifiers: true,
            indexedValues: true
        });

        if (options.namedValues && !options.indexedValues) {
            throw new Error(
              'Option `indexedValues`: false is ' +
              'not allowed together with option `namedValues`: true'
            );
        }

        this.options = options;

        this.setDialect(this.options.dialect);

        this._reset();
    }

    _reset() {
        if (this.options.separatedValues) {
            this._placeholderId = 1;
            this._values = this.options.namedValues ? {} : [];
        } else {
            delete this._placeholderId;
            delete this._values;
        }

        this._query = '';
    }

    _getPlaceholder() {
        var placeholder = '';
        if (this.options.namedValues) placeholder += 'p';
        if (this.options.indexedValues) placeholder += this._placeholderId++;
        return placeholder;
    }

    _wrapPlaceholder(name) {
        return this.options.valuesPrefix + name;
    }

    _pushValue(value) {
        if (_.isUndefined(value) || _.isNull(value)) {
            return 'null';
        } else if (_.isNumber(value) || _.isBoolean(value)) {
            return String(value);
        } else if (_.isString(value) || _.isDate(value)) {
            if (this.options.separatedValues) {
                var placeholder = this._getPlaceholder();

                if (this.options.namedValues) {
                    this._values[placeholder] = value;
                } else {
                    this._values.push(value);
                }

                return this._wrapPlaceholder(placeholder);
            } else {
                if (_.isDate(value)) value = value.toISOString();

                return '\'' + value + '\'';
            }
        } else {
            throw new Error('Wrong value type "' + (typeof value) + '"');
        }
    }

    build(params: any) {
        var builder = this;

        this._reset();

        this._query = this.dialect.buildTemplate('query', {queryBody: params}) + ';';

        if (this.options.separatedValues) {
            return {
                query: this._query,
                values: this._values,
                prefixValues: function() {
                    var values = {};
                    _(this.getValuesObject()).each(function(value, name) {
                        values[builder._wrapPlaceholder(name)] = value;
                    });
                    return values;
                },
                getValuesArray: function() {
                    return _.isArray(this.values) ? this.values : _(this.values).values();
                },
                getValuesObject: function() {
                    return _.isArray(this.values) ? _(_.range(1, this.values.length + 1)).zipObject(this.values) :
                      this.values;
                }
            };
        } else {
            return {query: this._query};
        }
    }

    setDialect(name) {
        if (!dialectsHash[name]) {
            throw new Error('Unknown dialect "' + name + '"');
        }
        this.dialect = new (dialectsHash[name])(this);
    }
}
