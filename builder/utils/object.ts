import * as _ from 'lodash';

export const ObjectValidation = {
    hasSome: (obj: any, keys: any) => {
        var objKeys = _(obj).keys();
        return _(keys).some(function(key) {
            return _(objKeys).includes(key);
        });
    },
    isSimpleValue: (value) => {
        return (
          _.isString(value) ||
          _.isNumber(value) ||
          _.isBoolean(value) ||
          _.isNull(value) ||
          _.isUndefined(value) ||
          _.isRegExp(value) ||
          _.isDate(value)
        );
    },
    isObjectObject: (obj) => {
        return _.isObject(obj) && Object.prototype.toString.call(obj) === '[object Object]';
    }
}
