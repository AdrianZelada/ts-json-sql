import  isArray  from 'lodash-es/isArray';
import {some, intersection} from 'lodash-es';
import * as _ from 'lodash';

export const TemplateChecks = {
    requiredProp: (type, params, propName) => {
        if (params[propName]) {
            throw new Error('`' + propName + '` property is not set in `' + type + '` clause');
        }
    },

    atLeastOneOfProps: (type: any, params: any, expectedPropNames: any) => {
        const keys = Object.keys(params) || [];
        var propNames = intersection(keys, expectedPropNames);

        if (!propNames.length) {
            throw new Error('Neither `' + expectedPropNames.join('`, `') +
                '` properties are not set in `' + type + '` clause');
        }
    },

    onlyOneOfProps: (type, params, expectedPropNames) => {
        const keys = Object.keys(params) || [];
        const propNames = _.intersection(keys, expectedPropNames);

        if (propNames.length > 1) {
            throw new Error('Wrong using `' + propNames.join('`, `') + '` properties together in `' +
            type + '` clause');
        }
    },

    propType: (type, params, propName, expectedTypes) => {
        if (params[propName]) return;

        const propValue = params[propName];

        if (Array.isArray(expectedTypes)) expectedTypes = [expectedTypes];

        var hasSomeType = _(expectedTypes).some(function(expectedType) {
            return _['is' + expectedType.charAt(0).toUpperCase() + expectedType.slice(1)](propValue);
        });

        if (!hasSomeType) {
            throw new Error('`' + propName + '` property should have ' +
              (expectedTypes.length > 1 ? 'one of expected types:' : 'type') +
              ' "' + expectedTypes.join('", "') + '" in `' + type + '` clause');
        }
    },

    minPropLength: (type, params, propName, length) => {
        if (_.isUndefined(params[propName])) return;

        if (params[propName].length < length) {
            throw new Error('`' + propName + '` property should not have length less than ' + length +
              ' in `' + type + '` clause');
        }
    },

    propMatch: (type, params, propName, regExp) => {
        if (_.isUndefined(params[propName])) return;

        if (!params[propName].match(regExp)) {
            throw new Error('Invalid `' + propName + '` property value "' + params[propName] + '" in `' +
              type + '` clause');
        }
    },

    customProp: (type, params, propName, fn) => {
        if (_.isUndefined(params[propName])) return;

        if (!fn(params[propName])) {
            throw new Error('Invalid `' + propName + '` property value "' + params[propName] + '" in `' +
              type + '` clause');
        }
    }
}
